/**
 * DISEÑO · NEXT MATCH · DERBI (previa sin jugador)
 * Póster de derbi partido en diagonal: arriba oro macizo con el escudo local impreso en negro,
 * abajo negro con el escudo visitante en blanco. El título cruza el corte y cambia de color a cada lado.
 */
import { use, f, text, fit, splitDate, hourH, GOLD, WHITE, ANTON, slug } from "../core/draw.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350, M = 56;
const INK = "#0B0B0A";
const Y0 = 880, Y1 = 500;                                   // la diagonal: y en x = 0 y en x = W
const diagY = x => Y0 + (Y1 - Y0) * x / W;
const ANG = Math.atan2(Y1 - Y0, W);
const isOurs = name => name.includes("FUTBOLGE");

/* ---------- escudo «impreso» en negro sobre oro: lo blanco pasa a tinta y lo negro desaparece en el oro ---------- */
const printed = new WeakMap();
function printOnGold(img){
  if (!img) return null;
  if (printed.has(img)) return printed.get(img);
  const k = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4){
    const l = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) / 255;   // 1 = línea blanca
    a[i] = 11; a[i + 1] = 11; a[i + 2] = 10;
    a[i + 3] = a[i + 3] * Math.min(1, Math.max(0, (l - .18) / .5));
  }
  g.putImageData(d, 0, 0);
  printed.set(img, c);
  return c;
}

/** Escudo en una caja centrada en (cx, cy). Los altos (tridente) se centran en su círculo. */
function crestBox(ctx, img, cx, cy, maxW, maxH){
  if (!img) return;
  const tall = img.height > img.width * 1.15;
  const s = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, cx - w / 2, cy - (tall ? h * .58 : h / 2), w, h);
}

const goldPath = ctx => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, Y1); ctx.lineTo(0, Y0); ctx.closePath(); };
const inkPath = ctx => { ctx.beginPath(); ctx.moveTo(0, Y0); ctx.lineTo(W, Y1); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); };

/** Trama de puntos de imprenta: los puntos crecen hacia el corte diagonal. */
function halftone(ctx){
  ctx.save(); goldPath(ctx); ctx.clip();
  ctx.fillStyle = "rgba(11,11,10,.13)";
  const step = 14, rot = -Math.PI / 4;
  for (let gy = -H; gy < H * 2; gy += step) for (let gx = -W; gx < W * 2; gx += step){
    const x = gx * Math.cos(rot) - gy * Math.sin(rot), y = gx * Math.sin(rot) + gy * Math.cos(rot);
    if (x < -10 || x > W + 10 || y < -10) continue;
    const dist = diagY(x) - y; if (dist < 0 || dist > 420) continue;
    const r = 5.2 * (1 - dist / 420) ** 1.6;
    if (r < .5) continue;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function titleAcross(ctx, v){
  const t = `${String(v.t1).trim()} ${String(v.t2).trim()}`.trim().toUpperCase();
  if (!t) return;
  const len = Math.hypot(W, Y1 - Y0);
  const px = fit(t, len - 150, 400, 250, 80, 2, ANTON);
  ctx.font = f(400, px, ANTON); const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const cx = W / 2, cy = diagY(cx);
  const draw = col => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ANG);
    text(t, 0, cap / 2, f(400, px, ANTON), col, "center", 2);
    ctx.restore();
  };
  ctx.save(); goldPath(ctx); ctx.clip(); draw(INK); ctx.restore();
  ctx.save(); inkPath(ctx); ctx.clip(); draw(GOLD); ctx.restore();
}

