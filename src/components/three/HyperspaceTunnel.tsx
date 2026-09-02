"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { InstancedBufferAttribute, InstancedMesh } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { createRandom } from "@/lib/three/random";
import {
  blendValue,
  CHAPTERS,
  chapterAt,
  createChapterCursor,
  type Chapter,
} from "@/lib/three/chapters";
import {
  DEPTH,
  PALETTE_SLOTS,
  SPAWN_RADIUS,
  SPEED_MAX,
  SPEED_MIN,
  STAGE,
  STREAK_FACTOR,
  STREAK_THICKNESS_K,
  STREAK_WEIGHTS,
  speedCurve,
  VELOCITY_SPEED,
  VELOCITY_STRETCH,
  stageProgress,
} from "@/lib/three/tunnel";

/** Semilla del campo. Cambiarla reparte las ranuras de otra forma. */
const SEED = 0x5eed;

/** Elige una ranura de la paleta respetando los pesos. */
function pickSlot(random: number): number {
  let accumulated = 0;
  for (let i = 0; i < STREAK_WEIGHTS.length; i += 1) {
    accumulated += STREAK_WEIGHTS[i] ?? 0;
    if (random <= accumulated) return i;
  }
  return PALETTE_SLOTS - 1;
}

/**
 * Qué ranura de la paleta le toca a cada instancia.
 *
 * Antes aquí se guardaba el color ya resuelto. Guardar la ranura es lo que
 * permite que cambiar de capítulo cueste interpolar **cinco** colores y volcar
 * el resultado, en vez de recalcular mil quinientos: el reparto no cambia nunca,
 * solo cambia a qué color apunta cada ranura.
 */
function buildSlots(count: number): Uint8Array {
  const random = createRandom(SEED);
  const slots = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) slots[i] = pickSlot(random());
  return slots;
}

