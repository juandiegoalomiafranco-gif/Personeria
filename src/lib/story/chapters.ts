/**
 * Capítulos del relato.
 *
 * La sección que cuenta quiénes son es un pin largo dividido en capítulos: cada
 * uno trae unas líneas de la frase y su propio color de fondo. Esta tabla es la
 * única fuente de verdad de cuántos hay y de qué tono tiene cada uno.
 *
 * Los capítulos se reparten en partes iguales del progreso del pin, así que el
 * número de entradas de aquí y el de `story.chapters` en `content/` **tienen que
 * coincidir**: el capítulo *i* del copy se pinta con el tono *i*.
 */

/** Un capítulo del recorrido. */
export interface Chapter {
  /** Identificador estable. No se pinta: sirve para leer diffs de esta tabla. */
  readonly id: string;
  /**
   * Token CSS del color base del capítulo.
   *
   * Va a `--bg` —el color del `body`— y es también el pie del degradado, para
   * que la capa y el fondo de la página no tengan costura.
   *
   * Es un token y no un hex porque el tema claro los redefine, y la sección los
   * lee con `getComputedStyle`: el mismo camino que ya usa `HeroShader` para que
   * cambiar de tema no obligue a tocar el color en JS.
   */
  readonly bgToken: string;
  /** Token del tinte que florece en la parte alta del degradado. */
  readonly tintToken: string;
}

/**
 * El arco de color.
 *
 * Arranca casi en el negro verdoso del hero para que el paso desde los nombres
 * no se note, florece en el medio —que es donde la frase dice de dónde vienen— y
 * vuelve a bajar al negro en el último capítulo, que es lo que espera el
 * manifiesto justo debajo.
 */
export const CHAPTERS = [
  { id: "quienes", bgToken: "--chapter-bg-1", tintToken: "--chapter-tint-1" },
  { id: "origen", bgToken: "--chapter-bg-2", tintToken: "--chapter-tint-2" },
  { id: "motivo", bgToken: "--chapter-bg-3", tintToken: "--chapter-tint-3" },
  { id: "promesa", bgToken: "--chapter-bg-4", tintToken: "--chapter-tint-4" },
] as const satisfies readonly Chapter[];

export const CHAPTER_COUNT = CHAPTERS.length;

/**
 * Cuánto scroll ocupa cada capítulo, en múltiplos del alto del viewport.
 *
 * 130 es el número con el que un capítulo se lee entero sin llegar a aburrir:
 * por debajo de 110 las palabras se encienden tan rápido que el scrub no se
 * percibe, y por encima de 150 la sección empieza a sentirse un peaje antes de
 * llegar al resto de la página.
 */
export const CHAPTER_RUNWAY_VH = 130;

/**
 * Fracción final de cada capítulo que se solapa con el siguiente.
 *
 * Es la zona donde el color de fondo y los bloques de texto se cruzan. Sin ella
 * el cambio de capítulo sería una conmutación, y el recorrido se leería como
 * cuatro diapositivas en vez de como un solo movimiento.
 */
export const CHAPTER_BLEND = 0.18;

/** Dónde está el scroll dentro del recorrido. */
export interface ChapterCursor {
  /** Capítulo actual. */
  index: number;
  /** Capítulo hacia el que se está mezclando. Igual a `index` fuera del solape. */
  next: number;
  /** Progreso dentro del capítulo actual, de 0 a 1. */
  local: number;
  /** Mezcla hacia `next`, de 0 a 1. Vale 0 en todo el cuerpo del capítulo. */
  blend: number;
  /**
   * Posición continua en el recorrido, de 0 a `CHAPTER_COUNT`.
   *
   * Es lo que usan los bloques de texto y las capas del fondo para saber cuánto
   * les toca estar en pantalla, sin reconstruir `index + local`.
   */
  position: number;
}

export function createChapterCursor(): ChapterCursor {
  return { index: 0, next: 0, local: 0, blend: 0, position: 0 };
}

/**
 * Traduce el progreso del pin a una posición en el recorrido.
 *
 * Escribe sobre un cursor que le pasa quien llama en vez de devolver un objeto
 * nuevo: esto corre en cada frame del scroll.
 */
export function chapterAt(progress: number, out: ChapterCursor): ChapterCursor {
  const position = Math.min(CHAPTER_COUNT, Math.max(0, progress * CHAPTER_COUNT));
  // El último capítulo tiene que quedarse en el índice N-1 cuando el progreso
  // llega exactamente a 1, o el cursor apuntaría a un capítulo que no existe.
  const index = Math.min(CHAPTER_COUNT - 1, Math.floor(position));
  const local = Math.min(1, position - index);

  const blend =
    local <= 1 - CHAPTER_BLEND ? 0 : Math.min(1, (local - (1 - CHAPTER_BLEND)) / CHAPTER_BLEND);

  out.index = index;
  out.next = Math.min(CHAPTER_COUNT - 1, index + 1);
  out.local = local;
  out.blend = blend;
  out.position = position;
  return out;
}

/**
 * Cuánto se ve la capa de fondo del capítulo `index`.
 *
 * Las cuatro capas del degradado van apiladas y opacas, y lo único que se anima
 * es su opacidad: la capa `i` entra durante el solape que hay al final del
 * capítulo `i-1` y a partir de ahí tapa a las de abajo. La capa 0 está siempre
 * al 100% porque es el suelo de la pila.
 *
 * Se hace así, y no reescribiendo los colores de un solo degradado, porque
 * cambiarle las paradas a un degradado obliga a rerasterizar la pantalla entera
 * en cada frame — en este mismo repo eso ya midió casi el doble de tiempo de
 * arranque del scroll. La opacidad, en cambio, la resuelve el compositor.
 *
 * El resultado es monótono respecto al scroll, así que subir deshace el cruce
 * exactamente por donde lo hizo al bajar.
 */
export function layerWeight(position: number, index: number): number {
  if (index <= 0) return 1;
  return Math.min(1, Math.max(0, (position - (index - CHAPTER_BLEND)) / CHAPTER_BLEND));
}
