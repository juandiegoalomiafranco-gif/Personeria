"use client";

import { useCallback, useSyncExternalStore } from "react";

export type QualityTier = "low" | "medium" | "high";

/**
 * Calidad de render según el dispositivo.
 *
 * La mayoría de las visitas a un sitio de campaña escolar llegan desde el
 * celular, donde el coste real del túnel no son los triángulos sino el número de
 * píxeles que hay que pintar: un teléfono con pantalla 3x tiene que rellenar más
 * área que un portátil. Por eso el escalón lo marcan el ancho y la densidad de
 * pantalla juntos, no solo el ancho.
 */
function detectTier(): QualityTier {
  const width = window.innerWidth;
  const density = Math.min(window.devicePixelRatio || 1, 3);
  const pixels = width * window.innerHeight * density * density;

  if (width < 768 || pixels > 12_000_000) return "low";
  if (width < 1280 || pixels > 6_000_000) return "medium";
  return "high";
}

const MULTIPLIER: Record<QualityTier, number> = {
  low: 0.32,
  medium: 0.6,
  high: 1,
};

/** Techo de `devicePixelRatio` por escalón. Renderizar a 3x no aporta aquí. */
export const MAX_DPR: Record<QualityTier, number> = {
  low: 1.5,
  medium: 1.75,
  high: 2,
};

export function useQualityTier(): QualityTier {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }, []);

  // En el servidor asumimos el escalón más bajo: si el dispositivo da para más,
  // el primer render del cliente lo sube, y nunca al revés.
  return useSyncExternalStore(subscribe, detectTier, () => "low");
}

/** Escala una cantidad de instancias al escalón de calidad. */
export function scaleForTier(count: number, tier: QualityTier): number {
  return Math.max(120, Math.round(count * MULTIPLIER[tier]));
}
