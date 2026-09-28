/**
 * Punto de entrada: registra las rutas y arranca la aplicación.
 */
import { Router } from "./core/router.js";
import { HomeController } from "./controllers/home-controller.js";
import { EditorController } from "./controllers/editor-controller.js";

new Router()
  .on("/", () => new HomeController())
  .on("/d/:id", (params, router) => new EditorController(params, router))
  .start(document.getElementById("app"));
