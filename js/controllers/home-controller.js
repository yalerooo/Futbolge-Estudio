/**
 * CONTROLADOR · Portada
 */
import { HomeView } from "../views/home-view.js";
import { designs } from "../designs/registry.js";

export class HomeController {
  mount(outlet){
    document.title = "Estudio de carteles · FUTBOLGE";
    this.view = new HomeView({ designs });
    outlet.replaceChildren(this.view.render());
  }
  unmount(){}
}
