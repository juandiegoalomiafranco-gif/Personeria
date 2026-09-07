"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { QualityTier } from "@/hooks/useQualityTier";

/**
 * Cuántas veces por segundo se redibuja el canvas que lo contiene.
 *
 * El scroll necesita 60; el 3D decorativo no. La tipografía gira a 0.055–0.085
 * rad/s y los stickers flotan: a 30 fps ninguno de los dos se distingue de 60,
 * y el frame que se ahorra queda para la interpolación de Lenis.
 */
const TARGET_FPS: Record<QualityTier, number> = {
  // Se probó a 60 en `high` y el arranque del scroll pasó de 969 a 1877 ms
  // medido con rueda de verdad: el script inflado cuesta 61.000 triángulos por
  // frame, más que la sans que sustituye, y a 60 vuelve a competir con Lenis
  // por el mismo `requestAnimationFrame`. A 30 el giro de la palabra no se
  // distingue y el scroll recupera su turno.
  high: 30,
  medium: 30,
  low: 24,
};

interface FrameCapProps {
  tier: QualityTier;
}

/**
 * Limita el redibujado de un canvas y lo desacopla del scroll.
 *
 * Lenis interpola dentro del ticker de GSAP, que corre en el mismo
 * `requestAnimationFrame` que dibuja el WebGL. Cuando el render es caro, cada
 * frame perdido es una actualización de scroll que no ocurre: exactamente la
 * sensación de que la página va colgando de la rueda.
 *
 * Va **dentro** del `<Canvas>` a propósito, para invalidar el root propio y no
 * los demás. El primer intento usaba `advance()` a nivel de módulo, que
 * redibuja todos los roots sin mirar el `frameloop` de cada uno: habría
 * despertado el canvas del túnel — 900 estelas con transparencia — durante toda
 * la página. Con `invalidate` por root, un canvas que deja de invalidar deja de
 * dibujar, y desmontarlo mata su bucle solo.
 *
 * Requiere `frameloop="demand"` en el canvas: con `"never"`, `invalidate` sale
 * sin hacer nada.
 */
export function FrameCap({ tier }: FrameCapProps) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const interval = 1000 / TARGET_FPS[tier];
    let frame = 0;
    // En 0 para que el primer frame se dibuje de inmediato y no haya un hueco
    // en negro mientras se cumple el primer intervalo.
    let last = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < interval) return;
      last = now;
      invalidate();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, tier]);

  return null;
}
