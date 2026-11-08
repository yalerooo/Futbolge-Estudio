/**
 * DISEÑO · FULL TIME · GOLEADORES
 * Negro y oro, minimalista y agresivo: marcador gigante inclinado detrás del jugador recortado
 * (a color, con corrección automática y luz de contorno dorada), que pisa una banda dorada en
 * diagonal con los equipos; los goleadores van debajo.
 * Goleadores: separados por comas; «Iago x4» o «Iago 4» = 4 goles.
 */
import { use, text, fit, width, f, slug, GOLD, WHITE, BLACK, ANTON } from "../core/draw.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350, M = 64;
const SKEW = -.14;                          // inclinación de los textos grandes
const BAND = { y: 1030, h: 62, tilt: 24 };  // banda dorada (sube hacia la derecha)
const bandY = x => BAND.y + BAND.tilt / 2 - BAND.tilt * x / W;

/** "Iago x4, Joan" → [{ name: "IAGO", n: 4 }, { name: "JOAN", n: 1 }] (junta repetidos) */
function scorers(s){
  const out = [];
  for (const raw of String(s || "").split(/[,;\n]+/)){
    const t = raw.trim(); if (!t) continue;
    const m = t.match(/^(.*?)\s*(?:[x×(]\s*(\d+)\s*\)?|\s(\d+))$/i);
    const name = (m ? m[1] : t).trim().toUpperCase(), n = m ? Number(m[2] || m[3]) : 1;
    const prev = out.find(o => o.name === name);
    if (prev) prev.n += n; else out.push({ name, n });
  }
  return out;
}

/**
 * Corrección de color automática para fotos a contraluz (lavadas, con dominante):
 * niveles por canal (percentiles), curva en S y algo más de saturación con un toque cálido.
 * Se calcula una vez por imagen (caché).
 */
const graded = new WeakMap();
function grade(img){
  if (!img) return null;
  if (graded.has(img)) return graded.get(img);
  const k = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; let n = 0;
  for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200){ hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; n++; }
  const pct = (h, p) => { let acc = 0; for (let v = 0; v < 256; v++){ acc += h[v]; if (acc >= p * n) return v; } return 255; };
  const lo = hist.map(h => pct(h, .01)), hi = hist.map(h => pct(h, .995));
  const warm = [1.02, 1, .96];
  const lut = [0, 1, 2].map(ch => {
    const t = new Uint8ClampedArray(256), a = lo[ch], b = Math.max(a + 40, hi[ch]);
    for (let v = 0; v < 256; v++){
      let x = Math.min(1, Math.max(0, (v - a) / (b - a)));
      x = x * x * (3 - 2 * x) * .55 + x * .45;          // curva en S suave
      t[v] = x * 255 * warm[ch];
    }
    return t;
  });
  for (let i = 0; i < d.length; i += 4){
    let r = lut[0][d[i]], gg = lut[1][d[i + 1]], b = lut[2][d[i + 2]];
    const l = .3 * r + .59 * gg + .11 * b, s = 1.1;
    d[i] = l + (r - l) * s; d[i + 1] = l + (gg - l) * s; d[i + 2] = l + (b - l) * s;
  }
  g.putImageData(id, 0, 0);
  graded.set(img, c);
  return c;
}

