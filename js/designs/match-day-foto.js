/**
 * DISEÑO · MATCH DAY · FOTO
 * El Match Day original del club: letras gigantes doradas de fondo, foto en tono dorado,
 * título blanco y barra inferior con escudos, hora y logo de la competición.
 */
import { use, f, text, fit, contain, crestCircle, GOLD, WHITE, ANTON, slug } from "../core/draw.js";
import { drawToned, FILTER_OK } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;
const PHOTO = { x: 166, y: 210, w: 760, h: 950 };
const BAR = { x: 346, y: 1045, h: 200, goldW: 312, blackW: 204 };
const SIDEBAR = { x: 804 };
const BG_GOLD = "#8f7c2c";

// firma en blanco (el original la lleva así en este cartel)
let whiteSig = null, whiteSigSrc = null;
function tintedWhite(img){
  if (!img) return null;
  if (whiteSigSrc === img) return whiteSig;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#EDEAE2"; g.fillRect(0, 0, c.width, c.height);
  whiteSig = c; whiteSigSrc = img; return c;
}

const TONE = "grayscale(1) contrast(1.12) brightness(.82)";

/* ---------------------------------------------------------------------------
   EFECTOS DE FONDO (solo cuando el jugador está recortado)
   Todo se hace sobre una "placa limpia": la foto sin el jugador (el hueco se rellena
   con el fondo de alrededor), así el desenfoque y el movimiento no dejan siluetas fantasma.
   --------------------------------------------------------------------------- */
const PRESETS = {
  //          desenfoque  barrido  zoom  líneas  bokeh  halo  oscurecer  contorno
  sprint:  { blur: 3,  motion: 85, zoom: 0,  lines: 40, bokeh: 0,  halo: 25, dark: 35, rim: true },
  impacto: { blur: 2,  motion: 0,  zoom: 80, lines: 0,  bokeh: 0,  halo: 55, dark: 45, rim: true },
  estadio: { blur: 22, motion: 0,  zoom: 0,  lines: 0,  bokeh: 75, halo: 35, dark: 40, rim: true }
};
function fxValues(v){
  const p = PRESETS[v.fxPreset] || {};
  const pick = (k, id) => Math.max(Number(v[id]) || 0, p[k] || 0);
  return { blur: pick("blur", "bgBlur"), motion: pick("motion", "motion"), zoom: pick("zoom", "zoomBurst"),
           lines: pick("lines", "speedLines"), bokeh: pick("bokeh", "bokeh"), halo: pick("halo", "halo"),
           dark: pick("dark", "bgDark"), rim: !!(v.rim || p.rim), dir: (Number(v.motionDir) || 0) * Math.PI / 180 };
}
const fxActive = fx => !!(fx.blur || fx.motion || fx.zoom || fx.lines || fx.bokeh || fx.halo || fx.dark || fx.rim);

function tintRect(ctx, t, r){
  ctx.save();
  ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = .55 * t; ctx.fillStyle = "#c9a53a"; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = .6 * t; ctx.fillStyle = GOLD; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

/* centro de la silueta */
const centers = new WeakMap();
function cutCenter(cut){
  if (centers.has(cut)) return centers.get(cut);
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const g = c.getContext("2d"); g.drawImage(cut, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data; let sx = 0, sy = 0, n = 0, top = 64, bot = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3] > 120){ sx += x; sy += y; n++; if (y < top) top = y; if (y > bot) bot = y; }
  const r = n ? { u: sx / n / 64, v: sy / n / 64, top: top / 64, bot: bot / 64 } : { u: .5, v: .5, top: .2, bot: .9 };
  centers.set(cut, r); return r;
}

/* lienzo del tamaño del panel (unidades de diseño con origen en el panel) */
function panelCanvas(q){
  const c = document.createElement("canvas"); c.width = Math.round(PHOTO.w * q); c.height = Math.round(PHOTO.h * q);
  const g = c.getContext("2d"); g.setTransform(q, 0, 0, q, -PHOTO.x * q, -PHOTO.y * q); g.imageSmoothingQuality = "high";
  return { c, g };
}

