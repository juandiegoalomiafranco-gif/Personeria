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

/**
 * Cuántas estelas.
 *
 * Suben con el adelgazamiento: una estela más fina cubre menos encuadre, y a
 * 1200 el radial se quedaba ralo. El coste por instancia es el mismo — es un
 * `InstancedMesh`, así que son 300 matrices más, no 300 draw calls más.
 */
export const STREAK_COUNT = 1500;

/**
 * Grosor de la estela en pantalla, como fracción del alto del viewport.
 *
 * El grosor en mundo se calcula por instancia multiplicando por su distancia a
 * la cámara, de modo que el ancho proyectado sea constante. Con un grosor fijo
 * en mundo, la perspectiva engorda las estelas cercanas hasta volverlas manchas
 * y el radial deja de leerse — la referencia las mantiene finas de punta a punta.
 */
export const STREAK_THICKNESS_K = 0.0018;

/** Velocidad al entrar a la sección y al final, en unidades por segundo. */
export const SPEED_MIN = 14;
export const SPEED_MAX = 190;

/** Largo de la estela como múltiplo de la velocidad. */
export const STREAK_FACTOR = 0.085;

/**
 * Peso relativo de cada ranura de la paleta.
 *
 * Los colores ya no viven aquí: los pone el capítulo, en `chapters.ts`. Lo que
 * queda es el reparto, que es estable en todo el recorrido — la ranura 0 domina
 * el encuadre y la 3 es la rara, mande el capítulo que mande. Gracias a eso el
 * cambio de paleta es interpolar cinco colores por frame y no reasignar los
 * 1500 de las instancias.
 */
export const STREAK_WEIGHTS = [0.42, 0.18, 0.16, 0.09, 0.15] as const;

/** Cuántas ranuras tiene la paleta. Es el largo de `Chapter["streaks"]`. */
export const PALETTE_SLOTS = STREAK_WEIGHTS.length;

/**
 * Reacción a la velocidad del scroll.
 *
 * Hasta aquí el largo de la estela dependía solo de la POSICIÓN dentro de la
 * sección, así que al soltar la rueda las estelas se quedaban igual de largas
 * y el túnel parecía una foto. Lo que vende el salto hiperespacial es que se
 * estire cuando empujas y se recoja cuando paras.
 */

/**
 * Cuánto se alarga la estela a velocidad máxima, como multiplicador.
 *
 * Se probó a 2.4 y las estelas se volvían barras que llenaban la pantalla y
 * dejaban el titular ilegible. En la referencia, incluso a toda velocidad,
 * siguen viéndose huecos negros entre estela y estela: el efecto es que
 * atraviesas algo, no que la pantalla se pinta entera.
 */
export const VELOCITY_STRETCH = 1;

/** Cuánto acelera el avance a velocidad máxima, como multiplicador. */
export const VELOCITY_SPEED = 0.45;

/** Anillos lima que se atraviesan. */
export const RING_COUNT = 6;
export const RING_RADIUS = 3.9;
/** Segmentos del círculo. 128 ya no muestra facetas a ningún tamaño. */
export const RING_SEGMENTS = 128;
/** Casi de canto: es lo que los convierte en elipses aplastadas en pantalla. */
export const RING_TILT = -1.25;

/**
 * Etapas globales del pin, en fracción de su progreso.
 *
 * Solo quedan las tres que valen para el recorrido entero. Lo que antes eran
 * `ringsIn`, `ringsOut` y `phrases` lo decide ahora cada capítulo: los anillos
 * por su campo `rings` y las frases por el capítulo al que pertenecen.
 */
export const STAGE = {
  /** Las estelas aparecen al anclarse la sección. */
  fadeIn: [0, 0.05],
  /** Aceleración final hacia la singularidad, ya dentro del último capítulo. */
  collapse: [0.86, 0.97],
  /** Todo se apaga y entran las propuestas. */
  fadeOut: [0.95, 1],
} as const;

/**
 * Curva de aceleración del recorrido completo: lenta al principio, se dispara
 * al final.
 *
 * Encima de esto, cada capítulo aplica su propio multiplicador `speed`, así que
 * la velocidad que se ve es el producto de las dos. La curva sigue haciendo
 * falta para que dentro de un mismo capítulo el avance no sea plano.
 */
export function speedCurve(progress: number): number {
  return progress * progress * (3 - 2 * progress) * 0.55 + progress ** 4 * 0.45;
}

/** Interpolación normalizada dentro de un tramo de `STAGE`, recortada a [0,1]. */
export function stageProgress(progress: number, stage: readonly [number, number]): number {
  const [start, end] = stage;
  if (end === start) return progress >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}
