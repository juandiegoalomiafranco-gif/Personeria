"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useContent } from "@/providers/LocaleProvider";
import { useScroll } from "@/providers/ScrollProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { createProgressStore } from "@/lib/scroll/progress";
import { cn } from "@/lib/utils";

/**
 * Cuánto scroll dura el anclaje, en múltiplos del alto del viewport.
 * Es la pista sobre la que se reparten las etapas del túnel.
 */
export const TUNNEL_RUNWAY_VH = 500;

/** El canvas pesa: solo se descarga cuando la página ya está interactiva. */
const TunnelCanvas = dynamic(
  () => import("@/components/three/TunnelCanvas").then((m) => m.TunnelCanvas),
  { ssr: false },
);

/**
 * Sección anclada del túnel hiperespacial.
 *
 * Un contenedor alto de verdad con un hijo `sticky top-0`: mientras el padre
 * cruza el viewport, el hijo queda congelado y su contenido se scrubbea con el
 * progreso. Es el patrón de la referencia.
 *
 * El progreso se escribe en un objeto mutable, no en estado de React: cambia
 * cada frame y la escena 3D lo lee dentro de su propio bucle de animación. Lo
 * único que sí pasa por estado es qué titular se muestra, y eso cambia dos o
 * tres veces en toda la sección.
 */
export function Tunnel() {
  const { tunnel } = useContent();
  const { scroller } = useScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [progress] = useState(createProgressStore);
  const [statementIndex, setStatementIndex] = useState(0);

  const statementCount = tunnel.statements.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!scroller || !section || prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progress.value = self.progress;
        progress.setActive(self.isActive);

        // Los titulares se reparten en partes iguales del recorrido. Solo se
        // llama a setState cuando el índice cambia de verdad: son dos o tres
        // renders en toda la sección, no uno por frame.
        const next = Math.min(statementCount - 1, Math.floor(self.progress * statementCount));
        setStatementIndex((current) => (current === next ? current : next));
      },
      onToggle: (self) => {
        progress.setActive(self.isActive);
      },
    });

    return () => trigger.kill();
  }, [scroller, prefersReducedMotion, progress, statementCount]);

  const statement = tunnel.statements[statementIndex] ?? [];

  return (
    <section
      ref={sectionRef}
      data-section-bg="void"
      className="relative z-10 w-full"
      style={{ height: `${TUNNEL_RUNWAY_VH}vh` }}
    >
      {!prefersReducedMotion ? <TunnelCanvas phrases={tunnel.phrases} progress={progress} /> : null}

      <div className="sticky top-0 flex h-dvh w-full items-center justify-center px-4 py-18 lg:px-14 lg:py-24">
        {/* z-40 deja el titular por encima del canvas (z-30), que a su vez pasa
            por encima del chrome. Ese apilado es el de la referencia. */}
        <h2
          key={statementIndex}
          className={cn(
            "relative z-40 flex flex-col items-center justify-center text-center",
            "text-[7.2svw] leading-none font-bold uppercase lg:text-[6.8svw]",
            "[animation:statement-in_600ms_var(--ease-expo-out)_both]",
          )}
          style={{ fontVariationSettings: '"wdth" 120' }}
        >
          {statement.map((line, index) => (
            <span key={line} className="reveal-mask" style={{ animationDelay: `${index * 0.07}s` }}>
              <span className="block">{line}</span>
            </span>
          ))}
        </h2>

        {/* Las frases viven en el canvas. Aquí quedan como texto accesible. */}
        <ul className="sr-only">
          {tunnel.phrases.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
