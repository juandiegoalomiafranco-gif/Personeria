/**
 * Capítulos del giro.
 *
 * El túnel dejó de ser un efecto de cinco pantallas con un titular que salta en
 * tercios: ahora es un recorrido de capítulos, y esta tabla es la única fuente
 * de verdad de cuánto dura cada uno y qué aspecto tiene. Cambiar el arco visual
 * de la sección es editar este archivo, no abrir cinco componentes.
 *
 * Los capítulos se reparten en partes iguales del progreso del pin, así que el
 * número de entradas de aquí y el de `tunnel.chapters` en `content/` **tienen
 * que coincidir**: la línea *i* del copy se cuenta con la paleta *i*.
 */

/** Un capítulo del recorrido. */
export interface Chapter {
  /** Identificador estable. No se pinta: sirve para leer diffs de esta tabla. */
  readonly id: string;
  /**
   * Un color por ranura de paleta. El orden es el de `STREAK_WEIGHTS`, así que
   * la ranura 0 es la que domina el encuadre y la 4 la más rara.
   */
  readonly streaks: readonly [string, string, string, string, string];
  /** Color de los anillos de este capítulo. */
  readonly ring: string;
  /** Cuántos anillos se ven, de 0 a `RING_COUNT`. Fraccionario: se interpola. */
  readonly rings: number;
  /**
   * Token CSS con el fondo de página del capítulo.
   *
   * Es un token y no un hex porque el tema claro los redefine, y el túnel los
   * lee con `getComputedStyle` — el mismo camino que ya usa `HeroShader` para
   * que cambiar de tema no obligue a tocar el 3D.
   */
  readonly bgToken: string;
  /** Intensidad del degradé del backdrop durante el capítulo. Va a `--glow`. */
  readonly glow: number;
  /** Multiplicador sobre la velocidad base del túnel. */
  readonly speed: number;
  /**
   * Fracción de las estelas que se dibujan. El resto se escala a cero.
   *
   * Ninguna llega a 1. Con el campo completo y las estelas ya estiradas por la
   * velocidad del capítulo, el radial se cierra y la pantalla queda pintada de
   * lado a lado: se pierden los huecos negros entre estela y estela, que son los
   * que hacen que se lea como atravesar algo y no como un fondo de color.
   */
  readonly density: number;
}

/**
 * El arco.
 *
 * Va de una deriva fría y casi vacía —el capítulo donde solo se dice quiénes
 * son— a un blanco denso a toda velocidad justo antes de entregarle el turno a
 * las propuestas. El verde profundo del capítulo 2 es el mismo `--bg-deep` del
 * contacto: es el único momento del recorrido donde el fondo se ilumina, y por
 * eso cae en el capítulo que habla de dónde vienen.
 */
export const CHAPTERS = [
  {
    id: "quienes",
    streaks: ["#22e8c4", "#1a9c8a", "#3fd9b0", "#c0fe04", "#ffffff"],
    ring: "#c0fe04",
    rings: 6,
    bgToken: "--chapter-bg-1",
    glow: 0,
    speed: 0.5,
    density: 0.5,
  },
  {
    id: "origen",
    streaks: ["#12b46a", "#0e9e57", "#6ee36b", "#c0fe04", "#ffffff"],
    ring: "#6ee36b",
    rings: 3,
    bgToken: "--chapter-bg-2",
    glow: 1,
    speed: 0.72,
    density: 0.6,
  },
  {
    id: "motivo",
    streaks: ["#c0fe04", "#9fd400", "#6ee36b", "#22e8c4", "#ffffff"],
    ring: "#c0fe04",
    rings: 0,
    bgToken: "--chapter-bg-3",
    glow: 0.55,
    speed: 0.88,
    density: 0.72,
  },
  {
    id: "promesa",
    streaks: ["#ffffff", "#c0fe04", "#e4ffa6", "#22e8c4", "#ffffff"],
    ring: "#ffffff",
    rings: 0,
    bgToken: "--chapter-bg-4",
    glow: 0,
    speed: 1,
    density: 0.85,
  },
] as const satisfies readonly Chapter[];

export const CHAPTER_COUNT = CHAPTERS.length;

/**
 * Cuánto scroll ocupa cada capítulo, en múltiplos del alto del viewport.
 *
 * 130 es el número con el que un capítulo se lee entero sin llegar a aburrir:
 * por debajo de 110 las palabras se encienden tan rápido que el scrub no se
 * percibe, y por encima de 150 la sección empieza a sentirse un peaje antes de
 * llegar a las propuestas.
 */
export const CHAPTER_RUNWAY_VH = 130;

/**
 * Fracción final de cada capítulo que se solapa con el siguiente.
 *
 * Es la zona donde la paleta, la energía y el fondo se interpolan. Sin ella el
 * cambio de capítulo sería una conmutación, que es justo lo que hacía el diseño
 * viejo y lo que se siente como un carrusel.
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
   * Es lo que usan las frases 3D y los bloques de texto para saber si les toca
   * estar en pantalla, sin tener que reconstruir `index + local`.
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
 * nuevo: esto corre dentro de `useFrame` en tres componentes a la vez, y el
 * resto del túnel ya evita crear basura por frame por la misma razón.
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

/** Interpola un número entre el capítulo actual y el siguiente. */
export function blendValue(cursor: ChapterCursor, pick: (chapter: Chapter) => number): number {
  const from = pick(CHAPTERS[cursor.index] ?? CHAPTERS[0]);
  if (cursor.blend === 0) return from;
  const to = pick(CHAPTERS[cursor.next] ?? CHAPTERS[0]);
  return from + (to - from) * cursor.blend;
}
