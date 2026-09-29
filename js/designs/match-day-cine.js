/**
 * DISEÑO · MATCH DAY · CINE
 * Cartel de estreno de cine: jugador enorme con luz dramática y neblina dorada, fecha gigante
 * en contorno detrás, título en oro metálico, frase gancho, línea de «estreno» y bloque de créditos.
 */
import { use, f, text, fit, width, contain, crestCircle, splitDate, hourH, GOLD, WHITE, ANTON, UI, slug } from "../core/draw.js";
import { drawToned, FILTER_OK } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;

/* neblina: textura de nubes suaves (ruido de varias escalas) generada una sola vez */
let haze = null;
function hazeTexture(){
  if (haze) return haze;
  let s = 97; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const c = document.createElement("canvas"); c.width = 540; c.height = 675;
  const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingQuality = "high";
  for (const [cells, a] of [[5, .55], [10, .35], [22, .2]]){
    const t = document.createElement("canvas"); t.width = cells; t.height = Math.round(cells * 1.25);
    const tg = t.getContext("2d"), d = tg.createImageData(t.width, t.height);
    for (let i = 0; i < d.data.length; i += 4){ const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    tg.putImageData(d, 0, 0);
    g.globalAlpha = a; g.globalCompositeOperation = "lighter"; g.drawImage(t, 0, 0, c.width, c.height);
  }
  // luminancia → alfa, en tono dorado cálido
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4){
    let v = d[i] / 255; v = Math.max(0, (v - .45) / .55); v = v * v;
    d[i] = 235; d[i + 1] = 196; d[i + 2] = 92; d[i + 3] = v * 255;
  }
  g.putImageData(id, 0, 0);
  haze = c; return c;
}

/* jugador con gradación de cine: menos color, más contraste y un baño dorado solo sobre la silueta */
let graded = null, gradedKey = "";
function gradePlayer(img, tint){
  const key = (img && img.src || "") + "|" + img.width + "|" + tint;
  if (graded && gradedKey === key) return graded;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d");
  drawToned(g, img, "saturate(.25) contrast(1.4) brightness(.7)", 0, 0, c.width, c.height);
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = .5 * tint; g.fillStyle = "#c79a2a"; g.globalCompositeOperation = "multiply"; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-in"; g.globalAlpha = 1; g.drawImage(img, 0, 0);
  graded = c; gradedKey = key; return c;
}

/* texto en oro metálico */
function goldText(ctx, t, x, y, px, spacing = 0){
  ctx.save();
  ctx.font = f(400, px, ANTON); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = spacing + "px";
  const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const g = ctx.createLinearGradient(0, y - cap, 0, y);
  g.addColorStop(0, "#fff4c8"); g.addColorStop(.3, "#ecd064"); g.addColorStop(.52, "#b38b1a");
  g.addColorStop(.7, "#f2d97a"); g.addColorStop(1, "#8c6b14");
  ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  ctx.fillStyle = g; ctx.fillText(t, x, y);
  ctx.shadowColor = "transparent";
  // filo de luz arriba
  ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = .35;
  const hl = ctx.createLinearGradient(0, y - cap, 0, y - cap * .7); hl.addColorStop(0, "#fff"); hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl; ctx.fillText(t, x, y);
  ctx.restore();
}

/* centro real de la silueta dentro de la imagen del jugador (la figura no siempre está centrada) */
const centroids = new WeakMap();
function silhouette(img){
  if (centroids.has(img)) return centroids.get(img);
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data; let sx = 0, n = 0, top = 64, bot = 0, upX = 0, upN = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3] > 120){
    sx += x; n++; if (y < top) top = y; if (y > bot) bot = y;
  }
  // centro horizontal del tronco (tercio superior de la figura)
  for (let y = top; y < top + (bot - top) * .45; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3] > 120){ upX += x; upN++; }
  const r = n ? { u: (upN ? upX / upN : sx / n) / 64, top: top / 64, bot: bot / 64 } : { u: .5, top: 0, bot: 1 };
  centroids.set(img, r); return r;
}

