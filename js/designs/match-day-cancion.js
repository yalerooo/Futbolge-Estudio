/**
 * DISEÑO · MATCH DAY · CANCIÓN
 * El partido como si fuera la canción que suena: tarjeta de cristal estilo reproductor
 * (foto, título, barra de progreso y controles) sobre el polideportivo desenfocado, en dorado y negro como el escudo.
 */
import { use, f, text, fit, contain, rr, slug, WHITE, GOLD } from "../core/draw.js";
import { blurred, drawToned, FILTER_OK } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;
const CARD = { x: 140, y: 150, w: 800, h: 954, r: 60 };
const PHOTO = { x: 231, y: 185, w: 618, h: 520, r: 16 };
const INTER = '"Inter", "Montserrat", system-ui, sans-serif';

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

/* ---------- iconos del reproductor (blancos, con esquinas suaves) ---------- */
function softFill(ctx, path){
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = WHITE; ctx.lineWidth = 6; ctx.lineJoin = "round";
  path(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* dos triángulos seguidos; dir = 1 apunta a la derecha (avanzar), -1 a la izquierda (retroceder) */
function skip(ctx, cx, cy, dir){
  const tw = 30, th = 42 / 2 - 3;
  softFill(ctx, () => {
    ctx.beginPath();
    for (const k of [-1, 0]){
      const x0 = cx + dir * (k * tw + 3), x1 = x0 + dir * (tw - 6);
      ctx.moveTo(x0, cy - th); ctx.lineTo(x1, cy); ctx.lineTo(x0, cy + th); ctx.closePath();
    }
  });
}
function pause(ctx, cx, cy){
  ctx.fillStyle = WHITE;
  for (const x of [cx - 21, cx + 6]){ rr(x, cy - 22, 15, 44, 4); ctx.fill(); }
}
function heart(ctx, cx, cy, s, color = WHITE){
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 32, s / 32); ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 13);
  ctx.bezierCurveTo(-4, 9, -16, 1, -16, -6); ctx.bezierCurveTo(-16, -12, -12, -15, -8, -15);
  ctx.bezierCurveTo(-4, -15, -1, -12, 0, -9); ctx.bezierCurveTo(1, -12, 4, -15, 8, -15);
  ctx.bezierCurveTo(12, -15, 16, -12, 16, -6); ctx.bezierCurveTo(16, 1, 4, 9, 0, 13);
  ctx.fill(); ctx.restore();
}

