/**
 * DISEÑO · MATCH DAY · CANCIÓN
 * El partido como si fuera la canción que suena: tarjeta de cristal como el reproductor de Apple Music
 * (portada, título, progreso, controles, volumen y AirPlay) sobre el polideportivo desenfocado,
 * en dorado y negro como el escudo.
 */
import { use, f, text, fit, rr, slug, WHITE } from "../core/draw.js";
import { blurred, drawToned, FILTER_OK } from "../core/fx.js";
import { grain, makeCanvas } from "../core/canvas.js";

const W = 1080, H = 1350;
const CARD = { x: 207, y: 42, w: 666, h: 1194, r: 86 };
const PHOTO = { x: 257, y: 92, w: 566, h: 566, r: 18 };
const L = PHOTO.x, R = PHOTO.x + PHOTO.w, CX = W / 2;
const INTER = '"Inter", "Montserrat", system-ui, sans-serif';
const DIM = "rgba(255,255,255,.72)";          // gris translúcido de los textos secundarios
const TINT = "rgba(244,220,120,.9)";          // el tiempo restante toma el color del fondo, como en iOS

// imágenes pasadas a blanco (firma dorada, logos de color…), cacheadas por imagen
const whites = new WeakMap();
function white(img){
  if (!img) return null;
  if (whites.has(img)) return whites.get(img);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, c.width, c.height);
  whites.set(img, c); return c;
}

/* fondo desenfocado y en tono (un solo filtro: drawToned sustituiría al desenfoque) */
function drawBg(ctx, bg, px, tone){
  if (FILTER_OK){ ctx.save(); ctx.filter = `blur(${px}px) ${tone}`; ctx.drawImage(bg.img, bg.x, bg.y, bg.w, bg.h); ctx.restore(); }
  else blurred(ctx, px, () => drawToned(ctx, bg.img, tone, bg.x, bg.y, bg.w, bg.h));
}

/* mancha de color difusa (los brillos que se cuelan por el cristal) */
function glow(ctx, x, y, rx, ry, color){
  ctx.save(); ctx.translate(x, y); ctx.scale(rx / 100, ry / 100);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
  g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = g; ctx.fillRect(-100, -100, 200, 200); ctx.restore();
}

/* ---------- cristal líquido (Liquid Glass de iOS) ----------
   Como el reproductor de Apple: el fondo se ve muy desenfocado, más luminoso y con los colores
   avivados (cristal lechoso); en el borde hay un bisel grueso más claro donde el fondo se curva
   (refracción) y un filo fino y brillante que destaca en las esquinas donde da la luz.
   `src` es el fondo ya pintado (lienzo W×H). */
