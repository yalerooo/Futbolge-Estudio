/**
 * DISEÑO · MATCH DAY · HALLOWEEN
 * Una sola idea: el jugador no está solo. Luna plana de oro a brasa que se pone en un horizonte recto,
 * MATCH que invierte su color al cruzarla y, a la espalda del jugador, su sombra con cuernos y el tridente del club.
 * Retícula: márgenes de 64, DAY y la sombra apoyados en el horizonte, base negra para los datos.
 */
import { use, f, text, fit, crestCircle, GOLD, ANTON, slug } from "../core/draw.js";
import { drawToned } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350, M = 64, HORIZON = 1028;
const INK = "#0B0A09", CREAM = "#F2EEE4", EMBER = "#DB6A1C";
const MOON = { x: 540, y: 716, r: 424 };
const LABEL = "rgba(242,238,228,.62)";

/* silueta de una imagen en un color (cacheada: la foto no cambia entre repintados) */
const tinted = new WeakMap();
function silhouetteOf(img, color){
  let c = tinted.get(img);
  if (c) return c;
  c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  tinted.set(img, c); return c;
}

/* medidas de la figura: centro del tronco, cabeza y altura, para colocar los cuernos en cualquier foto */
const shapes = new WeakMap();
function shapeOf(img){
  if (shapes.has(img)) return shapes.get(img);
  const N = 128, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data, on = (x, y) => d[(y * N + x) * 4 + 3] > 120;
  let top = N, bot = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (on(x, y)){ if (y < top) top = y; if (y > bot) bot = y; }
  let sx = 0, n = 0;
  for (let y = top; y < top + (bot - top) * .45; y++) for (let x = 0; x < N; x++) if (on(x, y)){ sx += x; n++; }
  const row = Math.min(N - 1, Math.round(top + (bot - top) * .07));
  let l = N, r = 0;
  for (let x = 0; x < N; x++) if (on(x, row)){ if (x < l) l = x; if (x > r) r = x; }
  const s = { u: n ? sx / n / N : .5, top: top / N, headL: l / N, headR: r / N, headY: row / N };
  shapes.set(img, s); return s;
}

/* cuerno: media luna que sale de la cabeza hacia fuera y arriba (k = -1 izquierda, 1 derecha) */
function horn(ctx, x, y, k, s){
  ctx.beginPath(); ctx.moveTo(x - k * s * .34, y + s * .12);
  ctx.bezierCurveTo(x + k * s * .25, y - s * .1, x + k * s * .72, y - s * .42, x + k * s * .62, y - s * 1.12);
  ctx.bezierCurveTo(x + k * s * .34, y - s * .7, x - k * s * .04, y - s * .52, x - k * s * .42, y - s * .36);
  ctx.closePath(); ctx.fill();
}

/* tridente del club: la cabeza es la de la firma; el mástil se alarga hasta el suelo */
const FIRMA_TRIDENT = { w: .2195, shaftW: .0277 };
function trident(ctx, firma, cx, top, headW, bottom){
  const sc = silhouetteOf(firma, INK);
  const sw = firma.width * FIRMA_TRIDENT.w, s = headW / sw;
  const headH = firma.height * .9 * s, x = cx - headW / 2;
  // en el archivo la púa izquierda toca el borde y sale recortada: se dibuja reflejando la derecha
  const tine = .27, keep = .06;
  ctx.drawImage(sc, sw * keep, 0, sw * (1 - keep), firma.height * .9, x + headW * keep, top, headW * (1 - keep), headH);
  ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1);
  ctx.drawImage(sc, sw * (1 - tine), 0, sw * tine, firma.height * .9, headW / 2 - headW * tine, top, headW * tine, headH);
  ctx.restore();
  const shaft = firma.width * FIRMA_TRIDENT.shaftW * s;
  ctx.fillStyle = INK; ctx.fillRect(cx - shaft / 2, top + headH - 2, shaft, bottom - top - headH + 2);
}

/* murciélago plano de alas en punta */
export function bat(ctx, x, y, s, rot, color){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath();                                              // una sola forma: sin costura en el eje
  [-1, 1].forEach(k => {
    ctx.moveTo(0, -17); ctx.lineTo(k * 2.2, -13);               // entre las orejas
    ctx.lineTo(k * 6.5, -20); ctx.lineTo(k * 7, -9);            // oreja y cuello
    ctx.quadraticCurveTo(k * 15, -9, k * 25, -24);              // hombro hasta la garra
    ctx.quadraticCurveTo(k * 44, -22, k * 86, 1);               // borde de ataque hasta la punta
    ctx.quadraticCurveTo(k * 70, -2, k * 60, 15);               // festones del ala
    ctx.quadraticCurveTo(k * 47, 3, k * 34, 18);
    ctx.quadraticCurveTo(k * 22, 7, k * 11, 19);
    ctx.quadraticCurveTo(k * 7, 15, k * 4, 16);
    ctx.lineTo(0, 27); ctx.closePath();
  });
  ctx.fill();
  ctx.restore();
}
const BATS = [[806, 556, 1, -.12], [896, 636, .42, .14], [690, 628, .34, -.18]];

