"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { DEPTH, SPEED_MAX, SPEED_MIN, STAGE, speedCurve, stageProgress } from "@/lib/three/tunnel";

/** Posición angular y radio de cada frase alrededor del eje del túnel. */
const SLOTS = [
  { angle: 0.75, radius: 6.2 },
  { angle: 2.45, radius: 7.0 },
  { angle: 3.85, radius: 5.8 },
  { angle: 5.35, radius: 7.4 },
] as const;

/**
 * Frases flotando dentro del túnel.
 *
 * Van repartidas en círculo alrededor del eje y viajan con el flujo, así que
 * crecen al acercarse a la cámara y pasan de largo. Se reparten en profundidad
 * para que no lleguen todas a la vez.
 *
 * El texto real también está en el DOM (oculto) para lectores de pantalla: aquí
 * es solo geometría.
 */
export function TunnelPhrases({
  phrases,
  progress,
}: {
  phrases: readonly string[];
  progress: ProgressStore;
}) {
  const groupRef = useRef<Group>(null);

  const slots = useMemo(
    () =>
      phrases.map((phrase, index) => {
        const slot = SLOTS[index % SLOTS.length] ?? SLOTS[0];
        return {
          phrase,
          x: Math.cos(slot.angle) * slot.radius,
          y: Math.sin(slot.angle) * slot.radius * 0.62,
          z: -DEPTH + (index * DEPTH) / Math.max(1, phrases.length),
        };
      }),
    [phrases],
  );

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group || !progress.active) return;

    const delta = Math.min(rawDelta, 0.05);
    const p = progress.value;
    // Las frases viajan más lento que las estelas: si fueran a la misma
    // velocidad pasarían tan rápido que serían ilegibles.
    const speed = MathUtils.lerp(SPEED_MIN, SPEED_MAX, speedCurve(p)) * 0.22;
    const visibility = stageProgress(p, STAGE.phrases) * (1 - stageProgress(p, STAGE.fadeOut));

    for (const child of group.children) {
      child.position.z += speed * delta;
      if (child.position.z > 1) child.position.z = -DEPTH;

      // Se desvanecen en los extremos: al fondo por lejanía, al frente al pasar
      // junto a la cámara.
      const depthFade = MathUtils.smoothstep(child.position.z, -DEPTH, -DEPTH * 0.72);
      // Se apagan bastante antes de llegar a la cámara: pasado ese punto la
      // perspectiva las agranda tanto que tapan el titular.
      const nearFade = 1 - MathUtils.smoothstep(child.position.z, -17, -9);

      const mesh = child as Mesh;
      const material = mesh.material as MeshBasicMaterial | undefined;
      if (material) material.opacity = visibility * depthFade * nearFade;
    }
  });

  return (
    <group ref={groupRef}>
      {slots.map((slot) => (
        <Text
          key={slot.phrase}
          position={[slot.x, slot.y, slot.z]}
          font="/fonts/roboto-flex.ttf"
          fontSize={0.62}
          maxWidth={7.5}
          lineHeight={1.15}
          textAlign="left"
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          // El material se crea transparente para poder animar la opacidad
          // desde `useFrame` sin recrearlo en cada cambio.
          material-transparent
          material-opacity={0}
          material-toneMapped={false}
        >
          {slot.phrase}
        </Text>
      ))}
    </group>
  );
}
