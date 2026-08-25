"use client";

import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { forwardRef, useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { ANGULAR_DAMPING, LINEAR_DAMPING, type StickerSpec } from "@/lib/three/stickers";

/** Contorno del rayo, dibujado a mano en un cuadrado de 1x1 centrado. */
function boltShape(): Shape {
  const shape = new Shape();
  shape.moveTo(0.1, 0.5);
  shape.lineTo(-0.35, -0.05);
  shape.lineTo(-0.05, -0.05);
  shape.lineTo(-0.1, -0.5);
  shape.lineTo(0.35, 0.08);
  shape.lineTo(0.05, 0.08);
  shape.closePath();
  return shape;
}

/** Contorno del corazón, dos bezier simétricas desde la punta inferior. */
function heartShape(): Shape {
  const shape = new Shape();
  shape.moveTo(0, -0.42);
  shape.bezierCurveTo(-0.55, -0.05, -0.38, 0.5, 0, 0.24);
  shape.bezierCurveTo(0.38, 0.5, 0.55, -0.05, 0, -0.42);
  return shape;
}

const EXTRUDE = {
  depth: 0.22,
  bevelEnabled: true,
  bevelSize: 0.05,
  bevelThickness: 0.05,
  bevelSegments: 6,
  curveSegments: 16,
};

/**
 * Un sticker flotante.
 *
 * Las formas planas (rayo, corazón) se extruyen desde un contorno dibujado a
 * mano en vez de cargar un SVG: son seis puntos y así no hay asset que pedir ni
 * parsear.
 *
 * El colisionador es una bola aunque la forma no lo sea. Es a propósito: con
 * gravedad baja y amortiguación alta nadie percibe la diferencia, y una bola es
 * el colisionador más barato que existe.
 */
export const Sticker = forwardRef<
  RapierRigidBody,
  { spec: StickerSpec; position: [number, number, number] }
>(function Sticker({ spec, position }, ref) {
  const geometry = useMemo(() => {
    if (spec.shape === "bolt") return new ExtrudeGeometry(boltShape(), EXTRUDE);
    if (spec.shape === "heart") return new ExtrudeGeometry(heartShape(), EXTRUDE);
    return null;
  }, [spec.shape]);

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders="ball"
      mass={spec.mass}
      linearDamping={LINEAR_DAMPING}
      angularDamping={ANGULAR_DAMPING}
      restitution={0.45}
      friction={0.2}
    >
      <mesh scale={spec.size} castShadow={false} receiveShadow={false}>
        {geometry ? (
          <primitive object={geometry} attach="geometry" />
        ) : spec.shape === "coin" ? (
          <cylinderGeometry args={[1, 1, 0.22, 40]} />
        ) : spec.shape === "ring" ? (
          <torusGeometry args={[0.8, 0.26, 16, 48]} />
        ) : spec.shape === "capsule" ? (
          <capsuleGeometry args={[0.55, 0.9, 8, 24]} />
        ) : spec.shape === "cube" ? (
          <boxGeometry args={[1.3, 1.3, 1.3]} />
        ) : (
          <icosahedronGeometry args={[1, 0]} />
        )}
        <meshPhysicalMaterial
          color={spec.color}
          roughness={spec.metal ? 0.12 : 0.24}
          metalness={spec.metal ? 0.85 : 0.15}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.3}
        />
      </mesh>
    </RigidBody>
  );
});
