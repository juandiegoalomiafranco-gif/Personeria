"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { AudioProvider } from "@/providers/AudioProvider";
import { PointerProvider } from "@/providers/PointerProvider";
import { ScrollProvider } from "@/providers/ScrollProvider";
import { StageProvider, useStage } from "@/providers/StageProvider";
import { ScrollChoreography } from "@/components/animation/ScrollChoreography";
import { Cursor } from "@/components/ui/Cursor";
import { Chrome } from "./Chrome";
import { GridOverlay } from "./GridOverlay";
import { Preloader } from "./Preloader";
import { SkipLink } from "./SkipLink";
import { ScrollArea } from "./ScrollArea";

/**
 * Los canvas se cargan aparte.
 *
 * three, drei y rapier suman más de un megabyte. Importándolos de forma normal
 * entraban en el bundle inicial y el sitio no era interactivo hasta que
 * terminaba de descargarlos — en el celular de alguien con datos móviles, eso
 * son varios segundos de pantalla en blanco. Así el texto se lee de inmediato y
 * el 3D llega después.
 */
const BackgroundCanvas = dynamic(
  () => import("@/components/three/BackgroundCanvas").then((m) => m.BackgroundCanvas),
  { ssr: false },
);

const ForegroundCanvas = dynamic(
  () => import("@/components/three/ForegroundCanvas").then((m) => m.ForegroundCanvas),
  { ssr: false },
);

/**
 * Raíz del cliente: providers, chrome fijo y contenedor de scroll.
 *
 * El orden de los providers importa. `LocaleProvider` va por fuera de todo lo
 * que muestra texto; `PointerProvider` por dentro de todo lo que lo consume; y
 * `ScrollProvider` necesita que el contenedor ya esté en el DOM, por eso vive en
 * `Stage` y no aquí.
 *
 * Orden de capas (z-index):
 *   -1   canvas de la tipografía 3D
 *   0    retícula técnica
 *   10   contenido de la página
 *   50   chrome (header y barra inferior)
 *   90   preloader
 *   100  cursor
 *   30   canvas de primer plano: stickers y túnel (por encima del chrome,
 *        a propósito — es lo que los hace sentir sueltos en la sala)
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AudioProvider>
          <PointerProvider>
            <StageProvider>
              <Stage>{children}</Stage>
            </StageProvider>
          </PointerProvider>
        </AudioProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

function Stage({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ready, markReady } = useStage();

  return (
    <ScrollProvider containerRef={containerRef}>
      <SkipLink />
      {/* El chrome va ANTES del contenedor de scroll en el DOM aunque se pinte
          encima: el apilado lo resuelve el z-index, y con el orden invertido un
          usuario de teclado tenía que tabular por las diez propuestas antes de
          llegar al menú. */}
      <Chrome />
      {/* Los canvas esperan a que termine el preloader. Montarlos antes hace que
          la descarga de three compita con la de las fuentes, y lo que el
          usuario necesita primero es leer. */}
      {ready ? <BackgroundCanvas /> : null}
      <GridOverlay />
      <ScrollArea ref={containerRef}>{children}</ScrollArea>
      {ready ? <ForegroundCanvas /> : null}
      <Preloader onDone={markReady} />
      <Cursor />
      <ScrollChoreography />
    </ScrollProvider>
  );
}
