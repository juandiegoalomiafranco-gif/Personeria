import type { QualityTier } from "@/hooks/useQualityTier";

/** Forma de cada sticker. Se mapea a una geometría en `Sticker.tsx`. */
export type StickerShape = "coin" | "capsule" | "ring" | "gem" | "bolt" | "heart" | "cube";

export interface StickerSpec {
  readonly id: string;
  readonly shape: StickerShape;
  readonly color: string;
  /** Escala en unidades de mundo. */
  readonly size: number;
  /** Posición inicial normalizada al viewport, de -1 a 1. */
  readonly at: readonly [number, number];
  /** Multiplicador de masa. Los pesados se mueven menos con el cursor. */
  readonly mass: number;
  readonly metal?: boolean;
}

/**
 * Reparto de los stickers.
 *
 * Nacen repartidos por los bordes y las esquinas, nunca en el centro: ahí va el
 * titular y la tipografía 3D. La gravedad baja hace el resto — en unos segundos
 * el conjunto se acomoda solo y ya nunca vuelve a estar igual.
 */
export const STICKERS: readonly StickerSpec[] = [
  { id: "coin", shape: "coin", color: "#c0fe04", size: 0.42, at: [-0.72, 0.55], mass: 1.4 },
  { id: "bolt", shape: "bolt", color: "#8ea2ff", size: 0.4, at: [0.68, 0.62], mass: 0.8 },
  { id: "heart", shape: "heart", color: "#ff4fa3", size: 0.36, at: [-0.55, -0.42], mass: 0.9 },
  { id: "ring", shape: "ring", color: "#22e0e8", size: 0.38, at: [0.78, -0.28], mass: 1 },
  {
    id: "gem",
    shape: "gem",
    color: "#ffffff",
    size: 0.3,
    at: [0.12, 0.72],
    mass: 1.1,
    metal: true,
  },
  { id: "capsule", shape: "capsule", color: "#4a50e0", size: 0.34, at: [-0.86, 0.05], mass: 1 },
  { id: "cube", shape: "cube", color: "#c0fe04", size: 0.26, at: [0.45, -0.66], mass: 1.2 },
  { id: "gem2", shape: "gem", color: "#d43ff2", size: 0.28, at: [-0.22, -0.78], mass: 0.9 },
];

/** Cuántos stickers montar según el dispositivo. */
export function stickersForTier(tier: QualityTier): readonly StickerSpec[] {
  if (tier === "low") return STICKERS.slice(0, 4);
  if (tier === "medium") return STICKERS.slice(0, 6);
  return STICKERS;
}

/**
 * Gravedad nula.
 *
 * Con cualquier gravedad, por baja que sea, la amortiguación termina ganando y
 * en unos segundos los ocho objetos quedan apilados contra el borde inferior.
 * En la referencia flotan repartidos por todo el encuadre, así que lo que los
 * sostiene no es equilibrio de fuerzas: no hay peso, y cada uno orbita su
 * posición de origen con una deriva propia.
 */
export const GRAVITY: readonly [number, number, number] = [0, 0, 0];

/**
 * Constante del resorte que ata cada objeto a su posición de origen.
 *
 * Sin él, el empujón del cursor los va desplazando y la composición se
 * desbalancea sola en un minuto. Con él vuelven despacio, sin que se note que
 * hay un ancla.
 */
export const HOME_SPRING = 0.16;

/** Amplitud y velocidad de la deriva que los mantiene vivos cuando nadie toca. */
export const DRIFT_FORCE = 0.02;
export const DRIFT_SPEED = 0.22;

/** Radio de influencia del cursor, en unidades de mundo. */
export const CURSOR_RADIUS = 1.9;

/** Fuerza del empujón del cursor. */
export const CURSOR_FORCE = 0.055;

/** Amortiguación. Alta para que todo se mueva como dentro de un fluido. */
export const LINEAR_DAMPING = 0.75;
export const ANGULAR_DAMPING = 0.5;
