/**
 * DISEÑO · NEXT MATCH · ESCUDOS (previa sin jugador, con la estética de la casa)
 * Título gigante NEXT (contorno) / MATCH (oro) y, delante, los dos escudos «de pie» sobre un suelo
 * que los refleja, con foco de luz desde arriba y contorno dorado. Datos abajo en una pila de texto centrada, sin cajas.
 */
import { use, f, text, fit, splitDate, hourH, GOLD, WHITE, ANTON, slug } from "../core/draw.js";
import { blurred } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;
const FLOOR = 958;                                          // línea del suelo donde se apoyan los escudos

/* silueta dorada de cada escudo (para el contorno de luz), en caché */
const goldCache = new WeakMap();
function goldOf(img){
  if (goldCache.has(img)) return goldCache.get(img);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = GOLD; g.fillRect(0, 0, c.width, c.height);
  goldCache.set(img, c); return c;
}

/** Caja del escudo apoyado en el suelo: los altos (tridente) un poco más altos para igualar el peso visual. */
function crestRect(img, cx, k){
  if (!img) return null;
  const tall = img.height > img.width * 1.15;
  const s = Math.min((tall ? 330 : 400) * k / img.width, (tall ? 470 : 390) * k / img.height);
  const w = img.width * s, h = img.height * s;
  return { x: cx - w / 2, y: FLOOR - h, w, h };
}

/** Datos en una pila centrada y limpia: competición · fecha / hora · pabellón. */
function infoStack(ctx, v){
  const { day, date } = splitDate(v.fecha), ho = hourH(v.hora);
  const sub = String(v.sub).trim().toUpperCase();
  if (sub) text(sub, W / 2, 1138, f(800, fit(sub, 600, 800, 14, 9, 9)), GOLD, "center", 9);

  // «DOMINGO 08.11  /  14:00H»: fecha en blanco, hora en oro, misma línea
  const dTxt = `${day} ${date}`.trim(), sep = "  /  ";
  let px = 76; const font = () => f(400, px, ANTON);
  const wOf = t => { ctx.font = font(); if ("letterSpacing" in ctx) ctx.letterSpacing = "2px"; const w = ctx.measureText(t).width; if ("letterSpacing" in ctx) ctx.letterSpacing = "0px"; return w; };
  const total = () => wOf(dTxt) + (ho ? wOf(sep) + wOf(ho) : 0);
  while (px > 30 && total() > 900) px -= 2;
  let x = W / 2 - total() / 2;
  const y = 1226;
  if (dTxt){ text(dTxt, x, y, font(), WHITE, "left", 2); x += wOf(dTxt); }
  if (ho){ text(sep, x, y, font(), "rgba(211,181,42,.45)", "left", 2); x += wOf(sep); text(ho, x, y, font(), GOLD, "left", 2); }

  const lu = String(v.lugar).trim().toUpperCase();
  if (lu) text(lu, W / 2, 1282, f(600, fit(lu, 760, 600, 15, 9, 5)), "rgba(255,255,255,.6)", "center", 5);
}

