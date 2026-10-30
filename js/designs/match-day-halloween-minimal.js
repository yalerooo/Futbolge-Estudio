/**
 * DISEÑO · MATCH DAY · HALLOWEEN MINIMAL
 * Una sola idea: fondo negro, un jugador y un título derretido. Todo lo demás (telaraña,
 * dos murciélagos, niebla) se queda en segundo plano y se puede apagar desde el editor.
 * Retícula: márgenes de 64, título a todo el ancho y base negra para los datos.
 */
import { use, f, text, fit, crestCircle, ANTON, slug } from "../core/draw.js";
import { drawToned, blurred } from "../core/fx.js";
import { grain } from "../core/canvas.js";
import { inkFit, bat } from "./match-day-halloween.js";

const W = 1080, H = 1350, M = 64, TITLE_Q = 2, TITLE_H = 640;
const INK = "#0A0809", BONE = "#EFE7D6", EMBER = "#E8701A";
const LABEL = "rgba(239,231,214,.62)";

/* silueta de la foto para la luz de borde (cacheada: la foto no cambia entre repintados) */
const rims = new WeakMap();
function rimOf(img){
  let c = rims.get(img);
  if (c) return c;
  c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in"; g.fillStyle = EMBER; g.fillRect(0, 0, c.width, c.height);
  rims.set(img, c); return c;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* generador con semilla: las gotas no bailan entre repintados y solo cambian si cambia el texto */
function seeded(t){
  let s = 7;
  for (const ch of t) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/* una gota: nace con curva suave del pie de la letra y termina en una perla algo más ancha */
function drip(ctx, x, y, w, len){
  const r = w / 2, b = r * 1.28, fl = w * .7, end = y + len;
  ctx.beginPath(); ctx.moveTo(x - r - fl, y - 1);
  ctx.quadraticCurveTo(x - r, y, x - r, y + fl);
  ctx.lineTo(x - r, end - b * 2);
  ctx.bezierCurveTo(x - r, end - b, x - b, end - b, x - b, end - b * .9);
  ctx.arc(x, end - b * .9, b, Math.PI, 0, true);
  ctx.bezierCurveTo(x + b, end - b, x + r, end - b, x + r, end - b * 2);
  ctx.lineTo(x + r, y + fl);
  ctx.quadraticCurveTo(x + r, y, x + r + fl, y - 1);
  ctx.closePath(); ctx.fill();
}

/* desenfoque de caja (3 pasadas ≈ gaussiano) sobre un canal: sin ctx.filter, para que salga igual en iPhone */
function boxBlur(a, w, h, r){
  const b = new Float32Array(a.length), n = 2 * r + 1;
  const pass = (src, dst, len, lines, step, next) => {
    for (let l = 0; l < lines; l++){
      const o = l * next; let sum = src[o] * (r + 1);
      for (let i = 1; i <= r; i++) sum += src[o + Math.min(i, len - 1) * step];
      for (let i = 0; i < len; i++){
        dst[o + i * step] = sum / n;
        sum += src[o + Math.min(i + r + 1, len - 1) * step] - src[o + Math.max(i - r, 0) * step];
      }
    }
  };
  for (let k = 0; k < 3; k++){ pass(a, b, w, h, 1, w); pass(b, a, h, w, w, 1); }
}

/* la forma del título: letras algo torcidas y gotas, fundidas en una sola masa blanda (desenfoque + umbral) */
function meltMask(t, px, x, y, withDrips, rnd){
  const S = TITLE_Q, c = document.createElement("canvas"); c.width = W * S; c.height = TITLE_H * S;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.scale(S, S); g.fillStyle = "#fff"; g.font = f(400, px, ANTON);
  if ("letterSpacing" in g) g.letterSpacing = "-4px";
  [...t].forEach((ch, i, all) => {
    const cx = x + g.measureText(all.slice(0, i).join("")).width, w = g.measureText(ch).width;
    g.save(); g.translate(cx + w / 2, y + (rnd() - .5) * 8); g.rotate((rnd() - .5) * .024); g.fillText(ch, -w / 2, 0); g.restore();
  });
  /* pies de las letras: tramos de tinta junto a la línea base, leídos de los píxeles */
  const y0 = (y - 20) * S, sh = 42 * S, d = g.getImageData(0, y0, c.width, sh).data, low = new Int32Array(c.width).fill(-1);
  for (let col = 0; col < c.width; col++) for (let row = sh - 1; row >= 0; row--) if (d[(row * c.width + col) * 4 + 3] > 128){ low[col] = y0 + row; break; }
  const feet = []; let start = -1;
  for (let col = 0; col <= c.width; col++){
    const on = col < c.width && low[col] >= 0 && (start < 0 || Math.abs(low[col] - low[col - 1]) < 8);
    if (on && start < 0) start = col;
    if (!on && start >= 0){ if ((col - start) / S >= 16) feet.push([start / S, col / S]); start = col < c.width && low[col] >= 0 ? col : -1; }
  }
  let deepest = null;
  if (withDrips) feet.forEach(([a, b]) => {
    const span = b - a, cx = a + span * (.28 + rnd() * .44), top = low[Math.round(cx * S)] / S - 3;
    if (rnd() < .42){ drip(g, cx, top, Math.min(span * .5, 20 + rnd() * 16), 10 + rnd() * 10); return; }   // solo se ablanda: menos es más
    const w = Math.min(span * .34, 9 + Math.pow(rnd(), 1.6) * 14), len = 18 + Math.pow(rnd(), 2.2) * 165;
    drip(g, cx, top, w, len);
    if (!deepest || len > deepest.len) deepest = { x: cx, w, len, top };
  });
  /* fundido: las esquinas se redondean y las gotas nacen de la letra sin costura */
  const id = g.getImageData(0, 0, c.width, c.height), px4 = id.data, a = new Float32Array(c.width * c.height);
  for (let i = 0; i < a.length; i++) a[i] = px4[i * 4 + 3] / 255;
  boxBlur(a, c.width, c.height, 3 * S);
  for (let i = 0; i < a.length; i++) px4[i * 4 + 3] = 255 * smooth(.455, .545, a[i]);
  g.putImageData(id, 0, 0);
  if (deepest){                                                  // una gota suelta bajo la más larga
    const gy = deepest.top + deepest.len + 36, r = deepest.w * .46;
    g.beginPath(); g.moveTo(deepest.x, gy - r * 2.8);
    g.quadraticCurveTo(deepest.x + r * .35, gy - r, deepest.x + r, gy);
    g.arc(deepest.x, gy, r, 0, Math.PI);
    g.quadraticCurveTo(deepest.x - r * .35, gy - r, deepest.x, gy - r * 2.8);
    g.fill();
  }
  return c;
}

/* borde interior: lo que queda de la forma al restarle su propia copia desplazada */
function rim(mask, color, dy){
  const c = document.createElement("canvas"); c.width = mask.width; c.height = mask.height;
  const g = c.getContext("2d");
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-out"; g.drawImage(mask, 0, dy * TITLE_Q);
  return c;
}

/* título terminado: naranja de calabaza con un brillo arriba y sombra abajo, como cera derretida (cacheado) */
let titleArt = { key: "", cv: null };
function moltenTitle(t, px, x, y, withDrips){
  const key = [t, px, withDrips].join("|");
  if (titleArt.key === key) return titleArt.cv;
  const mask = meltMask(t, px, x, y, withDrips, seeded(t));
  const c = document.createElement("canvas"); c.width = mask.width; c.height = mask.height;
  const g = c.getContext("2d");
  const paint = g.createLinearGradient(0, (y - px) * TITLE_Q, 0, (y + 190) * TITLE_Q);
  paint.addColorStop(0, "#FFAE35"); paint.addColorStop(.5, "#F2760F"); paint.addColorStop(.72, "#D9560A"); paint.addColorStop(1, "#9E3206");
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = "source-in"; g.fillStyle = paint; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = .28; g.drawImage(rim(mask, "#5E1A02", -9), 0, 0);
  g.globalAlpha = .5;  g.drawImage(rim(mask, "#5E1A02", -4), 0, 0);
  g.globalAlpha = .6;  g.drawImage(rim(mask, "#FFE3AE", 2.5), 0, 0);
  titleArt = { key, cv: c }; return c;
}

/* telaraña de hilo fino colgada de una esquina (hacia el interior del cartel) */
function web(ctx, cx, cy, R, from, to){
  const spokes = 7, rings = 6, ang = i => from + (to - from) * i / (spokes - 1);
  ctx.beginPath();
  for (let i = 0; i < spokes; i++){ ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang(i)) * R, cy + Math.sin(ang(i)) * R); }
  for (let k = 1; k <= rings; k++){
    const r = R * Math.pow(k / rings, 1.15);
    for (let i = 0; i < spokes - 1; i++){
      const a0 = ang(i), a1 = ang(i + 1), am = (a0 + a1) / 2, sag = r * .84;     // cada tramo se vence hacia la esquina
      ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      ctx.quadraticCurveTo(cx + Math.cos(am) * sag, cy + Math.sin(am) * sag, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    }
  }
  ctx.stroke();
}

/* niebla: ruido fractal estirado en horizontal y retorcido para que salgan jirones, no una franja (cacheada) */
function fogTexture(seed, rgb, peak){
  const w = 540, h = 300, c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), id = g.createImageData(w, h), d = id.data;
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy);
    const top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * fx, bot = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * fx;
    return top + (bot - top) * fy;
  };
  const fbm = (x, y) => { let v = 0, amp = 1, sum = 0; for (let o = 0; o < 4; o++){ v += noise(x, y) * amp; sum += amp; x = x * 2.03 + 11; y = y * 2.03 + 7; amp *= .42; } return v / sum; };
  for (let y = 0; y < h; y++){
    const v = y / h, env = smooth(0, .62, v) * (1 - smooth(.74, 1, v));
    for (let x = 0; x < w; x++){
      const wx = x / 170, wy = y / 46, warp = fbm(wx * .6 + 3, wy * .6 + 9) - .5;
      const n = fbm(wx + warp * 1.1, wy + warp * .6), i = (y * w + x) * 4;
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
      d[i + 3] = 255 * peak * env * smooth(.34, .74, n);
    }
  }
  g.putImageData(id, 0, 0);
  return c;
}
const fog = {};
const backFog = () => (fog.back ??= fogTexture(3, [196, 150, 126], .3));
const frontFog = () => (fog.front ??= fogTexture(8, [226, 219, 210], .36));

