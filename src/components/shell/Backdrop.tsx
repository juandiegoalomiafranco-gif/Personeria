"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "@/providers/PointerProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { damp } from "@/lib/utils";

/** Suavizado del seguimiento: fracción de distancia restante tras un segundo. */
const SMOOTHING = 0.0015;

/**
 * Fondo degradado de la página.
 *
 * El color plano dejaba el hero muerto: en la referencia el fondo tiene volumen
 * — dos focos difusos y unos haces inclinados que insinúan una luz fuera de
 * cuadro. Aquí es lo mismo, con tres capas de gradiente encima del color base.
 *
 * Va en CSS y no en un shader a propósito. Un plano a pantalla completa en
 * WebGL volvería a meter presión de relleno justo donde se acaba de quitar, y
 * el compositor del navegador pinta estos gradientes gratis.
 *
 * El color base es `var(--bg)`, la misma variable que conmuta el scroll, así
 * que el fondo sigue cambiando por sección y respeta el tema claro sin que este
 * componente sepa nada de ninguno de los dos. `--glow` lo apaga en los tramos
 * negros.
 *
 * El foco que sigue al puntero es un elemento aparte que se mueve con
 * `transform`, no un `radial-gradient` al que se le cambia el centro. La
 * diferencia es enorme y se midió: recolocar el centro obliga al navegador a
 * **rerasterizar el gradiente a pantalla completa en cada frame**, y eso le
 * robaba turnos a Lenis — el arranque del scroll se iba de 969 a casi 2000 ms.
 * Un `transform` lo resuelve el compositor sin repintar nada.
 *
 * La posición se escribe directo al `style` desde un rAF, el mismo patrón que
 * el cursor: React no se entera de nada.
 */
export function Backdrop() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { state } = usePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const element = glowRef.current;
    if (!element) return;

    // Arranca en el centro y no en 0,0: sin puntero — al cargar, o en una
    // pantalla táctil — el degradé tiene que quedar compuesto igual.
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.38;
    let lastX = Number.NaN;
    let lastY = Number.NaN;
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;

      if (state.active) {
        x = damp(x, state.x, SMOOTHING, delta);
        y = damp(y, state.y, SMOOTHING, delta);
      }

      // Solo se escribe si de verdad se movió. Con el ratón quieto —que es
      // justo cuando el usuario está scrolleando— no se toca el DOM en absoluto.
      if (Math.abs(x - lastX) > 0.4 || Math.abs(y - lastY) > 0.4) {
        lastX = x;
        lastY = y;
        element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion, state]);

  return (
    <div aria-hidden="true" className="backdrop pointer-events-none fixed inset-0 -z-2">
      <div ref={glowRef} className="backdrop__glow" />
    </div>
  );
}