export default {
  id: "match-day-cine",
  name: "Match Day",
  variant: "Póster",
  category: "Día de partido",
  description: "Póster editorial: MATCH y DAY gigantes con el jugador en capas entre las letras, escudos y hora.",
  thumb: "assets/thumbs/match-day-cine.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_cine_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

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
      { type: "range", id: "plX", label: "Posición horizontal", value: -70, min: -300, max: 300 },
      { type: "range", id: "plY", label: "Posición vertical", value: 0, min: -200, max: 200 },
      { type: "range", id: "tint", label: "Tono dorado del jugador", value: 0, min: 0, max: 100 }
    ]},
    { type: "section", title: "Estilo", collapsed: true, fields: [
      { type: "segmented", id: "titleColor", value: "gold", options: [{ value: "gold", label: "MATCH dorado" }, { value: "white", label: "MATCH blanco" }] },
      { type: "image", id: "bg", label: "Foto de fondo (muy tenue)", src: "assets/fotos/jugador_pabellon.webp" },
      { type: "range", id: "bgAlpha", label: "Intensidad de la foto de fondo", value: 0, min: 0, max: 60 }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    const M = 64;                                               // margen de la retícula
    const INK = "#0B0A09", CREAM = "#F2EEE4";

    /* ---------- fondo: negro plano con textura ---------- */
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
    if (I.bg && v.bgAlpha > 0){
      const img = I.bg, s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
      ctx.save(); ctx.globalAlpha = v.bgAlpha / 100;
      drawToned(ctx, img, "grayscale(1) contrast(1.2) brightness(.5)", (W - w) / 2, (H - h) / 2, w, h);
      ctx.restore();
    }

    /* ---------- cabecera: solo la firma, centrada ---------- */
    if (I.firma){ const h = 46, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - w) / 2, 52, w, h); }

    /* ---------- «MATCH» gigante detrás del jugador (alineado a la izquierda) ---------- */
    const t1 = String(v.t1 || "").toUpperCase(), t2 = String(v.t2 || "").toUpperCase();
    const maxW = W - M * 2;
    const P1 = fit(t1, maxW, 400, 400, 120, -4, ANTON);
    ctx.font = f(400, P1, ANTON); const cap1 = ctx.measureText("H").actualBoundingBoxAscent;
    const y1 = 138 + cap1;
    text(t1, M - 4, y1, f(400, P1, ANTON), v.titleColor === "white" ? CREAM : GOLD, "left", -4);

    /* ---------- jugador en blanco y negro, entre las dos palabras ---------- */
    const pl = I.player;
    if (pl){
      const ph = 1000 * v.plSize / 100, pw = pl.width * ph / pl.height;
      const sil = silhouette(pl);
      const px = W / 2 - sil.u * pw + Number(v.plX), py = 150 + Number(v.plY);
      const c = document.createElement("canvas"); c.width = pl.width; c.height = pl.height;
      const g = c.getContext("2d");
      drawToned(g, pl, "grayscale(1) contrast(1.22) brightness(.86)", 0, 0, c.width, c.height);
      const t = v.tint / 100;
      if (t > 0){ g.globalCompositeOperation = "multiply"; g.globalAlpha = .55 * t; g.fillStyle = "#c9a53a"; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = "destination-in"; g.globalAlpha = 1; g.drawImage(pl, 0, 0); }
      // sombra corta y dura para despegarlo de la palabra de detrás
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 28; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 12;
      ctx.drawImage(c, px, py, pw, ph); ctx.restore();
    }

    /* ---------- «DAY» gigante delante del jugador (alineado a la derecha) ---------- */
    const P2 = Math.min(fit(t2, maxW, 400, 400, 120, -4, ANTON), P1 * 1.08);
    ctx.font = f(400, P2, ANTON); const cap2 = ctx.measureText("H").actualBoundingBoxAscent;
    const y2 = 1040;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = -6;
    text(t2, W - M + 4, y2, f(400, P2, ANTON), CREAM, "right", -4);
    ctx.restore();
    // la parte baja del jugador se apaga bajo el título
    const fade = ctx.createLinearGradient(0, y2 - 10, 0, y2 + 60);
    fade.addColorStop(0, "rgba(11,10,9,0)"); fade.addColorStop(1, INK);
    ctx.fillStyle = fade; ctx.fillRect(0, y2 - 10, W, 70);
    ctx.fillStyle = INK; ctx.fillRect(0, y2 + 60, W, H - y2 - 60);

    /* ---------- cierre centrado: escudo · hora · escudo, y el pabellón debajo ---------- */
    const hour = String(v.hora || "").trim(), lu = String(v.lugar || "").split("·")[0].trim().toUpperCase();
    const D = 150, cy = 1202, off = 262;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 18;
    crestCircle(I.cL, W / 2 - off - D / 2, cy, D);
    crestCircle(I.cV, W / 2 + off - D / 2, cy, D);
    ctx.restore();
    if (hour){
      ctx.font = f(400, 104, ANTON); const hc = ctx.measureText("0").actualBoundingBoxAscent;
      text(hour, W / 2, cy + hc / 2, f(400, 104, ANTON), CREAM, "center", 2);
    }
    if (lu){
      const lp = fit(lu, 680, 600, 16, 10, 7);
      text(lu, W / 2, 1318, f(600, lp), "rgba(242,238,228,.62)", "center", 7);
    }

    /* ---------- textura de papel impreso ---------- */
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .12; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