export default {
  id: "match-day-halloween-minimal",
  name: "Match Day",
  variant: "Halloween minimal",
  category: "Día de partido",
  description: "Fondo negro, el jugador a contraluz y un título naranja derretido. Telaraña, murciélagos y niebla, sin pasarse.",
  thumb: "assets/thumbs/match-day-halloween-minimal.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_halloween_minimal_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "text", id: "titulo", label: "Título", value: "MATCH DAY" },
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
      { type: "image", id: "player", label: "Jugador (sube cualquier foto: se recorta solo)", src: "assets/fotos/jugador_halloween.png", cutout: true, cutoutAuto: true,
        cutoutHint: "Al subir una foto normal se quita el fondo automáticamente. Si ya es un PNG sin fondo, se usa tal cual." },
      { type: "range", id: "plSize", label: "Tamaño", value: 100, min: 70, max: 130 },
      { type: "range", id: "plX", label: "Posición horizontal", value: 0, min: -300, max: 300 },
      { type: "range", id: "plY", label: "Posición vertical", value: 0, min: -200, max: 200 }
    ]},
    { type: "section", title: "Ambiente", fields: [
      { type: "checkbox", id: "showDrips", label: "Gotas en el título", value: true },
      { type: "checkbox", id: "showBats", label: "Murciélagos", value: true },
      { type: "checkbox", id: "showWeb", label: "Telaraña", value: true },
      { type: "checkbox", id: "showFog", label: "Niebla", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);

    /* ---------- fondo: un único resplandor de brasa detrás del jugador ---------- */
    const glow = ctx.createRadialGradient(540, 690, 40, 540, 690, 620);
    glow.addColorStop(0, "rgba(206,84,16,.46)"); glow.addColorStop(.5, "rgba(140,44,10,.16)"); glow.addColorStop(1, "rgba(120,40,10,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    /* ---------- telaraña y murciélagos: segundo plano ---------- */
    if (v.showWeb){
      ctx.save(); ctx.strokeStyle = "rgba(239,231,214,.17)"; ctx.lineWidth = 1.3;
      web(ctx, W, 0, 450, Math.PI * .52, Math.PI * .98);
      ctx.restore();
    }
    if (v.showBats){
      bat(ctx, 826, 590, .66, -.14, "#050405");
      bat(ctx, 918, 668, .3, .16, "#050405");
    }

    /* ---------- firma ---------- */
    if (I.firma){ const h = 46, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - w) / 2, 52, w, h); }

    /* ---------- título a todo el ancho, derretido ---------- */
    const t = String(v.titulo || "").toUpperCase();
    if (t){
      const A = inkFit(t, W - M * 2, 300);
      ctx.save(); ctx.shadowColor = "rgba(232,112,26,.22)"; ctx.shadowBlur = 24;
      ctx.drawImage(moltenTitle(t, A.px, M - A.left, 136 + A.cap, v.showDrips), 0, 0, W, TITLE_H);
      ctx.restore();
    }

    /* ---------- niebla de fondo: el jugador sale de ella ---------- */
    if (v.showFog) ctx.drawImage(backFog(), 0, 800, W, 400);

    /* ---------- jugador en blanco y negro, con una luz de brasa en el contorno ---------- */
    const pl = I.player;
    if (pl){
      const ph = 850 * v.plSize / 100, pw = pl.width * ph / pl.height;
      const px = W / 2 - pw / 2 + Number(v.plX), py = 296 + Number(v.plY);
      blurred(ctx, 3, () => { ctx.globalAlpha *= .5; ctx.drawImage(rimOf(pl), px + 2, py - 1, pw, ph); });
      drawToned(ctx, pl, "grayscale(.82) brightness(.9) contrast(1.06) sepia(.16)", px, py, pw, ph);
    }

    /* ---------- fundido a la base negra y niebla delante de los pies ---------- */
    const floor = ctx.createLinearGradient(0, 1104, 0, 1190);
    floor.addColorStop(0, "rgba(10,8,9,0)"); floor.addColorStop(1, INK);
    ctx.fillStyle = floor; ctx.fillRect(0, 1104, W, H - 1104);
    if (v.showFog) ctx.drawImage(frontFog(), 0, 900, W, 330);

    /* ---------- cierre: escudo · hora · escudo, y el pabellón debajo ---------- */
    const hour = String(v.hora || "").trim(), lu = String(v.lugar || "").split("·")[0].trim().toUpperCase();
    const D = 112, cy = 1212, off = 300;
    crestCircle(I.cL, W / 2 - off - D / 2, cy, D);
    crestCircle(I.cV, W / 2 + off - D / 2, cy, D);
    if (hour){
      ctx.font = f(400, 88, ANTON); const hc = ctx.measureText("0").actualBoundingBoxAscent;
      text(hour, W / 2, cy + hc / 2, f(400, 88, ANTON), BONE, "center", 2);
    }
    if (lu) text(lu, W / 2, 1306, f(600, fit(lu, 680, 600, 16, 10, 5)), LABEL, "center", 5);

    /* ---------- textura de papel impreso ---------- */
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .2; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