/* caja de tinta real de una palabra en Anton, leída de los píxeles (las métricas del navegador no son exactas) */
const inkCache = new Map();
function inkBox(t, px){
  const key = t + "|" + px;
  if (inkCache.has(key)) return inkCache.get(key);
  const pad = Math.ceil(px * .2), w = Math.ceil(px * (t.length * .7 + .5)) + pad * 2, h = Math.ceil(px * 1.5), base = Math.ceil(px * 1.25);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.font = f(400, px, ANTON); if ("letterSpacing" in g) g.letterSpacing = "-4px"; g.fillText(t, pad, base);
  const d = g.getImageData(0, 0, w, h).data;
  let l = w, r = -1, top = h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128){ if (x < l) l = x; if (x > r) r = x; if (y < top) top = y; }
  const box = r < 0 ? { left: 0, right: 0, cap: 0 } : { left: l - pad, right: r + 1 - pad, cap: base - top };
  inkCache.set(key, box); return box;
}
/* tamaño con el que la tinta de la palabra cabe exacta en maxW */
export function inkFit(t, maxW, maxPx){
  let box = inkBox(t, maxPx), px = maxPx;
  if (box.right - box.left > maxW){ px = Math.max(120, Math.floor(maxPx * maxW / (box.right - box.left)) + 2); box = inkBox(t, px); }
  while (px > 120 && box.right - box.left > maxW){ px--; box = inkBox(t, px); }
  return { px, ...box };
}

