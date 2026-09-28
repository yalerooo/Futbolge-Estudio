/**
 * DISEÑO · NEXT MATCH (previa del partido)
 * Dos estilos: jugador recortado con efectos, o foto a pantalla completa.
 */
import { use, f, text, width, fit, crestCircle, splitDate, hourH, GOLD, WHITE, ANTON, slug } from "../core/draw.js";
import { drawToned, blurred } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;

/* ---------- jugador recortado: versiones procesadas (B/N con balón en color, silueta dorada) ---------- */
const P = { src: null, color: null, pop: null, gold: null };
function preparePlayer(img){
  if (!img || P.src === img) return;
  P.src = img;
  const w = img.width, h = img.height, mk = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  P.color = img;
  P.pop = mk(); const pc = P.pop.getContext("2d"); pc.drawImage(img, 0, 0);
  const d = pc.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4){
    const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    let hue = 0;
    if (mx !== mn){ if (mx === r) hue = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) hue = 60 * ((b - r) / (mx - mn) + 2); else hue = 60 * ((r - g) / (mx - mn) + 4); }
    if (hue < 0) hue += 360;
    const keep = hue > 40 && hue < 80 && sat > .45 && mx > 90;          // tonos amarillos saturados (el balón)
    let y = .3 * r + .59 * g + .11 * b; y = Math.max(0, Math.min(255, (y - 128) * 1.25 + 120));
    if (!keep){ a[i] = Math.min(255, y * 1.04 + 4); a[i + 1] = y; a[i + 2] = y * .9; }
  }
  pc.putImageData(d, 0, 0);
  P.gold = mk(); const gc = P.gold.getContext("2d"); gc.drawImage(img, 0, 0);
  gc.globalCompositeOperation = "source-in"; gc.fillStyle = GOLD; gc.fillRect(0, 0, w, h);
}

