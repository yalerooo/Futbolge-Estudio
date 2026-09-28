# Estudio de carteles · FUTBOLGE

Web para crear los carteles del equipo (Next Match, Match Day, Full Time…) desde el móvil o el ordenador y descargarlos en alta calidad (2160 × 2700 px).

## Cómo abrirlo

Es una web estática, pero usa módulos de JavaScript, así que **no funciona abriendo `index.html` con doble clic**: hay que servirla.

- **En tu ordenador:** desde esta carpeta, ejecuta
  `py -m http.server 8770` y abre <http://localhost:8770>.
- **Para todo el equipo (gratis):** sube la carpeta `estudio` a Netlify (arrastrar y soltar en app.netlify.com/drop), Cloudflare Pages o GitHub Pages. Tendréis un enlace para abrirlo desde el móvil.

## Estructura (MVC)

```
estudio/
├─ index.html              página única
├─ css/estudio.css         estilos (móvil primero, escritorio a partir de 960 px)
├─ assets/                 fuentes, escudos, fotos y miniaturas de la portada
└─ js/
   ├─ main.js              arranque y rutas (#/ portada · #/d/<id> editor)
   ├─ core/                piezas comunes
   │  ├─ model.js          MODELO: valores, imágenes y encuadre de fotos de un cartel
   │  ├─ router.js         enrutador por hash
   │  ├─ canvas.js         lienzos en alta resolución
   │  ├─ draw.js           utilidades de dibujo (textos, escudos, fechas…)
   │  ├─ fx.js             efectos con alternativa para iPhone/Safari
   │  └─ files.js          carga de imágenes (incluye HEIC de iPhone)
   ├─ views/               VISTAS: portada y editor (el formulario se genera solo)
   ├─ controllers/         CONTROLADORES: conectan modelo y vista, descargar/compartir
   └─ designs/             UN ARCHIVO POR DISEÑO + registry.js
```

## Añadir un diseño nuevo

1. Copia un diseño existente, por ejemplo `js/designs/next-match.js`, como `js/designs/mi-diseno.js`.
2. Cambia `id`, `name`, `category`, `description`, `size` y `filename`.
3. Define los **campos** del formulario en `fields`. Tipos disponibles:
   `text`, `number`, `select`, `segmented`, `checkbox`, `range`, `image`, `photo` (foto que se arrastra y se amplía), `button`, `hint`, y los contenedores `section` y `row`.
   Los campos `image`/`photo` admiten recorte automático con IA: `cutout: true` (botón «Quitar fondo»; con `cutoutAuto: true` se recorta solo al subir) o `cutout: "layer"` en una foto (guarda la silueta alineada en `m.images[id + "_cut"]` para efectos como el jugador delante del título).
   Cualquier campo o sección puede llevar `visibleIf: v => …` para mostrarse solo en ciertos casos.
4. Escribe `render(ctx, m)`: dibuja el cartel en unidades de diseño (p. ej. 1080 × 1350). Tienes los valores en `m.values`, las imágenes en `m.images` y las fotos encuadradas con `m.photo(id)`.
5. Regístralo en `js/designs/registry.js` (una línea en la lista).
6. Pon una miniatura en `assets/thumbs/<id>.jpg` (540 × 675).

La portada, el formulario, la vista previa, la descarga y el botón de compartir funcionan solos para cualquier diseño registrado.

## Datos guardados

Los textos que escribes se guardan en el navegador (por diseño), así que al volver siguen ahí. El botón ↺ del editor restablece los valores de ejemplo. Las imágenes que subes no se guardan.
