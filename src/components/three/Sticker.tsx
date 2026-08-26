"use client";

import { RoundedBox } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { forwardRef, useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { ANGULAR_DAMPING, LINEAR_DAMPING, type StickerSpec } from "@/lib/three/stickers";

/**
 * Contorno de la flecha del cursor.
 *
 * Es el objeto estrella de la referencia y el que más se reconoce. La punta y
 * la muesca trasera van redondeadas con cuadráticas en vez de vértices vivos:
 * inflado, un pico agudo se convierte en una arista brillante que delata que
 * esto es una extrusión y no un objeto modelado.
 */
function cursorShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-0.3, 0.52);
  shape.lineTo(0.34, -0.1);
  shape.quadraticCurveTo(0.4, -0.17, 0.31, -0.2);
  shape.lineTo(0.05, -0.26);
  shape.lineTo(0.19, -0.5);
  shape.quadraticCurveTo(0.23, -0.57, 0.15, -0.6);
  shape.lineTo(0.02, -0.65);
  shape.quadraticCurveTo(-0.06, -0.68, -0.09, -0.6);
  shape.lineTo(-0.2, -0.35);
  shape.lineTo(-0.36, -0.52);
  shape.quadraticCurveTo(-0.44, -0.59, -0.44, -0.48);
  shape.lineTo(-0.4, 0.46);
  shape.quadraticCurveTo(-0.39, 0.58, -0.3, 0.52);
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

/** Contorno de la estrella de cuatro puntas, con los brazos curvados hacia dentro. */
function sparkShape(): Shape {
  const shape = new Shape();
  const arm = 0.52;
  const waist = 0.1;
  shape.moveTo(0, arm);
  shape.quadraticCurveTo(waist, waist, arm, 0);
  shape.quadraticCurveTo(waist, -waist, 0, -arm);
  shape.quadraticCurveTo(-waist, -waist, -arm, 0);
  shape.quadraticCurveTo(-waist, waist, 0, arm);
  return shape;
}

/**
 * Extrusión inflada.
 *
 * El bisel es lo que separa una pegatina de un globo, y antes estaba en 0.05
 * sobre una profundidad de 0.22: prácticamente una plancha con el canto matado.
 * Ahora la panza sobresale de verdad.
 *
 * `depth` tiene que ser mayor que el doble de `bevelThickness` — 0.46 contra
 * 0.36 — o los biseles frontal y trasero casi se tocan y las caras pelean por
 * el z-buffer. Es el mismo error que salió con la tipografía.
 */
const EXTRUDE = {
  depth: 0.46,
  bevelEnabled: true,
  bevelThickness: 0.18,
  bevelSize: 0.11,
  bevelOffset: 0,
  bevelSegments: 8,
  curveSegments: 24,
};

const SHAPES = {
  cursor: cursorShape,
  heart: heartShape,
  spark: sparkShape,
} as const;

/**
 * Un sticker flotante.
 *
 * Las formas planas se extruyen desde un contorno dibujado a mano en vez de
 * cargar un SVG: son unos pocos puntos y así no hay asset que pedir ni parsear.
 *
 * Ninguna geometría deja ver una cara plana. Es el detalle que hundía el
 * conjunto: antes había un `icosahedronGeometry` con detalle 0, o sea un
 * icosaedro crudo de veinte caras, y un cubo de aristas vivas. Contra objetos
 * pulidos como los de la referencia se leían como formas de tutorial.
 *
 * El colisionador es una bola aunque la forma no lo sea. Es a propósito: con
 * gravedad nula y amortiguación alta nadie percibe la diferencia, y una bola es
 * el colisionador más barato que existe.
 */
export const Sticker = forwardRef<
  RapierRigidBody,
  { spec: StickerSpec; position: [number, number, number] }
>(function Sticker({ spec, position }, ref) {
  const geometry = useMemo(() => {
    const outline = SHAPES[spec.shape as keyof typeof SHAPES];
    return outline ? new ExtrudeGeometry(outline(), EXTRUDE) : null;
  }, [spec.shape]);

  const material = (
    <meshPhysicalMaterial
      color={spec.color}
      // Cuerpo mate con una capa brillante encima, igual que la tipografía: es
      // lo que hace que los dos canvas parezcan la misma escena.
      roughness={spec.metal ? 0.06 : 0.2}
      // Metalness alta deja el objeto a merced del entorno, y este entorno es
      // oscuro: con 0.85 el sticker holográfico salía gris sucio en vez de
      // brillante. A media asta conserva el tornasol y mantiene cuerpo propio.
      metalness={spec.metal ? 0.5 : 0.12}
      clearcoat={1}
      clearcoatRoughness={0.05}
      iridescence={spec.metal ? 0.9 : 0}
      iridescenceIOR={1.34}
      iridescenceThicknessRange={[120, 520]}
      envMapIntensity={spec.metal ? 2.6 : 1.4}
      reflectivity={0.7}
    />
  );

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
      {spec.shape === "box" ? (
        // Caja de esquinas redondeadas: un `boxGeometry` normal deja ocho
        // aristas vivas que cortan el brillo en seco.
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.34} smoothness={6} scale={spec.size}>
          {material}
        </RoundedBox>
      ) : (
        <mesh scale={spec.size} castShadow={false} receiveShadow={false}>
          {geometry ? (
            <primitive object={geometry} attach="geometry" />
          ) : spec.shape === "coin" ? (
            <cylinderGeometry args={[1, 1, 0.34, 64]} />
          ) : spec.shape === "ring" ? (
            <torusGeometry args={[0.78, 0.3, 32, 96]} />
          ) : spec.shape === "capsule" ? (
            <capsuleGeometry args={[0.55, 0.9, 16, 48]} />
          ) : (
            // La gota: una esfera con las subdivisiones altas y estirada. El
            // detalle importa — a baja resolución se le ven los gajos.
            <sphereGeometry args={[1, 48, 32]} />
          )}
          {material}
        </mesh>
      )}
    </RigidBody>
  );
});
