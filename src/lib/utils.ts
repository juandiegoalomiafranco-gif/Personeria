import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases condicionales y resuelve conflictos de Tailwind (la última gana). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Rellena un número con ceros a la izquierda, como el readout `0324 X 0221 Y`. */
export function pad(value: number, length = 4): string {
  return Math.max(0, Math.round(value)).toString().padStart(length, "0");
}

/** Restringe un número al rango [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Interpolación lineal. `t` fuera de [0,1] extrapola. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Lerp independiente del framerate. `smoothing` es la fracción de distancia que
 * queda tras un segundo, así que el resultado es idéntico a 30 y a 144 fps.
 */
export function damp(from: number, to: number, smoothing: number, deltaSeconds: number): number {
  return lerp(from, to, 1 - Math.pow(smoothing, deltaSeconds));
}

/** Remapea `value` del rango de entrada al de salida, sin recortar. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax - inMin === 0) return outMin;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
