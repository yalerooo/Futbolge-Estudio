/**
 * VISTA · Editor: formulario generado a partir de los campos del diseño + vista previa.
 * No toca el modelo: avisa al controlador mediante los callbacks de `handlers`.
 */
import { h, icon } from "./dom.js";
import { IMAGE_ACCEPT } from "../core/files.js";

export class EditorView {
  constructor(design, model, handlers, designs = []){
    this.design = design; this.model = model; this.on = handlers; this.designs = designs;
    this.sections = [];     // [nodo <details>, campo] de primer nivel, para el índice
    this.controls = {};     // id → { el, set(value) }
    this.visNodes = [];     // [nodo, campo] con visibleIf
  }

  render(){
    const d = this.design;
    this.canvas = h("canvas", { class: "preview", "aria-label": `Vista previa del cartel ${d.name}` });
    this.dragHint = h("div", { class: "drag-hint" }, icon("move", 16), "Arrastra la foto para encuadrarla");
    this.toastEl = h("div", { class: "toast", role: "status" });
    this.canvasBox = h("div", { class: "canvas-box" }, this.canvas, this.dragHint);
    this.stage = h("div", { class: "stage" },
      h("div", { class: "stage-in" },
        this.canvasBox,
        h("div", { class: "spec" },
          h("span", {}, h("b", {}, "4:5"), " Instagram"),
          h("span", {}, "Vista previa"),
          h("span", {}, "Exporta ", h("b", {}, `${d.size.w * 2} × ${d.size.h * 2}`), " px"),
          h("span", { class: "kbd-hint" }, h("kbd", {}, "Ctrl"), "+", h("kbd", {}, "S"), " descargar"))),
      this.renderRail(),
      h("button", { class: "stage-toggle", title: "Reducir / ampliar la vista previa", onclick: () => this.stage.classList.toggle("min") }, icon("eye", 18)));

    const actions = (cls) => h("div", { class: cls },
      this.shareBtn = h("button", { class: "btn btn-ghost share", onclick: () => this.on.share() }, icon("share", 18), h("span", {}, "Compartir")),
      h("button", { class: "btn btn-gold", onclick: () => this.on.download() }, icon("download", 18), h("span", {}, cls === "mobile-actions" ? "Descargar" : "Descargar PNG")));

    this.el = h("div", { class: "editor" },
      h("header", { class: "topbar editor-bar" },
        h("a", { class: "back", href: "#/", title: "Volver a los diseños" }, icon("back", 22), h("span", {}, "Diseños")),
        h("div", { class: "title" }, h("span", { class: "tag" }, d.category), h("h1", {}, d.name, d.variant ? h("em", {}, d.variant) : null)),
        h("div", { class: "bar-actions" },
          h("button", { class: "btn btn-ghost icon-only", title: "Restablecer datos", onclick: () => this.on.reset() }, icon("reset", 18)),
          actions("desk-actions"))),
      h("div", { class: "workspace" },
        this.stage,
        h("aside", { class: "panel" },
          this.form = h("form", { class: "form", onsubmit: e => e.preventDefault() }, this.renderFields(d.fields)),
          h("p", { class: "panel-foot" }, `Descarga en alta calidad: ${d.size.w * 2} × ${d.size.h * 2} px.`))),
      actions("mobile-actions"),
      this.toastEl);

    this.panelEl = this.el.querySelector(".panel");
    this.panelEl.prepend(this.renderIndex());
    if (!navigator.canShare) this.el.querySelectorAll(".share").forEach(b => b.remove());
    this.refresh();
    return this.el;
  }

  /* ---------------- construcción del formulario ---------------- */
  renderFields(fields){ return fields.map(fd => this.renderField(fd)); }

  renderField(fd){
    const node = this["f_" + fd.type]?.(fd);
    if (node && fd.visibleIf) this.visNodes.push([node, fd]);
    return node;
  }