/* ---------- estilo 1: jugador recortado ---------- */
function drawCutout(ctx, v, I){
  const img = I.player; preparePlayer(img);
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b0a07"); g.addColorStop(.55, "#17130a"); g.addColorStop(1, "#070706");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const k = v.plSize / 100, ph = 920 * k, pw = img ? img.width * ph / img.height : 0;
  const px = (W - pw) / 2 + Number(v.plX), feet = 1062, py = feet - ph;
  const cxp = px + pw * .45, cyp = py + ph * .42;

  if (v.rays){
    ctx.save(); ctx.globalCompositeOperation = "screen";
    blurred(ctx, 30, () => {
      const lg = ctx.createLinearGradient(0, -60, 0, feet + 40);
      lg.addColorStop(0, "rgba(233,207,78,.34)"); lg.addColorStop(.6, "rgba(211,181,42,.12)"); lg.addColorStop(1, "rgba(211,181,42,.02)");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(cxp - 70, -60); ctx.lineTo(cxp + 70, -60); ctx.lineTo(cxp + 380, feet + 40); ctx.lineTo(cxp - 380, feet + 40); ctx.closePath(); ctx.fill();
    });
    g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, 520); g.addColorStop(0, "rgba(211,181,42,.22)"); g.addColorStop(1, "rgba(211,181,42,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = "screen";
  blurred(ctx, 18, () => {
    const rg = ctx.createRadialGradient(W / 2, feet + 6, 0, W / 2, feet + 6, 380);
    rg.addColorStop(0, "rgba(233,207,78,.35)"); rg.addColorStop(1, "rgba(233,207,78,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(W / 2, feet + 6, 400, 46, 0, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  // título gigante detrás del jugador: la primera palabra solo en contorno, la segunda maciza en oro
  const t1 = String(v.t1).toUpperCase(), t2 = String(v.t2).toUpperCase();
  const TP = Math.min(fit(t1, 1000, 400, 440, 100, 0, ANTON), fit(t2, 1000, 400, 440, 100, 0, ANTON));
  ctx.font = f(400, TP, ANTON); const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const y1 = 118 + cap, y2 = y1 + cap + 26;
  ctx.save(); ctx.font = f(400, TP, ANTON); ctx.textAlign = "center"; if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillText(t1, W / 2, y1);
  ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.strokeText(t1, W / 2, y1);
  ctx.restore();
  text(t2, W / 2, y2, f(400, TP, ANTON), GOLD, "center", 2);

  if (img){
    const main = v.pop ? P.pop : P.color;
    blurred(ctx, 10, () => { ctx.fillStyle = "rgba(0,0,0,.85)"; ctx.beginPath(); ctx.ellipse(px + pw * .5, feet - 2, pw * .5, 16, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.save(); ctx.beginPath(); ctx.rect(0, feet, W, 90); ctx.clip();
    ctx.globalAlpha = .16; ctx.translate(0, feet * 2); ctx.scale(1, -1); ctx.drawImage(main, px, py, pw, ph); ctx.restore();
    g = ctx.createLinearGradient(0, feet, 0, feet + 90); g.addColorStop(0, "rgba(11,10,7,0)"); g.addColorStop(1, "rgba(11,10,7,1)");
    ctx.fillStyle = g; ctx.fillRect(0, feet, W, 90);
    if (v.echo) [[-120, .05], [-80, .08], [-40, .12]].forEach(([dx, al]) => { ctx.save(); ctx.globalAlpha = al; ctx.drawImage(P.gold, px + dx, py, pw, ph); ctx.restore(); });
    if (v.rim){ ctx.save(); ctx.shadowColor = "rgba(233,207,78,.9)"; ctx.shadowBlur = 9; ctx.drawImage(P.gold, px, py, pw, ph); ctx.restore(); }
    ctx.drawImage(main, px, py, pw, ph);
  }

  // bloque de datos: competición · escudos VS · fila de 3 columnas
  g = ctx.createLinearGradient(0, 990, 0, H); g.addColorStop(0, "rgba(7,7,6,0)"); g.addColorStop(.35, "rgba(7,7,6,.88)"); g.addColorStop(1, "rgba(7,7,6,.97)");
  ctx.fillStyle = g; ctx.fillRect(0, 990, W, H - 990);
  const sub = String(v.sub).trim().toUpperCase();
  if (sub) text(sub, W / 2, 1070, f(700, fit(sub, 500, 700, 13, 9, 8)), GOLD, "center", 8);

  const D = 94, ccy = 1176;
  ctx.font = f(400, 40, ANTON); const vsW = ctx.measureText("VS").width, gap = 34;
  const x0 = (W - (D + gap + vsW + gap + D)) / 2;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 14;
  crestCircle(I.cL, x0, ccy, D); crestCircle(I.cV, x0 + D + gap + vsW + gap, ccy, D);
  ctx.restore();
  text("VS", W / 2, ccy + 15, f(400, 40, ANTON), GOLD, "center", 1);

  const { day, date } = splitDate(v.fecha), ho = hourH(v.hora);
  const lu = String(v.lugar).split("·")[0].trim().toUpperCase();
  let luLabel = "PABELLÓN", luVal = lu;
  if (lu && fit(lu, 260, 400, 40, 18, 1, ANTON) < 38){ const w = lu.split(/\s+/); luLabel = w.slice(0, -1).join(" "); luVal = w[w.length - 1]; }
  const cols = [[day || "FECHA", date, WHITE], ["HORA", ho, GOLD], [luLabel, luVal, WHITE]];
  const top = 1250, colW = 300, cx0 = W / 2 - colW;
  ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(W / 2 - colW / 2, top, 1, 70); ctx.fillRect(W / 2 + colW / 2, top, 1, 70);
  cols.forEach(([label, val, col], i) => {
    const cx = cx0 + i * colW;
    text(label, cx, top + 14, f(600, fit(label, colW - 40, 600, 13, 9, 4)), "rgba(255,255,255,.55)", "center", 4);
    if (val) text(val, cx, top + 62, f(400, fit(val, colW - 40, 400, 40, 18, 1, ANTON), ANTON), col, "center", 1);
  });

  if (I.firma){ const h = 46, w = I.firma.width * h / I.firma.height; ctx.globalAlpha = .9; ctx.drawImage(I.firma, (W - w) / 2, 32, w, h); ctx.globalAlpha = 1; }
  ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .07; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
}

/* ---------- estilo 2: foto de fondo ---------- */
function drawPhoto(ctx, v, I, m){
  ctx.fillStyle = "#0A0A0A"; ctx.fillRect(0, 0, W, H);
  const ph = m.photo("photo");
  if (ph){
    drawToned(ctx, ph.img, v.bw ? "grayscale(1) contrast(1.25) brightness(.72)" : "contrast(1.1) brightness(.75) saturate(.8)", ph.x, ph.y, ph.w, ph.h);
    const t = v.tint / 100;
    if (t > 0){ ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = t; ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  let g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(8,7,5,.88)"); g.addColorStop(.38, "rgba(8,7,5,.55)"); g.addColorStop(.62, "rgba(8,7,5,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(8,7,5,.55)"); g.addColorStop(.18, "rgba(8,7,5,0)"); g.addColorStop(.72, "rgba(8,7,5,0)"); g.addColorStop(1, "rgba(8,7,5,.9)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (v.corners){
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(56, 40, 130, 1.5); ctx.fillRect(40, 56, 1.5, 130);
    ctx.fillRect(W - 186, H - 41.5, 130, 1.5); ctx.fillRect(W - 41.5, H - 186, 1.5, 130);
  }

  const X = 72, D = 104, cy = 318;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 20;
  const wL = crestCircle(I.cL, X, cy, D);
  ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(X + wL + 26, cy - 36, 1.5, 72);
  crestCircle(I.cV, X + wL + 53, cy, D);
  ctx.restore();

  const t1 = String(v.t1).toUpperCase(), t2 = String(v.t2).toUpperCase();
  const TP = Math.min(fit(t1, 460, 400, 200, 80, 0, ANTON), fit(t2, 460, 400, 200, 80, 0, ANTON));
  ctx.font = f(400, TP, ANTON); const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const y1 = 430 + cap, y2 = y1 + cap + 22;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 30;
  text(t1, X - 4, y1, f(400, TP, ANTON), WHITE); text(t2, X - 4, y2, f(400, TP, ANTON), GOLD);
  ctx.restore();

  let y = y2 + 56;
  const sub = String(v.sub).toUpperCase();
  if (sub){ text(sub, X, y, f(600, fit(sub, 460, 600, 17, 10, 6)), "rgba(255,255,255,.7)", "left", 6); y += 40; }
  const { day, date } = splitDate(v.fecha), dateTxt = `${day} ${date}`.trim(), hoTxt = hourH(v.hora);
  const dp = fit(dateTxt + "  ·  " + hoTxt, 460, 600, 30, 14, 2);
  text(dateTxt, X, y, f(600, dp), WHITE, "left", 2);
  if (hoTxt){
    text("·", X + width(dateTxt + "  ", f(600, dp), 2), y, f(600, dp), "rgba(255,255,255,.5)", "left");
    text(hoTxt, X + width(dateTxt + "  ·  ", f(600, dp), 2), y, f(700, dp), GOLD, "left", 2);
  }
  y += 36;
  const lu = String(v.lugar).split("·")[0].trim().toUpperCase();
  if (lu) text(lu, X, y, f(500, fit(lu, 460, 500, 17, 10, 3)), "rgba(255,255,255,.7)", "left", 3);

  if (I.firma){ const h = 72, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, X - 8, H - 64 - h, w, h); }
  ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .06; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
}

const base = {
  size: { w: W, h: H },
  filename: v => `next_match_${slug(v.nL)}_vs_${slug(v.nV)}${v.mode === "foto" ? "_foto" : ""}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Palabra blanca", value: "NEXT" },
        { type: "text", id: "t2", label: "Palabra dorada", value: "MATCH" }
      ]},
      { type: "text", id: "sub", label: "Competición", value: "Amistoso" },
      { type: "row", fields: [
        { type: "text", id: "fecha", label: "Día", value: "Domingo 04/10/2026" },
        { type: "text", id: "hora", label: "Hora", value: "18:00", narrow: true }
      ]},
      { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde · Vitoria-Gasteiz" }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante", value: "Jaimitos FC" }
      ]},
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_jaimitos_bn_hd.png" }
    ]},
    { type: "section", title: "Jugador", visibleIf: v => v.mode === "recorte", fields: [
      { type: "image", id: "player", label: "Jugador (sube cualquier foto: se recorta solo)", src: "assets/fotos/jugador_recorte.png", cutout: true, cutoutAuto: true,
        cutoutHint: "Al subir una foto normal se quita el fondo automáticamente con IA. Si ya es un PNG sin fondo, se usa tal cual." },
      { type: "range", id: "plSize", label: "Tamaño", value: 100, min: 60, max: 130 },
      { type: "range", id: "plX", label: "Posición horizontal", value: 0, min: -300, max: 300 },
      { type: "checkbox", id: "pop", label: "B/N con el balón en color", value: true },
      { type: "checkbox", id: "rim", label: "Luz dorada en el contorno", value: true },
      { type: "checkbox", id: "rays", label: "Foco de luz desde arriba", value: true },
      { type: "checkbox", id: "echo", label: "Estela de movimiento", value: false }
    ]},
    { type: "section", title: "Foto", visibleIf: v => v.mode === "foto", fields: [
      { type: "photo", id: "photo", label: "Foto del equipo", src: "assets/fotos/equipo_pista.jpg",
        area: () => ({ x: 0, y: 0, w: W, h: H }),
        defaultFrame: (img, a, cover) => {
          const zoom = Math.max(1, (0.55 * 3024 / img.width) / cover), s = cover * zoom;
          return { zoom, ox: 760 - 0.496 * img.width * s, oy: 0 };
        } },
      { type: "range", id: "tint", label: "Tono dorado", value: 45, min: 0, max: 100 },
      { type: "checkbox", id: "bw", label: "Foto en blanco y negro", value: true },
      { type: "checkbox", id: "corners", label: "Esquinas decorativas", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    if (v.mode === "foto") drawPhoto(ctx, v, I, m);
    else drawCutout(ctx, v, I);
  }
};

/* Dos diseños del catálogo que comparten código: cada uno fija su estilo en `state.mode`. */
export const nextMatchPlayer = {
  ...base,
  id: "next-match",
  name: "Next Match",
  variant: "Jugador",
  category: "Previa",
  description: "Jugador recortado delante del título, con foco de luz y color pop.",
  thumb: "assets/thumbs/next-match.jpg",
  state: { mode: "recorte" }
};

export const nextMatchPhoto = {
  ...base,
  id: "next-match-foto",
  name: "Next Match",
  variant: "Foto",
  category: "Previa",
  description: "Foto del equipo a pantalla completa con el texto a la izquierda.",
  thumb: "assets/thumbs/next-match-foto.jpg",
  state: { mode: "foto" }
};
