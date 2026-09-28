/**
 * MODELO: estado de un cartel (valores del formulario, imágenes y encuadre de fotos).
 * Es independiente de la vista: la vista lo lee y el controlador lo modifica.
 * Emite "change" cada vez que algo cambia.
 */
import { loadImage } from "./files.js";

/** Recorre los campos de un diseño (incluidos los anidados en secciones y filas). */
export function eachField(fields, cb){
  for (const fd of fields){
    if (fd.fields) eachField(fd.fields, cb);
    else cb(fd);
  }
}

const IMAGE_TYPES = new Set(["image", "photo"]);
const STORE = id => `futbolge.estudio.${id}`;

export class EditorModel extends EventTarget {
  constructor(design){
    super();
    this.design = design;
    this.values = {};     // textos, números, casillas…
    this.images = {};     // HTMLImageElement por id (campos imagen/foto y assets fijos)
    this.frames = {};     // encuadre de cada campo "photo": { zoom, ox, oy }
    this.fieldMap = {};
    eachField(design.fields, fd => { if (fd.id) this.fieldMap[fd.id] = fd; });
    this.reset(false);
  }

  /** Crea el modelo y carga las imágenes por defecto del diseño. */
  static async create(design){
    const m = new EditorModel(design);
    const jobs = [];
    for (const [k, src] of Object.entries(design.assets || {})) jobs.push(loadImage(src).then(i => (m.images[k] = i)));
    eachField(design.fields, fd => { if (IMAGE_TYPES.has(fd.type) && fd.src) jobs.push(loadImage(fd.src).then(i => (m.images[fd.id] = i))); });
    await Promise.all(jobs);
    eachField(design.fields, fd => { if (fd.type === "photo" && m.images[fd.id]) m.initFrame(fd.id, true); });
    m.restore();
    return m;
  }

  /** Vuelve a los valores por defecto (sin tocar las imágenes). */
  reset(notify = true){
    this.values = { ...(this.design.state || {}) };   // `state`: valores fijos del diseño (no se guardan)
    eachField(this.design.fields, fd => { if (fd.id && "value" in fd) this.values[fd.id] = fd.value; });
    if (notify){ this.persist(); this.emit(); }
  }

  get(id){ return this.values[id]; }
  set(id, value){ this.values[id] = value; this.persist(); this.emit(); }

  setImage(id, img){
    this.images[id] = img;
    delete this.images[id + "_cut"];      // el recorte automático pertenecía a la foto anterior
    if (this.fieldMap[id]?.type === "photo") this.initFrame(id, false);
    this.emit();
  }

  /** ¿El campo es visible con los valores actuales? */
  visible(fd){ return !fd.visibleIf || fd.visibleIf(this.values); }

  /* ---------------- encuadre de fotos (cubrir un área, con zoom y desplazamiento) ---------------- */
  area(id){ return this.fieldMap[id].area(this.values); }
  cover(id){ const a = this.area(id), img = this.images[id]; return Math.max(a.w / img.width, a.h / img.height); }

  initFrame(id, useDesignDefault){
    const fd = this.fieldMap[id], img = this.images[id], a = this.area(id);
    if (useDesignDefault && fd.defaultFrame){ this.frames[id] = fd.defaultFrame(img, a, this.cover(id)); this.clamp(id); return; }
    const s = this.cover(id);
    this.frames[id] = { zoom: 1, ox: a.x + (a.w - img.width * s) / 2, oy: a.y + (a.h - img.height * s) / 2 };
  }

  clamp(id){
    const fr = this.frames[id], a = this.area(id), img = this.images[id]; if (!fr || !img) return;
    fr.zoom = Math.min(3, Math.max(1, fr.zoom));
    const s = this.cover(id) * fr.zoom, w = img.width * s, h = img.height * s;
    fr.ox = Math.min(a.x, Math.max(a.x + a.w - w, fr.ox));
    fr.oy = Math.min(a.y, Math.max(a.y + a.h - h, fr.oy));
  }

  pan(id, dx, dy){ const fr = this.frames[id]; if (!fr) return; fr.ox += dx; fr.oy += dy; this.clamp(id); this.emit(); }

  zoom(id, z){
    const fr = this.frames[id], img = this.images[id]; if (!fr || !img) return;
    const a = this.area(id), cx = a.x + a.w / 2, cy = a.y + a.h / 2, s0 = this.cover(id) * fr.zoom;
    const u = (cx - fr.ox) / s0, v = (cy - fr.oy) / s0;
    fr.zoom = Math.min(3, Math.max(1, z));
    const s1 = this.cover(id) * fr.zoom; fr.ox = cx - u * s1; fr.oy = cy - v * s1;
    this.clamp(id); this.emit();
  }

  /** Rectángulo donde dibujar la foto encuadrada: { img, x, y, w, h } */
  photo(id){
    const img = this.images[id], fr = this.frames[id]; if (!img || !fr) return null;
    const s = this.cover(id) * fr.zoom;
    return { img, x: fr.ox, y: fr.oy, w: img.width * s, h: img.height * s };
  }

  /* ---------------- persistencia de textos entre visitas (no imágenes) ---------------- */
  persist(){
    try{ localStorage.setItem(STORE(this.design.id), JSON.stringify(this.values)); }catch(e){}
  }
  restore(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORE(this.design.id)) || "null");
      const fixed = this.design.state || {};
      if (saved) for (const k of Object.keys(saved)) if (k in this.values && !(k in fixed)) this.values[k] = saved[k];
    }catch(e){}
  }

  emit(){ this.dispatchEvent(new Event("change")); }
}
