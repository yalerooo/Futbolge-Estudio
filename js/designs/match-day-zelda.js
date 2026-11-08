/**
 * DISEÑO · MATCH DAY · ZELDA (OCARINA OF TIME)
 * Una sola idea: una ilustración del juego a toda página, enmarcada como un póster de cine.
 * Encima solo hay texto en oro y Cinzel: el título arriba y escudo · hora · escudo abajo.
 * Retícula: marco a 22, firma en el hueco del marco, título arriba y la base sobre el fondo oscurecido.
 */
import { use, f, text, fit, width, crestCircle, slug } from "../core/draw.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350, FRAME = 22;
const CINZEL = '"Cinzel", serif';
const GOLD = "#D9B055", LINE = "rgba(214,172,84,.85)", CREAM = "#F3E9D2";

/* fondos: `top` es la fila de la ilustración que queda en el borde de arriba del cartel (en píxeles del archivo);
 * el pixel art se amplía sin suavizar para que no se emborrone */
const BGS = {
  fuego:  { asset: "bgFuego",  top: 100 },
  espada: { asset: "bgEspada", top: 340 },
  pixel:  { asset: "bgPixel",  top: 175, pixel: true }
};

/* fondo a todo el ancho, con el encuadre del fondo elegido más el ajuste del editor */
function background(ctx, img, bg, shift){
  const s = W / img.width, h = img.height * s;
  const y = Math.min(0, Math.max(H - h, -bg.top * s + shift));
  ctx.save(); ctx.imageSmoothingEnabled = !bg.pixel;
  ctx.drawImage(img, 0, y, W, h);
  ctx.restore();
}

/* sombras de póster: arriba para el título, abajo para la base y una viñeta que cierra las esquinas */
function shade(ctx){
  const top = ctx.createLinearGradient(0, 0, 0, 470);
  top.addColorStop(0, "rgba(4,6,14,.82)"); top.addColorStop(.55, "rgba(4,6,14,.45)"); top.addColorStop(1, "rgba(4,6,14,0)");
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 470);
  const bot = ctx.createLinearGradient(0, 900, 0, H);
  bot.addColorStop(0, "rgba(3,4,8,0)"); bot.addColorStop(.5, "rgba(3,4,8,.7)"); bot.addColorStop(1, "rgba(3,4,8,.94)");
  ctx.fillStyle = bot; ctx.fillRect(0, 900, W, H - 900);
  const vig = ctx.createRadialGradient(W / 2, H * .5, H * .3, W / 2, H * .5, H * .82);
  vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,.5)");
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
}

/* escudo en oro de línea: lo claro del escudo pasa a oro y lo oscuro se vuelve transparente (cacheado) */
const golds = new WeakMap();
function goldOf(img){
  if (golds.has(img)) return golds.get(img);
  const k = Math.min(1, 700 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, h = c.height;
  for (let i = 0; i < d.length; i += 4){
    const L = (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255, t = 1 - (i / 4 / c.width) / h;   // t: brillo de arriba abajo
    d[i] = 196 + 59 * t; d[i + 1] = 146 + 80 * t; d[i + 2] = 60 + 90 * t * t;
    d[i + 3] *= Math.min(1, Math.max(0, (L - .28) / .4));
  }
  g.putImageData(id, 0, 0);
  golds.set(img, c); return c;
}

/* marco dorado fino con escuadras en las esquinas, Trifuerzas pequeñas arriba y hueco para la firma */
function miniTriforce(ctx, cx, top, h){
  const s = h / Math.sqrt(3);
  const tri = (x, y) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s / 2, y + h / 2); ctx.lineTo(x - s / 2, y + h / 2); ctx.closePath(); ctx.fill(); };
  ctx.fillStyle = GOLD; tri(cx, top); tri(cx - s / 2, top + h / 2); tri(cx + s / 2, top + h / 2);
}
function frame(ctx, gapHalf){
  const a = FRAME, b = FRAME + 10, x1 = W - a, y1 = H - a, c = 46;
  ctx.save(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(W / 2 - gapHalf, a); ctx.lineTo(a, a); ctx.lineTo(a, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, a); ctx.lineTo(W / 2 + gapHalf, a);
  ctx.stroke();
  ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(214,172,84,.6)";
  [[b, b, 1, 1], [W - b, b, -1, 1], [b, H - b, 1, -1], [W - b, H - b, -1, -1]].forEach(([x, y, kx, ky]) => {
    ctx.beginPath(); ctx.moveTo(x + kx * c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + ky * c); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - kx * 10, y + ky * 4); ctx.lineTo(x + kx * 4, y - ky * 10); ctx.stroke();   // diagonal de la esquina
  });
  ctx.restore();
  miniTriforce(ctx, 60, 44, 16); miniTriforce(ctx, W - 60, 44, 16);
}

