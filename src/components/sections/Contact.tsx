"use client";

import { useContent } from "@/providers/LocaleProvider";
import { DOTTED } from "@/components/ui/dotted";
import { cn } from "@/lib/utils";

/**
 * Alineación de cada segmento del titular de contacto.
 *
 * Cuatro segmentos en tres filas: los dos primeros comparten fila (izquierda y
 * derecha), el tercero va solo a la izquierda y el cuarto solo a la derecha. Ese
 * zigzag es lo que abre hueco en el centro para la tipografía 3D del fondo.
 */
const HEADLINE_POSITIONS = [
  "col-span-6 md:col-span-5 md:col-start-2 xl:col-span-5 xl:col-start-2 text-left",
  "col-span-6 md:col-span-5 xl:col-span-5 text-right",
  "col-span-12 md:col-start-2 xl:col-start-2 text-left",
  "col-span-12 md:col-end-12 xl:col-end-12 text-right",
] as const;

/** Filas del titular: índices de `headline` que van juntos. */
const HEADLINE_ROWS = [[0, 1], [2], [3]] as const;

export function Contact() {
  const { contact } = useContent();

  return (
    <footer
      id="contacto"
      data-section-bg="deep"
      data-type3d={contact.type3d}
      className="pointer-events-none relative z-10 flex h-dvh w-full flex-col justify-center p-6 lg:h-screen lg:p-16"
    >
      {HEADLINE_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-12 gap-2 text-[7.2svw] leading-none font-bold uppercase lg:text-[6svw] xl:text-[5.6svw] 2xl:text-[5svw]"
          style={{ fontVariationSettings: '"wdth" 120' }}
        >
          {row.map((index) => (
            <span key={index} className={cn("pointer-events-auto", HEADLINE_POSITIONS[index])}>
              <span data-reveal-line className="block">
                {contact.headline[index]}
              </span>
            </span>
          ))}
        </div>
      ))}

      {/* Datos de contacto anclados al pie, por encima del titular. */}
      <div className="font-mono-2 absolute inset-0 flex flex-col justify-end px-4 py-18 text-sm lg:px-14 lg:py-24 lg:text-base">
        <div className="flex w-full flex-col justify-between lg:flex-row">
          <a href={`mailto:${contact.email}`} className={cn(DOTTED, "pointer-events-auto block")}>
            {contact.email}
          </a>

          <div className="flex flex-row items-center gap-2 lg:gap-4">
            {contact.socials.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(DOTTED, "pointer-events-auto block")}
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
