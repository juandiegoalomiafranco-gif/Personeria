/**
 * Duraciones del proyecto, en segundos (la unidad de GSAP y motion).
 * Para CSS usa `toMs()`.
 */
export const DURATION = {
  /** EXACTO — llenado de la barra del preloader. */
  preloaderFill: 0.52,
  /** EXACTO — fade del preloader. */
  preloaderFade: 0.25,
  /** EXACTO — transición de color en hover de los targets punteados. */
  hover: 0.2,
  /** EXACTO — cambio de color al conmutar tema o fondo de sección. */
  themeShift: 0.3,

  /** Reveal de una línea de texto enmascarada. */
  revealLine: 0.9,
  /** Reveal del titular gigante del hero. */
  revealHeadline: 1.0,
  /** Entrada de una tarjeta del grid. */
  revealCard: 0.6,
  /** Barrido diagonal al entrar al túnel. */
  wipe: 0.8,
  /** Ciclo del bob del indicador de scroll del hero. */
  scrollHint: 2.4,
} as const;

/** Ritmos de stagger, en segundos entre elementos. */
export const STAGGER = {
  /** Entre líneas de un mismo bloque de texto. */
  lines: 0.09,
  /** Entre elementos del chrome al cargar. */
  chrome: 0.05,
  /** Entre tarjetas del grid de propuestas. */
  cards: 0.12,
  /** Entre palabras dentro de un titular. */
  words: 0.06,
} as const;

/** Convierte segundos a la cadena en milisegundos que espera CSS. */
export function toMs(seconds: number): string {
  return `${Math.round(seconds * 1000)}ms`;
}