/* placa limpia: foto con tono y sin el jugador (el hueco se rellena con el fondo cercano desenfocado) */
let plateCache = null;
function cleanPlate(ph, cut, q){
  const key = [ph.img.src, ph.x, ph.y, ph.w, ph.h, q].join("|");
  if (plateCache && plateCache.key === key && plateCache.cut === cut) return plateCache.c;
  const P = panelCanvas(q);
  drawToned(P.g, ph.img, TONE, ph.x, ph.y, ph.w, ph.h);
  if (FILTER_OK){
    // hueco algo más grande que la silueta
    const M = panelCanvas(q);
    M.g.filter = `blur(${10 * q}px)`; for (let i = 0; i < 3; i++) M.g.drawImage(cut, ph.x, ph.y, ph.w, ph.h);
    P.g.save(); P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.globalCompositeOperation = "destination-out"; P.g.drawImage(M.c, 0, 0); P.g.restore();
    // relleno: la placa agujereada muy desenfocada, varias pasadas para que cubra el hueco
    const F = document.createElement("canvas"); F.width = P.c.width; F.height = P.c.height;
    const fg = F.getContext("2d");
    for (const r of [60, 40, 24]){ fg.filter = `blur(${r * q}px)`; fg.drawImage(P.c, 0, 0); fg.drawImage(P.c, 0, 0); }
    P.g.save(); P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.globalCompositeOperation = "destination-over"; P.g.drawImage(F, 0, 0); P.g.restore();
  }
  plateCache = { key, cut, c: P.c };
  return P.c;
}

/* fondo con efectos: desenfoque, barrido (motion blur real), zoom radial y viñeta */
function drawFxBackground(ctx, ph, cut, fx){
  const q = ctx.__q || 1, plate = cleanPlate(ph, cut, q);
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + c.v * ph.h;
  const L = panelCanvas(q), g = L.g;
  const put = (img, x, y, w, h, a) => { g.globalAlpha = a; g.drawImage(img, x, y, w, h); };
  // 1) desenfoque de profundidad
  let base = plate;
  if (fx.blur){
    const B = document.createElement("canvas"); B.width = plate.width; B.height = plate.height;
    const bg = B.getContext("2d"); bg.filter = `blur(${fx.blur * q}px)`;
    // se amplía un poco para que el desenfoque no oscurezca los bordes
    bg.drawImage(plate, -plate.width * .03, -plate.height * .03, plate.width * 1.06, plate.height * 1.06);
    base = B;
  }
  const bx = PHOTO.x, by = PHOTO.y, bw = PHOTO.w, bh = PHOTO.h;
  put(base, bx - bw * .06, by - bh * .06, bw * 1.12, bh * 1.12, 1);     // margen para los desplazamientos
  // 2) barrido: promedio de copias desplazadas a ambos lados (como una foto con barrido de cámara)
  if (fx.motion){
    const len = fx.motion * 1.5, n = 28, dx = Math.cos(fx.dir), dy = Math.sin(fx.dir);
    for (let i = 1; i < n; i++){
      const o = (i / (n - 1) - .5) * len;
      put(base, bx - bw * .06 + dx * o, by - bh * .06 + dy * o, bw * 1.12, bh * 1.12, 1 / (i + 1));
    }
  }
  // 3) zoom radial desde el jugador
  if (fx.zoom){
    const n = 30, k = fx.zoom / 100 * .5;
    for (let i = 1; i < n; i++){
      const s = 1.12 * (1 + k * i / (n - 1)), w = bw * s, h = bh * s;
      put(base, cx - (cx - bx + bw * .06) * s / 1.12, cy - (cy - by + bh * .06) * s / 1.12, w, h, 1 / (i + 1));
    }
  }
  g.globalAlpha = 1;
  ctx.drawImage(L.c, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
}

/* viñeta: oscurece el fondo alrededor del jugador */
function vignette(ctx, ph, cut, fx){
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + c.v * ph.h;
  const k = fx.dark / 100;
  // separación: todo el fondo un poco más oscuro y los bordes mucho más
  ctx.fillStyle = `rgba(0,0,0,${k * .38})`; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  const g = ctx.createRadialGradient(cx, cy, 90, cx, cy, 620);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${Math.min(.95, k * 1.25)})`);
  ctx.fillStyle = g; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  const b = ctx.createLinearGradient(0, PHOTO.y + PHOTO.h * .6, 0, PHOTO.y + PHOTO.h);
  b.addColorStop(0, "rgba(0,0,0,0)"); b.addColorStop(1, `rgba(0,0,0,${k * .8})`);
  ctx.fillStyle = b; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
}

/* luces bokeh del pabellón (profundidad de campo) */
function bokeh(ctx, ph, cut, fx){
  const c = cutCenter(cut);
  let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = Math.round(8 + fx.bokeh * .16);
  ctx.save(); ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < n; i++){
    // luces del techo y las gradas: mitad superior, pocas grandes y varias pequeñas
    const r = 10 + Math.pow(rnd(), 2.2) * 78, x = PHOTO.x + rnd() * PHOTO.w, y = PHOTO.y + Math.pow(rnd(), 1.4) * PHOTO.h * .55;
    const a = (.22 + rnd() * .45) * fx.bokeh / 100 * (r > 45 ? .6 : 1), warm = rnd() > .3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = warm ? "255,214,110" : "255,246,225";
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.72, `rgba(${col},${a * .75})`); g.addColorStop(.86, `rgba(${col},${a * .95})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* halo dorado suave detrás del jugador */
function halo(ctx, ph, cut, fx){
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + (c.top + (c.bot - c.top) * .35) * ph.h;
  const R = (c.bot - c.top) * ph.h * .75;
  ctx.save(); ctx.globalCompositeOperation = "screen";
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, `rgba(245,212,90,${.8 * fx.halo / 100})`); g.addColorStop(.45, `rgba(211,181,42,${.32 * fx.halo / 100})`); g.addColorStop(1, "rgba(211,181,42,0)");
  ctx.fillStyle = g; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  ctx.restore();
}

