"use client";

import Image from "next/image";
import { useContent } from "@/providers/LocaleProvider";
import { RichText } from "@/components/animation/RichText";

/**
 * Lo que los formó: una actividad por tarjeta, cerrando en por qué eso los
 * vuelve las personas indicadas para el cargo.
 *
 * Va entre el Manifiesto y las Propuestas: primero quiénes son y qué los
 * formó, después qué proponen concretamente.
 */
export function Activities() {
  const { activities } = useContent();

  return (
    <section
      id="trayectoria"
      data-section-bg="void"
      aria-labelledby="trayectoria-heading"
      className="relative z-10 w-full px-4 py-18 lg:px-14 lg:py-24"
    >
      <h2
        id="trayectoria-heading"
        className="reveal-mask text-l1 mb-8 text-[9svw] leading-none font-bold uppercase lg:mb-14 lg:text-[3.4svw]"
        style={{ fontVariationSettings: '"wdth" 120' }}
      >
        <span data-reveal-line className="block">
          {activities.title}
        </span>
      </h2>

      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {activities.items.map((item) => (
          <article key={item.id} data-reveal-card className="space-y-3">
            {/* Mientras no haya foto real, la caja muestra el label — mismo
                lenguaje visual que el slot de imagen de Propuestas. El
                `aria-hidden` va solo en ese caso: con foto real el `alt` sí
                aporta, y ahí el label de abajo no lo repite. */}
            <div
              {...(item.image ? {} : { "aria-hidden": true })}
              className="bg-line border-line-strong text-l3 font-mono-2 relative flex aspect-square w-full items-center justify-center overflow-hidden border text-xs uppercase select-none"
            >
              {item.image ? (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                item.label
              )}
            </div>

            <p className="text-l1 text-xs uppercase lg:text-sm">{item.label}</p>
            <p className="text-l2 text-sm leading-snug lg:text-base">{item.reflection}</p>
          </article>
        ))}
      </div>

      <div className="mt-14 max-w-3xl space-y-4 text-base leading-[1.4] lg:mt-20 lg:text-lg">
        {activities.closing.map((paragraph, index) => (
          <p key={index} data-reveal-fade className="text-l1">
            <RichText value={paragraph} />
          </p>
        ))}
      </div>
    </section>
  );
}