export default {
  id: "match-day-cancion",
  name: "Match Day",
  variant: "Canción",
  category: "Día de partido",
  description: "El partido como la canción que suena: reproductor de cristal sobre el polideportivo desenfocado.",
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
      { type: "range", id: "progress", label: "Progreso de la canción", value: 50, min: 0, max: 100 },
      { type: "row", fields: [
        { type: "text", id: "tA", label: "Tiempo izquierda", value: "1:21" },
        { type: "text", id: "tR", label: "Tiempo derecha", value: "-1:36" }
      ]}
    ]},
    { type: "section", title: "Fotos", fields: [
      { type: "photo", id: "photo", label: "Foto de la canción", src: "assets/fotos/jugada_pista.png",
        area: () => PHOTO,
        defaultFrame: (img, a, cover) => ({ zoom: 1, ox: a.x + (a.w - img.width * cover) / 2, oy: a.y + a.h * .5 - img.height * cover * .48 }) },
      { type: "photo", id: "bg", label: "Fondo (polideportivo)", src: "assets/fotos/polideportivo.jpg",
        area: () => ({ x: 0, y: 0, w: W, h: H }),
        defaultFrame: (img, a, cover) => ({ zoom: 1, ox: a.w * .5 - img.width * cover * .62, oy: 0 }) },
      { type: "range", id: "bgBlur", label: "Desenfoque del fondo", value: 12, min: 0, max: 40 },
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

    // fondo: polideportivo desenfocado, en blanco y negro oscurecido y con un degradado dorado hacia abajo
    ctx.fillStyle = "#1a1810"; ctx.fillRect(0, 0, W, H);
    if (bg) drawBg(ctx, bg, Number(v.bgBlur) || 0, "grayscale(1) contrast(1.05)");
    const dk = ctx.createLinearGradient(0, 0, 0, H);
    dk.addColorStop(0, "rgba(8,8,6,.5)"); dk.addColorStop(.6, "rgba(8,8,6,.3)"); dk.addColorStop(1, "rgba(8,8,6,0)");
    ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);
    const wg = ctx.createLinearGradient(0, H * .2, W * .35, H);
    wg.addColorStop(0, "rgba(211,181,42,0)"); wg.addColorStop(.5, `rgba(211,181,42,${.45 * warm})`); wg.addColorStop(1, `rgba(226,190,40,${warm})`);
    // «color» tiñe de dorado conservando las luces del pabellón; «multiply» le da cuerpo y el normal lo aviva
    for (const [op, a] of [["color", 1], ["multiply", .55], ["source-over", .45]]){
      ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    // escudo arriba a la derecha
    if (v.crestTop && I.crest){
      const ch = 104, cw = I.crest.width * ch / I.crest.height;
      ctx.save(); ctx.globalAlpha = .92; ctx.drawImage(I.crest, W - 34 - cw, 26, cw, ch); ctx.restore();
    }

    // tarjeta de cristal: sombra suave, fondo muy desenfocado y velo negro con reflejo dorado abajo
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    ctx.fillStyle = "rgba(10,10,8,.25)"; rr(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fill();
    ctx.restore();
    ctx.save(); rr(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.clip();
    if (bg) drawBg(ctx, bg, 40, "grayscale(1)");
    const cg = ctx.createLinearGradient(0, CARD.y, 0, CARD.y + CARD.h);
    cg.addColorStop(0, "rgba(12,11,8,.74)"); cg.addColorStop(.6, "rgba(16,14,9,.74)"); cg.addColorStop(1, `rgba(${50 + 90 * warm | 0},${44 + 74 * warm | 0},${10 + 12 * warm | 0},.74)`);
    ctx.fillStyle = cg; ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    const sheen = ctx.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w * .6, CARD.y + CARD.h * .5);
    sheen.addColorStop(0, "rgba(255,255,255,.07)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen; ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    ctx.restore();
    ctx.strokeStyle = "rgba(211,181,42,.4)"; ctx.lineWidth = 1.5; rr(CARD.x + .75, CARD.y + .75, CARD.w - 1.5, CARD.h - 1.5, CARD.r); ctx.stroke();

    // foto de la "canción"
    const ph = m.photo("photo");
    ctx.save(); rr(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r); ctx.clip();
    ctx.fillStyle = "#14130e"; ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    if (ph) ctx.drawImage(ph.img, ph.x, ph.y, ph.w, ph.h);
    ctx.restore();

    // título y subtítulo
    const L = PHOTO.x, R = PHOTO.x + PHOTO.w;
    const title = String(v.title || "").trim();
    if (title) text(title, L, 778, f(700, fit(title, PHOTO.w, 700, 42, 26, -.6, INTER), INTER), WHITE, "left", -.6);
    const sub = [v.dia, v.lugar, v.hora, v.rival].map(s => String(s || "").trim()).filter(Boolean).join(" | ");
    if (sub) text(sub, L, 822, f(400, fit(sub, PHOTO.w, 400, 31, 18, -.2, INTER), INTER), "rgba(255,255,255,.88)", "left", -.2);

    // barra de progreso
    const py = 882, p = Math.min(1, Math.max(0, (Number(v.progress) || 0) / 100)), kx = L + PHOTO.w * p;
    ctx.lineCap = "round"; ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.beginPath(); ctx.moveTo(L, py); ctx.lineTo(R, py); ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.moveTo(L, py); ctx.lineTo(kx, py); ctx.stroke();
    ctx.lineCap = "butt";
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(kx, py, 7.5, 0, Math.PI * 2); ctx.fill();
    text(String(v.tA || ""), L, 920, f(500, 19, INTER), "rgba(255,255,255,.82)", "left");
    text(String(v.tR || ""), R, 920, f(500, 19, INTER), "rgba(255,255,255,.82)", "right");

    // controles: escudo · avanzar · pausa · retroceder · corazón (en el mismo orden que el original)
    const cy = 992;
    if (I.crest) contain(I.crest, L + 18, cy, 40, 54);
    skip(ctx, L + PHOTO.w * .27, cy, 1);
    pause(ctx, L + PHOTO.w * .5, cy);
    skip(ctx, L + PHOTO.w * .73, cy, -1);
    heart(ctx, R - 18, cy + 1, 40, GOLD);

    // pie: texto | firma | competición, separados por barras finas
    const items = [];
    const foot = String(v.foot || "").trim();
    if (foot){ const font = f(700, 29, INTER); ctx.font = font; items.push({ w: ctx.measureText(foot).width + foot.length * -.5, draw: x => text(foot, x, 1170, font, WHITE, "left", -.5) }); }
    const sig = v.showFirma && white(I.firma);
    if (sig){ const h = 42, w = sig.width * h / sig.height; items.push({ w, draw: x => ctx.drawImage(sig, x, 1160 - h / 2, w, h) }); }
    const comp = v.showComp && white(I.comp);
    if (comp){ const h = 46, w = comp.width * h / comp.height; items.push({ w, draw: x => ctx.drawImage(comp, x, 1160 - h / 2, w, h) }); }
    const GAP = 22, total = items.reduce((s, it) => s + it.w, 0) + GAP * 2 * Math.max(0, items.length - 1);
    let x = (W - total) / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2;
    items.forEach((it, i) => {
      if (i){ ctx.fillStyle = WHITE; ctx.fillRect(x + GAP - 1.25, 1142, 2.5, 36); x += GAP * 2; }
      it.draw(x); x += it.w;
    });
    ctx.restore();

    // grano de película, como el original
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .14; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
