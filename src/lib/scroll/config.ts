/**
 * Ajuste del scroll suave.
 *
 * `lerp` es la fracción de la distancia restante que Lenis cubre en cada frame,
 * así que va al revés de lo que sugiere la intuición: **más bajo es más lento**.
 * A 60 fps, 0.1 tarda unos 0.73 s en cubrir el 99% del recorrido, y ese retraso
 * se siente como si la página fuera colgando de la rueda con una goma.
 *
 *   lerp   tiempo al 99%   sensación
 *   0.06      1.24 s       muy pesado, claramente retrasado
 *   0.10      0.73 s       pesado (era el valor inicial)
 *   0.14      0.49 s       suave pero pegado a la rueda
 *   0.20      0.31 s       casi inmediato, se pierde la estela
 */
export const SCROLL_LERP = 0.14;

/**
 * Cuánto amplifica Lenis el gesto táctil.
 *
 * Por debajo de 1 el dedo se siente pesado; muy por encima, la página patina.
 * 1.6 deja el recorrido parecido al del scroll nativo del sistema.
 */
export const TOUCH_MULTIPLIER = 1.6;

/**
 * Velocidad de scroll, en píxeles por segundo, a la que el pulso satura.
 *
 * `ScrollTrigger.getVelocity()` no tiene techo: un golpe de rueda pasa de 5000
 * sin esfuerzo. Este número es el que convierte esa cifra cruda en un 0 a 1
 * con el que se puede calcular.
 */
export const VELOCITY_FULL = 2600;

/**
 * Fracción del pulso de velocidad que queda tras un segundo sin scroll.
 *
 * Bajo a propósito: con 0.01 se pierde dos tercios en el primer cuarto de
 * segundo, que es el tiempo en el que el ojo espera ver que el efecto se
 * recoge. Más alto y parece que la página tarda en obedecer.
 */
export const VELOCITY_DECAY = 0.01;
