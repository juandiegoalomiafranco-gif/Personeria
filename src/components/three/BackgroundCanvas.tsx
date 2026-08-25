"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { useScroll } from "@/providers/ScrollProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { MAX_DPR, useQualityTier } from "@/hooks/useQualityTier";
import { createProgressStore } from "@/lib/scroll/progress";
import { InflatedType } from "./InflatedType";

/**
 * Canvas de fondo con la tipografía 3D.
 *
 * Va fijo detrás de todo el contenido y nunca se mueve: la página scrollea por
 * encima. Esa es la fuente de la sensación de profundidad de la referencia — no
 * hay parallax, hay un objeto que gira a su propio ritmo mientras el texto pasa
 * por delante.
 *
 * Las secciones que quieren tipografía 3D se declaran con `data-type3d="PALABRA"`
 * y este componente las observa, igual que `data-section-bg`. Así no hay que
 * cablear un provider ni que las secciones sepan que existe un canvas.
 */
export function BackgroundCanvas() {
  const { scroller } = useScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const tier = useQualityTier();
  const [progress] = useState(createProgressStore);
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    if (!scroller) return;

    const sections = document.querySelectorAll<HTMLElement>("[data-type3d]");
    const triggers = [...sections].map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          if (!self.isActive) return;
          progress.value = self.progress;
        },
        onToggle: (self) => {
          progress.active = self.isActive;
          // La palabra solo cambia al entrar o salir de una sección: son dos o
          // tres veces en toda la página, así que el estado de React va bien.
          setWord(self.isActive ? (section.dataset.type3d ?? null) : null);
        },
      }),
    );

    ScrollTrigger.refresh();
    return () => {
      for (const trigger of triggers) trigger.kill();
    };
    // `word` cambia con el idioma, así que hay que rehacer los triggers cuando
    // el DOM se re-renderiza con el diccionario nuevo.
  }, [scroller, progress]);

  const active = word !== null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-1"
      style={{ opacity: active ? 1 : 0, transition: "opacity 450ms ease-out" }}
    >
      {active ? (
        <Canvas
          frameloop={prefersReducedMotion ? "demand" : "always"}
          camera={{ position: [0, 0, 6.5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, MAX_DPR[tier]]}
        >
          <Suspense fallback={null}>
            <InflatedType word={word} progress={progress} />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