function tinted(img, color){
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
let firmaInk = null, firmaSrc = null;

export default {
  id: "next-match-derbi",
  name: "Next Match",
  variant: "Derbi",
  category: "Previa",
  description: "Sin foto: póster partido en diagonal, escudo local impreso sobre oro y visitante sobre negro.",
  thumb: "assets/thumbs/next-match-derbi.jpg",
  size: { w: W, h: H },
  filename: v => `next_match_${slug(v.nL)}_vs_${slug(v.nV)}_derbi.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Título (1)", value: "NEXT" },
        { type: "text", id: "t2", label: "Título (2)", value: "MATCH" }
      ]},
      { type: "text", id: "sub", label: "Competición", value: "Liga" },
      { type: "row", fields: [
        { type: "text", id: "fecha", label: "Día", value: "Domingo 08/11/2026" },
        { type: "text", id: "hora", label: "Hora", value: "14:00", narrow: true }
      ]},
      { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde · Vitoria-Gasteiz" }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local (arriba, sobre oro)", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante (abajo, sobre negro)", value: "Atlético Cacao" }
      ]},
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_atletico_cacao_bn_hd.png" },
      { type: "hint", text: "Usa escudos en blanco y negro: el local se imprime en negro sobre el oro." }
    ]},
    { type: "section", title: "Estilo", fields: [
      { type: "checkbox", id: "dots", label: "Trama de puntos de imprenta", value: true },
      { type: "range", id: "crestSize", label: "Tamaño de los escudos", value: 100, min: 70, max: 125 }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images, k = (v.crestSize || 100) / 100;

    // fondo partido en diagonal
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GOLD; goldPath(ctx); ctx.fill();
    if (v.dots) halftone(ctx);
    // filete fino paralelo al corte, en el lado negro
    ctx.save(); ctx.strokeStyle = "rgba(211,181,42,.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, Y0 + 22); ctx.lineTo(W, Y1 + 22); ctx.stroke(); ctx.restore();

    // escudos gigantes, cada uno en su mitad (recortados por el corte)
    ctx.save(); goldPath(ctx); ctx.clip();
    crestBox(ctx, printOnGold(I.cL), 300, 380, 520 * k, 700 * k);
    ctx.restore();
    ctx.save(); inkPath(ctx); ctx.clip();
    crestBox(ctx, I.cV, 790, 1052, 500 * k, 500 * k);
    ctx.restore();

    titleAcross(ctx, v);

    /* ---------- arriba a la derecha (sobre oro): local, fecha y hora ---------- */
    const RX = W - M;
    if (I.firma){
      if (firmaSrc !== I.firma){ firmaInk = tinted(I.firma, INK); firmaSrc = I.firma; }
      const h = 38, w = I.firma.width * h / I.firma.height; ctx.drawImage(firmaInk, RX - w + 6, 46, w, h);
    }
    const sub = String(v.sub).trim().toUpperCase();
    text("LOCAL" + (sub ? "  ·  " + sub : ""), RX, 150, f(800, 14), "rgba(11,11,10,.62)", "right", 5);
    const nL = String(v.nL || "").trim().toUpperCase();
    if (nL) text(nL, RX + 3, 246, f(400, fit(nL, 430, 400, 104, 40, 1, ANTON), ANTON), INK, "right", 1);
    ctx.fillStyle = "rgba(11,11,10,.35)"; ctx.fillRect(RX - 430, 280, 430, 2);
    const { day, date } = splitDate(v.fecha);
    const dTxt = `${day} ${date}`.trim();
    if (dTxt) text(dTxt, RX, 340, f(400, fit(dTxt, 430, 400, 50, 24, 1, ANTON), ANTON), INK, "right", 1);
    const ho = hourH(v.hora);
    if (ho) text(ho, RX + 3, 432, f(400, 96, ANTON), INK, "right", 1);

    /* ---------- abajo a la izquierda (sobre negro): visitante y pabellón ---------- */
    text("VISITANTE", M, 1012, f(800, 14), "rgba(255,255,255,.55)", "left", 5);
    const words = String(v.nV || "").trim().toUpperCase().split(/\s+/).filter(Boolean);
    const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : words;
    const vpx = Math.min(...lines.map(l => fit(l, 420, 400, 104, 40, 1, ANTON)), 104);
    lines.forEach((l, i) => text(l, M - 3, 1108 + i * vpx * .98, f(400, vpx, ANTON), isOurs(l) ? GOLD : WHITE, "left", 1));
    const lu = String(v.lugar).trim().toUpperCase();
    if (lu) text(lu, M, H - 52, f(700, fit(lu, 600, 700, 14, 9, 4)), "rgba(255,255,255,.6)", "left", 4);

    // texto vertical en el borde izquierdo (detalle de imprenta)
    ctx.save(); ctx.translate(30, 470); ctx.rotate(-Math.PI / 2);
    text("FUTBOLGE  ·  MMXXVI", 0, 5, f(800, 11), "rgba(11,11,10,.5)", "center", 6);
    ctx.restore();

    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .09; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
