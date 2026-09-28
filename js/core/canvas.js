/**
 * Lienzos de alta resolución.
 * Todos los diseños dibujan en "unidades de diseño" (p. ej. 1080×1350) y el lienzo real
 * tiene q veces más píxeles. La vista previa usa q = 1 (rápida) y la descarga q = 2.
 */

export const EXPORT_Q = 2;

// Sombras y desenfoques del canvas no siguen la transformación: se multiplican por q
// en los contextos marcados con __q para que el resultado sea idéntico a cualquier escala.
(() => {
  const P = CanvasRenderingContext2D.prototype;
  if (P.__patched) return;
  P.__patched = true;
  ["shadowBlur", "shadowOffsetX", "shadowOffsetY"].forEach(k => {
    const d = Object.getOwnPropertyDescriptor(P, k);
    Object.defineProperty(P, k, {
      configurable: true,
      get(){ return d.get.call(this) / (this.__q || 1); },
      set(v){ d.set.call(this, v * (this.__q || 1)); }
    });
  });
  const fd = Object.getOwnPropertyDescriptor(P, "filter");
  if (fd) Object.defineProperty(P, "filter", {
    configurable: true,
    get(){ return fd.get.call(this); },
    set(v){ fd.set.call(this, this.__q && typeof v === "string" ? v.replace(/blur\(([\d.]+)px\)/g, (m, n) => `blur(${n * this.__q}px)`) : v); }
  });
})();

/** Prepara un contexto para dibujar en unidades de diseño a escala q. */
export function hiDPI(ctx, q){
  ctx.__q = q;
  ctx.setTransform(q, 0, 0, q, 0, 0);
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

/** Crea un lienzo fuera de pantalla de w×h unidades a escala q. */
export function makeCanvas(w, h, q = 1){
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * q); cv.height = Math.round(h * q);
  const ctx = hiDPI(cv.getContext("2d"), q);
  return { cv, ctx, w, h, q };
}

/** Ajusta un <canvas> existente al tamaño del diseño y devuelve su contexto listo. */
export function sizeCanvas(cv, w, h, q){
  const W = Math.round(w * q), H = Math.round(h * q);
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  return hiDPI(cv.getContext("2d"), q);
}

/** Textura de grano reutilizable (se genera una sola vez). */
let grainCv = null;
export function grain(){
  if (grainCv) return grainCv;
  grainCv = document.createElement("canvas"); grainCv.width = 1920; grainCv.height = 1920;
  const g = grainCv.getContext("2d"), d = g.createImageData(grainCv.width, grainCv.height);
  for (let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  return grainCv;
}
