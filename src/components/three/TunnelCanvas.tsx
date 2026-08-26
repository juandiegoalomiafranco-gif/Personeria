"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useSyncExternalStore } from "react";
import type { ProgressStore } from "@/lib/scroll/progress";
import { MAX_DPR, scaleForTier, useQualityTier } from "@/hooks/useQualityTier";
import { STREAK_COUNT } from "@/lib/three/tunnel";
import { HyperspaceTunnel } from "./HyperspaceTunnel";
import { TunnelRings } from "./TunnelRings";
import { TunnelPhrases } from "./TunnelPhrases";

interface TunnelCanvasProps {
  phrases: readonly string[];
  progress: ProgressStore;
}

/**
 * Canvas del túnel.
 *
 * Va fijo a pantalla completa y por encima del chrome, igual que en la
 * referencia: ahí las estelas pasan por encima del menú, y esa es justamente la
 * sensación de estar atravesando algo.
 *
 * `frameloop` se apaga cuando la sección no está anclada: sin eso el WebGL
 * seguiría dibujando 900 instancias durante todo el resto de la página.
 */
export function TunnelCanvas({ phrases, progress }: TunnelCanvasProps) {
  const tier = useQualityTier();
  const streakCount = scaleForTier(STREAK_COUNT, tier);

  // El store lo escribe ScrollTrigger fuera de React, así que se lee por
  // suscripción. Antes se sondeaba con un rAF que corría durante toda la vida
  // de la página para leer un booleano que cambia dos veces; ahora solo se
  // re-renderiza al entrar y al salir de la sección.
  const subscribe = useCallback((onChange: () => void) => progress.subscribe(onChange), [progress]);
  const getSnapshot = useCallback(() => progress.active, [progress]);
  const running = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30"
      style={{ opacity: running ? 1 : 0, transition: "opacity 320ms ease-out" }}
    >
      <Canvas
        frameloop={running ? "always" : "never"}
        camera={{ position: [0, 0, 0], fov: 72, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, MAX_DPR[tier]]}
        // Decorativo: nunca recibe input. r3f pone `pointer-events: auto` en
        // línea sobre su contenedor, y como este canvas está fijo por encima de
        // toda la página, se comía la rueda del ratón antes de que llegara al
        // contenedor de scroll — la página entera quedaba inmóvil.
        style={{ pointerEvents: "none" }}
      >
        <HyperspaceTunnel progress={progress} count={streakCount} />
        <TunnelRings progress={progress} />
        <TunnelPhrases phrases={phrases} progress={progress} />
      </Canvas>
    </div>
  );
}
