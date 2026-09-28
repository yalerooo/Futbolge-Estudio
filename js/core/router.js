/**
 * Enrutador por hash (funciona en cualquier hosting estático):
 *   #/            → portada
 *   #/d/<id>      → editor del diseño <id>
 */
export class Router {
  constructor(){ this.routes = []; this.current = null; }

  on(pattern, controllerFactory){
    const keys = [], re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
    this.routes.push({ re, keys, controllerFactory });
    return this;
  }

  start(outlet){
    this.outlet = outlet;
    addEventListener("hashchange", () => this.resolve());
    this.resolve();
  }

  go(path){ location.hash = "#" + path; }

  async resolve(){
    const path = location.hash.replace(/^#/, "") || "/";
    for (const r of this.routes){
      const m = path.match(r.re);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      if (this.current?.unmount) this.current.unmount();
      this.current = r.controllerFactory(params, this);
      await this.current.mount(this.outlet);
      scrollTo(0, 0);
      return;
    }
    this.go("/");
  }
}
