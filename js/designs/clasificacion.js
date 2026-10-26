/**
 * DISEÑO · CLASIFICACIÓN
 * Tabla de la liga tras una jornada, minimalista y en cristal: fondo negro con luces doradas
 * difuminadas, cabecera sencilla con el logo de la FVFS (FAVAFUTSAL) y la tabla dentro de un único
 * panel de cristal esmerilado. La fila de FUTBOLGE va en una franja dorada maciza.
 * Las plazas de ascenso forman una tarjeta de cristal agrupada: el campeón con velo e insignia dorados,
 * el resto con insignias plateadas; la leyenda va al pie del panel.
 * Cada equipo se escribe en una línea: «Nombre J G E P GF GC Pts» (se puede pegar tal cual de la web).
 */
import { use, f, text, width, fit, rr, slug, GOLD, WHITE, BLACK, ANTON } from "../core/draw.js";
import { FILTER_OK } from "../core/fx.js";
import { grain, makeCanvas } from "../core/canvas.js";

const W = 1080, H = 1350;
const TEAMS = 12;
const PANEL = { x: 48, y: 300, w: 984, h: 940, r: 36 };
const T = { x: 76, w: 928, head: 360, top: 384, row: 66 };              // tabla, dentro del panel
const COLS = [["J", 650], ["G", 704], ["E", 758], ["P", 812], ["GF", 866], ["GC", 920]];
const PTS_X = 978, POS_X = 112, NAME_X = 164, NAME_W = 440;

const DEFAULT = [
  "ATLÉTICO CACAO 1 1 0 0 4 2 3",
  "GUARANI GASTEIZ FC 1 1 0 0 5 3 3",
  "JAIMITOS FC GLUP GOLOSINAS 1 1 0 0 2 1 3",
  "DREAMTEAM F.C. 1 1 0 0 3 2 3",
  "STREET KINGS 1 1 0 0 4 3 3",
  "FUTBOLGE 1 0 1 0 3 3 1",
  "LOH CHAVALE 1 0 1 0 3 3 1",
  "PUERTO CHALACO F.C. 1 0 0 1 1 2 0",
  "KISUNA SPORT CLUB 1 0 0 1 2 3 0",
  "TXANTXI F.C. 1 0 0 1 3 4 0",
  "SIN FRONTERAS FC 1 0 0 1 2 4 0",
  "OPACUA ( LA CURVA DE SANSOMENDI) 1 0 0 1 3 5 0"
];

/* «Nombre J G E P GF GC Pts» → objeto. Si vienen 8 números (con la columna S de sanciones), se ignora la S. */
function parse(line){
  const s = String(line || "").trim(); if (!s) return null;
  const m = s.match(/^(.*?)((?:\s+-?\d+){7,8})\s*$/);
  if (!m) return { name: s.toUpperCase(), n: [] };
  let n = m[2].trim().split(/\s+/).map(Number);
  if (n.length === 8) n = [n[0], n[1], n[2], n[3], n[5], n[6], n[7]];
  return { name: m[1].trim().toUpperCase().replace(/\(\s+/g, "("), n };
}

/* mancha de luz difusa */
function glow(ctx, x, y, rx, ry, color){
  ctx.save(); ctx.translate(x, y); ctx.scale(rx / 100, ry / 100);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
  g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = g; ctx.fillRect(-100, -100, 200, 200); ctx.restore();
}

/* insignia redonda de puesto: dorada maciza (campeón) o de cristal plateado (ascenso) */
function badge(ctx, kind, cx, cy, d){
  const r = d / 2;
  ctx.save();
  if (kind === "champ"){
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, "#F2D762"); g.addColorStop(.55, "#D3B52A"); g.addColorStop(1, "#B8961C");
    ctx.shadowColor = "rgba(211,181,42,.55)"; ctx.shadowBlur = d * .55;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,248,210,.7)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r - .6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, "rgba(255,255,255,.26)"); g.addColorStop(1, "rgba(255,255,255,.08)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    const e = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    e.addColorStop(0, "rgba(255,255,255,.75)"); e.addColorStop(1, "rgba(255,255,255,.18)");
    ctx.strokeStyle = e; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, r - .65, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/* medalla redonda: oro, plata o bronce según el puesto */
function medal(ctx, i, cx, cy, d){
  const tones = [["#F6DD6E", "#D3B52A", "#A8871A"], ["#F4F4F0", "#C9C9C2", "#8E8E88"], ["#EFB37A", "#C27A3E", "#83501F"]][Math.min(i, 2)];
  const r = d / 2, g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, tones[0]); g.addColorStop(.55, tones[1]); g.addColorStop(1, tones[2]);
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r - .6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
}

