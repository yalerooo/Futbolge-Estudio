/**
 * DISEÑO · MATCH DAY (pantalla de selección de equipos estilo EA FC)
 * Opcional: «Modo TV», la pantalla dentro de la tele de un salón real.
 */
import { use, f, text, fit, wrap, contain, rr, capOf, GOLD, WHITE, slug } from "../core/draw.js";
import { drawToned, blurred, blurCopy } from "../core/fx.js";
import { grain, hiDPI } from "../core/canvas.js";

const STAR = "#CDB56E", STAR_OFF = "rgba(200,200,190,.38)";
const fitFont = (t, maxW, w, px, min, fam) => fit(t, maxW, w, px, min, 0, fam);

let ctx, mainCtx, v, I, q = 1;
let W = 1080, H = 1350;
const setCtx = x => { ctx = x; use(x); };

/* ---------------- fondo "estudio" en negro y oro ---------------- */
const bg = document.createElement("canvas"); let b, bgBlur;

function drawBackground(){
  if (bg.width !== Math.round(W * q) || bg.height !== Math.round(H * q)){ bg.width = Math.round(W * q); bg.height = Math.round(H * q); }
  b = hiDPI(bg.getContext("2d"), q);
  let g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b0b0b"); g.addColorStop(.45, "#15120a"); g.addColorStop(.78, "#0e0c07"); g.addColorStop(1, "#070707");
  b.fillStyle = g; b.fillRect(0, 0, W, H);

  if (v.usePhoto && I.bgPhoto){
    const p = I.bgPhoto, s = Math.max(W / p.width, H / p.height), w = p.width * s, h = p.height * s;
    b.save(); b.globalAlpha = v.photoAlpha / 100; drawToned(b, p, "grayscale(1) brightness(.55) contrast(1.1) blur(2px)", (W - w) / 2, (H - h) / 2, w, h); b.restore();
    b.save(); b.globalCompositeOperation = "soft-light"; b.globalAlpha = .6; b.fillStyle = GOLD; b.fillRect(0, 0, W, H); b.restore();
  }

  b.save(); b.scale(W / 1080, H / 1350);
  const DW = 1080, DH = 1350;
  b.save(); b.globalCompositeOperation = "screen";
  blurred(b, 26, () => {
    [[-80, 260, 380, -40, 300, .10], [120, 520, 700, -60, 180, .07], [1160, 260, 700, -40, 300, .10], [960, 520, 380, -60, 180, .07], [300, 1100, 540, 200, 360, .06]]
      .forEach(([x1, y1, x2, y2, wd, a]) => {
        b.beginPath(); b.moveTo(x1, y1); b.lineTo(x2, y2); b.lineTo(x2 + wd * .25, y2); b.lineTo(x1 + wd, y1 + wd * .2); b.closePath();
        b.fillStyle = `rgba(211,181,42,${a})`; b.fill();
      });
  });
  b.restore();
  g = b.createRadialGradient(540, 640, 0, 540, 640, 620);
  g.addColorStop(0, "rgba(211,181,42,.30)"); g.addColorStop(.55, "rgba(211,181,42,.08)"); g.addColorStop(1, "rgba(211,181,42,0)");
  b.fillStyle = g; b.fillRect(0, 0, DW, DH);
  const wall = side => {
    const sx = x => side < 0 ? x : DW - x;
    b.beginPath(); b.moveTo(sx(0), 170); b.lineTo(sx(118), 70); b.lineTo(sx(118), 1060); b.lineTo(sx(0), 1150); b.closePath();
    b.fillStyle = "rgba(0,0,0,.45)"; b.fill();
    b.save(); b.strokeStyle = "rgba(233,207,78,.9)"; b.lineWidth = 3; b.shadowColor = GOLD; b.shadowBlur = 22;
    b.beginPath(); b.moveTo(sx(0), 170); b.lineTo(sx(118), 70); b.stroke();
    b.beginPath(); b.moveTo(sx(118), 1060); b.lineTo(sx(0), 1150); b.stroke();
    b.lineWidth = 2; b.globalAlpha = .55; b.beginPath(); b.moveTo(sx(0), 430); b.lineTo(sx(70), 560); b.lineTo(sx(0), 690); b.stroke();
    b.restore();
  };
  wall(-1); wall(1);
  g = b.createLinearGradient(0, 1060, 0, DH); g.addColorStop(0, "rgba(211,181,42,.16)"); g.addColorStop(.12, "rgba(0,0,0,.25)"); g.addColorStop(1, "rgba(0,0,0,.75)");
  b.fillStyle = g; b.fillRect(0, 1060, DW, DH - 1060);
  b.save(); b.strokeStyle = "rgba(233,207,78,.55)"; b.lineWidth = 2; b.shadowColor = GOLD; b.shadowBlur = 16;
  b.beginPath(); b.moveTo(118, 1060); b.lineTo(DW - 118, 1060); b.stroke();
  b.globalAlpha = .35; b.beginPath(); b.moveTo(118, 1060); b.lineTo(540, 1350); b.lineTo(DW - 118, 1060); b.stroke();
  b.restore();
  b.restore();

  // "LOCAL" / "VISITANTE" gigantes en vertical
  const k = (H / 1350) * (W > H ? 1.55 : 1);
  const big = (t, x, rot) => { b.save(); b.translate(x, 650 * H / 1350); b.rotate(rot); b.font = f(900, 96 * k); b.textAlign = "center";
    b.textBaseline = "middle"; if ("letterSpacing" in b) b.letterSpacing = "2px"; b.fillStyle = "rgba(205,205,205,.62)"; b.fillText(t, 0, 0); b.restore(); };
  big("LOCAL", 52 * W / 1080, -Math.PI / 2); big("VISITANTE", W - 52 * W / 1080, Math.PI / 2);
  b.save(); b.globalCompositeOperation = "overlay"; b.globalAlpha = .07; b.drawImage(grain(), 0, 0, W, H); b.restore();

  bgBlur = blurCopy(bg, 18 * q);   // una sola copia desenfocada para todos los paneles de cristal
}

