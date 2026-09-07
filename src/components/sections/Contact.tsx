"use client";

import { useContent } from "@/providers/LocaleProvider";
import { DOTTED } from "@/components/ui/dotted";
import { cn } from "@/lib/utils";

/**
 * Alineación de cada línea del eslogan de cierre.
 *
 * Una línea por fila, bajando en diagonal: izquierda, centro, derecha. El
 * eslogan son tres frases que se leen como una sola idea que va creciendo, y
 * la diagonal es lo que hace que se lean en ese orden y no como tres bloques
 * sueltos.
 */
const HEADLINE_ALIGN = ["text-left", "text-center", "text-right"] as const;

export function Contact() {
  const { contact } = useContent();

  return (
    <footer
      id="contacto"
      data-section-bg="deep"
      className="pointer-events-none relative z-10 flex h-dvh w-full flex-col justify-center p-6 lg:h-screen lg:p-16"
    >
      {contact.headline.map((segment, index) => (
        <div
          key={index}
          className={cn(
            "pointer-events-auto text-[7.2svw] leading-none font-bold uppercase lg:text-[6svw] xl:text-[5.6svw] 2xl:text-[5svw]",
            HEADLINE_ALIGN[index] ?? "text-left",
          )}
          style={{ fontVariationSettings: '"wdth" 120' }}
        >
          <span data-reveal-line className="block">
            {segment}
          </span>
        </div>
      ))}

      {/* Dato de contacto anclado al pie, por encima del titular. */}
      <div className="font-mono-2 absolute inset-0 flex flex-col justify-end px-4 py-18 text-sm lg:px-14 lg:py-24 lg:text-base">
        <a
          href={`mailto:${contact.email}`}
          className={cn(DOTTED, "pointer-events-auto block self-start")}
        >
          {contact.email}
        </a>
      </div>
    </footer>
  );
}
