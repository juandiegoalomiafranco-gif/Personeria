"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "@/providers/PointerProvider";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { damp } from "@/lib/utils";

/** Suavizado del seguimiento: fracción de distancia restante tras un segundo. */
const SMOOTHING = 0.0001;

/**
 * Cursor personalizado: un cuadrito lima que persigue al puntero con retraso.
 *
 * Reemplaza al cursor del sistema, así que solo se monta con puntero fino — en
 * touch dejaría al usuario sin ningún indicador. Se anima escribiendo directo
 * al `style` desde un rAF: React nunca re-renderiza durante el movimiento.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const { state } = usePointer();
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!hasFinePointer) return;

    const element = ref.current;
    if (!element) return;

    // La clase le dice al CSS que oculte el cursor nativo. Solo se aplica
    // cuando este componente está realmente vivo.
    document.documentElement.classList.add("has-custom-cursor");

    let x = state.x;
    let y = state.y;
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;

      if (prefersReducedMotion) {
        x = state.x;
        y = state.y;
      } else {
        x = damp(x, state.x, SMOOTHING, delta);
        y = damp(y, state.y, SMOOTHING, delta);
      }

      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${state.down ? 0.6 : 1})`;
      element.style.opacity = state.active ? "1" : "0";

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [hasFinePointer, prefersReducedMotion, state]);

  if (!hasFinePointer) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="bg-accent pointer-events-none fixed top-0 left-0 z-[100] size-2.5 opacity-0 will-change-transform"
      style={{ transition: "opacity 150ms ease-out, scale 120ms ease-out" }}
    />
  );
}