  f_section(fd, top = true){
    const det = h("details", { class: "section", open: !fd.collapsed },
      h("summary", {}, h("b", { class: "sec-n", "aria-hidden": "true" }), h("span", {}, fd.title), icon("chevron", 18)),
      h("div", { class: "section-body" }, this.renderFields(fd.fields)));
    this.sections.push([det, fd]);
    return det;
  }
  f_row(fd){ return h("div", { class: "row" }, this.renderFields(fd.fields).map((n, i) => { if (fd.fields[i].narrow) n.classList.add("narrow"); return n; })); }
  f_hint(fd){ return h("p", { class: "hint" }, fd.text); }

  field(fd, control){
    return h("label", { class: "field" }, h("span", { class: "label" }, fd.label), control, fd.hint ? h("span", { class: "hint" }, fd.hint) : null);
  }

  f_text(fd){
    const inp = h("input", { type: "text", value: this.model.get(fd.id) ?? "", autocomplete: "off", oninput: e => this.on.input(fd.id, e.target.value) });
    this.controls[fd.id] = { set: v => { if (document.activeElement !== inp) inp.value = v ?? ""; } };
    return this.field(fd, inp);
  }
  f_number(fd){
    const inp = h("input", { type: "number", inputmode: fd.step && fd.step < 1 ? "decimal" : "numeric", min: fd.min, max: fd.max, step: fd.step || 1,
      value: this.model.get(fd.id), oninput: e => this.on.input(fd.id, e.target.value === "" ? "" : Number(e.target.value)) });
    this.controls[fd.id] = { set: v => { if (document.activeElement !== inp) inp.value = v; } };
    return this.field(fd, inp);
  }
  f_select(fd){
    const sel = h("select", { onchange: e => this.on.input(fd.id, e.target.value) },
      fd.options.map(o => h("option", { value: o.value, selected: this.model.get(fd.id) === o.value }, o.label)));
    this.controls[fd.id] = { set: v => (sel.value = v) };
    return this.field(fd, sel);
  }
  f_segmented(fd){
    const btns = fd.options.map(o => h("button", { type: "button", class: "seg-btn", onclick: () => this.on.input(fd.id, o.value) }, o.label));
    const set = v => btns.forEach((b, i) => b.classList.toggle("on", fd.options[i].value === v));
    this.controls[fd.id] = { set }; set(this.model.get(fd.id));
    return h("div", { class: "segmented", role: "radiogroup" }, btns);
  }
  f_checkbox(fd){
    const inp = h("input", { type: "checkbox", checked: !!this.model.get(fd.id), onchange: e => this.on.input(fd.id, e.target.checked) });
    this.controls[fd.id] = { set: v => (inp.checked = !!v) };
    return h("label", { class: "switch" }, inp, h("span", { class: "track" }), h("span", { class: "switch-label" }, fd.label));
  }
  f_range(fd){
    const out = h("output", {}, this.model.get(fd.id));
    const inp = h("input", { type: "range", min: fd.min, max: fd.max, step: fd.step || 1, value: this.model.get(fd.id),
      oninput: e => { out.textContent = e.target.value; this.on.input(fd.id, Number(e.target.value)); } });
    this.controls[fd.id] = { set: v => { inp.value = v; out.textContent = v; } };
    return h("label", { class: "field" }, h("span", { class: "label" }, fd.label, out), inp);
  }
  f_button(fd){ return h("button", { type: "button", class: "btn btn-ghost block", onclick: () => this.on.action(fd.id) }, fd.label); }