const teamFields = Array.from({ length: TEAMS }, (_, i) => ({ type: "text", id: "e" + (i + 1), label: `${i + 1}º`, value: DEFAULT[i] }));

export default {
  id: "clasificacion",
  name: "Clasificación",
  variant: "Jornada",
  category: "Clasificación",
  description: "La tabla de la liga tras cada jornada en un panel de cristal, con el podio de ascenso y la fila de FUTBOLGE en dorado.",
  thumb: "assets/thumbs/clasificacion.jpg",
  size: { w: W, h: H },
  filename: v => `clasificacion_${slug(v.jornada)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png", fvfs: "assets/img/logo_fvfs.png" },

  fields: [
    { type: "section", title: "Cabecera", fields: [
      { type: "text", id: "title", label: "Título", value: "Clasificación" },
      { type: "row", fields: [
        { type: "text", id: "comp", label: "Competición", value: "Preferente" },
        { type: "text", id: "jornada", label: "Jornada", value: "Jornada 1" }
      ]}
    ]},
    { type: "section", title: "Tabla", fields: [
      { type: "hint", text: "Un equipo por línea, en orden: Nombre J G E P GF GC Puntos. Puedes pegar la fila de la web (si trae la columna S, se ignora). El orden de los campos es el puesto: si hay empate y desempata algo (tarjetas, goles…), ponlos en el orden bueno." },
      { type: "text", id: "highlight", label: "Equipo resaltado", value: "FUTBOLGE" },
      { type: "row", fields: [
        { type: "number", id: "up", label: "Plazas de ascenso", value: 3, min: 0, max: 6, narrow: true },
        { type: "text", id: "upLabel", label: "Leyenda del ascenso", value: "Ascenso a Bronce" }
      ]},
      { type: "segmented", id: "podium", value: "bloque", options: [
        { value: "linea", label: "Línea" }, { value: "barra", label: "Barra" }, { value: "medallas", label: "Medallas" },
        { value: "numeros", label: "Números" }, { value: "bloque", label: "Bloque" }, { value: "podio", label: "Podio" }, { value: "tarjeta", label: "Tarjeta" }
      ]},
      { type: "checkbox", id: "champ", label: "Distinguir el primer puesto como campeón", value: true },
      { type: "text", id: "champLabel", label: "Leyenda del campeón", value: "Campeón", visibleIf: v => v.champ },
      ...teamFields
    ]},
    { type: "section", title: "Logos", collapsed: true, fields: [
      { type: "checkbox", id: "showFvfs", label: "Logo de la FVFS junto al título", value: true },
      { type: "checkbox", id: "showFirma", label: "Firma FUTBOLGE en el pie", value: true }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    const hl = String(v.highlight || "").trim().toUpperCase();
    const teams = Array.from({ length: TEAMS }, (_, i) => parse(v["e" + (i + 1)]));
    const isMine = t => !!(t && hl && t.name.includes(hl));
    const mid2 = (cy, font) => { ctx.font = font; const mt = ctx.measureText("H"); return cy + mt.actualBoundingBoxAscent / 2; };

    /* ---------- fondo: negro con luces doradas (en un lienzo aparte para el cristal) ---------- */
    const B = makeCanvas(W, H, ctx.__q || 1), g = B.ctx;
    g.fillStyle = "#0a0907"; g.fillRect(0, 0, W, H);
    glow(g, W * .86, 250, 420, 360, "rgba(211,181,42,.55)");
    glow(g, W * .1, H * .78, 380, 340, "rgba(211,181,42,.38)");
    glow(g, W * .55, H * .52, 260, 220, "rgba(255,226,140,.12)");
    ctx.drawImage(B.cv, 0, 0, W, H);

    /* ---------- cabecera: competición · jornada, título y logo de la FVFS ---------- */
    const comp = String(v.comp || "").trim().toUpperCase();
    const jor = String(v.jornada || "").trim().toUpperCase();
    const kick = [comp, jor].filter(Boolean).join("  ·  ");
    if (kick) text(kick, 56, 104, f(700, 22), GOLD, "left", 6);
    const title = String(v.title || "").trim().toUpperCase();
    const logo = v.showFvfs && I.fvfs;
    const tp = fit(title, logo ? 800 : W - 112, 400, 150, 80, 1, ANTON);
    ctx.font = f(400, tp, ANTON);
    const tcap = ctx.measureText("H").actualBoundingBoxAscent;
    text(title, 52, 128 + tcap, f(400, tp, ANTON), WHITE, "left", 1);
    if (logo){
      const lh = 96, lw = I.fvfs.width * lh / I.fvfs.height;
      ctx.save(); ctx.globalAlpha = .85; ctx.drawImage(I.fvfs, W - 58 - lw, 128 + tcap - lh, lw, lh); ctx.restore();
    }

    /* ---------- panel de cristal ---------- */
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
    ctx.fillStyle = "rgba(0,0,0,.2)"; rr(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r); ctx.fill();
    ctx.restore();
    ctx.save(); rr(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r); ctx.clip();
    if (FILTER_OK){ ctx.save(); ctx.filter = "blur(40px) saturate(1.3)"; ctx.drawImage(B.cv, 0, 0, W, H); ctx.restore(); }
    ctx.fillStyle = "rgba(255,255,255,.055)"; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    const sh = ctx.createLinearGradient(PANEL.x, PANEL.y, PANEL.x + PANEL.w * .5, PANEL.y + PANEL.h * .6);
    sh.addColorStop(0, "rgba(255,255,255,.07)"); sh.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sh; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.restore();
    const edge = ctx.createLinearGradient(PANEL.x, PANEL.y, PANEL.x + PANEL.w, PANEL.y + PANEL.h);
    edge.addColorStop(0, "rgba(255,255,255,.28)"); edge.addColorStop(.5, "rgba(255,255,255,.06)"); edge.addColorStop(1, "rgba(255,255,255,.16)");
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5; rr(PANEL.x + .75, PANEL.y + .75, PANEL.w - 1.5, PANEL.h - 1.5, PANEL.r); ctx.stroke();

    /* ---------- tabla ---------- */
    const hf = f(700, 15), dim = "rgba(255,255,255,.42)";

    // zonas: campeón (1º) y ascenso (el resto de plazas)
    const up = Math.min(TEAMS, Math.max(0, Number(v.up) || 0));
    const champ = !!v.champ && up > 0;
    const zone = i => i < up ? (champ && i === 0 ? "champ" : "up") : null;
    const champLabel = String(v.champLabel || "").trim().toUpperCase();
    const upLabel = String(v.upLabel || "").trim().toUpperCase();
    const style = v.podium || "bloque";
    const cut = ["linea", "medallas", "numeros"].includes(style);          // estilos con línea de corte
    const leg = [];
    if (!cut && style !== "podio"){
      if (champ && champLabel) leg.push(["champ", champLabel]);
      if (up > (champ ? 1 : 0) && upLabel) leg.push(["up", upLabel]);
    }
    const zc = z => z === "champ" ? GOLD : "#DEDCD2";

    // podio en tarjetas: los tres primeros salen de la tabla y van en tres tarjetas de cristal
    const podio = style === "podio" && up >= 3;
    const first = podio ? 3 : 0;
    const PH = 232, py0 = PANEL.y + 30;
    const headY = podio ? py0 + PH + 66 : T.head;
    const rowsTop = podio ? headY + 22 : T.top;
    const bottomPad = leg.length ? 64 : 36;
    const RH = (PANEL.y + PANEL.h - bottomPad - rowsTop) / (TEAMS - first);
    const rowTop = i => rowsTop + (i - first) * RH;

    // cabecera de columnas
    text("#", POS_X, headY, hf, dim, "center", 2);
    text("EQUIPO", NAME_X, headY, hf, dim, "left", 3);
    for (const [k, x] of COLS) text(k, x, headY, hf, dim, "center", 2);
    text("PTS", PTS_X, headY, hf, GOLD, "center", 2);

    if (podio){
      const gap = 16, cw = (T.w + 24 - gap * 2) / 3, x0 = T.x - 12;
      const order = [1, 0, 2];                                            // 2º · 1º · 3º
      order.forEach((idx, k) => {
        const t = teams[idx]; if (!t) return;
        const isC = idx === 0 && champ, mine = isMine(t);
        const x = x0 + k * (cw + gap), y = py0 + (isC ? 0 : 26), h = PH - (isC ? 0 : 26), r = 22;
        ctx.save();
        if (isC || mine){ ctx.shadowColor = "rgba(211,181,42,.35)"; ctx.shadowBlur = 40; }
        const cg = ctx.createLinearGradient(0, y, 0, y + h);
        if (mine){ cg.addColorStop(0, "#E2C43C"); cg.addColorStop(1, "#CBAA24"); }
        else if (isC){ cg.addColorStop(0, "rgba(211,181,42,.34)"); cg.addColorStop(1, "rgba(211,181,42,.08)"); }
        else { cg.addColorStop(0, "rgba(255,255,255,.11)"); cg.addColorStop(1, "rgba(255,255,255,.035)"); }
        ctx.fillStyle = cg; rr(x, y, cw, h, r); ctx.fill(); ctx.restore();
        const eg = ctx.createLinearGradient(x, y, x + cw, y + h);
        eg.addColorStop(0, isC ? "rgba(245,215,98,.9)" : "rgba(255,255,255,.4)"); eg.addColorStop(1, isC ? "rgba(211,181,42,.2)" : "rgba(255,255,255,.08)");
        ctx.strokeStyle = eg; ctx.lineWidth = 1.3; rr(x + .65, y + .65, cw - 1.3, h - 1.3, r); ctx.stroke();
        const cx = x + cw / 2, ink = mine ? BLACK : WHITE;
        // insignia con el puesto
        badge(ctx, isC ? "champ" : "up", cx, y + 40, 40);
        const bf = f(800, 20); ctx.font = bf; const bm = ctx.measureText("0");
        text(String(idx + 1), cx, y + 40 + bm.actualBoundingBoxAscent / 2, bf, isC ? BLACK : WHITE, "center");
        // nombre (hasta dos líneas)
        const nw = 800, maxW = cw - 36;
        let lines = [t.name], npx = fit(t.name, maxW, nw, 22, 13, .3);
        if (npx < 19 && t.name.includes(" ")){
          const ws = t.name.split(" "); let best = null;
          for (let s = 1; s < ws.length; s++){
            const a = ws.slice(0, s).join(" "), b = ws.slice(s).join(" ");
            const px = Math.min(fit(a, maxW, nw, 20, 13, .3), fit(b, maxW, nw, 20, 13, .3));
            if (!best || px > best.px) best = { lines: [a, b], px };
          }
          if (best && best.px > npx){ lines = best.lines; npx = best.px; }
        }
        // el nombre, centrado entre la insignia y los puntos
        const nf = f(nw, npx); ctx.font = nf; const cap = ctx.measureText("H").actualBoundingBoxAscent;
        const blockH = lines.length * cap + (lines.length - 1) * 10, areaTop = y + 70, areaBot = y + h - 72;
        const ny = (areaTop + areaBot) / 2 - blockH / 2 + cap;
        lines.forEach((ln, j) => text(ln, cx, ny + j * (cap + 10), nf, ink, "center", .3));
        // puntos
        if (t.n.length >= 7){
          const pt = f(400, 46, ANTON), s = String(t.n[6]);
          ctx.font = pt; const pw = ctx.measureText(s).width, lw = width("PTS", f(800, 13), 2), tot = pw + 8 + lw;
          text(s, cx - tot / 2, y + h - 22, pt, mine ? BLACK : isC ? GOLD : WHITE, "left");
          text("PTS", cx - tot / 2 + pw + 8, y + h - 24, f(800, 13), mine ? "rgba(10,10,10,.7)" : "rgba(255,255,255,.55)", "left", 2);
        }
      });
      // leyenda bajo el podio
      if (upLabel) text("▲  " + upLabel, T.x + T.w / 2, py0 + PH + 26, f(800, 12), "rgba(211,181,42,.85)", "center", 3);
    }

    // estilo «tarjeta»: una sola tarjeta de cristal para todas las plazas
    if (up && style === "tarjeta"){
      const zx = T.x - 12, zw = T.w + 24, zy = rowsTop + 2, zh = up * RH - 4, zr = 18;
      ctx.save(); rr(zx, zy, zw, zh, zr); ctx.clip();
      const cg = ctx.createLinearGradient(0, zy, 0, zy + zh);
      cg.addColorStop(0, "rgba(255,255,255,.085)"); cg.addColorStop(1, "rgba(255,255,255,.035)");
      ctx.fillStyle = cg; ctx.fillRect(zx, zy, zw, zh);
      if (champ){
        const vg = ctx.createRadialGradient(POS_X, zy + RH / 2, 0, POS_X, zy + RH / 2, zw * .75);
        vg.addColorStop(0, "rgba(211,181,42,.34)"); vg.addColorStop(.45, "rgba(211,181,42,.1)"); vg.addColorStop(1, "rgba(211,181,42,0)");
        ctx.fillStyle = vg; ctx.fillRect(zx, zy, zw, RH);
      }
      for (let k = 1; k < up; k++){ ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(zx + 24, zy + k * RH - 2, zw - 48, 1); }
      ctx.restore();
      const ze = ctx.createLinearGradient(zx, zy, zx + zw, zy + zh);
      ze.addColorStop(0, champ ? "rgba(235,207,78,.75)" : "rgba(255,255,255,.4)"); ze.addColorStop(.35, "rgba(255,255,255,.16)"); ze.addColorStop(1, "rgba(255,255,255,.1)");
      ctx.strokeStyle = ze; ctx.lineWidth = 1.3; rr(zx + .65, zy + .65, zw - 1.3, zh - 1.3, zr); ctx.stroke();
    }

    // estilo «bloque»: las plazas forman una pastilla continua; el campeón, en oro translúcido
    if (up && style === "bloque"){
      const zx = T.x - 12, zw = T.w + 24, zy = rowsTop + 2, zh = up * RH - 4, zr = 20;
      ctx.save(); rr(zx, zy, zw, zh, zr); ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(zx, zy, zw, zh);
      if (champ){
        const cg = ctx.createLinearGradient(zx, 0, zx + zw, 0);
        cg.addColorStop(0, "rgba(226,196,60,.5)"); cg.addColorStop(1, "rgba(226,196,60,.18)");
        ctx.fillStyle = cg; ctx.fillRect(zx, zy, zw, RH - 2);
      }
      for (let k = champ ? 2 : 1; k < up; k++){ ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(zx + 24, zy + k * RH - 2, zw - 48, 1); }
      ctx.restore();
    }

    teams.forEach((t, i) => {
      if (!t || i < first) return;
      const top = rowTop(i), cy = top + RH / 2, mine = isMine(t), z = podio ? null : zone(i);
      if (z && !mine && style === "barra"){
        const tint = z === "champ" ? "211,181,42" : "222,220,210";
        const bg = ctx.createLinearGradient(T.x - 12, 0, T.x + T.w * .6, 0);
        bg.addColorStop(0, `rgba(${tint},${z === "champ" ? .16 : .08})`); bg.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = bg; rr(T.x - 12, top + 4, T.w + 24, RH - 8, 14); ctx.fill();
        ctx.fillStyle = zc(z); rr(T.x - 12, top + 12, 5, RH - 24, 2.5); ctx.fill();
      }
      const mid = (font, s) => { ctx.font = font; const mt = ctx.measureText(s); return cy + (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2; };

      if (mine){
        ctx.save(); ctx.shadowColor = "rgba(211,181,42,.45)"; ctx.shadowBlur = 34;
        const gg = ctx.createLinearGradient(0, top, 0, top + RH);
        gg.addColorStop(0, "#E2C43C"); gg.addColorStop(1, "#CBAA24");
        ctx.fillStyle = gg; rr(T.x - 12, top + 3, T.w + 24, RH - 6, 16); ctx.fill();
        ctx.restore();
      } else if (i < TEAMS - 1 && !isMine(teams[i + 1])){
        const boxed = style === "tarjeta" || style === "bloque";
        const lineHere = boxed ? i + 1 >= up : style === "barra" ? !z && !zone(i + 1) : !(cut && i === up - 1);
        if (lineHere){ ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(T.x, top + RH - .5, T.w, 1); }
      }

      // puesto
      const ps = String(i + 1);
      if (z && !mine && style === "tarjeta"){
        badge(ctx, z, POS_X, cy, 40);
        const bf = f(800, 20); text(ps, POS_X, mid(bf, ps), bf, z === "champ" ? BLACK : WHITE, "center");
      } else if (z && !mine && style === "medallas"){
        medal(ctx, i, POS_X, cy, 40);
        const bf = f(800, 19); text(ps, POS_X, mid(bf, ps), bf, "rgba(20,16,6,.9)", "center");
      } else if (z && !mine && style === "numeros"){
        const pf = f(400, 50, ANTON);
        if (z === "champ") text(ps, POS_X, mid(pf, ps), pf, GOLD, "center");
        else { ctx.save(); ctx.font = pf; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.strokeText(ps, POS_X, mid(pf, ps)); ctx.restore(); }
      } else if (z && !mine){
        const pf = f(800, 26); text(ps, POS_X, mid(pf, ps), pf, style === "bloque" && z === "champ" ? WHITE : zc(z), "center");
      } else {
        const pf = f(700, 24); text(ps, POS_X, mid(pf, ps), pf, mine ? BLACK : dim, "center");
      }
      const nw = mine || z === "champ" ? 800 : z ? 700 : 600;
      const nf = f(nw, fit(t.name, NAME_W, nw, 25, 14, .3));
      text(t.name, NAME_X, mid(nf, "H"), nf, mine ? BLACK : z === "champ" ? WHITE : "rgba(255,255,255,.92)", "left", .3);
      // etiqueta del campeón junto al nombre (estilos con línea de corte)
      if (cut && z === "champ" && !mine && champLabel){
        const tf = f(800, 12), tw = width(champLabel, tf, 2.5) + 20, tx = NAME_X + width(t.name, nf, .3) + 16;
        if (tx + tw < COLS[0][1] - 30){
          ctx.fillStyle = "rgba(211,181,42,.14)"; rr(tx, cy - 12, tw, 24, 12); ctx.fill();
          ctx.strokeStyle = "rgba(211,181,42,.8)"; ctx.lineWidth = 1.2; rr(tx, cy - 12, tw, 24, 12); ctx.stroke();
          text(champLabel, tx + 10, mid(tf, "H"), tf, GOLD, "left", 2.5);
        }
      }
      const numF = f(500, 23);
      t.n.slice(0, 6).forEach((n, k) => text(String(n), COLS[k][1], mid(numF, "0"), numF, mine ? "rgba(10,10,10,.78)" : z ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.55)", "center"));
      if (t.n.length >= 7){
        const pt = f(400, 36, ANTON), s = String(t.n[6]);
        text(s, PTS_X, mid(pt, s), pt, mine ? BLACK : z === "champ" && style !== "bloque" ? GOLD : WHITE, "center");
      }
    });

    // línea de corte del ascenso: discontinua dorada con la etiqueta en el centro
    if (cut && up && up < TEAMS && upLabel){
      const ly = rowTop(up), lf = f(800, 13), lw = width(upLabel, lf, 3) + 34, lx = (T.x + T.x + T.w) / 2;
      ctx.save(); ctx.strokeStyle = "rgba(211,181,42,.7)"; ctx.lineWidth = 1.3; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(T.x - 12, ly); ctx.lineTo(lx - lw / 2 - 10, ly); ctx.moveTo(lx + lw / 2 + 10, ly); ctx.lineTo(T.x + T.w + 12, ly); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "rgba(20,18,10,.9)"; rr(lx - lw / 2, ly - 13, lw, 26, 13); ctx.fill();
      ctx.strokeStyle = "rgba(211,181,42,.7)"; ctx.lineWidth = 1.2; rr(lx - lw / 2, ly - 13, lw, 26, 13); ctx.stroke();
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(lx - lw / 2 + 12, ly + 3); ctx.lineTo(lx - lw / 2 + 17, ly - 3); ctx.lineTo(lx - lw / 2 + 22, ly + 3); ctx.closePath(); ctx.fill();
      text(upLabel, lx - lw / 2 + 28, mid2(ly, lf), lf, GOLD, "left", 3);
    }

    // leyenda al pie del panel
    if (leg.length){
      const ly = PANEL.y + PANEL.h - 30, lf = f(700, 14);
      let lx = T.x + 6;
      for (const [kind, label] of leg){
        if (style === "tarjeta") badge(ctx, kind, lx, ly, 16);
        else {
          ctx.fillStyle = style === "bloque" ? (kind === "champ" ? "rgba(226,196,60,.8)" : "rgba(255,255,255,.35)") : zc(kind);
          if (style === "barra") rr(lx - 2.5, ly - 9, 5, 18, 2.5); else { ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); }
          ctx.fill();
        }
        text(label, lx + 18, ly + 5, lf, "rgba(255,255,255,.62)", "left", 3);
        lx += 18 + width(label, lf, 3) + 40;
      }
    }

    /* ---------- pie: solo la firma dorada ---------- */
    if (v.showFirma && I.firma){
      const h = 40, w = I.firma.width * h / I.firma.height;
      ctx.drawImage(I.firma, (W - w) / 2, 1287 - h / 2, w, h);
    }

    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .06; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
  }
};
