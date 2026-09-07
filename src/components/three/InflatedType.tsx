"use client";

import { Center, Environment, Lightformer, Resize, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import type { ProgressStore } from "@/lib/scroll/progress";
import { useQualityTier } from "@/hooks/useQualityTier";
import {
  GEOMETRY,
  REFRACTION_PLANE,
  TESSELLATION,
  TYPE_FINISH,
  createRefractionTexture,
} from "@/lib/three/type3d";

/** Ruta del JSON generado por `scripts/build-3d-font.mjs`. */
const FONT = "/fonts/pacifico-3d.json";

/** Velocidad de la deriva continua, en radianes por segundo. */
const DRIFT_X = 0.055;
const DRIFT_Y = 0.085;

/** Separación entre los centros de dos líneas, en unidades de `size`. */
const LINE_GAP = 1.06;

/**
 * Ancho de la palabra en unidades de mundo.
 *
 * A z=6.5 con fov 42 el encuadre mide unas 9.1 unidades de ancho en 16:9. Con
 * una sola línea puede llenar el frente; con dos hay que dejarle aire arriba y
 * abajo, porque `Resize` normaliza el ancho y la altura crece con el número de
 * líneas.
 */
const FIT_WIDTH = { 1: 7.6, 2: 5.2 } as const;

/**
 * Cuánto sube el bloque, en unidades de mundo.
 *
 * El titular vive abajo a la izquierda y ocupa tres líneas. Centrado, el
 * segundo renglón de la palabra 3D le caía justo encima y las dos cosas se
 * volvían ilegibles. En la referencia se cruzan, pero solo por una esquina.
 */
const LIFT = 0.55;

interface InflatedTypeProps {
  /** Puede traer saltos de línea: cada uno es una línea de la palabra 3D. */
  word: string;
  progress: ProgressStore;
}

/**
 * Tipografía 3D inflada del fondo.
 *
 * Gira despacio por sí sola y además responde al scroll: la deriva constante es
 * lo que la hace sentir viva cuando el usuario está quieto, y el acoplamiento al
 * scroll lo que la conecta con el resto de la página.
 *
 * Las líneas se montan como `<Text3D>` independientes, no con un `\n` dentro de
 * uno solo: three saca el interlineado del bounding box de la fuente y no hay
 * forma de ajustarlo, y en un script con ascendentes y descendentes largos ese
 * valor deja las líneas demasiado separadas.
 */
export function InflatedType({ word, progress }: InflatedTypeProps) {
  const groupRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const tier = useQualityTier();
  const tessellation = TESSELLATION[TYPE_FINISH][tier];
  const geometry = GEOMETRY[TYPE_FINISH];

  const lines = useMemo(() => word.split("\n").filter(Boolean), [word]);
  const fit = lines.length > 1 ? FIT_WIDTH[2] : FIT_WIDTH[1];

  // La textura solo se crea con acabado de cristal: en opaco no hay nada que
  // refractar y el plano sería un dibujo tapado por las letras.
  const refraction = useMemo(
    () => (TYPE_FINISH === "glass" ? createRefractionTexture() : null),
    [],
  );
  useEffect(() => () => refraction?.dispose(), [refraction]);

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

  const material =
    TYPE_FINISH === "glass" ? (
      <meshPhysicalMaterial
        // En cristal el tinte NO va en `color`: eso multiplicaría también la
        // luz transmitida y ensucia el resultado. El verde entra por
        // atenuación, que es como se tiñe el vidrio de verdad — cuanto más
        // grueso el trazo, más saturado se ve.
        //
        // Con `attenuationDistance` corta (0.55) y `thickness` 2 el vidrio
        // absorbía casi toda la luz y las letras salían negras y sucias. La
        // distancia tiene que ser del orden del grosor del trazo, no menor.
        color="#ffffff"
        transmission={1}
        thickness={0.9}
        ior={1.5}
        roughness={0.05}
        metalness={0}
        attenuationColor="#0e9e57"
        attenuationDistance={2.6}
        // La capa brillante encima es lo que da los reflejos duros del lomo.
        // Sin ella el cristal se ve blando y pierde el filo.
        clearcoat={1}
        clearcoatRoughness={0.04}
        iridescence={0.25}
        iridescenceIOR={1.32}
        envMapIntensity={2.4}
        reflectivity={0.6}
      />
    ) : (
      <meshPhysicalMaterial
        color="#16b364"
        // Cuerpo mate con una capa brillante encima: es lo que separa un globo
        // de un plástico mojado. Con `roughness` bajísima el reflejo es duro y
        // la letra pierde volumen.
        roughness={0.19}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.06}
        // La iridiscencia alta produce manchas en las caras casi planas del
        // bisel; con 0.28 se queda el tornasol de los bordes sin el moteado.
        iridescence={0.28}
        iridescenceIOR={1.32}
        iridescenceThicknessRange={[180, 460]}
        envMapIntensity={1.4}
        reflectivity={0.75}
      />
    );

  return (
    <>
      {/*
        Estudio construido con lightformers en vez de un HDR descargado. No es
        por ahorrar: un preset de drei baja un HDRI de varios megas desde un CDN
        externo, y aquí se puede colocar cada brillo exactamente donde se
        quiere. El verde es la luz principal; el lima y el cian dan los bordes.
      */}
      <Environment resolution={256} frames={1}>
        {/* La tira clave: ancha, brillante, arriba y por DELANTE. Es la que
            dibuja el reflejo largo que recorre el lomo de cada trazo — el
            detalle que separa un render de estudio de un plástico plano. En la
            referencia se ve como una banda blanca continua sobre las letras. */}
        <Lightformer
          form="rect"
          intensity={6}
          position={[0, 5, 5]}
          rotation={[-0.5, 0, 0]}
          scale={[18, 2.2, 1]}
          color="#ffffff"
        />
        <Lightformer intensity={2.6} position={[0, 4, -6]} scale={[12, 7, 1]} color="#8dffc4" />
        <Lightformer intensity={1.5} position={[-7, 2, 3]} scale={[7, 7, 1]} color="#c0fe04" />
        <Lightformer intensity={1.3} position={[7, -2, 3]} scale={[7, 7, 1]} color="#22e8c4" />
        <Lightformer intensity={3.2} position={[0, -6, -4]} scale={[12, 3, 1]} color="#ffffff" />
        <Lightformer intensity={0.9} position={[0, 0, 8]} scale={[10, 10, 1]} color="#0e9e57" />
      </Environment>

      {/*
        Lo que el cristal refracta. Sin este plano la transmisión muestrea un
        buffer vacío —el canvas es `alpha: true` y el degradé de la página es
        CSS, por detrás— y las letras salen fantasmales en vez de vidriosas.
        Lleva el mismo degradé que el fondo, así que taparlo no se nota.
      */}
      {refraction ? (
        <mesh position={[0, 0, REFRACTION_PLANE.z]}>
          <planeGeometry args={[REFRACTION_PLANE.width, REFRACTION_PLANE.height]} />
          <meshBasicMaterial map={refraction} transparent toneMapped={false} />
        </mesh>
      ) : null}

      <group ref={groupRef} scale={fit} position={[0, lines.length > 1 ? LIFT : 0, 0]}>
        <Center>
          <Resize width>
            <group>
              {lines.map((line, index) => (
                // Cada línea se centra por su cuenta y luego se coloca: así los
                // descendentes de la `J` o la `g` no descuadran el bloque.
                <group key={line} position={[0, ((lines.length - 1) / 2 - index) * LINE_GAP, 0]}>
                  <Center>
                    <Text3D font={FONT} {...geometry} {...tessellation}>
                      {line}
                      {material}
                    </Text3D>
                  </Center>
                </group>
              ))}
            </group>
          </Resize>
        </Center>
      </group>
    </>
  );
}