/* título en oro batido: letras de los extremos más altas (como en los carteles de cine), relieve y brillo */
function goldTitle(ctx, t, cx, y, maxW){
  const letters = [...t], big = i => (i === 0 || i === letters.length - 1) && letters.length > 2;
  let px = 128, sp = 2;
  const measure = p => letters.reduce((s, ch, i) => { ctx.font = f(900, big(i) ? p * 1.22 : p, CINZEL); return s + ctx.measureText(ch).width + sp; }, -sp);
  while (px > 50 && measure(px) > maxW) px--;
  const total = measure(px), q = ctx.getTransform().a || 1;
  ctx.font = f(900, px * 1.22, CINZEL); const capBig = ctx.measureText("M").actualBoundingBoxAscent;
  const top = y - capBig - 10, hh = capBig + 30;
  const c = document.createElement("canvas"); c.width = Math.ceil(W * q); c.height = Math.ceil(hh * q);
  const g = c.getContext("2d"); g.scale(q, q); g.translate(0, -top);
  let x = cx - total / 2;
  g.textBaseline = "alphabetic"; g.fillStyle = "#fff";
  letters.forEach((ch, i) => { g.font = f(900, big(i) ? px * 1.22 : px, CINZEL); g.fillText(ch, x, y); x += g.measureText(ch).width + sp; });
  g.globalCompositeOperation = "source-in";
  const metal = g.createLinearGradient(0, y - capBig, 0, y);
  metal.addColorStop(0, "#FFF6CF"); metal.addColorStop(.32, "#F7D774"); metal.addColorStop(.55, "#C99A3A"); metal.addColorStop(.72, "#F2CF6E"); metal.addColorStop(1, "#A87428");
  g.fillStyle = metal; g.fillRect(0, top, W, hh);
  g.globalCompositeOperation = "source-atop"; g.globalAlpha = .16;             // oro batido: grano dentro de las letras
  g.drawImage(grain(), 0, top, W, hh);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.drawImage(c, 0, top, W, hh);
  ctx.shadowColor = "rgba(255,200,110,.35)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 0;
  ctx.globalAlpha = .5; ctx.drawImage(c, 0, top, W, hh);
  ctx.restore();
}

/* texto crema en Cinzel con sombra suave */
function caption(ctx, t, x, y, px, spacing, color = CREAM, weight = 700){
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.85)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
  text(t, x, y, f(weight, px, CINZEL), color, "center", spacing);
  ctx.restore();
}

/* hora en oro, más plana que el título */
function goldHour(ctx, t, x, y, px){
  ctx.save(); ctx.font = f(900, px, CINZEL); ctx.textAlign = "center";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  const cap = ctx.measureText("0").actualBoundingBoxAscent;
  const metal = ctx.createLinearGradient(0, y - cap, 0, y);
  metal.addColorStop(0, "#FFF0B8"); metal.addColorStop(.45, "#EBC05A"); metal.addColorStop(1, "#A9772A");
  ctx.shadowColor = "rgba(0,0,0,.85)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
  ctx.fillStyle = metal; ctx.fillText(t, x, y);
  ctx.restore();
}