/* ---------------- piezas estilo EA FC ---------------- */
function glass(x, y, w, h, opt = {}){
  const r = opt.r ?? 6;
  ctx.save(); rr(x, y, w, h, r); ctx.clip();
  ctx.drawImage(bgBlur, 0, 0, W, H);
  if (opt.sel){
    ctx.fillStyle = "rgba(255,248,225,.13)"; ctx.fillRect(x, y, w, h);
    let g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(.35, "rgba(255,255,255,.05)"); g.addColorStop(1, "rgba(255,255,255,.09)");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    g = ctx.createLinearGradient(0, y, 0, y + 22); g.addColorStop(0, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, 22);
    [[x, 1], [x + w, -1]].forEach(([ex, d]) => { const gs = ctx.createLinearGradient(ex, 0, ex + d * 16, 0);
      gs.addColorStop(0, "rgba(255,255,255,.18)"); gs.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gs; ctx.fillRect(Math.min(ex, ex + d * 16), y, 16, h); });
  } else {
    ctx.fillStyle = opt.fill || "rgba(30,28,22,.66)"; ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(255,255,255,.06)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  ctx.save(); rr(x + .75, y + .75, w - 1.5, h - 1.5, r);
  if (opt.sel){
    ctx.shadowColor = "rgba(255,255,255,.45)"; ctx.shadowBlur = 16; ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.stroke();
    ctx.shadowBlur = 10; ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.beginPath(); ctx.moveTo(x + r, y + 1); ctx.lineTo(x + w - r, y + 1); ctx.stroke();
  } else { ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.stroke(); }
  ctx.restore();
}
function star(cx, cy, r, fill){
  ctx.beginPath();
  for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .47 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function stars(cx, cy, val){
  const r = 12.5 * SS, gap = 29 * SS, x0 = cx - gap * 2;
  for (let i = 0; i < 5; i++){
    const x = x0 + i * gap; star(x, cy, r, STAR_OFF);
    const part = Math.max(0, Math.min(1, val - i));
    if (part > 0){ ctx.save(); ctx.beginPath(); ctx.rect(x - r, cy - r, 2 * r * part, 2 * r); ctx.clip(); star(x, cy, r, STAR); ctx.restore(); }
  }
}
function arrow(x, y, dir, s = 12){ ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(x + dir * s, y); ctx.lineTo(x - dir * s * .8, y - s); ctx.lineTo(x - dir * s * .8, y + s); ctx.closePath(); ctx.fill(); }
function chip(x, y, w, h, label, on){
  glass(x, y, w, h);
  const s = SS, cx = x + 26 * s, cy = y + h / 2;
  ctx.beginPath(); ctx.arc(cx, cy, 11 * s, 0, 7);
  if (on){ ctx.fillStyle = GOLD; ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 2.6 * s; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(cx - 5 * s, cy); ctx.lineTo(cx - 1.5 * s, cy + 4 * s); ctx.lineTo(cx + 5.5 * s, cy - 4 * s); ctx.stroke(); }
  else { ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill(); }
  const px = Math.min(fitFont("Eq. masculinos", w - 56 * s, 500, 17 * s, 11), fitFont("Eq. femeniles", w - 56 * s, 500, 17 * s, 11));
  text(label, x + 46 * s, cy + 6 * s, f(500, px), on ? WHITE : "rgba(255,255,255,.85)", "left");
}
function psButton(x, y, kind, s = 1){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fillStyle = "#9A9F99"; ctx.fill();
  ctx.strokeStyle = "#23271F"; ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (kind === "x"){ ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); ctx.stroke(); }
  if (kind === "o"){ ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.stroke(); }
  if (kind === "s"){ rr(-6, -6, 12, 12, 1.5); ctx.stroke(); }
  ctx.restore();
}

const team = s => ({ nm: v["nm" + s], pais: v["pais" + s], stars: parseFloat(v["stars" + s]) || 0, del: v["del" + s], med: v["med" + s], def: v["def" + s],
                     box: v["box" + s], boxtxt: v["boxtxt" + s], crest: I["crest" + s], flag: I["flag" + s] });

/* ---------------- composición (vertical o pantalla 16:9) ---------------- */
let COL, CW, CX0, CXW, Y, SS = 1, KY = 1, KB = 1;
function layoutPortrait(){
  W = 1080; H = 1350; SS = 1; KY = 1; KB = 1;
  COL = { L: 104, R: 646 }; CW = 330; CX0 = 434; CXW = 212;
  Y = { chips: 246, chipH: 46, country: 302, countryH: 80, card: 392, cardH: 510, box: 914, boxH: 126, hints: 1112 };
}
function layoutScreen(){
  W = 1920; H = 1080; SS = 1.42;
  COL = { L: 250, R: 1150 }; CW = 520; CX0 = 770; CXW = 380;
  Y = { chips: 66, chipH: 60, country: 140, countryH: 108, card: 262, cardH: 572, box: 848, boxH: 150, hints: 1042 };
  KY = Y.cardH / 510; KB = Y.boxH / 126;
}

function drawTitle(ty, maxPx, maxW, cxT = W / 2){
  const t1 = String(v.t1).toUpperCase(), t2 = String(v.t2).toUpperCase();
  let px = maxPx; ctx.font = f(400, px, "Anton");
  const gap = px * .2; let w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width;
  while (w1 + w2 + gap > maxW && px > 40){ px -= 2; ctx.font = f(400, px, "Anton"); w1 = ctx.measureText(t1).width; w2 = ctx.measureText(t2).width; }
  const tx = cxT - (w1 + gap + w2) / 2;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 30;
  text(t1, tx, ty, f(400, px, "Anton"), WHITE, "left"); text(t2, tx + w1 + gap, ty, f(400, px, "Anton"), GOLD, "left");
  ctx.restore();
}

function drawScene(){
  const selMode = v.selMode, s = SS, hx = CW / 330;
  ["L", "R"].forEach(side => {
    const T = team(side), x = COL[side], cx = x + CW / 2;
    if (v.chips){ const cw = (CW - 10 * s) / 2; chip(x, Y.chips, cw, Y.chipH, "Eq. masculinos", true); chip(x + cw + 10 * s, Y.chips, cw, Y.chipH, "Eq. femeniles", false); }

    const selC = selMode === "paisR" && side === "R";
    glass(x, Y.country, CW, Y.countryH, { sel: selC });
    const fw = 72 * s, fh = 48 * s, cpx = fitFont(T.pais, CW - fw - (selC ? 110 : 60) * s, 700, 27 * s, 14);
    ctx.font = f(700, cpx); const tw = ctx.measureText(T.pais).width, gx = cx - (tw + 28 * s + fw) / 2, my = Y.country + Y.countryH / 2;
    text(T.pais, gx, my + cpx * .36, f(700, cpx), WHITE, "left");
    const fx = gx + tw + 28 * s, flag = T.flag || I.flagES;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8;
    if (flag){ const sc = Math.min(fw / flag.width, fh / flag.height), w = flag.width * sc, h = flag.height * sc; ctx.drawImage(flag, fx + (fw - w) / 2, my - h / 2, w, h); }
    ctx.restore();
    if (selC){ arrow(x + 28 * hx, my, -1, 10 * s); arrow(x + CW - 28 * hx, my, 1, 10 * s); }

    const selT = (selMode === "cardL" && side === "L") || (selMode === "cardR" && side === "R");
    glass(x, Y.card, CW, Y.cardH, { sel: selT });
    const npx = fitFont(T.nm, CW - 40 * s, 800, 33 * s, 18);
    text(T.nm, cx, Y.card + 58 * KY, f(800, npx), WHITE, "center");
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
    contain(T.crest, cx, Y.card + 222 * KY, 236 * KY, 236 * KY); ctx.restore();
    if (selT){ arrow(x + 32 * hx, Y.card + 222 * KY, -1, 10 * s); arrow(x + CW - 32 * hx, Y.card + 222 * KY, 1, 10 * s); }
    stars(cx, Y.card + 384 * KY, T.stars);
    const bandY = Y.card + 410 * KY;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + (selT ? 1.5 : 0), bandY, CW - (selT ? 3 : 0), Y.card + Y.cardH - bandY - (selT ? 1.5 : 0), [0, 0, 6, 6]);
    ctx.fillStyle = selT ? "rgba(0,0,0,.16)" : "rgba(0,0,0,.22)"; ctx.fill(); ctx.restore();
    [["DEL", T.del], ["MED", T.med], ["DEF", T.def]].forEach(([k, val], i) => {
      const sx = cx + (i - 1) * 90 * hx;
      text(k, sx, Y.card + 441 * KY, f(600, 17 * s), "rgba(255,255,255,.9)", "center", .5);
      text(String(val), sx, Y.card + 489 * KY, f(400, 36 * s), WHITE, "center", 1);
    });

    glass(x, Y.box, CW, Y.boxH);
    const by = Y.box + Y.boxH / 2;
    if (T.box === "listo") text("LISTO", cx, by + 11 * s, f(800, 31 * s), WHITE, "center", 1.5);
    else if (T.box === "texto"){ const bpx = fitFont(T.boxtxt || " ", CW - 40 * s, 800, 28 * s, 14); text(T.boxtxt, cx, by + bpx * .36, f(800, bpx), WHITE, "center", 1); }
    else {
      const lbl = v.compLabel;
      if (lbl){ const lpx = fitFont(lbl, CW - 40 * s, 700, 16 * s, 10); text(lbl, cx, Y.box + 32 * KB, f(700, lpx), "rgba(255,255,255,.88)", "center", .5); }
      contain(I.compLogo, cx, Y.box + (lbl ? 80 : 63) * KB, 180 * s, (lbl ? 62 : 86) * KB);
    }
  });

  // columna central: datos flotando, solo recuadros pequeños de cristal
  const cx = CX0 + CXW / 2, soft = a => `rgba(255,255,255,${a})`;
  const compParts = String(v.comp).split(/\s*[·|]\s*/).filter(Boolean);
  if (compParts.length){
    const c1 = compParts[0].toUpperCase();
    let c2 = compParts.slice(1).join(" · ").toUpperCase();
    const jm = c2.match(/^J(?:ORNADA)?\s*-?\s*(\d+)$/); if (jm) c2 = "JORNADA " + jm[1].padStart(2, "0");
    const p1 = fitFont(c1, 170 * s, 800, 17 * s, 10), p2 = c2 ? fitFont(c2, 170 * s, 500, 11 * s, 8) : 0;
    ctx.font = f(800, p1); let w = ctx.measureText(c1).width;
    if (c2){ ctx.font = f(500, p2); w = Math.max(w, ctx.measureText(c2).width + c2.length * 2 * s); }
    const pw = Math.min(CXW - 8, w + 48 * s), ph = (c2 ? 60 : 44) * s, py = Y.country + (Y.countryH - ph) / 2;
    glass(cx - pw / 2, py, pw, ph);
    text(c1, cx, py + (c2 ? 27 : 28) * s, f(800, p1), WHITE, "center", 1);
    if (c2) text(c2, cx, py + 46 * s, f(500, p2), soft(.65), "center", 2);
  }
  const fe = String(v.fecha).trim();
  if (fe){
    const m = fe.match(/^(.*?)(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\s*$/);
    const day = (m ? m[1] : "").trim().toUpperCase(), big = m ? `${m[2].padStart(2, "0")}.${m[3].padStart(2, "0")}` : fe.toUpperCase();
    if (day) text(day, cx, Y.card + 60 * KY, f(600, fitFont(day, CXW - 20, 600, 14 * s, 9)), soft(.7), "center", 3);
    const bp = fitFont(big, CXW - 20, 400, 66 * s, 24, "Anton");
    text(big, cx, Y.card + 72 * KY + capOf(bp), f(400, bp, "Anton"), WHITE, "center", 1);
  }
  const vy = Y.card + 222 * KY, vs = 36 * s;
  glass(cx - vs, vy - vs, vs * 2, vs * 2);
  text("VS", cx, vy + 8 * s, f(800, 22 * s), WHITE, "center", 2);
  const ho = String(v.hora).trim();
  if (ho){
    text("HORA", cx, Y.card + 326 * KY, f(600, 14 * s), soft(.7), "center", 3);
    const hp = fitFont(ho, CXW - 20, 400, 66 * s, 24, "Anton");
    text(ho, cx, Y.card + 338 * KY + capOf(hp), f(400, hp, "Anton"), GOLD, "center", 1);
  }
  const lu = String(v.lugar).trim();
  if (lu){
    const parts = lu.toUpperCase().split(/\s*·\s*/).filter(Boolean).slice(0, 2);
    const bw = CXW - 8, inner = bw - 28 * s, name = parts[0], city = parts[1] || "";
    const NP = 18 * s, CP = 13 * s;
    let lines = wrap(name, inner - 6 * s, f(700, NP));
    if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
    const lp = Math.min(...lines.map(l => fitFont(l, inner - l.length * s, 700, NP, 10)));
    const cp = city ? fitFont(city, inner - city.length * 1.5 * s, 500, CP, 9) : 0;
    const lh = lp * 1.22, contentH = lines.length * lh + (city ? cp * 1.6 : 0);
    const ph = Math.min(Y.boxH, contentH + 26 * s), py = Y.box + (Y.boxH - ph) / 2, px = cx - bw / 2;
    glass(px, py, bw, ph);
    let yy = py + (ph - contentH) / 2;
    lines.forEach(l => { text(l, cx, yy + lp * .82, f(700, lp), WHITE, "center", 1); yy += lh; });
    if (city) text(city, cx, yy + cp * 1.15, f(500, cp), soft(.65), "center", 1.5);
  }

  if (v.hints){
    const hitems = [["x", "Seleccionar"], ["o", "Atrás"], ["s", "Al azar"]];
    ctx.font = f(500, 23 * s); const widths = hitems.map(([, t]) => (17 * 2 + 12) * s + ctx.measureText(t).width);
    let hxp = (W - (widths.reduce((a, c) => a + c, 0) + 44 * s * 2)) / 2;
    hitems.forEach(([k, t], i) => { psButton(hxp + 17 * s, Y.hints, k, s); text(t, hxp + (17 * 2 + 12) * s, Y.hints + 8 * s, f(500, 23 * s), "#F2F2F2", "left"); hxp += widths[i] + 44 * s; });
  }
}

/* ---------------- modo TV: pantalla dentro de la tele de una foto real (enderezada) ---------------- */
const screenCv = document.createElement("canvas");
const BLEED = 3, TVR = { x: 118.5 - BLEED, y: 316.7 - BLEED, w: 843.7 + BLEED * 2, h: 474.6 + BLEED * 2 };

function drawRoom(){
  if (I.room) drawToned(ctx, I.room, "sepia(.12) saturate(.6) brightness(.74) contrast(1.06)", 0, 0, W, H);
  else { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = .16; ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, H); ctx.restore();
  const cx = TVR.x + TVR.w / 2, cy = TVR.y + TVR.h / 2;
  ctx.save(); ctx.globalCompositeOperation = "screen";
  let g = ctx.createRadialGradient(cx, cy, 260, cx, cy, 760);
  g.addColorStop(0, "rgba(211,181,42,.20)"); g.addColorStop(.5, "rgba(170,130,40,.07)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();

  ctx.save(); ctx.imageSmoothingQuality = "high"; ctx.drawImage(screenCv, TVR.x, TVR.y, TVR.w, TVR.h); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(TVR.x, TVR.y, TVR.w, TVR.h); ctx.clip();
  g = ctx.createLinearGradient(TVR.x, TVR.y, TVR.x + 480, TVR.y + 460);
  g.addColorStop(0, "rgba(255,255,255,.08)"); g.addColorStop(.5, "rgba(255,255,255,.025)"); g.addColorStop(.51, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(cx, cy, 250, cx, cy, 560); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, "rgba(8,7,5,.92)"); g.addColorStop(.7, "rgba(8,7,5,.55)"); g.addColorStop(1, "rgba(8,7,5,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 300);
  g = ctx.createLinearGradient(0, 1130, 0, H); g.addColorStop(0, "rgba(8,7,5,0)"); g.addColorStop(1, "rgba(8,7,5,.9)");
  ctx.fillStyle = g; ctx.fillRect(0, 1130, W, H - 1130);
  g = ctx.createRadialGradient(W / 2, H * .5, H * .38, W / 2, H * .5, H * .85); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  drawTitle(220, 160, 900);
  if (I.firma){ const h = 80, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - w) / 2, 1240, w, h); }
  ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .05; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();
}

const teamFields = (s, def) => [
  { type: "text", id: "nm" + s, label: "Nombre", value: def.nm },
  { type: "image", id: "crest" + s, label: "Escudo (a color)", src: def.crest },
  { type: "row", fields: [
    { type: "text", id: "pais" + s, label: "País", value: "España" },
    { type: "number", id: "stars" + s, label: "Estrellas", value: def.stars, min: 0, max: 5, step: .5, narrow: true }
  ]},
  { type: "image", id: "flag" + s, label: "Bandera (por defecto, España)" },
  { type: "row", fields: [
    { type: "number", id: "del" + s, label: "DEL", value: def.del, min: 0, max: 99 },
    { type: "number", id: "med" + s, label: "MED", value: def.med, min: 0, max: 99 },
    { type: "number", id: "def" + s, label: "DEF", value: def.def, min: 0, max: 99 }
  ]},
  { type: "select", id: "box" + s, label: "Recuadro inferior", value: def.box,
    options: [{ value: "listo", label: "LISTO" }, { value: "logo", label: "Logo de la competición" }, { value: "texto", label: "Texto propio" }] },
  { type: "text", id: "boxtxt" + s, label: "Texto propio", value: "¡A por ellos!", visibleIf: v => v["box" + s] === "texto" }
];

export default {
  id: "match-day",
  name: "Match Day",
  variant: "EA FC",
  category: "Día de partido",
  description: "Pantalla de selección de equipos al estilo EA FC. Con modo TV opcional.",
  thumb: "assets/thumbs/match-day.jpg",
  size: { w: 1080, h: 1350 },
  filename: v => `match_day_${slug(v.nmL)}_vs_${slug(v.nmR)}${v.tv ? "_tv" : ""}.png`,

  assets: { flagES: "assets/img/bandera_espana.png", firma: "assets/img/firma_futbolge.png", room: "assets/img/sala_tv.jpg" },

  fields: [
    { type: "section", title: "Partido", fields: [
      { type: "row", fields: [
        { type: "text", id: "t1", label: "Palabra blanca", value: "MATCH" },
        { type: "text", id: "t2", label: "Palabra dorada", value: "DAY" }
      ]},
      { type: "text", id: "comp", label: "Competición · jornada", value: "Amistoso", hint: "Ej.: «Liga FVFS · J-02»" },
      { type: "row", fields: [
        { type: "text", id: "fecha", label: "Día", value: "Domingo 04/10/2026" },
        { type: "text", id: "hora", label: "Hora", value: "18:00", narrow: true }
      ]},
      { type: "text", id: "lugar", label: "Lugar", value: "Centro Cívico Hegoalde · Vitoria-Gasteiz" }
    ]},
    { type: "section", title: "Local", fields: teamFields("L", { nm: "Futbolge", crest: "assets/img/escudo_futbolge_color.png", stars: 4.5, del: 82, med: 80, def: 81, box: "listo" }) },
    { type: "section", title: "Visitante", fields: teamFields("R", { nm: "Jaimitos FC", crest: "assets/img/escudo_jaimitos.png", stars: 4, del: 77, med: 76, def: 78, box: "logo" }) },
    { type: "section", title: "Pantalla", fields: [
      { type: "checkbox", id: "tv", label: "Modo TV (en la tele de un salón real)", value: false },
      { type: "select", id: "selMode", label: "Selección (borde blanco y flechas)", value: "cardR",
        options: [{ value: "cardR", label: "Club del visitante" }, { value: "paisR", label: "País del visitante" }, { value: "cardL", label: "Club del local" }, { value: "none", label: "Ninguna" }] },
      { type: "checkbox", id: "chips", label: "Mostrar «Eq. masculinos / femeniles»", value: true },
      { type: "checkbox", id: "hints", label: "Mostrar botones (✕ Seleccionar…)", value: true }
    ]},
    { type: "section", title: "Competición y fondo", collapsed: true, fields: [
      { type: "text", id: "compLabel", label: "Texto encima del logo", value: "FEDERACIÓN VASCA DE FÚTBOL SALA" },
      { type: "image", id: "compLogo", label: "Logo de la competición", src: "assets/img/logo_fvfs.png" },
      { type: "checkbox", id: "usePhoto", label: "Foto de pabellón de fondo", value: false },
      { type: "image", id: "bgPhoto", label: "Foto de fondo", src: "assets/fotos/jugador_pabellon.webp", visibleIf: v => v.usePhoto },
      { type: "range", id: "photoAlpha", label: "Intensidad de la foto", value: 45, min: 10, max: 100, visibleIf: v => v.usePhoto }
    ]}
  ],

  render(target, m){
    mainCtx = target; v = m.values; I = m.images; q = target.__q || 1;
    if (v.tv){
      layoutScreen();
      screenCv.width = Math.round(1920 * q); screenCv.height = Math.round(1080 * q);
      setCtx(hiDPI(screenCv.getContext("2d"), q)); ctx.clearRect(0, 0, W, H);
      drawBackground(); ctx.drawImage(bg, 0, 0, W, H); drawScene();
      layoutPortrait(); setCtx(mainCtx);
      drawRoom();
    } else {
      layoutPortrait(); setCtx(mainCtx);
      drawBackground(); ctx.drawImage(bg, 0, 0, W, H);
      drawTitle(200, 168, 940);
      drawScene();
      if (I.firma){ const h = 84, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, (W - w) / 2, 1210, w, h); }
    }
  }
};