export default {
  id: "next-match-escudos",
  name: "Next Match",
  variant: "Escudos",
  category: "Previa",
  description: "Sin foto: los dos escudos de pie delante del título, con foco de luz y reflejo en el suelo.",
  thumb: "assets/thumbs/next-match-escudos.jpg",
  size: { w: W, h: H },
  filename: v => `next_match_${slug(v.nL)}_vs_${slug(v.nV)}_escudos.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Palabra blanca", value: "NEXT" },
        { type: "text", id: "t2", label: "Palabra dorada", value: "MATCH" }
      ]},
      { type: "text", id: "sub", label: "Competición", value: "Preferente" },
      { type: "row", fields: [
        { type: "text", id: "fecha", label: "Día", value: "Domingo 08/11/2026" },
        { type: "text", id: "hora", label: "Hora", value: "14:00", narrow: true }
      ]},
      { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde · Vitoria-Gasteiz" }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Futbolge" },
        { type: "text", id: "nV", label: "Visitante", value: "Atlético Cacao" }
      ]},
      { type: "image", id: "cL", label: "Escudo local (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png" },
      { type: "image", id: "cV", label: "Escudo visitante (blanco y negro)", src: "assets/img/escudo_atletico_cacao_bn_hd.png" },
      { type: "checkbox", id: "names", label: "Nombres bajo los escudos", value: false }
    ]},
    { type: "section", title: "Estilo", fields: [
      { type: "range", id: "crestSize", label: "Tamaño de los escudos", value: 100, min: 75, max: 120 },
      { type: "checkbox", id: "rays", label: "Foco de luz desde arriba", value: true },
      { type: "checkbox", id: "rim", label: "Luz dorada en el contorno", value: true },
      { type: "checkbox", id: "mirror", label: "Reflejo en el suelo", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images, k = (v.crestSize || 100) / 100;
    const L = 300, R = W - 300;

    /* ---------- fondo cálido y foco ---------- */
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b0a07"); g.addColorStop(.6, "#17130a"); g.addColorStop(1, "#070706");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (v.rays){
      ctx.save(); ctx.globalCompositeOperation = "screen";
      blurred(ctx, 30, () => {
        const lg = ctx.createLinearGradient(0, -60, 0, FLOOR + 40);
        lg.addColorStop(0, "rgba(233,207,78,.32)"); lg.addColorStop(.6, "rgba(211,181,42,.12)"); lg.addColorStop(1, "rgba(211,181,42,.03)");
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(W / 2 - 90, -60); ctx.lineTo(W / 2 + 90, -60); ctx.lineTo(W / 2 + 560, FLOOR + 40); ctx.lineTo(W / 2 - 560, FLOOR + 40); ctx.closePath(); ctx.fill();
      });
      g = ctx.createRadialGradient(W / 2, 640, 0, W / 2, 640, 560); g.addColorStop(0, "rgba(211,181,42,.2)"); g.addColorStop(1, "rgba(211,181,42,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // brillo del suelo
    ctx.save(); ctx.globalCompositeOperation = "screen";
    blurred(ctx, 18, () => {
      const rg = ctx.createRadialGradient(W / 2, FLOOR + 6, 0, W / 2, FLOOR + 6, 460);
      rg.addColorStop(0, "rgba(233,207,78,.38)"); rg.addColorStop(1, "rgba(233,207,78,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(W / 2, FLOOR + 6, 500, 44, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    /* ---------- título gigante detrás de los escudos ---------- */
    const t1 = String(v.t1).toUpperCase(), t2 = String(v.t2).toUpperCase();
    const TP = Math.min(fit(t1, 1000, 400, 340, 100, 0, ANTON), fit(t2, 1000, 400, 340, 100, 0, ANTON));
    ctx.font = f(400, TP, ANTON); const cap = ctx.measureText("H").actualBoundingBoxAscent;
    const y1 = 112 + cap, y2 = y1 + cap + 24;
    ctx.save(); ctx.font = f(400, TP, ANTON); ctx.textAlign = "center"; if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
    ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillText(t1, W / 2, y1);
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.strokeText(t1, W / 2, y1);
    ctx.restore();
    text(t2, W / 2, y2, f(400, TP, ANTON), GOLD, "center", 2);

    /* ---------- escudos de pie sobre el suelo ---------- */
    const crests = [[I.cL, L], [I.cV, R]].map(([img, cx]) => ({ img, r: crestRect(img, cx, k) })).filter(c => c.r);
    // reflejo
    if (v.mirror){
      for (const { img, r } of crests){
        ctx.save(); ctx.beginPath(); ctx.rect(0, FLOOR, W, 170); ctx.clip();
        ctx.globalAlpha = .16; ctx.translate(0, FLOOR * 2); ctx.scale(1, -1); ctx.drawImage(img, r.x, r.y, r.w, r.h); ctx.restore();
      }
      g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 170); g.addColorStop(0, "rgba(18,15,9,0)"); g.addColorStop(1, "rgba(16,13,8,1)");
      ctx.fillStyle = g; ctx.fillRect(0, FLOOR, W, 170);
    }
    for (const { img, r } of crests){
      // sombra de contacto
      blurred(ctx, 10, () => { ctx.fillStyle = "rgba(0,0,0,.85)"; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, FLOOR - 2, r.w * .42, 14, 0, 0, Math.PI * 2); ctx.fill(); });
      // separación del título: sombra oscura y, encima, contorno dorado
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10; ctx.drawImage(img, r.x, r.y, r.w, r.h); ctx.restore();
      if (v.rim){ ctx.save(); ctx.shadowColor = "rgba(233,207,78,.95)"; ctx.shadowBlur = 10; ctx.drawImage(goldOf(img), r.x, r.y, r.w, r.h); ctx.restore(); }
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
    }
    // VS entre los dos, a media altura de los escudos
    const vsY = FLOOR - 190 * k;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 20;
    text("VS", W / 2, vsY + 24, f(400, 68, ANTON), GOLD, "center", 2);
    ctx.restore();

    /* ---------- nombres, competición y datos ---------- */
    if (v.names){
      [[String(v.nL || "").trim().toUpperCase(), L], [String(v.nV || "").trim().toUpperCase(), R]].forEach(([n, x]) => {
        if (n) text(n, x, FLOOR + 58, f(800, fit(n, 400, 800, 22, 12, 5)), n.includes("FUTBOLGE") ? GOLD : WHITE, "center", 5);
      });
    }
    infoStack(ctx, v);

    if (I.firma){ const h = 46, w = I.firma.width * h / I.firma.height; ctx.globalAlpha = .9; ctx.drawImage(I.firma, (W - w) / 2, 32, w, h); ctx.globalAlpha = 1; }
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .07; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
