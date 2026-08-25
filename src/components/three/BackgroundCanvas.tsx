"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { useScroll } from "@/providers/ScrollProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { MAX_DPR, useQualityTier } from "@/hooks/useQualityTier";
import { createProgressStore } from "@/lib/scroll/progress";
import { useContent } from "@/providers/LocaleProvider";
import { InflatedType } from "./InflatedType";

/** Secciones que pueden pedir tipografía 3D, en el orden de la página. */
type TypeSlot = "hero" | "contact";

function isTypeSlot(value: string | undefined): value is TypeSlot {
  return value === "hero" || value === "contact";
}

/**
 * Canvas de fondo con la tipografía 3D.
 *
 * Va fijo detrás de todo el contenido y nunca se mueve: la página scrollea por
 * encima. Esa es la fuente de la sensación de profundidad de la referencia — no
 * hay parallax, hay un objeto que gira a su propio ritmo mientras el texto pasa
 * por delante.
 *
 * Las secciones que quieren tipografía 3D se declaran con `data-type3d="hero"` o
 * `"contact"` y este componente las observa, igual que `data-section-bg`. Así no
 * hay que cablear un provider ni que las secciones sepan que existe un canvas.
 *
 * Lo que se guarda en estado es CUÁL sección está activa, no la palabra. La
 * palabra se deriva del diccionario en cada render, así que cambiar de idioma la
 * actualiza sola. Guardando la cadena, el 3D se quedaba con el idioma anterior
 * hasta que el usuario saliera y volviera a entrar a la sección.
 */
export function BackgroundCanvas() {
  const { scroller } = useScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const tier = useQualityTier();
  const content = useContent();
  const [progress] = useState(createProgressStore);
  const [slot, setSlot] = useState<TypeSlot | null>(null);

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
          // Solo cambia al entrar o salir de una sección: dos o tres veces en
          // toda la página, así que el estado de React va bien.
          const key = section.dataset.type3d;
          setSlot(self.isActive && isTypeSlot(key) ? key : null);
        },
      }),
    );

    ScrollTrigger.refresh();
    return () => {
      for (const trigger of triggers) trigger.kill();
    };
  }, [scroller, progress]);

  const word =
    slot === "hero" ? content.hero.type3d : slot === "contact" ? content.contact.type3d : null;
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
          // Decorativo: nunca recibe input. r3f pone `pointer-events: auto` en
          // línea sobre su contenedor, y como este canvas está fijo por encima de
          // toda la página, se comía la rueda del ratón antes de que llegara al
          // contenedor de scroll — la página entera quedaba inmóvil.
          style={{ pointerEvents: "none" }}
        >
          <Suspense fallback={null}>
            <InflatedType word={word} progress={progress} />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
