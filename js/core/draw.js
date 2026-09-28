/**
 * Utilidades de dibujo compartidas por todos los diseños.
 * Trabajan sobre el "contexto actual", que cada diseño fija con use(ctx).
 */

export const GOLD = "#D3B52A", WHITE = "#FFFFFF", BLACK = "#0A0A0A";
export const UI = '"Montserrat", "Segoe UI", system-ui, sans-serif';
export const ANTON = "Anton";

let c = null;
export const use = ctx => (c = ctx);
export const cur = () => c;

/** Cadena de fuente: f(700, 24) → "700 24px Montserrat…" ; f(400, 90, ANTON) para Anton. */
export const f = (w, px, fam = UI) => `${w} ${px}px ${fam}`;

export function text(t, x, y, font, color, align = "left", spacing = 0){
  c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic";
  if ("letterSpacing" in c) c.letterSpacing = spacing + "px";
  c.fillText(t, x, y);
  if ("letterSpacing" in c) c.letterSpacing = "0px";
}

export function width(t, font, spacing = 0){ c.font = font; return c.measureText(t).width + spacing * t.length; }

/** Mayor tamaño (entre min y px) con el que el texto cabe en maxW. */
export function fit(t, maxW, w, px, min, spacing = 0, fam = UI){
  while (px > min && width(t, f(w, px, fam), spacing) > maxW) px--;
  return px;
}

export function wrap(t, maxW, font){
  c.font = font; const words = t.split(/\s+/); const lines = []; let line = "";
  for (const w of words){
    const tr = line ? line + " " + w : w;
    if (c.measureText(tr).width > maxW && line){ lines.push(line); line = w; } else line = tr;
  }
  if (line) lines.push(line);
  return lines;
}

export function contain(img, cx, cy, mw, mh){
  if (!img) return;
  const s = Math.min(mw / img.width, mh / img.height), w = img.width * s, h = img.height * s;
  c.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

export function rr(x, y, w, h, r){ c.beginPath(); c.roundRect(x, y, w, h, r); }

/** Altura de las mayúsculas para una fuente dada. */
export function capOf(px, fam = ANTON, w = 400){ c.font = f(w, px, fam); return c.measureText("H").actualBoundingBoxAscent; }

/** Escudo con el círculo de un diámetro D. Si el escudo es alto (tridente), el círculo queda a la altura cy igualmente. */
export function crestCircle(img, x, cy, D){
  if (!img) return D;
  const h = img.height * D / img.width;
  const circleY = img.height > img.width * 1.15 ? h * .6 : h / 2;
  c.drawImage(img, x, cy - circleY, D, h);
  return D;
}

/** "Domingo 04/10/2026" → { day: "DOMINGO", date: "04.10" } */
export function splitDate(fe){
  const m = (fe || "").trim().match(/^(.*?)(\d{1,2})[\/.\-](\d{1,2})/);
  return m ? { day: m[1].trim().toUpperCase(), date: `${m[2].padStart(2, "0")}.${m[3].padStart(2, "0")}` }
           : { day: "", date: (fe || "").trim().toUpperCase() };
}

/** "18:00" → "18:00H" */
export const hourH = ho => { ho = (ho || "").trim(); return ho ? (/h$/i.test(ho) ? ho.toUpperCase() : ho + "H") : ""; };

/** Nombre de archivo seguro: "Jaimitos FC" → "JAIMITOS-FC" */
export const slug = t => (t || "equipo").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
