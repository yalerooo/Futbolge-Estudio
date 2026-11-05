/**
 * Escudos del proyecto que se pueden elegir con un toque en cualquier campo de escudo.
 * Para añadir uno: copia el archivo en assets/img/ y añade una línea aquí.
 *   bn: true  → versión en blanco y negro con fondo transparente (para carteles oscuros)
 */
export const CRESTS = [
  { name: "Futbolge",          src: "assets/img/escudo_futbolge_bn_hd.png",       bn: true },
  { name: "Jaimitos FC",       src: "assets/img/escudo_jaimitos_bn_hd.png",       bn: true },
  { name: "Sansomendi",        src: "assets/img/escudo_sansomendi_bn_hd.png",     bn: true },
  { name: "Atlético Cacao",    src: "assets/img/escudo_atletico_cacao_bn_hd.png", bn: true },
  { name: "Futbolge (color)",  src: "assets/img/escudo_futbolge_color.png" },
  { name: "Jaimitos (color)",  src: "assets/img/escudo_jaimitos.png" },
  { name: "Sansomendi (color)", src: "assets/img/escudo_sansomendi.png" },
  { name: "Loh Chavale",       src: "assets/img/escudo_loh_chavale.jpg" }
];

/**
 * ¿El campo es un escudo? Por defecto, los campos `image` cuya etiqueta empieza por «Escudo»;
 * un diseño puede forzarlo con `crests: true` o quitarlo con `crests: false`.
 * Devuelve la lista ordenada: primero el estilo que pide el campo (a color o B/N).
 */
export function crestsFor(fd){
  const on = fd.crests ?? (fd.type === "image" && /^escudo/i.test(fd.label || ""));
  if (!on) return [];
  const wantColor = /color/i.test(fd.label || "");
  return [...CRESTS].sort((a, b) => (!!a.bn === wantColor) - (!!b.bn === wantColor));
}
