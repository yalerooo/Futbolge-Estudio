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
function fxValues(v){
  const n = id => Number(v[id]) || 0;
  return { blur: n("bgBlur"), motion: n("motion"), zoom: n("zoomBurst"), halo: n("halo"), dark: n("bgDark"),
           dir: n("motionDir") * Math.PI / 180 };
}
const fxActive = fx => !!(fx.blur || fx.motion || fx.zoom || fx.halo || fx.dark);

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

/* zona de trabajo: el panel de la foto + un margen, para que desplazamientos y desenfoques
   no dejen bordes vacíos. Todo se dibuja a escala 1:1: el fondo nunca se amplía respecto al jugador. */
const MARGIN = 110;
const AREA = { x: PHOTO.x - MARGIN, y: PHOTO.y - MARGIN, w: PHOTO.w + MARGIN * 2, h: PHOTO.h + MARGIN * 2 };
function panelCanvas(q){
  const c = document.createElement("canvas"); c.width = Math.round(AREA.w * q); c.height = Math.round(AREA.h * q);
  const g = c.getContext("2d"); g.setTransform(q, 0, 0, q, -AREA.x * q, -AREA.y * q); g.imageSmoothingQuality = "high";
  return { c, g };
}
const rawCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

/* placa limpia: foto con tono y sin el jugador (el hueco se rellena con el fondo cercano desenfocado) */
let plateCache = null;
function cleanPlate(ph, cut, q){
  const key = [ph.img.src, ph.x, ph.y, ph.w, ph.h, q].join("|");
  if (plateCache && plateCache.key === key && plateCache.cut === cut) return plateCache.c;
  const P = panelCanvas(q);
  drawToned(P.g, ph.img, TONE, ph.x, ph.y, ph.w, ph.h);
  if (FILTER_OK){
    const M = panelCanvas(q);
    M.g.filter = `blur(${3 * q}px)`; for (let i = 0; i < 4; i++) M.g.drawImage(cut, ph.x, ph.y, ph.w, ph.h);
    P.g.save(); P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.globalCompositeOperation = "destination-out"; P.g.drawImage(M.c, 0, 0); P.g.restore();
    const F = rawCanvas(P.c.width, P.c.height), fg = F.getContext("2d");
    for (const r of [50, 30, 16]){ fg.filter = `blur(${r * q}px)`; fg.drawImage(P.c, 0, 0); fg.drawImage(P.c, 0, 0); }
    P.g.save(); P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.globalCompositeOperation = "destination-over"; P.g.drawImage(F, 0, 0); P.g.restore();
  }
  plateCache = { key, cut, c: P.c };
  return P.c;
}

/* fondo con efectos. Si solo hay efectos «encima» (contraluz, oscurecer) se usa la foto original tal cual */
function drawFxBackground(ctx, ph, cut, fx){
  if (!(fx.blur || fx.motion || fx.zoom)){ drawToned(ctx, ph.img, TONE, ph.x, ph.y, ph.w, ph.h); return; }
  const q = ctx.__q || 1, plate = cleanPlate(ph, cut, q);
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + c.v * ph.h;
  let base = plate;
  if (fx.blur){
    const B = rawCanvas(plate.width, plate.height), bg = B.getContext("2d");
    bg.filter = `blur(${fx.blur * q}px)`; bg.drawImage(plate, 0, 0);
    base = B;
  }
  const L = panelCanvas(q), g = L.g;
  const put = (x, y, w, h, a) => { g.globalAlpha = a; g.drawImage(base, x, y, w, h); };
  put(AREA.x, AREA.y, AREA.w, AREA.h, 1);
  if (fx.motion){       // barrido de cámara: promedio de copias desplazadas a ambos lados
    const len = Math.min(MARGIN * 2, fx.motion * 1.5), n = 28, dx = Math.cos(fx.dir), dy = Math.sin(fx.dir);
    for (let i = 1; i < n; i++){ const o = (i / (n - 1) - .5) * len; put(AREA.x + dx * o, AREA.y + dy * o, AREA.w, AREA.h, 1 / (i + 1)); }
  }
  if (fx.zoom){         // zoom radial centrado en el jugador
    const n = 30, k = fx.zoom / 100 * .5;
    for (let i = 1; i < n; i++){ const s = 1 + k * i / (n - 1); put(cx - (cx - AREA.x) * s, cy - (cy - AREA.y) * s, AREA.w * s, AREA.h * s, 1 / (i + 1)); }
  }
  g.globalAlpha = 1;
  ctx.drawImage(L.c, AREA.x, AREA.y, AREA.w, AREA.h);
}

