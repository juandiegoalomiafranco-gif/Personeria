"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { useScroll } from "@/providers/ScrollProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { AMBIENT_DPR, useQualityTier } from "@/hooks/useQualityTier";
import { FrameCap } from "./FrameCap";
import { StickerField } from "./StickerField";

/**
 * Canvas de primer plano con los stickers físicos.
 *
 * Va por encima del contenido y del chrome, igual que en la referencia: ahí los
 * objetos pasan por delante del texto, y eso es lo que los hace sentir sueltos
 * en la sala en vez de pegados al fondo.
 *
 * Las secciones que los quieren se marcan con `data-stickers`, el mismo patrón
 * que `data-section-bg` y `data-type3d`.
 */
export function ForegroundCanvas() {
  const { scroller } = useScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const tier = useQualityTier();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!scroller || prefersReducedMotion) return;

    const sections = document.querySelectorAll<HTMLElement>("[data-stickers]");
    const triggers = [...sections].map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setActive(self.isActive),
      }),
    );

    ScrollTrigger.refresh();
    return () => {
      for (const trigger of triggers) trigger.kill();
    };
  }, [scroller, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30"
      style={{ opacity: active ? 1 : 0, transition: "opacity 500ms ease-out" }}
    >
      {active ? (
        <Canvas
          // El redibujado lo marca `FrameCap` a 30 fps, no r3f: así la física
          // de los stickers no compite con la interpolación del scroll. Con
          // reduce activo este componente ni siquiera llega hasta aquí.
          frameloop="demand"
          camera={{ position: [0, 0, 9], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, AMBIENT_DPR[tier]]}
          // Decorativo: nunca recibe input. r3f pone `pointer-events: auto` en
          // línea sobre su contenedor, y como este canvas está fijo por encima de
          // toda la página, se comía la rueda del ratón antes de que llegara al
          // contenedor de scroll — la página entera quedaba inmóvil.
          style={{ pointerEvents: "none" }}
        >
          <FrameCap tier={tier} />
          <Suspense fallback={null}>
            {/* Mismo estudio que la tipografía 3D, para que los stickers
                pertenezcan a la misma escena aunque estén en otro canvas. */}
            {/* Los stickers son objetos de juguete: tienen que leerse saturados.
                Solo con el environment map quedan apagados, así que va también
                una ambiental generosa y una direccional que marque el volumen. */}
            <ambientLight intensity={1.1} />
            <directionalLight position={[4, 6, 8]} intensity={1.6} />
            <Environment resolution={128} frames={1}>
              <Lightformer
                intensity={2.4}
                position={[0, 5, -6]}
                scale={[12, 6, 1]}
                color="#8dffc4"
              />
              <Lightformer
                intensity={1.4}
                position={[-7, 1, 4]}
                scale={[6, 6, 1]}
                color="#c0fe04"
              />
              <Lightformer
                intensity={1.2}
                position={[7, -2, 4]}
                scale={[6, 6, 1]}
                color="#22e8c4"
              />
              <Lightformer
                intensity={2.4}
                position={[0, -6, -3]}
                scale={[12, 3, 1]}
                color="#ffffff"
              />
            </Environment>
            <StickerField />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
