"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { AudioProvider } from "@/providers/AudioProvider";
import { PointerProvider } from "@/providers/PointerProvider";
import { Cursor } from "@/components/ui/Cursor";
import { Chrome } from "./Chrome";
import { GridOverlay } from "./GridOverlay";
import { Preloader } from "./Preloader";
import { ScrollArea } from "./ScrollArea";

/**
 * Raíz del cliente: providers, chrome fijo y contenedor de scroll.
 *
 * El orden de los providers importa. `LocaleProvider` va por fuera de todo lo
 * que muestra texto, y `PointerProvider` por dentro de todo lo que lo consume.
 *
 * Orden de capas (z-index):
 *   0    retícula técnica
 *   10   contenido de la página
 *   50   chrome (header y barra inferior)
 *   90   preloader
 *   100  cursor
 * Los canvas WebGL entran en la Fase 5: el de fondo en -1, el de frente en 30.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AudioProvider>
          <PointerProvider>
            <GridOverlay />
            <ScrollArea>{children}</ScrollArea>
            <Chrome />
            <Preloader />
            <Cursor />
          </PointerProvider>
        </AudioProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