/* líneas de velocidad finas y elegantes, a los lados del jugador */
function speedLines(ctx, ph, cut, fx){
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + c.v * ph.h, hh = (c.bot - c.top) * ph.h;
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = Math.round(8 + fx.lines * .3);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(fx.dir); ctx.globalCompositeOperation = "screen"; ctx.lineCap = "round";
  for (let i = 0; i < n; i++){
    const side = rnd() > .5 ? 1 : -1, y = (rnd() - .5) * hh * 1.05, len = 90 + rnd() * 260;
    const x0 = side * (60 + rnd() * 120), x1 = x0 + side * len, a = (.25 + rnd() * .5) * fx.lines / 100;
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, `rgba(255,236,160,${a})`); g.addColorStop(1, "rgba(255,236,160,0)");
    ctx.strokeStyle = g; ctx.lineWidth = .8 + rnd() * 1.8;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  }
  ctx.restore();
}

/* jugador nítido con el mismo tono dorado, sombra y (opcional) luz de contorno */
function drawPlayer(ctx, ph, cut, v, over = false, rimOn = v.rim){
  const q = ctx.__q || 1, tmp = document.createElement("canvas");
  tmp.width = Math.round(W * q); tmp.height = Math.round(H * q);
  const tg = tmp.getContext("2d"); tg.setTransform(q, 0, 0, q, 0, 0);
  drawToned(tg, cut, TONE, ph.x, ph.y, ph.w, ph.h);
  tg.globalCompositeOperation = "multiply"; tg.globalAlpha = .55 * (v.tint / 100); tg.fillStyle = "#c9a53a"; tg.fillRect(0, 0, W, H);
  tg.globalCompositeOperation = "destination-in"; tg.globalAlpha = 1; tg.drawImage(cut, ph.x, ph.y, ph.w, ph.h);
  if (rimOn){
    const rim = document.createElement("canvas"); rim.width = tmp.width; rim.height = tmp.height;
    const rg = rim.getContext("2d"); rg.setTransform(q, 0, 0, q, 0, 0);
    rg.drawImage(cut, ph.x, ph.y, ph.w, ph.h); rg.globalCompositeOperation = "source-in"; rg.fillStyle = "#f0d24a"; rg.fillRect(0, 0, W, H);
    ctx.save(); ctx.shadowColor = "rgba(240,210,74,.9)"; ctx.shadowBlur = 10; ctx.globalAlpha = .9; ctx.drawImage(rim, 0, 0, W, H); ctx.restore();
  }
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = over ? 26 : 18; ctx.shadowOffsetY = over ? 10 : 6;
  ctx.drawImage(tmp, 0, 0, W, H);
  ctx.restore();
}

