/**
 * Cursor y su estela.
 *
 * El puntero de la referencia no es un punto: es un cuadrito que lidera y una
 * cola de cuadraditos que lo persiguen con retraso creciente, cada uno más
 * pequeño y más tenue. Lo que da la sensación de peso no es la velocidad sino
 * el escalonamiento — que cada eslabón persiga al anterior y no al puntero.
 */

/** Cuántos cuadraditos van detrás del que lidera. */
export const TRAIL_LENGTH = 7;

/** Lado del cuadrito que lidera, en píxeles. */
export const HEAD_SIZE = 10;

/**
 * Suavizado del que lidera: fracción de distancia que queda tras un segundo.
 *
 * Va bajísimo a propósito. `damp` es independiente del framerate, así que este
 * número es "cuánto queda sin recorrer después de un segundo": 0.0001 significa
 * que prácticamente alcanza al puntero, con el punto justo de retraso para que
 * se sienta un objeto y no el cursor del sistema.
 */
export const HEAD_SMOOTHING = 0.0001;

/**
 * Suavizado de cada eslabón de la cola.
 *
 * Más alto que el de la cabeza: cuanto más alto, más se queda atrás. Cada
 * eslabón persigue la posición del anterior, no la del puntero, y de esa cadena
 * sale la curva que dibuja la estela al girar.
 */
export const TRAIL_SMOOTHING = 0.004;

/** Escala del eslabón `index`, de 0 a `TRAIL_LENGTH - 1`. */
export function trailScale(index: number): number {
  return 0.82 - index * 0.09;
}

/** Opacidad del eslabón `index`. */
export function trailOpacity(index: number): number {
  return 0.55 - index * 0.06;
}