export default {
  id: "match-day-zelda",
  name: "Match Day",
  variant: "Zelda",
  category: "Día de partido",
  description: "Una ilustración de Ocarina of Time a toda página con marco dorado, título en oro y escudos en oro.",
  thumb: "assets/thumbs/match-day-zelda.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_zelda_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

  assets: {
    firma: "assets/img/firma_futbolge.png",
    bgFuego: "assets/fotos/zelda_fuego.jpg", bgEspada: "assets/fotos/zelda_espada.jpg", bgPixel: "assets/fotos/zelda_pixel.jpg"
  },

  fields: [
    { type: "section", title: "Fondo", fields: [
      { type: "segmented", id: "bg", value: "fuego", options: [
        { value: "fuego", label: "Fuego" }, { value: "espada", label: "Espada" }, { value: "pixel", label: "Pixel art" }
      ]},
      { type: "range", id: "bgY", label: "Encuadre vertical", value: 0, min: -400, max: 400 }
    ]},
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "pre", label: "Encima del título", value: "The Legend of" },
        { type: "text", id: "titulo", label: "Título", value: "MATCHDAY" }
      ]},
      { type: "text", id: "sub", label: "Debajo del título", value: "Ocarina of Goal" },
      { type: "row", fields: [
        { type: "text", id: "hora", label: "Hora", value: "14:00", narrow: true },
        { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde" }
      ]},
      { type: "hint", text: "El Match Day se publica el mismo día del partido: no lleva fecha." }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante", value: "Atlético Cacao" }
      ]},
      { type: "hint", text: "Los nombres no salen en el cartel: solo dan nombre al archivo descargado." },
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_atletico_cacao_bn_hd.png" },
      { type: "checkbox", id: "goldCrests", label: "Escudos en oro", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;

    /* ---------- ilustración a toda página y sombras de póster ---------- */
    ctx.fillStyle = "#06070C"; ctx.fillRect(0, 0, W, H);
    const bg = BGS[v.bg] || BGS.fuego;
    if (I[bg.asset]) background(ctx, I[bg.asset], bg, Number(v.bgY));
    shade(ctx);

    /* ---------- marco y firma en su hueco ---------- */
    let fw = 0;
    if (I.firma){ const h = 40; fw = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - fw) / 2, FRAME - h / 2, fw, h); }
    frame(ctx, fw / 2 + 18);

    /* ---------- logotipo: «The Legend of» en versalitas, título en oro y subtítulo entre filetes ---------- */
    const pre = String(v.pre || ""), t = String(v.titulo || "").toUpperCase(), sub = String(v.sub || "").toUpperCase();
    if (pre) caption(ctx, pre, W / 2 + 4, 112, 40, 9);
    if (t) goldTitle(ctx, t, W / 2, 238, 800);
    if (sub){
      const sp = fit(sub, 520, 700, 30, 16, 8, CINZEL), sw = width(sub, f(700, sp, CINZEL), 8);
      caption(ctx, sub, W / 2 + 4, 282, sp, 8);
      ctx.save(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      [[-1, W / 2 - sw / 2 - 20], [1, W / 2 + sw / 2 + 20]].forEach(([k, x]) => { ctx.beginPath(); ctx.moveTo(x, 271); ctx.lineTo(x + k * 120, 271); ctx.stroke(); });
      ctx.restore();
    }

    /* ---------- base: escudo · | hora | · escudo y el pabellón bajo la hora ---------- */
    const D = 150, cy = 1206, cxL = 222, cxR = W - 222;
    [[I.cL, cxL], [I.cV, cxR]].forEach(([img, cx]) => {
      if (!img) return;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      crestCircle(v.goldCrests ? goldOf(img) : img, cx - D / 2, cy, D);
      ctx.restore();
    });
    const hour = String(v.hora || "").trim();
    if (hour) goldHour(ctx, hour, W / 2, 1238, 92);
    ctx.save(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
    [W / 2 - 170, W / 2 + 170].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 1174); ctx.lineTo(x, 1234); ctx.stroke(); });
    ctx.restore();
    const lu = String(v.lugar || "").split("·")[0].trim().toUpperCase();
    if (lu) caption(ctx, lu, W / 2 + 2, 1294, fit(lu, 330, 700, 18, 10, 3, CINZEL), 3);

    /* ---------- textura de papel impreso ---------- */
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .1; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
