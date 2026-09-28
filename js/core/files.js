/**
 * Carga de imágenes (rutas del proyecto o archivos del usuario, incluidos HEIC/HEIF de iPhone).
 */

export const loadImage = src => new Promise(res => {
  if (!src) return res(null);
  const i = new Image(); i.decoding = "async";
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

const asDataURL = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

let heicLib = null;
function loadHeicLib(){
  if (window.heic2any) return Promise.resolve();
  if (heicLib) return heicLib;
  heicLib = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
    sc.onload = () => res(); sc.onerror = () => { heicLib = null; rej(new Error("sin conexión")); };
    document.head.appendChild(sc);
  });
  return heicLib;
}

/** Convierte un File en una imagen. onBusy(msg) se llama mientras se convierte un HEIC. */
export async function fileToImage(file, onBusy = () => {}){
  const isHeic = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type);
  const img = await loadImage(await asDataURL(file));     // Safari/iPhone abren HEIC directamente
  if (img || !isHeic) return img;
  onBusy("Convirtiendo foto HEIC…");
  await loadHeicLib();
  const out = await window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return loadImage(await asDataURL(Array.isArray(out) ? out[0] : out));
}

export const IMAGE_ACCEPT = "image/*,.heic,.heif";
