/**
 * Mezcla de colores sin dependencias.
 *
 * El fondo del giro se interpola en el hilo principal, dentro del `onUpdate` de
 * un `ScrollTrigger`, no en la escena 3D. `Color` de three haría el trabajo,
 * pero importarlo desde un componente que **no** va detrás de un `dynamic()`
 * metería three entero en el bundle inicial — los ~810 KB que el proyecto se
 * cuida de mantener fuera. Son treinta líneas: se hacen aquí.
 */

/** Un color ya descompuesto, con cada canal de 0 a 255. */
export type Rgb = readonly [number, number, number];

const BLACK: Rgb = [0, 0, 0];

/**
 * Convierte `#rgb` o `#rrggbb` a canales.
 *
 * Acepta la cadena tal como la devuelve `getPropertyValue`, que llega con
 * espacios alrededor. Cualquier cosa que no sea un hexadecimal reconocible cae
 * en negro, que es el fondo por defecto del sitio: un token mal escrito deja la
 * sección oscura, no en blanco.
 */
export function parseHex(value: string): Rgb {
  const hex = value.trim().replace(/^#/, "");

  if (hex.length === 3) {
    const r = hex[0];
    const g = hex[1];
    const b = hex[2];
    if (!r || !g || !b) return BLACK;
    return [
      Number.parseInt(r + r, 16),
      Number.parseInt(g + g, 16),
      Number.parseInt(b + b, 16),
    ] as const;
  }

  if (hex.length !== 6) return BLACK;
  const parsed = Number.parseInt(hex, 16);
  if (Number.isNaN(parsed)) return BLACK;
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255] as const;
}

/**
 * Mezcla dos colores y devuelve una cadena `rgb()`.
 *
 * La interpolación es en sRGB directo. Para colores saturados eso da mezclas
 * apagadas a mitad de camino, pero aquí solo se mezclan fondos casi negros —
 * negro, verde profundo — donde la diferencia con una mezcla perceptual no se
 * ve, y en cambio esto no cuesta nada por frame.
 */
export function mixRgb(from: Rgb, to: Rgb, t: number): string {
  const amount = Math.min(1, Math.max(0, t));
  const r = Math.round(from[0] + (to[0] - from[0]) * amount);
  const g = Math.round(from[1] + (to[1] - from[1]) * amount);
  const b = Math.round(from[2] + (to[2] - from[2]) * amount);
  return `rgb(${r} ${g} ${b})`;
}