  imageRow(fd, extra){
    const prev = h("span", { class: "img-prev" }, icon("image", 18));
    const file = h("input", { type: "file", accept: IMAGE_ACCEPT, onchange: e => { const f = e.target.files[0]; e.target.value = ""; if (f) this.on.file(fd.id, f); } });
    const clear = h("button", { type: "button", class: "btn btn-ghost small", title: "Quitar", onclick: () => this.on.clearImage(fd.id) }, icon("x", 16));
    const setPrev = () => {
      const img = this.model.images[fd.id];
      prev.replaceChildren(img ? h("img", { src: img.src, alt: "" }) : icon("image", 18));
      clear.hidden = !img || !!fd.src;         // las imágenes con valor por defecto no se quitan, se cambian
    };
    this.controls["img:" + fd.id] = { set: setPrev }; setPrev();
    const cutBtn = fd.cutout ? h("button", { type: "button", class: "btn btn-gold small cut-btn", onclick: () => this.on.cutout(fd.id) },
      icon("cut", 15), fd.cutout === "layer" ? "Recortar jugador" : "Quitar fondo") : null;
    const cutHint = fd.cutout ? h("span", { class: "hint" }, fd.cutoutHint ||
      "Recorte automático con IA, como en Photoshop. La primera vez descarga el modelo (unos segundos).") : null;
    return h("div", { class: "field" },
      h("span", { class: "label" }, fd.label),
      h("div", { class: "img-row" }, prev, h("label", { class: "btn btn-ghost small upload" }, file, "Cambiar…"), clear, cutBtn),
      cutHint,
      extra);
  }
  f_image(fd){ return this.imageRow(fd); }
  f_photo(fd){
    const out = h("output", {});
    const zoom = h("input", { type: "range", min: 100, max: 300, step: 1, oninput: e => { out.textContent = e.target.value + "%"; this.on.zoom(fd.id, e.target.value / 100); } });
    this.controls["zoom:" + fd.id] = { set: () => { const fr = this.model.frames[fd.id]; if (fr){ zoom.value = Math.round(fr.zoom * 100); out.textContent = zoom.value + "%"; } } };
    return this.imageRow(fd, h("div", { class: "field sub" }, h("span", { class: "label" }, "Zoom", out), zoom,
      h("span", { class: "hint" }, "Arrastra la foto en la vista previa para encuadrarla.")));
  }

  /* ---------------- índice de secciones (PC) y carril de diseños ---------------- */
  renderIndex(){
    this.indexEl = h("nav", { class: "sec-index", "aria-label": "Secciones" });
    return this.indexEl;
  }
  updateIndex(){
    if (!this.indexEl) return;
    const vis = this.sections.filter(([n]) => !n.hidden);
    this.indexEl.replaceChildren(...vis.map(([node, fd], i) =>
      h("button", { type: "button", class: "idx-btn", onclick: () => { node.open = true; node.scrollIntoView({ behavior: "smooth", block: "start" }); } },
        h("b", {}, String(i + 1).padStart(2, "0")), h("span", {}, fd.title))));
  }
  renderRail(){
    if (this.designs.length < 2) return null;
    return h("nav", { class: "rail", "aria-label": "Otros diseños" },
      h("span", { class: "rail-title" }, "Diseños"),
      this.designs.map((x, i) => h("a", { class: "rail-item" + (x.id === this.design.id ? " on" : ""), href: `#/d/${x.id}`, title: `${x.name}${x.variant ? " · " + x.variant : ""}` },
        h("img", { src: x.thumb, alt: "" }),
        h("span", {}, String(i + 1).padStart(2, "0")))));
  }

  /* ---------------- sincronización con el modelo ---------------- */
  refresh(){
    for (const [node, fd] of this.visNodes) node.hidden = !this.model.visible(fd);
    this.updateIndex();
    for (const [id, c] of Object.entries(this.controls)){
      if (id.startsWith("img:") || id.startsWith("zoom:")) c.set();
      else c.set(this.model.get(id));
    }
  }

  /** Encaja la vista previa en el espacio disponible manteniendo la proporción del diseño. */
  fit(){
    const box = this.canvasBox, { w, h: H } = this.design.size;
    const bw = box.clientWidth, bh = box.clientHeight; if (!bw || !bh) return;
    const s = Math.min(bw / w, bh / H);
    this.canvas.style.width = Math.floor(w * s) + "px";
    this.canvas.style.height = Math.floor(H * s) + "px";
  }

  setDraggable(on){ this.canvas.classList.toggle("draggable", on); this.dragHint.hidden = !on; }

  toast(msg, ms = 3500){
    this.toastEl.textContent = msg; this.toastEl.classList.add("show");
    clearTimeout(this.toastT); if (ms) this.toastT = setTimeout(() => this.toastEl.classList.remove("show"), ms);
  }
  hideToast(){ this.toastEl.classList.remove("show"); }
}
