"use client";

import { Center, Environment, Lightformer, Resize, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { useQualityTier, type QualityTier } from "@/hooks/useQualityTier";

/** Ruta del JSON generado por `scripts/build-3d-font.mjs`. */
const FONT = "/fonts/fredoka-semibold-3d.json";

/**
 * Geometría de la letra.
 *
 * El look inflado sale del bevel, no del grosor: un bevel grande respecto a la
 * altura redondea el canto hasta que la letra parece un globo.
 *
 * La teselación se ajusta al dispositivo porque el coste se dispara rápido: es
 * el producto de los segmentos de curva por los del bisel, sobre diez glifos
 * llenos de curvas. Con 14 y 12 la palabra salía a **200.000 triángulos por
 * frame**, y como Lenis comparte el rAF con el render, ese frame perdido se
 * sentía como retraso en el scroll — la página parecía colgar de la rueda. Con
 * 6 y 5 baja a unos 36.000 y el contorno se sigue viendo liso al tamaño al que
 * se muestra.
 */
const TESSELLATION: Record<QualityTier, { curveSegments: number; bevelSegments: number }> = {
  high: { curveSegments: 6, bevelSegments: 5 },
  medium: { curveSegments: 5, bevelSegments: 4 },
  low: { curveSegments: 4, bevelSegments: 3 },
};

const GEOMETRY = {
  size: 1,
  // La profundidad tiene que ser bastante mayor que el doble del bevel: con
  // `depth` 0.42 y `bevelThickness` 0.2 los biseles frontal y trasero casi se
  // tocaban y las caras peleaban por el z-buffer, produciendo manchas.
  depth: 0.9,
  bevelEnabled: true,
  bevelThickness: 0.18,
  // `bevelSize` desplaza el contorno hacia dentro; pasado cierto punto se
  // autointersecta en las curvas cerradas de una tipografía redondeada.
  bevelSize: 0.1,
  bevelOffset: 0,
} as const;

/** Velocidad de la deriva continua, en radianes por segundo. */
const DRIFT_X = 0.055;
const DRIFT_Y = 0.085;

/**
 * Ancho de la palabra en unidades de mundo.
 *
 * A z=6.5 con fov 42 el encuadre mide unas 9.1 unidades de ancho en 16:9, así
 * que 7.6 la deja llenando el frente sin tocar los bordes. Se normaliza con
 * `Resize` porque cada palabra tiene un ancho distinto: sin eso, "TU VOZ" y
 * "PERSONERÍA" saldrían a escalas completamente diferentes.
 */
const FIT_WIDTH = 7.6;

interface InflatedTypeProps {
  word: string;
  progress: ProgressStore;
}

/**
 * Tipografía 3D inflada del fondo.
 *
 * Gira despacio por sí sola y además responde al scroll: la deriva constante es
 * lo que la hace sentir viva cuando el usuario está quieto, y el acoplamiento al
 * scroll lo que la conecta con el resto de la página.
 */
export function InflatedType({ word, progress }: InflatedTypeProps) {
  const groupRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const tier = useQualityTier();
  const tessellation = TESSELLATION[tier];

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;

    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    const t = elapsed.current;
    const p = progress.value;

    // Deriva base + un empujón proporcional al scroll. El `sin` de periodo largo
    // evita que la rotación se vea como un motor a velocidad constante.
    // Amplitudes contenidas: la palabra tiene que seguir siendo legible en
    // cualquier punto del giro, no solo de frente.
    group.rotation.x = Math.sin(t * DRIFT_X) * 0.17 + p * 0.32;
    group.rotation.y = Math.sin(t * DRIFT_Y) * 0.3 + p * 0.75;
    group.rotation.z = Math.sin(t * 0.031) * 0.045;

    // Se aleja un poco al scrollear, para que el titular respire.
    group.position.z = MathUtils.lerp(0, -1.6, p);
  });

  return (
    <>
      {/*
        Estudio construido con lightformers en vez de un HDR descargado: no hay
        asset externo que cargar y se puede colocar cada brillo donde se quiere.
        El azul es la luz principal, magenta y cian dan los bordes iridiscentes.
      */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.6} position={[0, 4, -6]} scale={[12, 7, 1]} color="#8ea2ff" />
        <Lightformer intensity={1.5} position={[-7, 2, 3]} scale={[7, 7, 1]} color="#ff4fa3" />
        <Lightformer intensity={1.3} position={[7, -2, 3]} scale={[7, 7, 1]} color="#22e0e8" />
        <Lightformer intensity={3.2} position={[0, -6, -4]} scale={[12, 3, 1]} color="#ffffff" />
        <Lightformer intensity={0.9} position={[0, 0, 8]} scale={[10, 10, 1]} color="#3a46d8" />
      </Environment>

      <group ref={groupRef} scale={FIT_WIDTH}>
        <Center>
          <Resize width>
            <Text3D font={FONT} {...GEOMETRY} {...tessellation}>
              {word}
              <meshPhysicalMaterial
                color="#2e34b7"
                // Cuerpo mate con una capa brillante encima: es lo que separa
                // un globo de un plástico mojado. Con `roughness` bajísima el
                // reflejo es duro y la letra pierde volumen.
                roughness={0.19}
                metalness={0.1}
                clearcoat={1}
                clearcoatRoughness={0.06}
                // La iridiscencia alta produce manchas en las caras casi planas
                // del bevel; con 0.28 se queda el tornasol de los bordes sin el
                // moteado.
                iridescence={0.28}
                iridescenceIOR={1.32}
                iridescenceThicknessRange={[180, 460]}
                envMapIntensity={1.4}
                reflectivity={0.75}
              />
            </Text3D>
          </Resize>
        </Center>
      </group>
    </>
  );
}
