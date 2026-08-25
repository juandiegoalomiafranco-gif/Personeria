/**
 * Curvas de easing del proyecto.
 *
 * Las marcadas EXACTO están extraídas del HTML servido por la referencia; el
 * resto son la librería curada estándar. Ningún componente debe escribir un
 * `cubic-bezier` a mano: si hace falta una curva nueva, se agrega aquí.
 */

export type Bezier = readonly [number, number, number, number];

export const EASE = {
  /** EXACTO — barra del preloader al llenarse. quint out. */
  preloaderFill: [0.22, 1, 0.36, 1],
  /** EXACTO — fade del preloader al desaparecer. quart out. */
  preloaderFade: [0.25, 1, 0.5, 1],
  /** EXACTO — trazo de la firma SVG. cubic in-out. */
  signatureDraw: [0.65, 0, 0.35, 1],

  /** Snappy y premium. El default para reveals. */
  expoOut: [0.16, 1, 0.3, 1],
  /** Como expoOut pero menos agresivo al final. */
  quintOut: [0.22, 1, 0.36, 1],
  /** Simétrico y suave. Para transiciones de página. */
  quintInOut: [0.83, 0, 0.17, 1],
  /** Neutral clásico. */
  cubicInOut: [0.65, 0, 0.35, 1],
  /** Overshoot ligero. Para micro-interacciones juguetonas. */
  backOut: [0.34, 1.56, 0.64, 1],
  /** Suave a ambos lados, sin rebote. El look "Awwwards". */
  smoothPower: [0.6, 0.01, 0.05, 0.95],
  /** Material Design estándar. */
  materialStandard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, Bezier>;

export type EaseName = keyof typeof EASE;

/** Serializa una curva a la sintaxis `cubic-bezier()` de CSS. */
export function toCss(ease: Bezier): string {
  return `cubic-bezier(${ease.join(", ")})`;
}

/** Nombre equivalente en la sintaxis de GSAP, para las curvas que lo tienen. */
export const GSAP_EASE = {
  expoOut: "expo.out",
  quintOut: "quint.out",
  quintInOut: "quint.inOut",
  cubicInOut: "power2.inOut",
  backOut: "back.out(1.7)",
  smoothPower: "power3.inOut",
} as const;

/** Configuraciones de spring para gestos y seguimiento del cursor. */
export const SPRING = {
  /** Elástico y orgánico. Hovers tipo Notion. */
  soft: { stiffness: 100, damping: 15 },
  /** Contenido y rápido. Botones tipo iOS, efecto magnético. */
  snappy: { stiffness: 400, damping: 30 },
  /** Muy rápido, casi sin recorrido. Toggles. */
  instant: { stiffness: 700, damping: 30 },
  /** Pesado. Drawers y sheets. */
  heavy: { stiffness: 200, damping: 40 },
} as const;