/** Caja del contenido opaco de un recorte (en píxeles de la imagen). Caché por imagen. */
const boxes = new WeakMap();
function bbox(img){
  if (boxes.has(img)) return boxes.get(img);
  const k = Math.min(1, 400 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const b = x1 < 0 ? { x: 0, y: 0, w: img.width, h: img.height } : { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
  // puntos de apoyo: lo más bajo de la mitad izquierda y de la derecha (pies, balón)
  b.feet = [];
  if (x1 >= 0){
    const mid = (x0 + x1) / 2;
    for (const [a, z] of [[x0, mid], [mid, x1 + 1]]){
      let by = -1, bx = 0;
      for (let x = Math.floor(a); x < z; x++) for (let y = h - 1; y > by; y--) if (d[(y * w + x) * 4 + 3] > 128){ by = y; bx = x; break; }
      if (by >= 0) b.feet.push({ x: (bx + .5) / k, y: (by + 1) / k });
    }
  }
  boxes.set(img, b); return b;
}

/**
 * Escudo con el mismo «peso visual» que el otro, aunque tengan formas distintas (uno alto con
 * tridente, otro ancho): se iguala el área de su caja (media de ancho y alto), con topes.
 */
const crestInfo = new WeakMap();
function crest(ctx, img, cx, cy, area, maxW, maxH){
  if (!img) return;
  let ci = crestInfo.get(img);
  if (!ci){
    const k = Math.min(1, 300 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data; let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 100){ n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    ci = x1 < 0 ? { n: img.width * img.height, x: 0, y: 0, w: img.width, h: img.height }
                : { n: n / k / k, x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
    crestInfo.set(img, ci);
  }
  const s = Math.min(Math.sqrt(area / (ci.w * ci.h)), maxW / ci.w, maxH / ci.h);
  ctx.drawImage(img, cx - (ci.x + ci.w / 2) * s, cy - (ci.y + ci.h / 2) * s, img.width * s, img.height * s);
}

/* ---------- cristal (glassmorphism) ---------- */

/** Copia desenfocada (y algo más luminosa) de lo dibujado hasta ahora, a resolución real. */
function frosted(ctx, blur){
  const cv = ctx.canvas, q = ctx.getTransform().a || 1;
  const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height;
  const g = c.getContext("2d");
  g.filter = `blur(${Math.round(blur * q)}px) brightness(1.3) saturate(1.2)`; g.drawImage(cv, 0, 0);
  return c;
}

/**
 * Cristal esmerilado con la forma que dibuje shape(g, modo) (en unidades de diseño, sobre un
 * contexto ya transformado): fondo desenfocado, tinte, brillo en diagonal y borde luminoso.
 */
function glassShape(ctx, shape, { tint = "255,255,255", alpha = .14, blur = 20, edge = .75, shadow = true } = {}){
  const cv = ctx.canvas, T = ctx.getTransform();
  const mk = () => { const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; const g = c.getContext("2d"); g.setTransform(T); return [c, g]; };
  // máscara de la forma
  const [mask, mg] = mk(); mg.fillStyle = "#fff"; shape(mg, "fill");
  // sombra suave bajo el cristal
  if (shadow){
    const [sh, sg] = mk(); sg.shadowColor = "rgba(0,0,0,.55)"; sg.shadowBlur = 40 * T.a; sg.shadowOffsetY = 14 * T.a;
    sg.fillStyle = "rgba(0,0,0,.35)"; shape(sg, "fill");
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sh, 0, 0); ctx.restore();
  }
  // capa: fondo esmerilado + tinte + brillo, recortada por la máscara
  const [layer, lg] = mk();
  lg.save(); lg.setTransform(1, 0, 0, 1, 0, 0); lg.drawImage(frosted(ctx, blur), 0, 0); lg.restore();
  lg.fillStyle = `rgba(${tint},${alpha})`; lg.fillRect(0, 0, W, H);
  const hi = lg.createLinearGradient(0, 0, W * .35, H);
  hi.addColorStop(0, "rgba(255,255,255,.1)"); hi.addColorStop(.5, "rgba(255,255,255,.02)"); hi.addColorStop(1, "rgba(255,255,255,0)");
  lg.fillStyle = hi; lg.fillRect(0, 0, W, H);
  lg.save(); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = "destination-in"; lg.drawImage(mask, 0, 0); lg.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, 0, 0); ctx.restore();
  // borde luminoso (más brillante arriba a la izquierda, como si le diera la luz)
  if (edge){
    ctx.save();
    const eg = ctx.createLinearGradient(0, 0, W, H);
    eg.addColorStop(0, `rgba(255,255,255,${edge})`); eg.addColorStop(1, `rgba(255,255,255,${edge * .6})`);
    ctx.strokeStyle = eg; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    shape(ctx, "stroke");
    ctx.restore();
  }
}

/** Texto de cristal inclinado. */
function glassText(ctx, t, x, y, font, align, opts){
  glassShape(ctx, (g, mode) => {
    g.save(); g.translate(x, y); g.transform(1, 0, SKEW, 1, 0, 0);
    g.font = font; g.textAlign = align; g.textBaseline = "alphabetic";
    if (mode === "fill") g.fillText(t, 0, 0); else g.strokeText(t, 0, 0);
    g.restore();
  }, opts);
}


/** Texto inclinado (cursiva falsa) apoyado en su línea base. */
function slanted(ctx, t, x, y, font, color, align = "left", spacing = 0){
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, SKEW, 1, 0, 0);
  text(t, 0, 0, font, color, align, spacing);
  ctx.restore();
}

/** Balón dorado clásico: pentágono central, cinco pentágonos cortados en el borde y costuras. */
function ball(ctx, x, y, r){
  const pent = (cx, cy, rad, rot) => { ctx.beginPath(); for (let i = 0; i < 5; i++){ const a = rot + i * Math.PI * 2 / 5; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); };
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill(); ctx.clip();
  ctx.fillStyle = BLACK; ctx.strokeStyle = BLACK; ctx.lineWidth = r * .1;
  const up = -Math.PI / 2, pr = r * .34;
  pent(x, y, pr, up);
  for (let i = 0; i < 5; i++){
    const a = up + i * Math.PI * 2 / 5;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * pr, y + Math.sin(a) * pr); ctx.lineTo(x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72); ctx.stroke();
    const b = a + Math.PI / 5;
    pent(x + Math.cos(b) * r * 1.02, y + Math.sin(b) * r * 1.02, pr * .95, b + Math.PI);
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r - r * .05, 0, Math.PI * 2); ctx.strokeStyle = GOLD; ctx.lineWidth = r * .1; ctx.stroke();
}

