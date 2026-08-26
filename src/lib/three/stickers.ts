import type { QualityTier } from "@/hooks/useQualityTier";

/** Forma de cada sticker. Se mapea a una geometría en `Sticker.tsx`. */
export type StickerShape =
  "cursor" | "heart" | "spark" | "coin" | "ring" | "capsule" | "box" | "blob";

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
  // El reparto esquiva dos zonas: el titular de tres líneas abajo a la
  // izquierda y el párrafo de intro arriba a la derecha. Cruzarse con el texto
  // está bien —en la referencia el corazón pisa una palabra— pero sentarse
  // encima de una letra se lee como un accidente, no como una decisión.
  { id: "cursor", shape: "cursor", color: "#1fd07a", size: 0.62, at: [0.82, -0.12], mass: 1.2 },
  { id: "heart", shape: "heart", color: "#ff4fa3", size: 0.38, at: [0.5, -0.66], mass: 0.9 },
  { id: "ring", shape: "ring", color: "#22e8c4", size: 0.36, at: [0.04, 0.66], mass: 1 },
  { id: "coin", shape: "coin", color: "#c0fe04", size: 0.4, at: [-0.62, 0.44], mass: 1.4 },
  { id: "capsule", shape: "capsule", color: "#12b46a", size: 0.34, at: [-0.94, 0.2], mass: 1 },
  {
    id: "spark",
    shape: "spark",
    color: "#ffffff",
    size: 0.32,
    at: [0.42, 0.74],
    mass: 0.8,
    metal: true,
  },
  { id: "box", shape: "box", color: "#6ee36b", size: 0.26, at: [0.3, -0.34], mass: 1.2 },
  { id: "blob", shape: "blob", color: "#0e9e57", size: 0.24, at: [0.74, -0.74], mass: 0.9 },
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
 *
 * A 0.16 la deriva ganaba igual y en unos segundos varios terminaban recortados
 * contra el borde del encuadre, que es un accidente y se nota como tal.
 */
export const HOME_SPRING = 0.3;

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
