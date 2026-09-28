/**
 * Efectos visuales con alternativa para navegadores sin ctx.filter (Safari/iPhone antiguos).
 */

const probe = document.createElement("canvas").getContext("2d");
export const FILTER_OK = "filter" in probe && (probe.filter = "blur(1px)", probe.filter === "blur(1px)");

/* ---------- tono de foto: "grayscale(1) contrast(1.2) brightness(.8)…" ---------- */

const parseOps = str => [...str.matchAll(/(grayscale|contrast|brightness|saturate|sepia)\(([\d.]+)\)/g)].map(m => [m[1], parseFloat(m[2])]);
const toneCache = new WeakMap();

function tonedCopy(img, str){
  let per = toneCache.get(img); if (!per){ per = new Map(); toneCache.set(img, per); }
  if (per.has(str)) return per.get(str);
  const MAX = 2600, k = Math.min(1, MAX / Math.max(img.width, img.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  const g = cv.getContext("2d"); g.drawImage(img, 0, 0, cv.width, cv.height);
  const d = g.getImageData(0, 0, cv.width, cv.height), a = d.data, ops = parseOps(str);
  for (let i = 0; i < a.length; i += 4){
    let r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255;
    for (const [op, v] of ops){
      if (op === "brightness"){ r *= v; gg *= v; b *= v; }
      else if (op === "contrast"){ r = (r - .5) * v + .5; gg = (gg - .5) * v + .5; b = (b - .5) * v + .5; }
      else if (op === "grayscale" || op === "saturate"){
        const s = op === "grayscale" ? 1 - Math.min(1, v) : v, L = .2126 * r + .7152 * gg + .0722 * b;
        r = L + (r - L) * s; gg = L + (gg - L) * s; b = L + (b - L) * s;
      } else if (op === "sepia"){
        const sr = .393 * r + .769 * gg + .189 * b, sg = .349 * r + .686 * gg + .168 * b, sb = .272 * r + .534 * gg + .131 * b;
        r += (sr - r) * v; gg += (sg - gg) * v; b += (sb - b) * v;
      }
    }
    a[i] = r * 255; a[i + 1] = gg * 255; a[i + 2] = b * 255;
  }
  g.putImageData(d, 0, 0);
  per.set(str, cv);
  return cv;
}

/** Dibuja una imagen con un filtro de tono (usa ctx.filter si existe; si no, una copia procesada y cacheada). */
export function drawToned(ctx, img, str, x, y, w, h){
  if (!img) return;
  const tone = str.replace(/blur\([^)]*\)/g, "").trim();
  if (FILTER_OK){ ctx.save(); ctx.filter = str; ctx.drawImage(img, x, y, w, h); ctx.restore(); return; }
  ctx.drawImage(tone ? tonedCopy(img, tone) : img, x, y, w, h);
}

/** Dibuja lo que haga fn() desenfocado px (en unidades de diseño). Sin soporte de filtros, se dibuja más suave. */
export function blurred(ctx, px, fn){
  ctx.save();
  if (FILTER_OK) ctx.filter = `blur(${px}px)`; else ctx.globalAlpha *= .55;
  fn();
  ctx.restore();
}

/** Copia desenfocada de un lienzo completo (para paneles de cristal). pxDevice en píxeles reales. */
export function blurCopy(src, pxDevice){
  const cv = document.createElement("canvas"); cv.width = src.width; cv.height = src.height;
  const g = cv.getContext("2d");
  if (FILTER_OK){ g.filter = `blur(${pxDevice}px)`; g.drawImage(src, 0, 0); return cv; }
  // alternativa: reducir y ampliar varias veces
  const k = Math.max(2, pxDevice / 2.5);
  const s = document.createElement("canvas"); s.width = Math.max(1, Math.round(src.width / k)); s.height = Math.max(1, Math.round(src.height / k));
  const sg = s.getContext("2d"); sg.imageSmoothingQuality = "high"; sg.drawImage(src, 0, 0, s.width, s.height);
  g.imageSmoothingQuality = "high"; g.drawImage(s, 0, 0, cv.width, cv.height);
  return cv;
}