export default {
  id: "full-time-goleadores",
  name: "Full Time",
  variant: "Goleadores",
  category: "Resultado",
  description: "Marcador gigante de cristal detrás del jugador, banda dorada con los escudos y los goleadores.",
  thumb: "assets/thumbs/full-time-goleadores.jpg",
  size: { w: W, h: H },
  filename: v => `full_time_${slug(v.nL)}_${v.gL}-${v.gV}_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png", photo_cut: "assets/fotos/jugador_resultado_recorte.png" },

  fields: [
    { type: "section", title: "Local", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Nombre", value: "Futbolge" },
        { type: "number", id: "gL", label: "Goles", value: 3, min: 0, max: 99, narrow: true }
      ]},
      { type: "text", id: "sL", label: "Goleadores", value: "Oier, Alex, Oribe" },
      { type: "image", id: "cL", label: "Escudo (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" }
    ]},
    { type: "section", title: "Visitante", fields: [
      { type: "row", fields: [
        { type: "text", id: "nV", label: "Nombre", value: "Atlético Cacao" },
        { type: "number", id: "gV", label: "Goles", value: 7, min: 0, max: 99, narrow: true }
      ]},
      { type: "text", id: "sV", label: "Goleadores", value: "Iago x4, Joan, Álvaro, Edwin" },
      { type: "image", id: "cV", label: "Escudo (blanco y negro)", src: "assets/img/escudo_atletico_cacao_bn_hd.png" }
    ]},
    { type: "hint", text: "Goleadores separados por comas. Para varios goles del mismo: «Iago x4»." },
    { type: "section", title: "Competición", fields: [
      { type: "text", id: "jornada", label: "Jornada", value: "Jornada 2" },
      { type: "checkbox", id: "showComp", label: "Mostrar logo de la competición", value: true },
      { type: "image", id: "comp", label: "Logo de la competición", src: "assets/img/logo_fvfs.png", visibleIf: v => v.showComp }
    ]},
    { type: "section", title: "Foto", fields: [
      { type: "photo", id: "photo", label: "Foto del jugador", src: "assets/fotos/jugador_resultado.jpg", cutout: "layer",
        cutoutHint: "«Recortar jugador» lo separa del fondo para ponerlo delante del marcador.",
        area: () => ({ x: 0, y: 0, w: W, h: H }) },
      { type: "checkbox", id: "popOut", label: "Jugador delante del marcador", value: true },
      { type: "range", id: "pSize", label: "Tamaño del jugador", value: 100, min: 70, max: 130, visibleIf: v => v.popOut },
      { type: "range", id: "pX", label: "Posición del jugador", value: 0, min: -300, max: 300, visibleIf: v => v.popOut },
      { type: "range", id: "bgShow", label: "Foto de fondo", value: 14, min: 0, max: 80 }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images, ph = m.photo("photo"), cut = v.popOut ? I.photo_cut : null;

    // ── fondo: campo de luz dorada difusa (lo que el cristal refracta) sobre negro
    ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H);
    if (ph){
      ctx.save(); ctx.globalAlpha = Math.min(1, (v.bgShow ?? 14) / 100 * (cut ? 1 : 2.4));
      ctx.filter = cut ? "grayscale(1) blur(12px)" : "none"; ctx.drawImage(grade(ph.img), ph.x, ph.y, ph.w, ph.h);
      ctx.restore();
    }
    for (const [gx, gy, gr, col, ga] of [
      [W / 2, 640, 560, "211,181,42", .5]
    ]){
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gg.addColorStop(0, `rgba(${col},${ga})`); gg.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(10,10,10,.9)"); g.addColorStop(.22, "rgba(10,10,10,.1)"); g.addColorStop(.66, "rgba(10,10,10,.2)"); g.addColorStop(.78, BLACK); g.addColorStop(1, BLACK);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // ── marcador gigante de cristal
    const gL = String(v.gL === "" ? 0 : v.gL), gV = String(v.gV === "" ? 0 : v.gV);
    const sPx = fit(gL + gV, 700, 400, 620, 300, 0, ANTON), base = 900, gap = 118, sf0 = f(400, sPx, ANTON);
    glassText(ctx, gL, W / 2 - gap, base, sf0, "right", { tint: "255,255,255", alpha: .16, blur: 24, edge: .7, shadow: false });
    glassText(ctx, gV, W / 2 + gap, base, sf0, "left", { tint: "211,181,42", alpha: .4, blur: 24, edge: .7, shadow: false });
    const dy = base - sPx * .36;
    ctx.save(); ctx.translate(W / 2, dy); ctx.transform(1, 0, SKEW, 1, 0, 0); ctx.fillStyle = GOLD; ctx.fillRect(-50, -11, 100, 22); ctx.restore();

    // ── banda dorada en diagonal (el jugador la pisa)
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.beginPath(); ctx.moveTo(0, bandY(0)); ctx.lineTo(W, bandY(W)); ctx.lineTo(W, bandY(W) + BAND.h); ctx.lineTo(0, bandY(0) + BAND.h); ctx.closePath();
    ctx.fillStyle = GOLD; ctx.fill(); ctx.restore();

    // ── jugador recortado, colocado por su silueta sobre la banda
    if (ph && cut){
      const img = grade(cut), b = bbox(cut), sc = 800 * (v.pSize ?? 100) / 100 / b.h;
      const cx = 560 + (v.pX ?? 0), x = cx - (b.x + b.w / 2) * sc, w = cut.width * sc, h = cut.height * sc;
      const feet = b.feet.length ? b.feet : [{ x: b.x + b.w / 2, y: b.y + b.h }];
      const y = Math.max(...feet.map(p => bandY(x + p.x * sc) + 3 - p.y * sc));
      ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = BLACK; ctx.filter = "blur(8px)";
      feet.forEach(p => { ctx.beginPath(); ctx.ellipse(x + p.x * sc, y + p.y * sc - 3, 62, 9, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 50; ctx.shadowOffsetX = -12; ctx.drawImage(img, x, y, w, h); ctx.restore();
    }

    // ── cabecera
    const tf = f(400, 118, ANTON), wF = width("FULL", tf, 2);
    slanted(ctx, "FULL", M, 168, tf, WHITE, "left", 2);
    slanted(ctx, "TIME", M + wF + 22, 168, tf, GOLD, "left", 2);
    // arriba a la derecha: logo de la competición y jornada (sin caja)
    const capMid = 168 - 118 * .36, jf = f(400, 46, ANTON);
    const logo = v.showComp && I.comp ? I.comp : null;
    const lw = logo ? Math.min(124, logo.width * 96 / logo.height) : 0, lhh = logo ? lw * logo.height / logo.width : 0;
    const jor = String(v.jornada || "").trim().toUpperCase(), jm = jor.match(/^(.*?)\s*(\d+)$/);
    const jParts = jm && jm[1] ? [jm[1], jm[2]] : [jor, ""];
    let rx = W - M;
    if (logo){ ctx.drawImage(logo, rx - lw, capMid - lhh / 2, lw, lhh); rx -= lw + 26; }
    if (logo && jor){ ctx.fillStyle = GOLD; ctx.fillRect(rx - 2, capMid - 38, 3, 76); rx -= 24; }
    if (jor){
      if (jParts[1]){
        slanted(ctx, jParts[1], rx, capMid + 17, jf, GOLD, "right", 1);
        slanted(ctx, jParts[0], rx - width(jParts[1], jf, 1) - 12, capMid + 17, jf, WHITE, "right", 1);
      } else slanted(ctx, jParts[0], rx, capMid + 17, jf, WHITE, "right", 1);
    }

    // ── equipos: escudos sobre los extremos de la banda, nombre y goleadores en la lámina
    const teams = [
      { n: String(v.nL || "").toUpperCase(), c: I.cL, list: scorers(v.sL), right: false },
      { n: String(v.nV || "").toUpperCase(), c: I.cV, list: scorers(v.sV), right: true }
    ];
    const CREST_AREA = 222 * 222, colX = 290;
    const rows = Math.max(1, ...teams.map(t => t.list.length));
    const lh = Math.min(34, 104 / Math.max(1, rows - 1)), spx = Math.round(Math.min(32, lh * .92)), sf = f(400, spx, ANTON), r = spx * .3, top = 1216;
    ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.fillRect(W / 2 - 1, 1140, 2, 128);
    if (I.firma){ const h = 34, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, W / 2 - w / 2, 1286, w, h); }
    teams.forEach(t => {
      const al = t.right ? "right" : "left", dir = t.right ? -1 : 1, x = t.right ? W - colX : colX;
      const cx = t.right ? W - 158 : 158, cy = bandY(cx) + BAND.h / 2 + 4;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 10;
      crest(ctx, t.c, cx, cy, CREST_AREA, 262, 290); ctx.restore();
      const px = fit(t.n, 220, 400, 46, 24, 1, ANTON);
      slanted(ctx, t.n, x, 1174, f(400, px, ANTON), /FUTBOLGE/.test(t.n) ? GOLD : WHITE, al, 1);
      t.list.forEach((s, i) => {
        const y = top + i * lh, nw = width(s.name, sf, 2), gp = r * 2 + 7;
        text(s.name, x, y, sf, "rgba(255,255,255,.94)", al, 2);
        const bx0 = x + dir * (nw + 16 + r);
        for (let k = 0; k < Math.min(s.n, 8); k++) ball(ctx, bx0 + dir * k * gp, y - spx * .36, r);
      });
    });

    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .1; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
