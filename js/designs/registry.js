/**
 * REGISTRO DE DISEÑOS
 * Para añadir un cartel nuevo:
 *   1. Crea js/designs/mi-diseno.js (copia uno existente como plantilla).
 *   2. Impórtalo aquí y añádelo a la lista.
 * La portada y el editor se generan solos a partir de esta lista.
 */
import { nextMatchPlayer, nextMatchPhoto } from "./next-match.js";
import matchDay from "./match-day.js";
import matchDayFoto from "./match-day-foto.js";
import fullTime from "./full-time.js";

export const designs = [nextMatchPlayer, nextMatchPhoto, matchDay, matchDayFoto, fullTime];

export const getDesign = id => designs.find(d => d.id === id);

/** Orden de las categorías en la portada (el momento del partido). */
export const CATEGORIES = ["Previa", "Día de partido", "Resultado"];
