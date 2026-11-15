/**
 * DISEÑO · MATCH DAY · GLASS
 * Maquetación editorial con cristal acanalado: una placa de vidrio estriado ocupa la izquierda y
 * refracta lo que hay detrás (la luz dorada y medio cuerpo del jugador, partido en franjas). Encima,
 * nítido, el texto: MATCH / DAY, los equipos y la hora como protagonista. El jugador, a la derecha,
 * grande y de cuerpo entero.
 */
import { use, f, fit, GOLD, ANTON, slug } from "../core/draw.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350, M = 64;

/* ---------- jugador: B/N cálido conservando amarillos y verdes lima (botas, balón) ---------- */
const P = { src: null, pop: null, gold: null };
function preparePlayer(img){
  if (!img || P.src === img) return;
  P.src = img;
  const w = img.width, h = img.height, mk = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  P.pop = mk(); const pc = P.pop.getContext("2d", { willReadFrequently: true }); pc.drawImage(img, 0, 0);
  const d = pc.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4){
    const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    let hue = 0;
    if (mx !== mn){ if (mx === r) hue = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) hue = 60 * ((b - r) / (mx - mn) + 2); else hue = 60 * ((r - g) / (mx - mn) + 4); }
    if (hue < 0) hue += 360;
    const keep = hue > 55 && hue < 100 && sat > .55 && mx > 150;
    let y = .3 * r + .59 * g + .11 * b; y = Math.max(0, Math.min(255, (y - 128) * 1.3 + 122));
    if (!keep){ a[i] = Math.min(255, y * 1.05 + 4); a[i + 1] = y; a[i + 2] = y * .88; }
  }
  pc.putImageData(d, 0, 0);
  P.gold = mk(); const gc = P.gold.getContext("2d"); gc.drawImage(img, 0, 0);
  gc.globalCompositeOperation = "source-in"; gc.fillStyle = GOLD; gc.fillRect(0, 0, w, h);
}

