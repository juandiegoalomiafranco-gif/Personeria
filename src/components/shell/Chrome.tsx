"use client";

import Link from "next/link";
import { useContent } from "@/providers/LocaleProvider";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { DOTTED } from "@/components/ui/dotted";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./MobileMenu";
import { CoordReadout } from "./CoordReadout";
import { ClockTemp } from "./ClockTemp";

/**
 * Chrome fijo: la barra superior y la inferior en un solo elemento.
 *
 * Como en la referencia, es un `fixed inset-0` en columna con `justify-between`,
 * no dos barras independientes. Así las dos filas quedan ancladas a los bordes
 * del viewport sin ocupar layout. El contenedor no recibe eventos; solo los
 * controles lo hacen, para que el scroll siga pasando por debajo.
 */
export function Chrome() {
  const { brand, nav } = useContent();

  return (
    <header className="text-l1 font-mono-2 pointer-events-none fixed inset-0 z-50 flex flex-col justify-between">
      {/* Fila superior */}
      <div className="flex items-center justify-between px-4 py-4 text-sm lg:px-14 lg:py-7 lg:text-base">
        {/* Abreviado en todos los tamaños: el titular del hero ya dice los dos
            nombres completos y a tamaño gigante, así que repetirlos aquí solo
            compite con él. El nombre entero se queda en la etiqueta accesible. */}
        <Link
          href="/"
          aria-label={brand.name}
          className={cn(DOTTED, "font-sans font-bold", "pointer-events-auto")}
          style={{ fontVariationSettings: '"wght" 700, "wdth" 120' }}
        >
          {brand.short}
        </Link>

        <MobileMenu />

        {/* El ancho sale de `basis` y no del contenido: las etiquetas en español
            son más largas que las inglesas de la referencia y con `basis-1/3`
            se partían en dos filas. */}
        <nav className="pointer-events-auto hidden basis-1/2 items-center justify-between gap-x-3 whitespace-nowrap lg:flex xl:basis-[48%]">
          <a href="#propuestas" className={DOTTED}>
            {nav.work}
          </a>
          <a href="#contacto" className={DOTTED}>
            {nav.contact}
          </a>
          <ThemeToggle />
          <SoundToggle />
        </nav>
      </div>

      {/* Fila inferior */}
      <div className="flex items-center justify-between px-4 py-4 text-xs lg:px-14 lg:py-7 lg:text-sm">
        <ClockTemp className="p-2 uppercase" />

        {/* Centrado respecto al viewport, no respecto a sus hermanos: si fuera
            un hijo más del flex, el ancho del reloj lo desplazaría. */}
        <CoordReadout className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 p-2 uppercase lg:bottom-7 lg:block" />

        <LocaleToggle className="pointer-events-auto" />
      </div>
    </header>
  );
}
