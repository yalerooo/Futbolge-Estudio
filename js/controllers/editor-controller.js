/**
 * CONTROLADOR · Editor
 * Une el modelo (datos del cartel) con la vista (formulario + vista previa):
 * traduce las acciones del usuario en cambios del modelo y vuelve a dibujar.
 */
import { EditorModel, eachField } from "../core/model.js";
import { EditorView } from "../views/editor-view.js";
import { getDesign, designs } from "../designs/registry.js";
import { fileToImage } from "../core/files.js";
import { removeBackground, preloadCutout } from "../core/cutout.js";
import { sizeCanvas, makeCanvas, EXPORT_Q } from "../core/canvas.js";
import { h } from "../views/dom.js";

export async function ensureFonts(){
  const wanted = ["100px Anton", "400 20px Montserrat", "500 20px Montserrat", "600 20px Montserrat", "700 20px Montserrat", "800 20px Montserrat", "900 20px Montserrat"];
  await Promise.race([Promise.all(wanted.map(w => document.fonts.load(w))), new Promise(r => setTimeout(r, 4000))]);
}

function hasAlpha(img){
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

export class EditorController {
  constructor({ id }, router){ this.id = id; this.router = router; }

  async mount(outlet){
    this.design = getDesign(this.id);
    if (!this.design) return this.router.go("/");
    document.title = `${this.design.name} · Estudio FUTBOLGE`;
    outlet.replaceChildren(h("div", { class: "loading" }, h("span", { class: "spinner" }), "Cargando diseño…"));

    const [model] = await Promise.all([EditorModel.create(this.design), ensureFonts()]);
    if (this.dead) return;
    this.model = model;
    this.view = new EditorView(this.design, model, {
      input: (id, v) => model.set(id, v),
      file: (id, f) => this.loadFile(id, f),
      clearImage: id => model.setImage(id, null),
      cutout: id => this.cutout(id),
      zoom: (id, z) => model.zoom(id, z),
      action: id => this.fieldById(id)?.action?.(model),
      reset: () => { model.reset(); this.view.toast("Datos restablecidos"); },
      download: () => this.download(),
      share: () => this.share()
    }, designs);
    outlet.replaceChildren(this.view.render());

    this.onChange = () => { this.view.refresh(); this.schedule(); };
    model.addEventListener("change", this.onChange);
    this.bindCanvas();
    this.ro = new ResizeObserver(() => { this.view.fit(); this.schedule(); });
    this.ro.observe(this.view.canvasBox);
    // atajo de teclado en PC: Ctrl/Cmd + S descarga el cartel
    this.onKey = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s"){ e.preventDefault(); this.download(); } };
    addEventListener("keydown", this.onKey);
    this.view.fit();
    if (JSON.stringify(this.design.fields).includes('"cutout"')) preloadCutout();
    this.schedule();
  }

  unmount(){
    this.dead = true;
    this.model?.removeEventListener("change", this.onChange);
    this.ro?.disconnect();
    removeEventListener("keydown", this.onKey);
    cancelAnimationFrame(this.raf);
  }

  fieldById(id){ let r; eachField(this.design.fields, fd => { if (fd.id === id) r = fd; }); return r; }

  /* ---------------- vista previa (redibujo agrupado por fotograma) ---------------- */
  schedule(){ cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.renderPreview()); }

  renderPreview(){
    const { w, h: H } = this.design.size, cv = this.view.canvas, r = cv.getBoundingClientRect();
    // resolución justa para la pantalla (más rápida en móvil); la descarga siempre va en alta calidad
    const q = Math.min(1.5, Math.max(.5, (r.height || 600) * (devicePixelRatio || 1) / H));
    const ctx = sizeCanvas(cv, w, H, Math.round(q * 20) / 20);
    ctx.clearRect(0, 0, w, H);
    this.design.render(ctx, this.model);
    this.view.setDraggable(!!this.activePhoto());
  }

  /* ---------------- arrastrar / hacer zoom en la foto ---------------- */
  activePhoto(pt){
    let found = null;
    eachField(this.design.fields, fd => {
      if (found || fd.type !== "photo" || !this.model.images[fd.id]) return;
      if (!this.visibleDeep(fd)) return;
      const a = this.model.area(fd.id);
      if (!pt || (pt[0] >= a.x && pt[0] <= a.x + a.w && pt[1] >= a.y && pt[1] <= a.y + a.h)) found = fd.id;
    });
    return found;
  }
  visibleDeep(target){
    // un campo es visible si él y todas sus secciones contenedoras lo son
    const walk = (fields, chain) => {
      for (const fd of fields){
        if (fd === target) return [...chain, fd].every(x => this.model.visible(x));
        if (fd.fields){ const r = walk(fd.fields, [...chain, fd]); if (r !== undefined) return r; }
      }
    };
    return walk(this.design.fields, []) ?? false;
  }

  bindCanvas(){
    const cv = this.view.canvas, { w, h: H } = this.design.size;
    const toDesign = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * H / r.height]; };
    let drag = null;
    cv.addEventListener("pointerdown", e => {
      const p = toDesign(e), id = this.activePhoto(p); if (!id) return;
      drag = { id, p }; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging");
    });
    cv.addEventListener("pointermove", e => {
      if (!drag) return; const p = toDesign(e);
      this.model.pan(drag.id, p[0] - drag.p[0], p[1] - drag.p[1]); drag.p = p;
    });
    const end = () => { drag = null; cv.classList.remove("dragging"); };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", e => {
      const id = this.activePhoto(toDesign(e)); if (!id) return;
      e.preventDefault(); this.model.zoom(id, this.model.frames[id].zoom * (e.deltaY < 0 ? 1.05 : 1 / 1.05));
    }, { passive: false });
  }

  /* ---------------- archivos ---------------- */
  async loadFile(id, file){
    try{
      const img = await fileToImage(file, msg => this.view.toast(msg, 0));
      if (!img) throw new Error("formato");
      this.model.setImage(id, img); this.view.hideToast();
      // recorte automático al subir, si el campo lo pide y la imagen no trae ya transparencia
      const fd = this.fieldById(id);
      if (fd?.cutoutAuto && !hasAlpha(img)) this.cutout(id);
    }catch(e){
      this.view.toast(e.message === "sin conexión"
        ? "Para abrir fotos HEIC hace falta conexión a internet."
        : "No se ha podido abrir esa imagen. Prueba con JPG, PNG o HEIC.", 6000);
    }
  }

  /* ---------------- recorte automático (quitar fondo) ---------------- */
  async cutout(id){
    const fd = this.fieldById(id), img = this.model.images[id];
    if (!img){ this.view.toast("Primero sube una imagen."); return; }
    if (this.cutting) return;
    this.cutting = true; this.view.el.classList.add("busy");
    try{
      const layer = fd.cutout === "layer";
      const res = await removeBackground(img, msg => this.view.toast(msg, 0), { trim: !layer });
      if (layer){
        this.model.images[id + "_cut"] = res;
        if (fd.cutoutSet){ Object.assign(this.model.values, fd.cutoutSet); this.model.persist(); }
        if (fd.cutoutToggle) this.model.set(fd.cutoutToggle, true); else this.model.emit();
      } else this.model.setImage(id, res);
      this.view.toast("Recorte listo ✓");
    }catch(e){
      this.view.toast(e.message === "sin conexión" ? "El recorte necesita conexión a internet la primera vez." :
                      e.message === "vacío" ? "No se ha encontrado ninguna persona u objeto en la imagen." :
                      "No se ha podido recortar la imagen.", 6000);
    }finally{ this.cutting = false; this.view.el.classList.remove("busy"); }
  }

  /* ---------------- exportar en alta calidad ---------------- */
  async exportBlob(){
    const { w, h: H } = this.design.size;
    this.view.toast("Generando imagen en alta calidad…", 0);
    await new Promise(r => setTimeout(r, 30));
    const out = makeCanvas(w, H, EXPORT_Q);
    this.design.render(out.ctx, this.model);
    const blob = await new Promise(r => out.cv.toBlob(r, "image/png"));
    this.schedule();          // algunos diseños reutilizan lienzos internos: redibuja la vista previa
    return blob;
  }

  async download(){
    const blob = await this.exportBlob();
    const a = h("a", { href: URL.createObjectURL(blob), download: this.design.filename(this.model.values) });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    this.view.toast("Cartel descargado ✓");
  }

  async share(){
    const blob = await this.exportBlob();
    const file = new File([blob], this.design.filename(this.model.values), { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })){
      this.view.hideToast();
      try{ await navigator.share({ files: [file], title: this.design.name }); }catch(e){ /* cancelado */ }
    } else {
      this.view.toast("Este navegador no permite compartir: se descarga el archivo.");
      const a = h("a", { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove();
    }
  }
}