function glass(ctx, src, x, y, w, h, r, o){
  const cx = x + w / 2, cy = y + h / 2;
  const sample = (z, b) => {
    ctx.save(); if (FILTER_OK) ctx.filter = `blur(${b}px) saturate(1.45) brightness(1.06)`;
    ctx.drawImage(src, cx - cx * z, cy - cy * z, W * z, H * z); ctx.restore();
  };
  ctx.save(); rr(x, y, w, h, r); ctx.clip();
  sample(o.zoom, o.blur);
  // labio del borde: anillos cada vez más ampliados (el fondo se estira hacia fuera, como en una lente)
  // y más claros, sobre todo pegados al filo
  const n = 28, band = o.edge / n;
  for (let i = 0; i < n; i++){
    const a = i * band, b = a + band, t = (n - i) / n;
    ctx.save(); ctx.beginPath();
    ctx.roundRect(x + a, y + a, w - a * 2, h - a * 2, Math.max(0, r - a));
    ctx.roundRect(x + b, y + b, w - b * 2, h - b * 2, Math.max(0, r - b));
    ctx.clip("evenodd");
    sample(o.zoom + o.bend * t * t, o.blur * .5);
    ctx.fillStyle = `rgba(255,255,255,${.01 + .08 * t ** 2.4})`; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  // velo lechoso y, encima, un tono neutro para que el texto blanco se lea
  ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = o.tint; ctx.fillRect(x, y, w, h);
  const sh = ctx.createLinearGradient(0, y, 0, y + h);
  sh.addColorStop(0, "rgba(255,255,255,.12)"); sh.addColorStop(.4, "rgba(255,255,255,0)");
  ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  // resplandor interior junto al borde, más fuerte arriba a la izquierda y abajo a la derecha
  const glowW = Math.min(w, h) * .07;
  const ig = ctx.createLinearGradient(x, y, x + w, y + h);
  ig.addColorStop(0, "rgba(255,255,255,.16)"); ig.addColorStop(.3, "rgba(255,255,255,.02)");
  ig.addColorStop(.7, "rgba(255,255,255,.02)"); ig.addColorStop(1, "rgba(255,255,255,.14)");
  ctx.save(); if (FILTER_OK) ctx.filter = `blur(${glowW * .5}px)`;
  ctx.strokeStyle = ig; ctx.lineWidth = glowW; rr(x, y, w, h, r); ctx.stroke(); ctx.restore();
  ctx.restore();
  // filo especular: nítido y muy brillante en las esquinas donde da la luz, casi invisible en los lados,
  // con un halo suave debajo
  const rim = ctx.createLinearGradient(x, y, x + w, y + h);
  rim.addColorStop(0, "rgba(255,255,255,.55)"); rim.addColorStop(.16, "rgba(255,255,255,.16)");
  rim.addColorStop(.5, "rgba(255,255,255,.06)"); rim.addColorStop(.84, "rgba(255,255,255,.16)"); rim.addColorStop(1, "rgba(255,255,255,.7)");
  const lw = o.rim || 2;
  ctx.save(); rr(x, y, w, h, r); ctx.clip(); if (FILTER_OK) ctx.filter = `blur(${lw * 2}px)`; ctx.globalAlpha = .25;
  ctx.strokeStyle = rim; ctx.lineWidth = lw * 3; rr(x + lw, y + lw, w - lw * 2, h - lw * 2, r - lw); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = rim; ctx.lineWidth = lw; rr(x + lw / 2, y + lw / 2, w - lw, h - lw, r - lw / 2); ctx.stroke();
}

/* ---------- iconos del reproductor (como los de iOS: macizos y con esquinas suaves) ---------- */
function softFill(ctx, path, color = WHITE, round = 7){
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = color; ctx.lineWidth = round; ctx.lineJoin = "round";
  path(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* dos triángulos seguidos; dir = 1 avanzar, -1 retroceder */
function skip(ctx, cx, cy, dir){
  const tw = 38, th = 19;
  softFill(ctx, () => {
    ctx.beginPath();
    for (const k of [-1, 0]){
      const x0 = cx + dir * (k * tw + 3), x1 = x0 + dir * (tw - 4);
      ctx.moveTo(x0, cy - th); ctx.lineTo(x1, cy); ctx.lineTo(x0, cy + th); ctx.closePath();
    }
  });
}
function pause(ctx, cx, cy){
  ctx.fillStyle = WHITE;
  for (const x of [cx - 27, cx + 9]){ rr(x, cy - 35, 18, 70, 6); ctx.fill(); }
}
/* estrella de favoritos, rellena (marcada) y con las puntas suaves */
function star(ctx, cx, cy, R){
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = WHITE; ctx.lineWidth = 3; ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 10; i++){
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * .45 : R;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* barras de ecualizador junto al título (la canción está sonando) */
function waveform(ctx, right, cy){
  const hs = [12, 22, 30, 40, 48, 40, 30], bw = 4.5, gap = 3.6;
  let x = right - hs.length * (bw + gap) + gap;
  ctx.fillStyle = "rgba(255,255,255,.88)";
  hs.forEach(h => { rr(x, cy - h / 2, bw, h, bw / 2); ctx.fill(); x += bw + gap; });
}
/* altavoz con 0, 1 o 3 ondas */
function speaker(ctx, cx, cy, waves){
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = DIM; ctx.lineJoin = "round"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 6); ctx.lineTo(cx - 5, cy - 6); ctx.lineTo(cx + 4, cy - 14); ctx.lineTo(cx + 4, cy + 14); ctx.lineTo(cx - 5, cy + 6); ctx.lineTo(cx - 12, cy + 6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.lineCap = "round";
  for (let i = 1; i <= waves; i++){ ctx.beginPath(); ctx.arc(cx + 4, cy, 5 + i * 6, -Math.PI / 4.2, Math.PI / 4.2); ctx.stroke(); }
  ctx.restore();
}
/* icono de AirPlay: ondas concéntricas con un triángulo debajo */
function airplay(ctx, cx, cy){
  ctx.save(); ctx.strokeStyle = ctx.fillStyle = WHITE; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  for (const r of [6, 11.5, 17]){ ctx.beginPath(); ctx.arc(cx, cy - 2, r, Math.PI * .78, Math.PI * 2.22); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy - 2, 2.4, 0, Math.PI * 2); ctx.fill();
  softFill(ctx, () => { ctx.beginPath(); ctx.moveTo(cx, cy + 6); ctx.lineTo(cx + 9, cy + 17); ctx.lineTo(cx - 9, cy + 17); ctx.closePath(); }, WHITE, 3);
  ctx.restore();
}
/* barra en cápsula: parte llena en blanco y el resto translúcido */
function capsule(ctx, x0, x1, y, h, p, rest){
  rr(x0, y - h / 2, x1 - x0, h, h / 2); ctx.fillStyle = rest; ctx.fill();
  const xf = x0 + (x1 - x0) * p;
  if (xf > x0){
    ctx.save(); rr(x0, y - h / 2, x1 - x0, h, h / 2); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.fillRect(x0, y - h / 2, xf - x0, h);
    ctx.restore();
  }
}
const pct = v => Math.min(1, Math.max(0, (Number(v) || 0) / 100));

export default {
  id: "match-day-cancion",
  name: "Match Day",
  variant: "Canción",
  category: "Día de partido",
  description: "El partido como la canción que suena: reproductor de cristal estilo Apple Music sobre el polideportivo desenfocado.",
  thumb: "assets/thumbs/match-day-cancion.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_cancion_${slug(v.rival)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Canción", fields: [
      { type: "text", id: "title", label: "Título", value: "Es hoy, Futbolge" },
      { type: "row", fields: [
        { type: "text", id: "dia", label: "Día", value: "Hoy" },
        { type: "text", id: "lugar", label: "Lugar", value: "Hegoalde" }
      ]},
      { type: "row", fields: [
        { type: "text", id: "hora", label: "Hora", value: "16:00" },
        { type: "text", id: "rival", label: "Rival", value: "Loh Chavale" }
      ]},
      { type: "hint", text: "El subtítulo une Día | Lugar | Hora | Rival; deja un campo vacío para quitarlo." },
      { type: "range", id: "progress", label: "Progreso de la canción", value: 30, min: 0, max: 100 },
      { type: "row", fields: [
        { type: "text", id: "tA", label: "Tiempo izquierda", value: "1:21" },
        { type: "text", id: "tR", label: "Tiempo derecha", value: "-1:36" }
      ]},
      { type: "range", id: "volume", label: "Volumen", value: 100, min: 0, max: 100 },
      { type: "text", id: "pill", label: "Botón de abajo", value: "AirPlay" }
    ]},
    { type: "section", title: "Fotos", fields: [
      { type: "photo", id: "photo", label: "Foto de la canción (portada)", src: "assets/fotos/jugada_pista.png",
        area: () => PHOTO },
      { type: "photo", id: "bg", label: "Fondo (polideportivo)", src: "assets/fotos/polideportivo.jpg",
        area: () => ({ x: 0, y: 0, w: W, h: H }),
        defaultFrame: (img, a, cover) => ({ zoom: 1, ox: a.w * .5 - img.width * cover * .62, oy: 0 }) },
      { type: "range", id: "bgBlur", label: "Desenfoque del fondo", value: 14, min: 0, max: 40 },
      { type: "range", id: "warm", label: "Tono dorado", value: 70, min: 0, max: 100 }
    ]},
    { type: "section", title: "Escudo y pie", collapsed: true, fields: [
      { type: "image", id: "crest", label: "Escudo (blanco)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "checkbox", id: "crestTop", label: "Escudo arriba a la derecha", value: false },
      { type: "text", id: "foot", label: "Texto del pie", value: "@futbolge_" },
      { type: "checkbox", id: "showFirma", label: "Firma FUTBOLGE en el pie", value: true },
      { type: "checkbox", id: "showComp", label: "Logo de la competición en el pie", value: true },
      { type: "image", id: "comp", label: "Logo de la competición", src: "assets/img/logo_fvfs.png", visibleIf: v => v.showComp }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images, warm = (Number(v.warm) || 0) / 100;
    const bg = m.photo("bg");

    // fondo en un lienzo aparte: se pinta tal cual y el cristal lo vuelve a usar para refractarlo
    const B = makeCanvas(W, H, ctx.__q || 1), g = B.ctx;
    // polideportivo desenfocado, en blanco y negro oscurecido y con un degradado dorado hacia abajo
    g.fillStyle = "#1a1810"; g.fillRect(0, 0, W, H);
    if (bg) drawBg(g, bg, Number(v.bgBlur) || 0, "grayscale(1) contrast(1.05)");
    const dk = g.createLinearGradient(0, 0, 0, H);
    dk.addColorStop(0, "rgba(8,8,6,.5)"); dk.addColorStop(.6, "rgba(8,8,6,.3)"); dk.addColorStop(1, "rgba(8,8,6,0)");
    g.fillStyle = dk; g.fillRect(0, 0, W, H);
    const wg = g.createLinearGradient(0, H * .2, W * .35, H);
    wg.addColorStop(0, "rgba(211,181,42,0)"); wg.addColorStop(.5, `rgba(211,181,42,${.45 * warm})`); wg.addColorStop(1, `rgba(226,190,40,${warm})`);
    // «color» tiñe de dorado conservando las luces del pabellón; «multiply» le da cuerpo y el normal lo aviva
    for (const [op, a] of [["color", 1], ["multiply", .55], ["source-over", .45]]){
      g.save(); g.globalCompositeOperation = op; g.globalAlpha = a; g.fillStyle = wg; g.fillRect(0, 0, W, H); g.restore();
    }

    // manchas de luz y sombra alrededor de la tarjeta: lo que el cristal deja ver y curva en el borde
    // (en el reproductor de Apple son los colores de la pantalla de detrás)
    glow(g, CARD.x + 10, CARD.y + 70, 300, 240, `rgba(240,200,56,${.35 + .3 * warm})`);
    glow(g, CARD.x + CARD.w - 30, CARD.y + CARD.h * .5, 230, 320, "rgba(255,232,170,.32)");
    glow(g, CARD.x + 80, CARD.y + CARD.h * .78, 240, 220, "rgba(0,0,0,.38)");
    glow(g, CARD.x + CARD.w * .78, CARD.y + CARD.h * .96, 300, 200, `rgba(240,196,40,${.15 + .2 * warm})`);
    ctx.drawImage(B.cv, 0, 0, W, H);

    // escudo arriba a la derecha (opcional)
    if (v.crestTop && I.crest){
      const ch = 104, cw = I.crest.width * ch / I.crest.height;
      ctx.save(); ctx.globalAlpha = .92; ctx.drawImage(I.crest, W - 34 - cw, 26, cw, ch); ctx.restore();
    }

    // tarjeta de cristal líquido: sombra suave debajo y la lente encima
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    ctx.fillStyle = "rgba(0,0,0,.2)"; rr(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fill();
    ctx.restore();
    glass(ctx, B.cv, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r, { zoom: 1.03, blur: 24, edge: 54, bend: .2, tint: "rgba(22,20,14,.24)", rim: 2 });

    // portada cuadrada
    const ph = m.photo("photo");
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#14130e"; rr(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r); ctx.fill();
    ctx.restore();
    ctx.save(); rr(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r); ctx.clip();
    if (ph) ctx.drawImage(ph.img, ph.x, ph.y, ph.w, ph.h);
    ctx.restore();

    // título (blanco) y subtítulo (gris), con el ecualizador a la derecha
    const tw = PHOTO.w - 80;
    const title = String(v.title || "").trim();
    if (title) text(title, L, 738, f(700, fit(title, tw, 700, 36, 24, -.5, INTER), INTER), WHITE, "left", -.5);
    const sub = [v.dia, v.lugar, v.hora, v.rival].map(s => String(s || "").trim()).filter(Boolean).join(" | ");
    if (sub) text(sub, L, 779, f(500, fit(sub, tw, 500, 33, 20, -.3, INTER), INTER), DIM, "left", -.3);
    waveform(ctx, R - 4, 745);

    // barra de progreso gruesa, en cápsula y sin bola
    capsule(ctx, L, R, 830, 15, pct(v.progress), "rgba(255,236,170,.42)");
    text(String(v.tA || ""), L, 878, f(500, 22, INTER), DIM, "left");
    text(String(v.tR || ""), R, 878, f(500, 22, INTER), TINT, "right");

    // controles: estrella · retroceder · pausa · avanzar (como en Apple Music)
    const cy = 958;
    star(ctx, CX - 238, cy + 2, 28);
    skip(ctx, CX - 119, cy, -1);
    pause(ctx, CX, cy);
    skip(ctx, CX + 119, cy, 1);

    // volumen
    const vy = 1074;
    speaker(ctx, L + 10, vy, 0);
    capsule(ctx, L + 52, R - 56, vy, 15, pct(v.volume), "rgba(255,255,255,.3)");
    speaker(ctx, R - 22, vy, 3);

    // botón en cápsula (AirPlay)
    const pill = String(v.pill || "").trim();
    if (pill){
      const font = f(500, 27, INTER); ctx.font = font;
      const pw = ctx.measureText(pill).width + 108, py = 1155;
      glass(ctx, B.cv, CX - pw / 2, py - 33, pw, 66, 33, { zoom: 1.06, blur: 18, edge: 14, bend: .12, tint: "rgba(22,20,14,.18)", rim: 1.5 });
      airplay(ctx, CX - pw / 2 + 40, py - 2);
      text(pill, CX - pw / 2 + 68, py + 10, font, WHITE, "left");
    }

    // pie: texto | firma | competición, separados por barras finas
    const FY = 1295;
    const items = [];
    const foot = String(v.foot || "").trim();
    if (foot){ const font = f(700, 29, INTER); ctx.font = font; items.push({ w: ctx.measureText(foot).width + foot.length * -.5, draw: x => text(foot, x, FY + 10, font, WHITE, "left", -.5) }); }
    const sig = v.showFirma && white(I.firma);
    if (sig){ const h = 42, w = sig.width * h / sig.height; items.push({ w, draw: x => ctx.drawImage(sig, x, FY - h / 2, w, h) }); }
    const comp = v.showComp && white(I.comp);
    if (comp){ const h = 46, w = comp.width * h / comp.height; items.push({ w, draw: x => ctx.drawImage(comp, x, FY - h / 2, w, h) }); }
    const GAP = 22, total = items.reduce((s, it) => s + it.w, 0) + GAP * 2 * Math.max(0, items.length - 1);
    let x = (W - total) / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2;
    items.forEach((it, i) => {
      if (i){ ctx.fillStyle = WHITE; ctx.fillRect(x + GAP - 1.25, FY - 18, 2.5, 36); x += GAP * 2; }
      it.draw(x); x += it.w;
    });
    ctx.restore();

    // grano de película, como el original
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .12; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