export default {
  id: "match-day-foto",
  name: "Match Day",
  variant: "Foto",
  category: "Día de partido",
  description: "El Match Day original: foto en tono dorado, letras gigantes de fondo y barra con escudos y hora.",
  thumb: "assets/thumbs/match-day-foto.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_foto_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png", barra: "assets/img/barra_lateral.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Primera línea", value: "MATCH" },
        { type: "text", id: "t2", label: "Segunda línea", value: "DAY" }
      ]},
      { type: "text", id: "hora", label: "Hora", value: "18:00" }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante", value: "Jaimitos FC" }
      ]},
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_jaimitos_bn_hd.png" }
    ]},
    { type: "section", title: "Foto", fields: [
      { type: "photo", id: "photo", label: "Foto del partido", src: "assets/fotos/jugador_pabellon.webp", cutout: "layer", cutoutSet: { fxPreset: "impacto" },
        cutoutHint: "«Recortar jugador» separa a la persona del fondo con IA: podrás desenfocar el fondo, añadir movimiento y ponerlo delante del título.",
        area: () => PHOTO,
        defaultFrame: (img, a, cover) => {
          // jugador grande y centrado, como en el cartel original
          const zoom = 1.95, s = cover * zoom;
          return { zoom, ox: a.x + a.w * .47 - .5 * img.width * s, oy: a.y + a.h * .47 - .5 * img.height * s };
        } },
      { type: "range", id: "tint", label: "Tono dorado", value: 70, min: 0, max: 100 },
      { type: "checkbox", id: "popOut", label: "Efecto 3D: jugador delante del título", value: false },
      { type: "hint", text: "Primero pulsa «Recortar jugador» en la foto.", visibleIf: v => v.popOut }
    ]},
    { type: "section", title: "Efectos de fondo", fields: [
      { type: "hint", text: "Pulsa «Recortar jugador» en la foto: los efectos se aplican solo al fondo y el jugador queda nítido delante." },
      { type: "segmented", id: "fxPreset", value: "none", options: [
        { value: "none", label: "Nada" }, { value: "sprint", label: "Sprint" }, { value: "impacto", label: "Impacto" }, { value: "estadio", label: "Estadio" }] },
      { type: "range", id: "bgBlur", label: "Desenfocar fondo", value: 0, min: 0, max: 30 },
      { type: "range", id: "motion", label: "Barrido de movimiento", value: 0, min: 0, max: 100 },
      { type: "range", id: "motionDir", label: "Ángulo del barrido (°)", value: 0, min: -45, max: 45, visibleIf: v => v.motion > 0 || v.fxPreset === "sprint" },
      { type: "range", id: "zoomBurst", label: "Zoom radial", value: 0, min: 0, max: 100 },
      { type: "range", id: "bokeh", label: "Luces del pabellón (bokeh)", value: 0, min: 0, max: 100 },
      { type: "range", id: "halo", label: "Halo dorado detrás del jugador", value: 0, min: 0, max: 100 },
      { type: "range", id: "speedLines", label: "Líneas de velocidad", value: 0, min: 0, max: 100 },
      { type: "range", id: "bgDark", label: "Oscurecer bordes", value: 0, min: 0, max: 80 },
      { type: "checkbox", id: "rim", label: "Luz dorada en el contorno del jugador", value: false }
    ]},
    { type: "section", title: "Competición y estilo", collapsed: true, fields: [
      { type: "checkbox", id: "showComp", label: "Mostrar logo de la competición", value: true },
      { type: "image", id: "comp", label: "Logo de la competición", src: "assets/img/logo_fvfs.png", visibleIf: v => v.showComp },
      { type: "checkbox", id: "bgWords", label: "Letras gigantes de fondo", value: true },
      { type: "checkbox", id: "glow", label: "Barra lateral con degradado", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    const t1 = String(v.t1 || "").toUpperCase(), t2 = String(v.t2 || "").toUpperCase();

    // fondo negro
    ctx.fillStyle = "#0b0a08"; ctx.fillRect(0, 0, W, H);
    // letras gigantes de fondo: líneas alternas con el título, cortadas por los bordes
    if (v.bgWords){
      const words = [t1, t2 || t1];
      const PX = 330;
      ctx.save(); ctx.font = f(400, PX, ANTON); ctx.fillStyle = BG_GOLD; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
      const cap = ctx.measureText("H").actualBoundingBoxAscent, step = cap + 26;
      for (let i = 0, y = 190; y - cap < H + 40; i++, y += step) ctx.fillText(words[i % 2], -14, y);
      ctx.restore();
    }

    // barra lateral: el rectángulo con degradado del diseño original (x 804 → borde derecho, alto completo),
    // encima de las letras y debajo de todo lo demás
    if (v.glow){
      if (I.barra) ctx.drawImage(I.barra, SIDEBAR.x, 0, W - SIDEBAR.x, H);
      else {
        const gr = ctx.createLinearGradient(SIDEBAR.x, 0, W, H);
        gr.addColorStop(0, "#8a7a2c"); gr.addColorStop(.18, "#0e0e0e"); gr.addColorStop(.52, "#d3b52a"); gr.addColorStop(.82, "#0e0e0e"); gr.addColorStop(1, "#7a6a26");
        ctx.fillStyle = gr; ctx.fillRect(SIDEBAR.x, 0, W - SIDEBAR.x, H);
      }
    }

    // foto en tono dorado (+ efectos de fondo si el jugador está recortado)
    const ph = m.photo("photo"), cut = I.photo_cut;
    const fx = fxValues(v), fxOn = !!(cut && ph && fxActive(fx));
    ctx.save(); ctx.beginPath(); ctx.rect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h); ctx.clip();
    ctx.fillStyle = "#000"; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    if (ph){
      if (fxOn) drawFxBackground(ctx, ph, cut, fx);
      else drawToned(ctx, ph.img, TONE, ph.x, ph.y, ph.w, ph.h);
      tintRect(ctx, v.tint / 100, PHOTO);
      if (fxOn){
        if (fx.dark) vignette(ctx, ph, cut, fx);
        if (fx.bokeh) bokeh(ctx, ph, cut, fx);
        if (fx.halo) halo(ctx, ph, cut, fx);
        if (fx.lines) speedLines(ctx, ph, cut, fx);
        if (!v.popOut) drawPlayer(ctx, ph, cut, v, false, fx.rim);
      }
    }
    const g2 = ctx.createLinearGradient(0, PHOTO.y, 0, PHOTO.y + PHOTO.h);
    g2.addColorStop(0, "rgba(0,0,0,.25)"); g2.addColorStop(.3, "rgba(0,0,0,0)"); g2.addColorStop(.85, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = g2; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    ctx.restore();

    // título blanco en dos líneas
    const TP = Math.min(fit(t1, 560, 400, 220, 90, 0, ANTON), fit(t2, 560, 400, 220, 90, 0, ANTON));
    ctx.font = f(400, TP, ANTON); const cap = ctx.measureText("H").actualBoundingBoxAscent;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 24;
    text(t1, 96, 38 + cap, f(400, TP, ANTON), WHITE, "left", 1);
    text(t2, 96, 38 + cap * 2 + 22, f(400, TP, ANTON), WHITE, "left", 1);
    ctx.restore();

    // efecto 3D: el jugador recortado se dibuja encima del título y puede salir por arriba del marco de la foto
    if (v.popOut && cut && ph){
      ctx.save(); ctx.beginPath(); ctx.rect(PHOTO.x, 0, PHOTO.w, PHOTO.y + PHOTO.h); ctx.clip();
      drawPlayer(ctx, ph, cut, v, true, fxValues(v).rim);
      ctx.restore();
    }

    // barra inferior: escudos (oro) · hora (blanco) · competición (negro)
    // tres bloques pegados, sin huecos, hasta el borde derecho; si no hay logo, el blanco ocupa su sitio
    const showComp = v.showComp && I.comp;
    const gx = BAR.x, gw = BAR.goldW, wx = gx + gw, bx = showComp ? W - BAR.blackW : W, ww = bx - wx, bw = W - bx;
    // una sola sombra para toda la barra (antes cada bloque tenía la suya y se veía una línea oscura entre ellos)
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#0A0A0A"; ctx.fillRect(gx, BAR.y, W - gx, BAR.h);
    ctx.restore();
    // se solapan medio píxel para que nunca asome el fondo entre bloques
    ctx.fillStyle = GOLD; ctx.fillRect(gx, BAR.y, gw + 1, BAR.h);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(wx, BAR.y, ww + (showComp ? 1 : 0), BAR.h);
    if (showComp){ ctx.fillStyle = "#0A0A0A"; ctx.fillRect(bx, BAR.y, bw, BAR.h); contain(I.comp, bx + bw / 2, BAR.y + BAR.h / 2, bw - 48, BAR.h - 48); }
    // escudos: mismo diámetro de círculo y a la misma altura (el tridente sobresale por arriba, como en el original)
    const D = 124, ccy = BAR.y + 116, gap = (gw - D * 2) / 3;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 10;
    crestCircle(I.cL, gx + gap, ccy, D);
    crestCircle(I.cV, gx + gap * 2 + D, ccy, D);
    ctx.restore();
    const ho = String(v.hora || "").trim();
    if (ho){
      const hp = fit(ho, ww - 28, 400, 120, 40, 0, ANTON);
      ctx.font = f(400, hp, ANTON); const m2 = ctx.measureText(ho);
      text(ho, wx + ww / 2, BAR.y + BAR.h / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2, f(400, hp, ANTON), GOLD, "center");
    }

    // firma en blanco abajo a la derecha
    const sig = tintedWhite(I.firma);
    // firma dentro del rectángulo lateral, centrada bajo la barra
    if (sig){
      const rw = W - SIDEBAR.x, w = rw - 44, h = sig.height * w / sig.width;
      const top = BAR.y + BAR.h, y = top + (H - top - h) / 2;
      ctx.drawImage(sig, SIDEBAR.x + (rw - w) / 2, y, w, h);
    }

    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .06; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
