/**
 * DISEÑO · FULL TIME (resultado final)
 * Marco dorado con trazos, foto B/N con toque dorado y columna de marcador.
 */
import { use, GOLD, WHITE, BLACK, slug } from "../core/draw.js";
import { drawToned } from "../core/fx.js";
import { grain } from "../core/canvas.js";

const W = 1080, H = 1350;
const PANEL = { x: 300, y: 70, w: 710, h: 1210 };

export default {
  id: "full-time",
  name: "Full Time",
  variant: "Marcador",
  category: "Resultado",
  description: "Resultado final con marco de garras doradas y foto del partido.",
  thumb: "assets/thumbs/full-time.jpg",
  size: { w: W, h: H },
  filename: v => `full_time_${slug(v.nL)}_${v.gL}-${v.gV}_${slug(v.nV)}.png`,

  assets: { firma: "assets/img/firma_futbolge.png" },
  state: { seed: 7 },

  fields: [
    { type: "section", title: "Diseño", fields: [
      { type: "segmented", id: "mode", value: "escudos", options: [{ value: "escudos", label: "Con escudos" }, { value: "nombres", label: "Solo nombres" }] },
      { type: "hint", text: "«Solo nombres» es para rivales sin escudo. El nombre que contenga FUTBOLGE sale en dorado." }
    ]},
    { type: "section", title: "Local", fields: [
      { type: "row", fields: [
        { type: "text", id: "nL", label: "Nombre", value: "FUTBOLGE" },
        { type: "number", id: "gL", label: "Goles", value: 5, min: 0, max: 99, narrow: true }
      ]},
      { type: "image", id: "cL", label: "Escudo (blanco y negro)", src: "assets/img/escudo_futbolge_bn_hd.png", visibleIf: v => v.mode === "escudos" }
    ]},
    { type: "section", title: "Visitante", fields: [
      { type: "row", fields: [
        { type: "text", id: "nV", label: "Nombre", value: "JAIMITOS FC" },
        { type: "number", id: "gV", label: "Goles", value: 3, min: 0, max: 99, narrow: true }
      ]},
      { type: "image", id: "cV", label: "Escudo (blanco y negro)", src: "assets/img/escudo_jaimitos_bn_hd.png", visibleIf: v => v.mode === "escudos" }
    ]},
    { type: "section", title: "Foto", fields: [
      { type: "photo", id: "photo", label: "Foto del partido", src: "assets/fotos/jugador_pabellon.webp",
        area: () => PANEL,
        defaultFrame: (img, a, cover) => {
          const zoom = 2050 / img.height / cover, s = cover * zoom;
          return { zoom, ox: 770 - .5 * img.width * s, oy: 650 - .52 * img.height * s };
        } }
    ]},
    { type: "section", title: "Competición y marco", collapsed: true, fields: [
      { type: "checkbox", id: "showComp", label: "Mostrar logo de la competición", value: true },
      { type: "image", id: "comp", label: "Logo de la competición", src: "assets/img/logo_fvfs.png", visibleIf: v => v.showComp },
      { type: "button", id: "reseed", label: "Cambiar trazos del marco", action: m => m.set("seed", 1 + Math.floor(Math.random() * 99999)) }
    ]}
  ],

  render(ctx, m){
    use(ctx);
    const v = m.values, I = m.images;
    const font = px => `${px}px Anton`;
    const capH = px => { ctx.font = font(px); return ctx.measureText("H").actualBoundingBoxAscent; };
    const contain = (img, cx, cy, mw, mh) => { if (!img) return; const s = Math.min(mw / img.width, mh / img.height), w = img.width * s, h = img.height * s; ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); };
    const number = (n, cx, cy, px, color) => {
      ctx.font = font(px); ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      const mt = ctx.measureText(String(n)); ctx.fillText(String(n), cx, cy + (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2);
    };
    const fitName = (t, maxW, maxPx, minPx) => {
      const words = t.trim().split(/\s+/), w1 = s => { ctx.font = font(100); return ctx.measureText(s).width / 100; };
      let best = { lines: [t], px: Math.min(maxPx, maxW / w1(t)) };
      for (let k = 1; k < words.length; k++){
        const a = words.slice(0, k).join(" "), b = words.slice(k).join(" "), px = Math.min(maxPx, maxW / Math.max(w1(a), w1(b)));
        if (px > best.px * 1.15) best = { lines: [a, b], px };
      }
      best.px = Math.max(minPx, Math.floor(best.px)); return best;
    };

    // fondo dorado con trazos negros (garras) que entran desde los bordes
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, H);
    let s = v.seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const p = new Path2D();
    const claw = (x, y, nx, ny) => {
      const len = 60 + rnd() * rnd() * 230, wid = 12 + rnd() * 26, bend = (rnd() - .5) * .7;
      const tx = -ny, ty = nx, dx = nx + tx * bend, dy = ny + ty * bend, L = Math.hypot(dx, dy);
      const ex = x + dx / L * len, ey = y + dy / L * len;
      const mx = x + nx * len * .5 + tx * bend * len * .35, my = y + ny * len * .5 + ty * bend * len * .35;
      p.moveTo(x - tx * wid / 2 - nx * 20, y - ty * wid / 2 - ny * 20);
      p.quadraticCurveTo(mx - tx * wid * .35, my - ty * wid * .35, ex, ey);
      p.quadraticCurveTo(mx + tx * wid * .35, my + ty * wid * .35, x + tx * wid / 2 - nx * 20, y + ty * wid / 2 - ny * 20);
      p.closePath();
    };
    for (let x = -10; x < W; x += 58 + rnd() * 60) claw(x, 0, 0, 1);
    for (let x = -10; x < W; x += 58 + rnd() * 60) claw(x, H, 0, -1);
    for (let y = -10; y < H; y += 58 + rnd() * 60) claw(0, y, 1, 0);
    for (let y = -10; y < H; y += 58 + rnd() * 60) claw(W, y, -1, 0);
    ctx.fillStyle = BLACK; ctx.fill(p);

    // panel de foto
    ctx.save(); ctx.beginPath(); ctx.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); ctx.clip();
    ctx.fillStyle = BLACK; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    const ph = m.photo("photo");
    if (ph){
      drawToned(ctx, ph.img, "grayscale(1) contrast(1.35) brightness(.78)", ph.x, ph.y, ph.w, ph.h);
      ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = .55; ctx.fillStyle = GOLD; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    }
    let g = ctx.createLinearGradient(0, PANEL.y, 0, PANEL.y + PANEL.h);
    g.addColorStop(0, "rgba(10,10,10,.35)"); g.addColorStop(.25, "rgba(10,10,10,0)"); g.addColorStop(.6, "rgba(10,10,10,0)"); g.addColorStop(1, "rgba(10,10,10,.85)");
    ctx.fillStyle = g; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    g = ctx.createLinearGradient(PANEL.x, 0, PANEL.x + PANEL.w, 0); g.addColorStop(0, "rgba(10,10,10,.55)"); g.addColorStop(.45, "rgba(10,10,10,0)");
    ctx.fillStyle = g; ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = .08; ctx.drawImage(grain(), 0, 0, W, H); ctx.restore();

    // logo de la competición
    if (v.showComp && I.comp){ ctx.fillStyle = BLACK; ctx.fillRect(W - 260, 70, 190, 190); contain(I.comp, W - 165, 165, 128, 140); }

    // columna de resultado
    const crests = v.mode === "escudos";
    const colW = crests ? 290 : 420, numW = crests ? 270 : 200, rowH = crests ? 290 : 260, titleH = 150;
    const X = 70, SW = colW + numW, SH = titleH + rowH * 2, Y = Math.round((H - SH) / 2);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 90; ctx.shadowOffsetY = 40; ctx.fillStyle = BLACK; ctx.fillRect(X, Y, SW, SH); ctx.restore();
    ctx.fillStyle = BLACK; ctx.fillRect(X, Y, SW, titleH);
    ctx.font = font(118); ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    const wF = ctx.measureText("FULL").width, gap = 24, wT = ctx.measureText("TIME").width;
    const tx = X + (SW - (wF + gap + wT)) / 2, ty = Y + titleH / 2 + capH(118) / 2;
    ctx.font = font(118); ctx.fillStyle = WHITE; ctx.fillText("FULL", tx, ty); ctx.fillStyle = GOLD; ctx.fillText("TIME", tx + wF + gap, ty);

    const rows = [{ n: String(v.nL).toUpperCase(), g: v.gL === "" ? 0 : v.gL, c: I.cL }, { n: String(v.nV).toUpperCase(), g: v.gV === "" ? 0 : v.gV, c: I.cV }];
    ctx.font = font(100);
    const oneLine = Math.floor(Math.min(104, ...rows.map(r => (colW - 76) / (ctx.measureText(r.n || "—").width / 100))));
    rows.forEach((r, i) => {
      const ry = Y + titleH + i * rowH;
      ctx.fillStyle = BLACK; ctx.fillRect(X, ry, colW, rowH);
      if (i === 1){ ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(X, ry, colW, 1); }
      ctx.fillStyle = WHITE; ctx.fillRect(X + colW, ry, numW, rowH);
      if (crests) contain(r.c, X + colW / 2, ry + rowH / 2, 215, 230);
      else {
        const ft = oneLine >= 60 ? { lines: [r.n || "—"], px: oneLine } : fitName(r.n || "—", colW - 76, 104, 44);
        const ch = capH(ft.px), lh = ft.px, blockH = ch + (ft.lines.length - 1) * lh;
        ctx.font = font(ft.px); ctx.textAlign = "left"; ctx.fillStyle = /FUTBOLGE/.test(r.n) ? GOLD : WHITE;
        ft.lines.forEach((t, k) => ctx.fillText(t, X + 38, ry + (rowH - blockH) / 2 + ch + k * lh));
      }
      number(r.g, X + colW + numW / 2, ry + rowH / 2 + 8, crests ? 250 : 220, BLACK);
    });
    ctx.fillStyle = GOLD; ctx.fillRect(X + colW + 28, Y + titleH + rowH - 3, numW - 56, 6);

    if (I.firma){ const h = 92, w = I.firma.width * h / I.firma.height; ctx.drawImage(I.firma, W - 100 - w, H - 100 - h, w, h); }
  }
};
