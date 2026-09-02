"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, LineBasicMaterial, LineLoop } from "three";
import { Color, MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { blendValue, CHAPTERS, chapterAt, createChapterCursor } from "@/lib/three/chapters";
import {
  DEPTH,
  RING_COUNT,
  RING_RADIUS,
  RING_SEGMENTS,
  RING_TILT,
  SPEED_MAX,
  SPEED_MIN,
  STAGE,
  speedCurve,
  stageProgress,
} from "@/lib/three/tunnel";

/** Círculo unitario en el plano XY, compartido por los seis anillos. */
function buildCircle(): Float32Array {
  const points = new Float32Array(RING_SEGMENTS * 3);
  for (let i = 0; i < RING_SEGMENTS; i += 1) {
    const angle = (i / RING_SEGMENTS) * Math.PI * 2;
    points[i * 3] = Math.cos(angle);
    points[i * 3 + 1] = Math.sin(angle);
    points[i * 3 + 2] = 0;
  }
  return points;
}

/**
 * Anillos repartidos por el eje del túnel.
 *
 * Están casi de canto (`RING_TILT`), que es lo que los aplasta en elipses en vez
 * de dejarlos como círculos concéntricos. Viajan con el flujo y renacen al
 * fondo, así se siente que se atraviesan puertas y no que hay una decoración
 * fija.
 *
 * Son `LineLoop` y no toros: un toro tiene grosor en unidades de mundo, así que
 * al acercarse a la cámara se convierte en una salchicha que se come el
 * encuadre. Una línea mide siempre un píxel, a cualquier profundidad — que es
 * exactamente como se ven en la referencia.
 *
 * Cuántos se ven y de qué color lo decide el capítulo. El conteo es
 * fraccionario a propósito: al interpolar entre un capítulo de seis y otro de
 * tres, los anillos se apagan de uno en uno en vez de desvanecerse todos a la
 * vez, y eso se lee como que el túnel se vacía por delante.
 */
export function TunnelRings({ progress }: { progress: ProgressStore }) {
  const groupRef = useRef<Group>(null);
  const circle = useMemo(() => buildCircle(), []);
  const cursor = useMemo(() => createChapterCursor(), []);
  // Dos colores fijos que solo se mutan: el resultado y el destino del lerp.
  // Crearlos por frame sería basura en el bucle de animación.
  const tint = useMemo(() => ({ current: new Color(), target: new Color() }), []);

  const initialZ = useMemo(
    () => Array.from({ length: RING_COUNT }, (_, i) => -((i + 0.5) * (DEPTH / RING_COUNT))),
    [],
  );

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group || !progress.active) return;

    const delta = Math.min(rawDelta, 0.05);
    const p = progress.value;
    chapterAt(p, cursor);

    const speed =
      MathUtils.lerp(SPEED_MIN, SPEED_MAX, speedCurve(p)) *
      blendValue(cursor, (chapter) => chapter.speed);

    // Cuántos anillos toca ver, con decimales.
    const wanted = blendValue(cursor, (chapter) => chapter.rings);
    const globalFade = stageProgress(p, STAGE.fadeIn) * (1 - stageProgress(p, STAGE.fadeOut));

    const from = CHAPTERS[cursor.index] ?? CHAPTERS[0];
    tint.current.set(from.ring);
    if (cursor.blend > 0) {
      tint.target.set((CHAPTERS[cursor.next] ?? CHAPTERS[0]).ring);
      tint.current.lerp(tint.target, cursor.blend);
    }

    group.children.forEach((child, index) => {
      const ring = child as LineLoop;
      ring.position.z += speed * delta;
      if (ring.position.z > -1.5) ring.position.z = -DEPTH;

      // El anillo `index` se apaga cuando el conteo del capítulo baja de él.
      const presence = Math.min(1, Math.max(0, wanted - index));

      const material = ring.material as LineBasicMaterial;
      material.opacity = presence * globalFade * 0.9;
      material.color.copy(tint.current);
      ring.visible = material.opacity > 0.01;
    });
  });

  return (
    <group ref={groupRef}>
      {initialZ.map((z, index) => (
        <lineLoop
          key={index}
          position={[0, 0, z]}
          rotation={[RING_TILT, 0, 0]}
          scale={[RING_RADIUS, RING_RADIUS, 1]}
          visible={false}
          frustumCulled={false}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[circle, 3]} />
          </bufferGeometry>
          <lineBasicMaterial transparent opacity={0} toneMapped={false} />
        </lineLoop>
      ))}
    </group>
  );
}
