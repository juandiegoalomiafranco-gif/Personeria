"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, LineBasicMaterial, LineLoop } from "three";
import { MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
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
 * Anillos lima repartidos por el eje del túnel.
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
 */
export function TunnelRings({ progress }: { progress: ProgressStore }) {
  const groupRef = useRef<Group>(null);
  const circle = useMemo(() => buildCircle(), []);

  const initialZ = useMemo(
    () => Array.from({ length: RING_COUNT }, (_, i) => -((i + 0.5) * (DEPTH / RING_COUNT))),
    [],
  );

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group || !progress.active) return;

    const delta = Math.min(rawDelta, 0.05);
    const p = progress.value;
    const speed = MathUtils.lerp(SPEED_MIN, SPEED_MAX, speedCurve(p));

    // Los anillos solo existen en la primera mitad: después el túnel es pura
    // velocidad y estorbarían.
    const visibility = stageProgress(p, STAGE.ringsIn) * (1 - stageProgress(p, STAGE.ringsOut));

    for (const child of group.children) {
      const ring = child as LineLoop;
      ring.position.z += speed * delta;
      if (ring.position.z > -1.5) ring.position.z = -DEPTH;

      const material = ring.material as LineBasicMaterial;
      material.opacity = visibility * 0.9;
      ring.visible = visibility > 0.01;
    }
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
          <lineBasicMaterial color="#c0fe04" transparent opacity={0} toneMapped={false} />
        </lineLoop>
      ))}
    </group>
  );
}
