"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "@/providers/PointerProvider";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import {
  HEAD_SIZE,
  HEAD_SMOOTHING,
  TRAIL_LENGTH,
  TRAIL_SMOOTHING,
  trailOpacity,
  trailScale,
} from "@/lib/motion/cursor";
import { damp } from "@/lib/utils";

/** Índices de la cadena: 0 es el que lidera, el resto es la cola. */
const CHAIN = Array.from({ length: TRAIL_LENGTH + 1 }, (_, index) => index);

/**
 * Cursor personalizado: un cuadrito lima que persigue al puntero, con una cola
 * de cuadraditos detrás.
 *
 * Reemplaza al cursor del sistema, así que solo se monta con puntero fino — en
 * touch dejaría al usuario sin ningún indicador.
 *
 * Dos detalles que son los que hacen que se sienta como un objeto:
 *
 * 1. **Cada eslabón persigue al anterior, no al puntero.** Persiguiendo todos
 *    al puntero con retrasos distintos, la cola se estira y se encoge en línea
 *    recta. Encadenados, al girar dibujan la curva del recorrido.
 * 2. **Un solo `requestAnimationFrame` para los ocho elementos.** Ocho bucles
 *    independientes serían ocho lecturas de reloj y ocho tandas de escrituras
 *    al DOM por frame, y además se desincronizarían entre sí.
 *
 * Todo se escribe directo al `style`: React no re-renderiza durante el
 * movimiento.
 */
export function Cursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = usePointer();
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!hasFinePointer) return;

    const container = containerRef.current;
    if (!container) return;

    // Los nodos se leen del DOM en vez de con un array de refs: son hermanos
    // fijos y así no hay que sincronizar una estructura paralela. Se invierten
    // porque en el marcado van de más lejano a más cercano, para que el que
    // lidera quede pintado encima sin necesidad de z-index.
    const nodes = [...container.children].reverse() as HTMLElement[];

    // La clase le dice al CSS que oculte el cursor nativo. Solo se aplica
    // cuando este componente está realmente vivo.
    document.documentElement.classList.add("has-custom-cursor");

    // Un objeto por eslabón, con su nodo y su posición dentro. Se recorre con
    // `for...of` y se encadena con una variable local en vez de indexar arrays
    // paralelos: el proyecto corre con `noUncheckedIndexedAccess`, así que cada
    // índice sería un `number | undefined` que habría que comprobar ocho veces
    // por frame para nada.
    const links = nodes.map((node, index) => ({
      node,
      head: index === 0,
      x: state.x,
      y: state.y,
      scale: index === 0 ? 1 : trailScale(index - 1),
      opacity: index === 0 ? 1 : trailOpacity(index - 1),
    }));

    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;

      // La posición que persigue el eslabón actual: el puntero para el que
      // lidera, y el eslabón anterior para el resto.
      let targetX = state.x;
      let targetY = state.y;

      for (const link of links) {
        if (link.head) {
          link.x = prefersReducedMotion ? targetX : damp(link.x, targetX, HEAD_SMOOTHING, delta);
          link.y = prefersReducedMotion ? targetY : damp(link.y, targetY, HEAD_SMOOTHING, delta);
        } else if (!prefersReducedMotion) {
          link.x = damp(link.x, targetX, TRAIL_SMOOTHING, delta);
          link.y = damp(link.y, targetY, TRAIL_SMOOTHING, delta);
        }

        targetX = link.x;
        targetY = link.y;

        const scale = link.head ? (state.down ? 0.6 : 1) : link.scale;
        link.node.style.transform = `translate3d(${link.x.toFixed(2)}px, ${link.y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale})`;

        // Con movimiento reducido la cola no se dibuja: es decoración pura, y
        // ocho objetos persiguiéndose es exactamente lo que molesta a quien
        // pide menos movimiento.
        const visible = state.active && (link.head || !prefersReducedMotion);
        link.node.style.opacity = visible ? String(link.opacity) : "0";
      }

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
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-100">
      {/* De más lejano a más cercano: el orden del DOM resuelve el apilado. */}
      {[...CHAIN].reverse().map((index) => (
        <div
          key={index}
          className="bg-accent absolute top-0 left-0 opacity-0 will-change-transform"
          style={{
            width: HEAD_SIZE,
            height: HEAD_SIZE,
            transition: index === 0 ? "opacity 150ms ease-out" : "opacity 260ms ease-out",
          }}
        />
      ))}
    </div>
  );
}
