"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { InstancedMesh } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { createRandom } from "@/lib/three/random";
import {
  DEPTH,
  SPAWN_RADIUS,
  SPEED_MAX,
  SPEED_MIN,
  STAGE,
  STREAK_COLORS,
  STREAK_FACTOR,
  STREAK_THICKNESS_K,
  STREAK_WEIGHTS,
  speedCurve,
  VELOCITY_SPEED,
  VELOCITY_STRETCH,
  stageProgress,
} from "@/lib/three/tunnel";

/** Semilla del campo. Cambiarla reparte los colores de otra forma. */
const SEED = 0x5eed;

/** Elige un color de la paleta respetando los pesos. */
function pickColor(random: number): string {
  let accumulated = 0;
  for (let i = 0; i < STREAK_WEIGHTS.length; i += 1) {
    accumulated += STREAK_WEIGHTS[i] ?? 0;
    if (random <= accumulated) return STREAK_COLORS[i] ?? "#ffffff";
  }
  return "#ffffff";
}

/** Colores por instancia. Puro y determinista: se puede calcular en render. */
function buildColors(count: number): Float32Array {
  const random = createRandom(SEED);
  const colors = new Float32Array(count * 3);
  const color = new Color();

  for (let i = 0; i < count; i += 1) {
    color.set(pickColor(random()));
    color.toArray(colors, i * 3);
  }

  return colors;
}

interface StreakState {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  matrix: Matrix4;
  position: Vector3;
  scale: Vector3;
  rotation: Quaternion;
}

/**
 * Estado mutable del campo.
 *
 * Se construye dentro del bucle de animación, no en render: se muta 900 veces
 * por frame y los valores creados durante el render deben quedarse inmutables.
 * Los objetos de three se crean una vez y se reutilizan; instanciarlos por frame
 * generaría basura suficiente para provocar pausas del recolector.
 */
function createStreakState(count: number): StreakState {
  const random = createRandom(SEED ^ 0x9e3779b9);
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const z = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    // Raíz del aleatorio para repartir uniforme en área y no acumular al centro.
    const radius = Math.sqrt(random()) * SPAWN_RADIUS;
    x[i] = Math.cos(angle) * radius;
    y[i] = Math.sin(angle) * radius;
    z[i] = -random() * DEPTH;
  }

  return {
    x,
    y,
    z,
    matrix: new Matrix4(),
    position: new Vector3(),
    scale: new Vector3(),
    rotation: new Quaternion(),
  };
}

/**
 * Campo de estelas que salen de un punto de fuga central.
 *
 * Cada estela es una caja alargada sobre el eje Z que viaja hacia la cámara. No
 * se dibujan en abanico a mano: la perspectiva es la que las abre desde el
 * centro, y eso es lo que produce el radial de la referencia.
 *
 * Todo va en un `InstancedMesh` con las matrices actualizadas a mano: 900 draw
 * calls por frame sería insostenible, uno solo es gratis.
 */
export function HyperspaceTunnel({ progress, count }: { progress: ProgressStore; count: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const stateRef = useRef<StreakState | null>(null);
  const colors = useMemo(() => buildColors(count), [count]);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh || !progress.active) return;

    stateRef.current ??= createStreakState(count);
    const state = stateRef.current;

    // Un salto de pestaña puede entregar un delta enorme; recortarlo evita que
    // todas las estelas se teletransporten de golpe.
    const delta = Math.min(rawDelta, 0.05);
    const p = progress.value;

    // El pulso decae aquí, no en el `ScrollTrigger`: `onUpdate` solo dispara
    // mientras el scroll se mueve, así que al soltar la rueda nadie volvería a
    // tocarlo y las estelas se quedarían estiradas. Va por método y no
    // escribiendo el campo porque `progress` es una prop, y el compilador de
    // React prohíbe mutarlas.
    progress.decayVelocity(delta);
    const push = progress.velocity;

    // Empujar y soltar: las estelas se estiran y aceleran con la velocidad del
    // scroll, y vuelven solas a su largo de reposo al parar.
    const speed = MathUtils.lerp(SPEED_MIN, SPEED_MAX, speedCurve(p)) * (1 + push * VELOCITY_SPEED);
    const streakLength = Math.max(0.4, speed * STREAK_FACTOR * (1 + push * VELOCITY_STRETCH));

    // En el colapso final el disco de nacimiento se cierra: las estelas dejan de
    // abrirse y todo converge a un punto.
    const collapse = stageProgress(p, STAGE.collapse);
    const spawnRadius = SPAWN_RADIUS * (1 - collapse * 0.92);

    const material = mesh.material;
    if (!Array.isArray(material) && "opacity" in material) {
      material.opacity = stageProgress(p, STAGE.fadeIn) * (1 - stageProgress(p, STAGE.fadeOut));
    }

    for (let i = 0; i < count; i += 1) {
      let zi = (state.z[i] ?? -DEPTH) + speed * delta;

      // Renace bastante antes del plano de la cámara: pasado ese punto la
      // perspectiva la agranda tanto que se ve como una cuña, no como una estela.
      if (zi > -2.5) {
        zi = -DEPTH;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * spawnRadius;
        state.x[i] = Math.cos(angle) * radius;
        state.y[i] = Math.sin(angle) * radius;
      }
      state.z[i] = zi;

      // El grosor crece con la distancia para que el ancho proyectado sea
      // constante: es lo que mantiene las estelas finas también al pasar cerca.
      const thickness = Math.abs(zi) * STREAK_THICKNESS_K;
      state.scale.set(thickness, thickness, streakLength);

      state.position.set(state.x[i] ?? 0, state.y[i] ?? 0, zi);
      state.matrix.compose(state.position, state.rotation, state.scale);
      mesh.setMatrixAt(i, state.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0} toneMapped={false} />
    </instancedMesh>
  );
}