/* viñeta: oscurece el fondo alrededor del jugador */
function vignette(ctx, ph, cut, fx){
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + c.v * ph.h;
  const k = fx.dark / 100;
  ctx.fillStyle = `rgba(0,0,0,${k * .3})`; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  const g = ctx.createRadialGradient(cx, cy, 110, cx, cy, 640);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${Math.min(.92, k * 1.2)})`);
  ctx.fillStyle = g; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  const b = ctx.createLinearGradient(0, PHOTO.y + PHOTO.h * .62, 0, PHOTO.y + PHOTO.h);
  b.addColorStop(0, "rgba(0,0,0,0)"); b.addColorStop(1, `rgba(0,0,0,${k * .75})`);
  ctx.fillStyle = b; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
}

/* contraluz: foco suave detrás de la parte alta del jugador, más intenso en el centro */
function halo(ctx, ph, cut, fx){
  const c = cutCenter(cut), cx = ph.x + c.u * ph.w, cy = ph.y + (c.top + (c.bot - c.top) * .28) * ph.h;
  const R = (c.bot - c.top) * ph.h * .95, k = Math.min(1, fx.halo / 100 * 1.15);
  ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.translate(cx, cy); ctx.scale(1, 1.4);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `rgba(255,232,150,${.95 * k})`); g.addColorStop(.25, `rgba(245,210,95,${.55 * k})`);
  g.addColorStop(.6, `rgba(211,181,42,${.18 * k})`); g.addColorStop(1, "rgba(211,181,42,0)");
  ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
}

/* jugador nítido con el mismo tono dorado, sombra y (opcional) contraluz en los bordes */
function drawPlayer(ctx, ph, cut, v, over = false){
  const q = ctx.__q || 1, tmp = rawCanvas(W * q, H * q);
  const tg = tmp.getContext("2d"); tg.setTransform(q, 0, 0, q, 0, 0);
  drawToned(tg, cut, TONE, ph.x, ph.y, ph.w, ph.h);
  tg.globalCompositeOperation = "multiply"; tg.globalAlpha = .55 * (v.tint / 100); tg.fillStyle = "#c9a53a"; tg.fillRect(0, 0, W, H);
  tg.globalCompositeOperation = "destination-in"; tg.globalAlpha = 1; tg.drawImage(cut, ph.x, ph.y, ph.w, ph.h);
  ctx.save(); ctx.shadowColor = over ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.35)"; ctx.shadowBlur = over ? 26 : 10; ctx.shadowOffsetY = over ? 10 : 4;
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
      { type: "photo", id: "photo", label: "Foto del partido", src: "assets/fotos/jugador_pabellon.webp", cutout: "layer",
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
      { type: "range", id: "bgBlur", label: "Desenfocar fondo", value: 0, min: 0, max: 30 },
      { type: "range", id: "motion", label: "Barrido de movimiento", value: 0, min: 0, max: 100 },
      { type: "range", id: "motionDir", label: "Ángulo del barrido (°)", value: 0, min: -45, max: 45, visibleIf: v => v.motion > 0 },
      { type: "range", id: "zoomBurst", label: "Zoom radial", value: 0, min: 0, max: 100 },
      { type: "range", id: "halo", label: "Contraluz detrás del jugador", value: 0, min: 0, max: 100 },
      { type: "range", id: "bgDark", label: "Oscurecer bordes", value: 0, min: 0, max: 80 }
    ]},
    { type: "section", title: "Competición y estilo", collapsed: true, fields: [
      { type: "checkbox", id: "showComp", label: "Mostrar logo de la competición", value: true },
      { type: "image", id: "comp", label: "Logo de la competición", src: "assets/img/logo_fvfs.png", visibleIf: v => v.showComp },
      { type: "checkbox", id: "bgWords", label: "Letras gigantes de fondo", value: true },
      { type: "checkbox", id: "sideBar", label: "Barra lateral con degradado", value: true }
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
    if (v.sideBar){
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
        if (fx.halo) halo(ctx, ph, cut, fx);
        if (!v.popOut) drawPlayer(ctx, ph, cut, v, false);
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
      drawPlayer(ctx, ph, cut, v, true);
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
