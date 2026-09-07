"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Trazos de la firma.
 *
 * Marca abstracta original, pensada como marcador de posición: cuando el
 * candidato mande su firma real se vectoriza y se reemplazan estos paths. Lo
 * que importa aquí es el mecanismo de dibujado, no el dibujo.
 *
 * `dur` es cuánto tarda cada trazo en dibujarse, en segundos.
 */
const STROKES = [
  // Trazo largo ascendente, el cuerpo de la firma.
  {
    d: "M18 118C54 96 92 62 132 44c26-12 46-8 44 10-2 16-28 30-44 22-18-9-8-34 16-46 30-15 68-18 96-6",
    w: 4,
    dur: 1.1,
  },
  // Lazo de cierre.
  {
    d: "M186 62c22 22 44 34 70 30 20-3 34-16 30-28-3-10-18-10-24 2-7 14 4 32 24 38",
    w: 4,
    dur: 0.8,
  },
  // Subrayado que remata el conjunto.
  { d: "M34 132c74 16 158 14 250-6", w: 4, dur: 0.6 },
  // Punto de acento.
  { d: "M292 40l3-13", w: 5, dur: 0.18 },
] as const;

/**
 * Retrasos acumulados de cada trazo, precalculados a nivel de módulo.
 *
 * Cada uno arranca al 85% del anterior: así la firma se siente escrita de
 * corrido y no como cuatro dibujos sueltos.
 */
const TIMED_STROKES = STROKES.reduce<{ d: string; w: number; dur: number; delay: number }[]>(
  (accumulator, stroke) => {
    const previous = accumulator.at(-1);
    const delay = previous ? previous.delay + previous.dur * 0.85 : 0;
    accumulator.push({ ...stroke, delay });
    return accumulator;
  },
  [],
);

/**
 * Firma manuscrita que se dibuja sola.
 *
 * Cada trazo se anima con `stroke-dashoffset`, arrancando cuando el SVG entra
 * al viewport. La longitud real de cada path se mide en el cliente con
 * `getTotalLength()`: hardcodearla se rompe en cuanto alguien toca un path.
 *
 * Los `--path-delay` y `--path-dur` los consume el CSS de `globals.css`, con la
 * curva exacta de la referencia.
 */
export function Signature({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    for (const path of element.querySelectorAll<SVGPathElement>(".svg-sign__path")) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setDrawing(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 154"
      fill="none"
      aria-hidden="true"
      className={cn("svg-sign", drawing && "is-drawing", className)}
    >
      {TIMED_STROKES.map((stroke, index) => (
        <path
          key={index}
          className="svg-sign__path"
          d={stroke.d}
          stroke="var(--accent)"
          strokeWidth={stroke.w}
          fill="none"
          style={
            {
              "--path-delay": `${stroke.delay}s`,
              "--path-dur": `${stroke.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}
