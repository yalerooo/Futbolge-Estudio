/**
 * VISTA · Portada con estética de matchday: cabecera de impacto, ticker y catálogo de diseños.
 * Todo el contenido va dentro de `.wrap` para que barra, cabecera y catálogo queden alineados en PC.
 */
import { h, icon } from "./dom.js";

export class HomeView {
  constructor({ designs }){ this.designs = designs; }

  render(){
    const n = String(this.designs.length).padStart(2, "0");
    const tickerWords = [...new Set(this.designs.map(d => d.name.toUpperCase())), "FUTBOLGE", "MMXXVI"];
    const tickerRun = () => h("div", { class: "ticker-run" }, tickerWords.flatMap(w => [h("span", {}, w), h("i", { "aria-hidden": "true" }, "✦")]));

    this.el = h("div", { class: "home" },
      h("header", { class: "topbar" },
        h("div", { class: "wrap bar-in" },
          h("a", { class: "brand", href: "#/" },
            h("img", { src: "assets/img/escudo_futbolge_color.png", alt: "" }),
            h("span", { class: "brand-name" }, "FUTBOLGE")),
          h("span", { class: "brand-meta" }, h("b", {}), "Estudio"))),

      h("section", { class: "hero" },
        h("div", { class: "wrap hero-in" },
          h("div", { class: "hero-art", "aria-hidden": "true" },
            h("img", { class: "hero-crest", src: "assets/img/escudo_futbolge_color.png", alt: "" }),
            h("span", { class: "slash s1" }), h("span", { class: "slash s2" })),
          h("div", { class: "hero-copy" },
            h("p", { class: "kicker" }, h("span", {}), "Estudio de diseño · MMXXVI"),
            h("h1", {},
              h("span", { class: "l1" }, "Carteles"),
              h("span", { class: "l2" }, "de partido"))),
          h("dl", { class: "stats" },
            h("div", {}, h("dt", {}, "Diseños"), h("dd", {}, n)),
            h("div", {}, h("dt", {}, "Formato"), h("dd", {}, "4:5")),
            h("div", {}, h("dt", {}, "Calidad"), h("dd", {}, "2160", h("small", {}, "PX")))))),

      h("div", { class: "ticker", "aria-hidden": "true" }, h("div", { class: "ticker-track" }, tickerRun(), tickerRun(), tickerRun(), tickerRun())),

      h("section", { class: "wrap catalog" },
        h("div", { class: "catalog-head" },
          h("h2", {}, "Diseños"),
          h("span", { class: "rule" }),
          h("span", { class: "catalog-count" }, n)),
        h("div", { class: "grid" },
          this.designs.map((d, i) => this.card(d, i)),
          this.soonCard(this.designs.length))),

      h("footer", { class: "foot" },
        h("div", { class: "wrap foot-in" },
          h("img", { src: "assets/img/firma_futbolge.png", alt: "FUTBOLGE MMXXVI" }),
          h("span", {}, "Uso interno del club"))));
    return this.el;
  }

  card(d, i){
    return h("a", { class: "card", href: `#/d/${d.id}`, style: `--i:${i}` },
      h("div", { class: "thumb" },
        h("img", { src: d.thumb, alt: `Ejemplo del diseño ${d.name}${d.variant ? " · " + d.variant : ""}`, loading: "lazy" }),
        h("span", { class: "badge" }, d.category),
        h("span", { class: "open" }, "Crear", icon("arrow", 16))),
      h("div", { class: "meta" },
        h("span", { class: "num" }, String(i + 1).padStart(2, "0")),
        h("div", {}, h("h3", {}, d.name), d.variant ? h("span", { class: "variant" }, d.variant) : null)));
  }

  soonCard(i){
    return h("div", { class: "card soon", style: `--i:${i}` },
      h("div", { class: "thumb" },
        h("div", { class: "soon-in" }, h("span", { class: "plus" }, "+"), h("span", {}, "Próximamente"))),
      h("div", { class: "meta" }, h("span", { class: "num" }, String(i + 1).padStart(2, "0")),
        h("div", {}, h("h3", {}, "Nuevo"), h("span", { class: "variant" }, "En camino"))));
  }
}