/** Caja del contenido opaco (para escalar y apoyar al jugador por su silueta). */
const boxes = new WeakMap();
function bbox(img){
  if (boxes.has(img)) return boxes.get(img);
  const k = Math.min(1, 400 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const b = x1 < 0 ? { x: 0, y: 0, w: img.width, h: img.height } : { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
  boxes.set(img, b); return b;
}

/**
 * Cristal acanalado sobre la franja [0, sw]: cada estría muestra lo que hay detrás comprimido y
 * desplazado (refracción), algo desenfocado, con brillo en un canto y sombra en el otro.
 */
function flutedGlass(ctx, sw, rib){
  const cv = ctx.canvas, q = ctx.getTransform().a || 1;
  const snap = document.createElement("canvas"); snap.width = cv.width; snap.height = cv.height;
  snap.getContext("2d").drawImage(cv, 0, 0);
  const n = Math.ceil(sw / rib);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, sw, H); ctx.clip();
  ctx.filter = `blur(${(1.1 * q).toFixed(1)}px) brightness(1.12) saturate(1.1)`;
  for (let i = 0; i < n; i++){
    const dx = i * rib, src = rib * 2.4, sx = Math.max(0, Math.min(W - src, dx + rib / 2 - src / 2 + rib * .35));
    ctx.drawImage(snap, sx * q, 0, src * q, H * q, dx, 0, rib + .5, H);
  }
  ctx.filter = "none";
  // velo para que el texto se lea
  ctx.fillStyle = "rgba(8,8,8,.42)"; ctx.fillRect(0, 0, sw, H);
  // volumen de cada estría
  for (let i = 0; i < n; i++){
    const dx = i * rib, g = ctx.createLinearGradient(dx, 0, dx + rib, 0);
    g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(.12, "rgba(255,255,255,.05)");
    g.addColorStop(.65, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.36)");
    ctx.fillStyle = g; ctx.fillRect(dx, 0, rib, H);
  }
  // reflejo general de arriba abajo
  const gl = ctx.createLinearGradient(0, 0, sw, H);
  gl.addColorStop(0, "rgba(255,255,255,.07)"); gl.addColorStop(.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(255,255,255,.04)");
  ctx.fillStyle = gl; ctx.fillRect(0, 0, sw, H);
  ctx.restore();
  // canto de la placa: línea de luz y sombra proyectada
  const sh = ctx.createLinearGradient(sw, 0, sw + 46, 0);
  sh.addColorStop(0, "rgba(0,0,0,.42)"); sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh; ctx.fillRect(sw, 0, 46, H);
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(sw - 1.5, 0, 1.5, H);
}

const isOurs = name => name.includes("FUTBOLGE");

export default {
  id: "match-day-glass",
  name: "Match Day",
  variant: "Glass",
  category: "Día de partido",
  description: "Minimalista: placa de cristal acanalado con MATCH DAY, los equipos y la hora; jugador delante de un sol dorado.",
  thumb: "assets/thumbs/match-day-glass.jpg",
  size: { w: W, h: H },
  filename: v => `match_day_${slug(v.nL)}_vs_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Título (blanco)", value: "MATCH" },
        { type: "text", id: "t2", label: "Título (dorado)", value: "DAY" }
      ]},
      { type: "text", id: "hora", label: "Hora", value: "15:30" }
    ]},
    { type: "section", title: "Equipos", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Local", value: "Street Kings" },
        { type: "text", id: "nV", label: "Visitante", value: "Futbolge" }
      ]},
      { type: "hint", text: "El nombre que contenga FUTBOLGE sale en dorado." }
    ]},
    { type: "section", title: "Jugador", fields: [
      { type: "image", id: "player", label: "Jugador (sube cualquier foto: se recorta solo)", src: "assets/fotos/jugador_yuli.png", cutout: true, cutoutAuto: true,
        cutoutHint: "Al subir una foto normal se quita el fondo automáticamente con IA. Si ya es un PNG sin fondo, se usa tal cual." },
      { type: "range", id: "plSize", label: "Tamaño", value: 100, min: 60, max: 130 },
      { type: "range", id: "plX", label: "Posición horizontal", value: 0, min: -250, max: 250 },
      { type: "range", id: "glassW", label: "Ancho del cristal", value: 560, min: 420, max: 700 },
      { type: "checkbox", id: "pop", label: "B/N con las botas en color", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images, img = I.player;
    preparePlayer(img);
    const SW = Number(v.glassW || 560);

    // ── escena: negro profundo con luz de estudio neutra (sin tonos oliva)
    ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(720, 560, 0, 720, 560, 760);
    g.addColorStop(0, "rgba(74,68,60,.95)"); g.addColorStop(.45, "rgba(36,33,29,.8)"); g.addColorStop(1, "rgba(7,7,7,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // ── esfera de luz dorada, a caballo del canto del cristal (lisa fuera, estriada dentro)
    const ox = SW + 10, oy = 330, orr = 250;
    ctx.save(); ctx.filter = "blur(60px)"; ctx.globalAlpha = .55;
    ctx.fillStyle = "#D3B52A"; ctx.beginPath(); ctx.arc(ox, oy, orr * 1.05, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(ox, oy, orr, 0, Math.PI * 2); ctx.fill();
    // segunda luz, pequeña, abajo dentro del cristal
    g = ctx.createRadialGradient(120, 1090, 0, 120, 1090, 230);
    g.addColorStop(0, "rgba(240,207,76,.75)"); g.addColorStop(1, "rgba(240,207,76,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 800, W, H - 800);
    g = ctx.createLinearGradient(0, H * .7, 0, H); g.addColorStop(0, "rgba(7,7,7,0)"); g.addColorStop(1, "rgba(7,7,7,.8)");
    ctx.fillStyle = g; ctx.fillRect(SW, 0, W - SW, H);

    // ── jugador grande, de cuerpo entero, a la derecha (por delante de la esfera)
    if (img){
      const b = bbox(img), k = (v.plSize ?? 100) / 100, sc = 1170 * k / b.h;
      const cx = 660 + Number(v.plX || 0), feet = H - 22;
      const x = cx - (b.x + b.w / 2) * sc, y = feet - (b.y + b.h) * sc, w = img.width * sc, h = img.height * sc;
      const main = v.pop === false ? img : P.pop;
      ctx.save(); ctx.filter = "blur(14px)"; ctx.globalAlpha = .75; ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.ellipse(cx, feet - 4, b.w * sc * .55, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // sombra suave para despegarlo de la esfera y una luz de contorno fina, casi blanca
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 40; ctx.shadowOffsetX = -18; ctx.drawImage(main, x, y, w, h); ctx.restore();
      ctx.save(); ctx.globalAlpha = .5; ctx.shadowColor = "rgba(255,244,214,.9)"; ctx.shadowBlur = 5; ctx.drawImage(P.gold, x, y, w, h); ctx.restore();
      ctx.drawImage(main, x, y, w, h);
    }

    // ── placa de cristal acanalado
    flutedGlass(ctx, SW, 38);

    // ── tipografía sobre el cristal: título, equipos y hora, todo alineado al mismo borde de tinta
    const tw = SW - M - 44;
    const metal = GOLD, pearl = "#FFFFFF";      // colores planos, sin degradados
    /** Texto alineado ópticamente a la izquierda (sin el margen interno de la letra). Devuelve su altura de mayúscula. */
    const type = (t, y, font, { fill, stroke, lw = 3, spacing = 0, glow = true } = {}) => {
      ctx.save();
      ctx.font = font; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      if ("letterSpacing" in ctx) ctx.letterSpacing = spacing + "px";
      const mt = ctx.measureText(t), x = M + mt.actualBoundingBoxLeft, top = y - mt.actualBoundingBoxAscent;
      if (glow){ ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 20; }
      if (fill){ ctx.fillStyle = typeof fill === "function" ? fill(top, y) : fill; ctx.fillText(t, x, y); }
      if (stroke){ ctx.shadowColor = "transparent"; ctx.lineWidth = lw; ctx.lineJoin = "miter"; ctx.strokeStyle = typeof stroke === "function" ? stroke(top, y) : stroke; ctx.strokeText(t, x, y); }
      ctx.restore();
      return mt.actualBoundingBoxAscent;
    };
    const capOf = font => { ctx.font = font; return ctx.measureText("H").actualBoundingBoxAscent; };

    // título: MATCH macizo en blanco, DAY en contorno dorado, interlineado justo
    const t1 = String(v.t1 || "").toUpperCase(), t2 = String(v.t2 || "").toUpperCase();
    const TP = Math.min(fit(t1, tw, 400, 236, 90, 0, ANTON), fit(t2, tw, 400, 236, 90, 0, ANTON));
    const tf = f(400, TP, ANTON), tc = capOf(tf), TOP = 104, LEAD = Math.round(TP * .07);
    const y1 = TOP + tc, y2 = y1 + LEAD + tc;
    if (t1) type(t1, y1, tf, { fill: pearl });
    if (t2) type(t2, y2, tf, { stroke: GOLD, lw: 3.2 });

    // hora, abajo (sin la «H»: 15:30)
    const ho = String(v.hora || "").trim().replace(/\s*h$/i, "");
    const HP = fit(ho || "00:00", tw, 400, 222, 80, 0, ANTON), hf = f(400, HP, ANTON), hc = capOf(hf);
    const yH = H - 86;
    if (ho) type(ho, yH, hf, { fill: metal });

    // equipos en el centro del hueco entre título y hora: local / VS con filetes / visitante
    const nL = String(v.nL || "").trim().toUpperCase(), nV = String(v.nV || "").trim().toUpperCase();
    const NP = Math.min(fit(nL, tw, 400, 74, 28, 1, ANTON), fit(nV, tw, 400, 74, 28, 1, ANTON));
    const nf = f(400, NP, ANTON), nc = capOf(nf), GAP = 20;
    const vf = f(400, Math.round(NP * .5), ANTON), vc = capOf(vf);
    const blockH = nc + GAP + vc + GAP + nc;
    const bTop = y2 + (yH - hc - y2 - blockH) / 2;
    let y = bTop + nc;
    if (nL) type(nL, y, nf, { fill: isOurs(nL) ? metal : pearl, spacing: 1 });
    // VS sencillo, en la misma letra, más pequeño y en oro
    y += GAP + vc; type("VS", y, vf, { fill: GOLD, spacing: 1 });
    y += GAP + nc;
    if (nV) type(nV, y, nf, { fill: isOurs(nV) ? metal : pearl, spacing: 1 });

    // firma arriba a la derecha, fuera del cristal
    if (I.firma){ const h = 42, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, W - M - w, 56, w, h); }

    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .08; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