/** Vuelca una paleta de cinco colores sobre el atributo por instancia. */
function paintSlots(colors: Float32Array, slots: Uint8Array, palette: readonly Color[]): void {
  for (let i = 0; i < slots.length; i += 1) {
    const color = palette[slots[i] ?? 0] ?? palette[0];
    if (!color) continue;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
}

/** Los cinco colores del capítulo, ya como objetos de three. */
function paletteOf(chapter: Chapter): Color[] {
  return chapter.streaks.map((hex) => new Color(hex));
}

interface StreakState {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  matrix: Matrix4;
  position: Vector3;
  scale: Vector3;
  rotation: Quaternion;
  /** Paleta interpolada del frame. Se reutiliza para no crear basura. */
  palette: Color[];
  /** Color de apoyo para el lerp de paleta. Existe solo para no asignar. */
  scratch: Color;
  /** Índice y mezcla del último repintado, para no repintar de más. */
  paintedIndex: number;
  paintedBlend: number;
}

/**
 * Estado mutable del campo.
 *
 * Se construye dentro del bucle de animación, no en render: se muta 1500 veces
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
    palette: Array.from({ length: PALETTE_SLOTS }, () => new Color()),
    scratch: new Color(),
    // -1 fuerza el primer repintado, aunque el recorrido arranque en el
    // capítulo 0 con mezcla 0.
    paintedIndex: -1,
    paintedBlend: 0,
  };
}

/**
 * Campo de estelas que salen de un punto de fuga central.
 *
 * Cada estela es una caja alargada sobre el eje Z que viaja hacia la cámara. No
 * se dibujan en abanico a mano: la perspectiva es la que las abre desde el
 * centro, y eso es lo que produce el radial de la referencia.
 *
 * Todo va en un `InstancedMesh` con las matrices actualizadas a mano: 1500 draw
 * calls por frame sería insostenible, uno solo es gratis.
 *
 * El color, la densidad y la velocidad los manda el capítulo, y se interpolan en
 * la zona de solape. La densidad **no** cambia el `count`: recrear el
 * `InstancedMesh` remontaría el mesh por el `key` y tiraría el frame, así que
 * las estelas sobrantes se escalan a cero y siguen ahí, en su sitio, listas para
 * volver cuando el capítulo siguiente suba la densidad.
 */
export function HyperspaceTunnel({ progress, count }: { progress: ProgressStore; count: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const stateRef = useRef<StreakState | null>(null);
  const cursor = useMemo(() => createChapterCursor(), []);
  const slots = useMemo(() => buildSlots(count), [count]);

  // Arranca pintado con el capítulo 1 para que el primer frame ya salga en su
  // paleta y no en blanco.
  const colors = useMemo(() => {
    const initial = new Float32Array(count * 3);
    paintSlots(initial, slots, paletteOf(CHAPTERS[0]));
    return initial;
  }, [count, slots]);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh || !progress.active) return;

    stateRef.current ??= createStreakState(count);
    const state = stateRef.current;

    // Un salto de pestaña puede entregar un delta enorme; recortarlo evita que
    // todas las estelas se teletransporten de golpe.
    const delta = Math.min(rawDelta, 0.05);
    const p = progress.value;
    chapterAt(p, cursor);

    // El pulso decae aquí, no en el `ScrollTrigger`: `onUpdate` solo dispara
    // mientras el scroll se mueve, así que al soltar la rueda nadie volvería a
    // tocarlo y las estelas se quedarían estiradas. Va por método y no
    // escribiendo el campo porque `progress` es una prop, y el compilador de
    // React prohíbe mutarlas.
    progress.decayVelocity(delta);
    const push = progress.velocity;

    // Repintar solo cuando la paleta cambió de verdad. Fuera de las zonas de
    // solape la mezcla se queda clavada y este bloque no llega a correr: son
    // unos cuatro quintos de los frames de la sección.
    if (cursor.index !== state.paintedIndex || cursor.blend !== state.paintedBlend) {
      const from = CHAPTERS[cursor.index] ?? CHAPTERS[0];
      const to = CHAPTERS[cursor.next] ?? CHAPTERS[0];

      for (let slot = 0; slot < PALETTE_SLOTS; slot += 1) {
        const target = state.palette[slot];
        if (!target) continue;
        target.set(from.streaks[slot] ?? "#ffffff");
        if (cursor.blend > 0) {
          state.scratch.set(to.streaks[slot] ?? "#ffffff");
          target.lerp(state.scratch, cursor.blend);
        }
      }

      paintSlots(colors, slots, state.palette);
      const attribute = mesh.geometry.getAttribute("color") as InstancedBufferAttribute | undefined;
      if (attribute) attribute.needsUpdate = true;

      state.paintedIndex = cursor.index;
      state.paintedBlend = cursor.blend;
    }

    // Empujar y soltar: las estelas se estiran y aceleran con la velocidad del
    // scroll, y vuelven solas a su largo de reposo al parar. El capítulo pone el
    // multiplicador encima de la curva global.
    const chapterSpeed = blendValue(cursor, (chapter) => chapter.speed);
    const speed =
      MathUtils.lerp(SPEED_MIN, SPEED_MAX, speedCurve(p)) *
      chapterSpeed *
      (1 + push * VELOCITY_SPEED);
    const streakLength = Math.max(0.4, speed * STREAK_FACTOR * (1 + push * VELOCITY_STRETCH));

    // En el colapso final el disco de nacimiento se cierra: las estelas dejan de
    // abrirse y todo converge a un punto.
    const collapse = stageProgress(p, STAGE.collapse);
    const spawnRadius = SPAWN_RADIUS * (1 - collapse * 0.92);

    const material = mesh.material;
    if (!Array.isArray(material) && "opacity" in material) {
      material.opacity = stageProgress(p, STAGE.fadeIn) * (1 - stageProgress(p, STAGE.fadeOut));
    }

    const visible = Math.round(count * blendValue(cursor, (chapter) => chapter.density));

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

      if (i < visible) {
        // El grosor crece con la distancia para que el ancho proyectado sea
        // constante: es lo que mantiene las estelas finas también al pasar cerca.
        const thickness = Math.abs(zi) * STREAK_THICKNESS_K;
        state.scale.set(thickness, thickness, streakLength);
      } else {
        state.scale.set(0, 0, 0);
      }

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