export default {
  id: "match-day-halloween",
  name: "Match Day",
  variant: "Halloween",
  category: "Día de partido",
  description: "Luna de oro a brasa, título que invierte su color y, a la espalda del jugador, su sombra con cuernos y el tridente del club.",
  thumb: "assets/thumbs/match-day-halloween.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_halloween_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Título", value: "MATCH" },
        { type: "text", id: "t2", label: "Título (2ª palabra)", value: "DAY" }
      ]},
      { type: "row", fields: [
        { type: "text", id: "hora", label: "Hora", value: "18:00", narrow: true },
        { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde" }
      ]},
      { type: "row", fields: [
        { type: "text", id: "tagL", label: "Texto arriba izquierda", value: "Noche de Halloween" },
        { type: "text", id: "tagR", label: "Texto arriba derecha", value: "Truco o gol" }
      ]},
      { type: "hint", text: "El Match Day se publica el mismo día del partido: no lleva fecha." }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante", value: "Jaimitos FC" }
      ]},
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_jaimitos_bn_hd.png" }
    ]},
    { type: "section", title: "Jugador", fields: [
      { type: "image", id: "player", label: "Jugador (sube cualquier foto: se recorta solo)", src: "assets/fotos/jugador_recorte.png", cutout: true, cutoutAuto: true,
        cutoutHint: "Al subir una foto normal se quita el fondo automáticamente. Si ya es un PNG sin fondo, se usa tal cual." },
      { type: "range", id: "plSize", label: "Tamaño", value: 116, min: 70, max: 140 },
      { type: "range", id: "plX", label: "Posición horizontal", value: -14, min: -300, max: 300 },
      { type: "range", id: "plY", label: "Posición vertical", value: 0, min: -200, max: 200 }
    ]},
    { type: "section", title: "La sombra", fields: [
      { type: "checkbox", id: "devil", label: "Sombra con cuernos y tridente", value: true },
      { type: "range", id: "dvX", label: "Posición de la sombra (con cuernos y tridente)", value: 0, min: -120, max: 120, visibleIf: v => v.devil },
      { type: "checkbox", id: "showBats", label: "Murciélagos", value: true }
    ]},
    { type: "section", title: "Cuernos", visibleIf: v => v.devil, fields: [
      { type: "hint", text: "Si cambias de jugador, ajusta aquí los cuernos para que encajen en su cabeza." },
      { type: "range", id: "hornX", label: "Posición horizontal", value: 0, min: -150, max: 150 },
      { type: "range", id: "hornY", label: "Posición vertical", value: 0, min: -150, max: 150 },
      { type: "range", id: "hornGap", label: "Separación", value: 0, min: -60, max: 60 },
      { type: "range", id: "hornSize", label: "Tamaño", value: 100, min: 40, max: 200 }
    ]},
    { type: "section", title: "Tridente", visibleIf: v => v.devil, fields: [
      { type: "range", id: "trX", label: "Posición horizontal", value: 0, min: -150, max: 300 },
      { type: "range", id: "trY", label: "Posición vertical", value: 0, min: -200, max: 300 },
      { type: "range", id: "trSize", label: "Tamaño", value: 100, min: 50, max: 180 }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);

    /* ---------- luna plana: del oro de la casa a la brasa, como una tinta degradada ---------- */
    const moon = ctx.createLinearGradient(0, MOON.y - MOON.r, 0, HORIZON);
    moon.addColorStop(0, GOLD); moon.addColorStop(.42, "#DBA628"); moon.addColorStop(1, EMBER);
    ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r, 0, 7); ctx.fill();

    /* ---------- cabecera en tres columnas ---------- */
    if (I.firma){ const h = 46, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - w) / 2, 52, w, h); }
    const tagL = String(v.tagL || "").toUpperCase(), tagR = String(v.tagR || "").toUpperCase();
    if (tagL) text(tagL, M, 81, f(600, fit(tagL, 310, 600, 16, 10, 5)), LABEL, "left", 5);
    if (tagR) text(tagR, W - M + 5, 81, f(600, fit(tagR, 310, 600, 16, 10, 5)), LABEL, "right", 5);

    /* ---------- «MATCH»: oro sobre la noche, negro al cruzar la luna ---------- */
    const t1 = String(v.t1 || "").toUpperCase(), t2 = String(v.t2 || "").toUpperCase();
    const maxW = W - M * 2;
    const A = inkFit(t1, maxW, 470);
    const y1 = 132 + A.cap, x1 = M - A.left, font1 = f(400, A.px, ANTON);
    text(t1, x1, y1, font1, GOLD, "left", -4);
    ctx.save(); ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r, 0, 7); ctx.clip();
    text(t1, x1, y1, font1, INK, "left", -4);
    ctx.restore();

    /* ---------- murciélagos, solo en el hueco libre de la luna ---------- */
    if (v.showBats) BATS.forEach(([x, y, s, rot]) => bat(ctx, x, y, s, rot, INK));

    const pl = I.player;
    /* ---------- la sombra: el mismo jugador en negro, más lejos, con cuernos y tridente ---------- */
    if (pl && v.devil){
      const sh = shapeOf(pl), dh = 700, dw = pl.width * dh / pl.height;
      const dx = 312 + Number(v.dvX) - sh.u * dw, dy = 494 - sh.top * dh;
      ctx.save(); ctx.fillStyle = INK;
      ctx.drawImage(silhouetteOf(pl, INK), dx, dy, dw, dh);
      const hornS = (sh.headR - sh.headL) * dw * .44 * v.hornSize / 100, hy = dy + sh.headY * dh + Number(v.hornY);
      const hornX = Number(v.hornX), gap = Number(v.hornGap);
      horn(ctx, dx + sh.headL * dw + hornS * .3 + hornX - gap, hy, -1, hornS);
      horn(ctx, dx + sh.headR * dw - hornS * .3 + hornX + gap, hy, 1, hornS);
      ctx.restore();
      if (I.firma) trident(ctx, I.firma, 216 + Number(v.dvX) + Number(v.trX), 512 + Number(v.trY), 104 * v.trSize / 100, HORIZON);
    }

    /* ---------- jugador en blanco y negro, como en el póster de siempre ---------- */
    if (pl){
      const ph = 1000 * v.plSize / 100, pw = pl.width * ph / pl.height;
      const px = W / 2 - shapeOf(pl).u * pw + Number(v.plX), py = 192 + Number(v.plY);
      const c = document.createElement("canvas"); c.width = pl.width; c.height = pl.height;
      drawToned(c.getContext("2d"), pl, "grayscale(1) brightness(.8) contrast(1.28) sepia(.1)", 0, 0, c.width, c.height);
      ctx.drawImage(c, px, py, pw, ph);
    }

    /* ---------- horizonte recto: todo se hunde en la base negra ---------- */
    ctx.fillStyle = INK; ctx.fillRect(0, HORIZON, W, H - HORIZON);

    /* ---------- «DAY» apoyado en el horizonte ---------- */
    const B = inkFit(t2, maxW, A.px);
    text(t2, W - M - B.right, HORIZON, f(400, B.px, ANTON), CREAM, "left", -4);

    /* ---------- cierre: escudo · hora · escudo, y el pabellón debajo ---------- */
    const hour = String(v.hora || "").trim(), lu = String(v.lugar || "").split("·")[0].trim().toUpperCase();
    const D = 130, cy = 1176, off = 287;                         // los escudos caen bajo los extremos de la luna
    crestCircle(I.cL, W / 2 - off - D / 2, cy, D);
    crestCircle(I.cV, W / 2 + off - D / 2, cy, D);
    if (hour){
      ctx.font = f(400, 96, ANTON); const hc = ctx.measureText("0").actualBoundingBoxAscent;
      text(hour, W / 2, cy + hc / 2, f(400, 96, ANTON), CREAM, "center", 2);
    }
    if (lu){
      const lp = fit(lu, 680, 600, 16, 10, 5);
      text(lu, W / 2, 1298, f(600, lp), LABEL, "center", 5);
    }

    /* ---------- textura de papel impreso ---------- */
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .16; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
