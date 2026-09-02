"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { chapterAt, createChapterCursor } from "@/lib/three/chapters";
import { DEPTH, STAGE, stageProgress } from "@/lib/three/tunnel";

/** Posición angular y radio de cada frase alrededor del eje del túnel. */
const SLOTS = [
  { angle: 0.75, radius: 6.2 },
  { angle: 2.45, radius: 7.0 },
  { angle: 3.85, radius: 5.8 },
  { angle: 5.35, radius: 7.4 },
] as const;

/** Lo más cerca de la cámara que llega una frase. Más acá taparía el titular. */
const NEAR_Z = -7;

/**
 * Frases flotando dentro del túnel, una por capítulo.
 *
 * Van repartidas en círculo alrededor del eje y se acercan a la cámara, así que
 * crecen conforme avanza su capítulo. Antes flotaban en un ciclo propio, sin
 * relación con el titular que estaba en pantalla: dos textos compitiendo por la
 * atención en el mismo encuadre. Ahora la frase *i* solo existe durante el
 * capítulo *i*, y refuerza lo que se está leyendo.
 *
 * La profundidad la manda el scroll, no un acumulador: la `z` se calcula desde
 * el progreso del capítulo en vez de sumarse frame a frame. Además de ser lo que
 * pide un efecto scrubbeado, es lo que hace que al subir el scroll las frases
 * retrocedan, y que un salto con `End` o `Home` las deje donde toca en vez de
 * donde se quedaron.
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
  const cursor = useMemo(() => createChapterCursor(), []);

  const slots = useMemo(
    () =>
      phrases.map((phrase, index) => {
        const slot = SLOTS[index % SLOTS.length] ?? SLOTS[0];
        return {
          phrase,
          x: Math.cos(slot.angle) * slot.radius,
          y: Math.sin(slot.angle) * slot.radius * 0.62,
        };
      }),
    [phrases],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !progress.active) return;

    const p = progress.value;
    chapterAt(p, cursor);
    const globalFade = 1 - stageProgress(p, STAGE.fadeOut);

    group.children.forEach((child, index) => {
      // Cuánto lleva recorrido el capítulo de esta frase: 0 antes de empezar,
      // 1 cuando ya pasó.
      const t = Math.min(1, Math.max(0, cursor.position - index));

      child.position.z = MathUtils.lerp(-DEPTH, NEAR_Z, t);

      // Entra desde el fondo y se apaga antes de llegar a la altura del
      // titular: pasado ese punto la perspectiva la agranda tanto que compite.
      const enter = MathUtils.smoothstep(t, 0, 0.16);
      const leave = 1 - MathUtils.smoothstep(t, 0.68, 0.92);

      const mesh = child as Mesh;
      const material = mesh.material as MeshBasicMaterial | undefined;
      if (material) material.opacity = enter * leave * globalFade;
      child.visible = enter * leave * globalFade > 0.01;
    });
  });

  return (
    <group ref={groupRef}>
      {slots.map((slot) => (
        <Text
          key={slot.phrase}
          position={[slot.x, slot.y, -DEPTH]}
          font="/fonts/roboto-flex.ttf"
          fontSize={0.62}
          maxWidth={7.5}
          lineHeight={1.15}
          textAlign="left"
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          visible={false}
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
