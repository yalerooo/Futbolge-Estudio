/**
 * Recorte automático de personas y objetos (quitar fondo), 100 % en el navegador.
 * Usa @imgly/background-removal (modelo IS-Net). La primera vez descarga el modelo (~40 MB) y
 * queda en la caché del navegador; las siguientes veces es mucho más rápido.
 * Licencia de la librería: AGPL-3.0 (uso interno del club).
 */
const LIB = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";
const MAX_SIDE = 2400;          // límite de tamaño de entrada para que no tarde demasiado en móvil

let libP = null;
const lib = () => (libP ??= import(LIB).catch(e => { libP = null; throw new Error("sin conexión"); }));

/** Precarga la librería y el modelo en segundo plano (p. ej. al abrir un editor que lo usa). */
export function preloadCutout(){ lib().then(m => m.preload?.({ model: "isnet_fp16" })).catch(() => {}); }

const toBlob = cv => new Promise(r => cv.toBlob(r, "image/png"));
const loadURL = url => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

/**
 * Devuelve una imagen nueva con el fondo quitado y recortada al contenido.
 * onStatus(texto, progreso 0..1 | null) informa del avance.
 */
export async function removeBackground(img, onStatus = () => {}, { trim: doTrim = true } = {}){
  onStatus("Preparando el recorte…", null);
  const m = await lib();

  // entrada: la imagen reescalada si es muy grande
  const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const src = document.createElement("canvas"); src.width = Math.round(img.width * k); src.height = Math.round(img.height * k);
  src.getContext("2d").drawImage(img, 0, 0, src.width, src.height);

  const seen = {};
  const out = await m.removeBackground(await toBlob(src), {
    model: "isnet_fp16",
    output: { format: "image/png" },
    progress: (key, cur, total) => {
      if (!/fetch/i.test(key) || !total) return;
      seen[key] = [cur, total];
      const c = Object.values(seen).reduce((a, [x]) => a + x, 0), t = Object.values(seen).reduce((a, [, y]) => a + y, 0);
      onStatus(`Descargando el modelo de recorte (solo la primera vez)… ${Math.round(c / t * 100)} %`, c / t);
    }
  });
  onStatus("Recortando…", null);

  const url = URL.createObjectURL(out);
  try{
    const cut = cleanup(await loadURL(url));
    if (doTrim) return trim(cut);
    // copia estable (la URL temporal se libera al terminar)
    const c = document.createElement("canvas"); c.width = cut.width; c.height = cut.height; c.getContext("2d").drawImage(cut, 0, 0);
    return loadURL(c.toDataURL("image/png"));
  } finally { URL.revokeObjectURL(url); }
}

/**
 * Limpieza: quita restos sueltos del fondo (objetos pequeños, halos casi transparentes)
 * y deja solo las figuras grandes (la persona principal y lo que toca, como el balón).
 */
function cleanup(img){
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, cv.width, cv.height), d = id.data, W = cv.width, H = cv.height;
  // máscara reducida (celdas de 4 px) para buscar zonas conectadas rápido
  const S = 4, w = Math.ceil(W / S), h = Math.ceil(H / S), mask = new Uint8Array(w * h);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 90) mask[(y / S | 0) * w + (x / S | 0)] = 1;
  // erosión: rompe los puentes finos (p. ej. un objeto del fondo que roza el brazo) antes de separar zonas
  const er = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++){
    let all = 1; for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (!mask[(y + dy) * w + x + dx]){ all = 0; break; }
    er[y * w + x] = all;
  }
  mask.set(er);
  const lab = new Int32Array(w * h), sizes = [0]; let n = 0;
  const stack = [];
  for (let i = 0; i < mask.length; i++){
    if (!mask[i] || lab[i]) continue;
    n++; let size = 0; stack.push(i); lab[i] = n;
    while (stack.length){
      const j = stack.pop(); size++;
      const x = j % w, y = (j / w) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const k = Y * w + X; if (mask[k] && !lab[k]){ lab[k] = n; stack.push(k); }
      }
    }
    sizes.push(size);
  }
  if (n <= 1) return img;
  const biggest = Math.max(...sizes);
  const keep = sizes.map(sz => sz >= biggest * 0.08);          // se quedan las zonas grandes (≥ 8 % de la principal)
  // conservar también los píxeles suaves del borde junto a zonas buenas (dilatación de 1 celda)
  const ok = new Uint8Array(w * h);
  for (let i = 0; i < lab.length; i++) if (lab[i] && keep[lab[i]]){
    const x = i % w, y = (i / w) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) ok[Y * w + X] = 1; }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const p = (y * W + x) * 4 + 3;
    if (!ok[(y / S | 0) * w + (x / S | 0)] || d[p] < 24) d[p] = 0;
  }
  g.putImageData(id, 0, 0);
  return cv;                      // un canvas sirve igual que una imagen para dibujar
}

/** Recorta los bordes transparentes para que la figura ocupe toda la imagen. */
function trim(img){
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++){
    if (d[(y * cv.width + x) * 4 + 3] > 16){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error("vacío");
  const pad = 2, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2;
  const o = document.createElement("canvas"); o.width = w; o.height = h;
  o.getContext("2d").drawImage(cv, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
  return loadURL(o.toDataURL("image/png"));
}
