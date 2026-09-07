"use client";

import { CuboidCollider, Physics, type RapierRigidBody } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { usePointer } from "@/providers/PointerProvider";
import {
  CURSOR_FORCE,
  CURSOR_RADIUS,
  DRIFT_FORCE,
  DRIFT_SPEED,
  GRAVITY,
  HOME_SPRING,
  stickersForTier,
} from "@/lib/three/stickers";
import { useQualityTier } from "@/hooks/useQualityTier";
import { Sticker } from "./Sticker";

/** Grosor de las paredes. Gruesas para que nada las atraviese a alta velocidad. */
const WALL = 2;

/**
 * Paredes invisibles en los bordes del encuadre.
 *
 * Se miden con `viewport`, no con constantes: al redimensionar la ventana el
 * mundo cambia de tamaño y con paredes fijas los objetos se quedarían fuera de
 * pantalla para siempre. La de atrás y la de delante mantienen todo en un plano
 * fino, para que nada se pierda en la profundidad.
 */
function Walls() {
  const { viewport } = useThree();
  const halfWidth = viewport.width / 2;
  const halfHeight = viewport.height / 2;

  return (
    <>
      <CuboidCollider
        position={[0, -halfHeight - WALL / 2, 0]}
        args={[halfWidth + WALL, WALL / 2, 4]}
      />
      <CuboidCollider
        position={[0, halfHeight + WALL / 2, 0]}
        args={[halfWidth + WALL, WALL / 2, 4]}
      />
      <CuboidCollider
        position={[-halfWidth - WALL / 2, 0, 0]}
        args={[WALL / 2, halfHeight + WALL, 4]}
      />
      <CuboidCollider
        position={[halfWidth + WALL / 2, 0, 0]}
        args={[WALL / 2, halfHeight + WALL, 4]}
      />
      <CuboidCollider position={[0, 0, -1.2]} args={[halfWidth + WALL, halfHeight + WALL, 0.4]} />
      <CuboidCollider position={[0, 0, 1.2]} args={[halfWidth + WALL, halfHeight + WALL, 0.4]} />
    </>
  );
}

/**
 * Fuerzas por frame sobre cada cuerpo.
 *
 * Tres cosas a la vez:
 *
 * 1. Deriva. Dos senos de periodo distinto por eje, desfasados por índice, para
 *    que ninguno se mueva igual que otro. Es lo que los mantiene vivos cuando
 *    nadie está tocando la pantalla.
 * 2. Resorte hacia su posición de origen. Sin él, los empujones del cursor los
 *    van corriendo y en un minuto la composición se desbalancea sola.
 * 3. Repulsión del cursor, con caída cuadrática para que el borde del efecto sea
 *    suave: con caída lineal se percibe el radio como un círculo invisible.
 */
function StickerForces({
  bodies,
  homes,
}: {
  bodies: React.RefObject<(RapierRigidBody | null)[]>;
  homes: readonly [number, number, number][];
}) {
  const { viewport } = useThree();
  const { state } = usePointer();

  // Vectores reutilizables en un ref, no en un memo: se mutan 8 veces por frame
  // y lo que sale del render tiene que quedarse inmutable. Instanciarlos dentro
  // del bucle generaría basura suficiente para provocar pausas del recolector.
  const scratchRef = useRef<{ cursor: Vector3; force: Vector3; offset: Vector3 } | null>(null);
  const elapsed = useRef(0);

  useFrame((_, rawDelta) => {
    const list = bodies.current;
    if (!list) return;

    scratchRef.current ??= {
      cursor: new Vector3(),
      force: new Vector3(),
      offset: new Vector3(),
    };
    const scratch = scratchRef.current;

    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    const t = elapsed.current;

    scratch.cursor.set((state.nx * viewport.width) / 2, (state.ny * viewport.height) / 2, 0);

    for (let i = 0; i < list.length; i += 1) {
      const body = list[i];
      const home = homes[i];
      if (!body || !home) continue;

      const position = body.translation();
      const phase = i * 1.7;

      scratch.force.set(
        Math.sin(t * DRIFT_SPEED + phase) * DRIFT_FORCE,
        Math.cos(t * DRIFT_SPEED * 0.73 + phase * 1.3) * DRIFT_FORCE,
        0,
      );

      scratch.offset.set(home[0] - position.x, home[1] - position.y, home[2] - position.z);
      scratch.force.addScaledVector(scratch.offset, HOME_SPRING * delta);

      if (state.active) {
        const dx = position.x - scratch.cursor.x;
        const dy = position.y - scratch.cursor.y;
        const distance = Math.hypot(dx, dy);

        if (distance < CURSOR_RADIUS && distance > 0.001) {
          const falloff = 1 - distance / CURSOR_RADIUS;
          const push = (CURSOR_FORCE * falloff * falloff) / distance;
          scratch.force.x += dx * push;
          scratch.force.y += dy * push;
        }
      }

      body.applyImpulse(scratch.force, true);
    }
  });

  return null;
}

/**
 * Campo de stickers con física.
 *
 * No son sprites con keyframes: es un mundo de Rapier sin gravedad, con mucha
 * amortiguación y cada objeto atado por un resorte suave a su posición de
 * origen. Por eso chocan entre ellos, giran con inercia y se apartan del cursor
 * de una forma que nunca se repite igual, pero la composición no se deshace.
 */
export function StickerField() {
  const { viewport } = useThree();
  const tier = useQualityTier();
  const specs = useMemo(() => stickersForTier(tier), [tier]);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);

  // Posiciones de origen en unidades de mundo. Se recalculan al redimensionar:
  // con posiciones fijas, los objetos quedarían fuera de encuadre en otra
  // relación de aspecto.
  const homes = useMemo(
    () =>
      specs.map(
        (spec) =>
          [(spec.at[0] * viewport.width) / 2.4, (spec.at[1] * viewport.height) / 2.4, 0] as [
            number,
            number,
            number,
          ],
      ),
    [specs, viewport.width, viewport.height],
  );

  return (
    <Physics gravity={[...GRAVITY]} timeStep="vary">
      <Walls />
      <StickerForces bodies={bodies} homes={homes} />
      {specs.map((spec, index) => (
        <Sticker
          key={spec.id}
          spec={spec}
          position={homes[index] ?? [0, 0, 0]}
          ref={(body) => {
            bodies.current[index] = body;
          }}
        />
      ))}
    </Physics>
  );
}
