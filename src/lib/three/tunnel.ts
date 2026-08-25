/**
 * Parámetros del túnel hiperespacial.
 *
 * Todo lo que define el "feel" de la sección vive aquí, para poder calibrarlo
 * contra los frames de la referencia sin abrir los componentes.
 */

/** Profundidad de la caja donde viven las estelas, en unidades de escena. */
export const DEPTH = 70;

/** Radio del disco donde nacen. Pequeño: la perspectiva es la que las abre. */
export const SPAWN_RADIUS = 9;

/** Cuántas estelas. 1200 se mueven cómodas en JS y llenan el encuadre. */
export const STREAK_COUNT = 1200;

/**
 * Grosor de la estela en pantalla, como fracción del alto del viewport.
 *
 * El grosor en mundo se calcula por instancia multiplicando por su distancia a
 * la cámara, de modo que el ancho proyectado sea constante. Con un grosor fijo
 * en mundo, la perspectiva engorda las estelas cercanas hasta volverlas manchas
 * y el radial deja de leerse — la referencia las mantiene finas de punta a punta.
 */
export const STREAK_THICKNESS_K = 0.0042;

/** Velocidad al entrar a la sección y al final, en unidades por segundo. */
export const SPEED_MIN = 14;
export const SPEED_MAX = 190;

/** Largo de la estela como múltiplo de la velocidad. */
export const STREAK_FACTOR = 0.085;

/** Paleta de las estelas, en el orden en que se reparten. */
export const STREAK_COLORS = [
  "#22e0e8", // cian
  "#2b6cf5", // azul eléctrico
  "#7b3ff2", // violeta
  "#d43ff2", // magenta
  "#ffffff", // blanco
] as const;

/** Peso relativo de cada color. El cian domina, como en la referencia. */
export const STREAK_WEIGHTS = [0.42, 0.18, 0.16, 0.09, 0.15] as const;

/** Anillos lima que se atraviesan. */
export const RING_COUNT = 6;
export const RING_RADIUS = 3.9;
/** Segmentos del círculo. 128 ya no muestra facetas a ningún tamaño. */
export const RING_SEGMENTS = 128;
/** Casi de canto: es lo que los convierte en elipses aplastadas en pantalla. */
export const RING_TILT = -1.25;

/**
 * Etapas de la sección, en fracción del progreso del pin.
 *
 * Cada tramo es una de las ocho fases que se ven en el video de referencia.
 */
export const STAGE = {
  /** Las estelas aparecen. */
  fadeIn: [0, 0.06],
  /** Los anillos aparecen rápido: si tardan, el tramo donde se ven se acaba. */
  ringsIn: [0.01, 0.07],
  ringsOut: [0.38, 0.52],
  /** Las frases entran flotando. */
  phrases: [0.16, 0.86],
  /** Aceleración final hacia la singularidad. */
  collapse: [0.82, 0.96],
  /** Todo se apaga y entra el contacto. */
  fadeOut: [0.94, 1],
} as const;

/** Curva de aceleración: lenta al principio, se dispara al final. */
export function speedCurve(progress: number): number {
  return progress * progress * (3 - 2 * progress) * 0.55 + progress ** 4 * 0.45;
}

/** Interpolación normalizada dentro de un tramo de `STAGE`, recortada a [0,1]. */
export function stageProgress(progress: number, stage: readonly [number, number]): number {
  const [start, end] = stage;
  if (end === start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}
