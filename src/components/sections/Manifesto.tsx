"use client";

import Image from "next/image";
import { useContent } from "@/providers/LocaleProvider";
import { RichText } from "@/components/animation/RichText";
import { Signature } from "@/components/animation/Signature";

/**
 * Manifiesto: retrato a la izquierda, dos párrafos grandes a la derecha.
 *
 * El primero va en `--label-1` y el segundo en `--label-2`: esa diferencia de
 * peso tonal es lo que hace que se lean como afirmación y matiz, no como dos
 * párrafos iguales.
 */
export function Manifesto() {
  const { manifesto } = useContent();

  return (
    <section
      data-section-bg="void"
      className="relative z-10 grid w-full grid-cols-12 px-4 py-18 lg:px-14 lg:py-24 lg:pb-28"
    >
      <div className="relative col-span-12 p-2 sm:col-span-4 lg:col-span-3">
        <Signature className="pointer-events-none absolute -top-[3%] -left-[8%] w-3/4" />
        <div className="bg-line relative aspect-square overflow-hidden">
          <Image
            src={manifesto.image.src}
            alt={manifesto.image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="col-span-12 flex flex-col items-start justify-start gap-6 text-base leading-none sm:col-span-7 sm:col-start-6 lg:col-span-8 lg:col-start-5 lg:text-xl">
        <p
          data-reveal-fade
          className="text-l1 w-full p-2 text-xl leading-[1.3] md:text-[4.2svw] md:leading-none"
        >
          <RichText value={manifesto.primary} />
        </p>
        <p
          data-reveal-fade
          className="text-l2 w-full p-2 text-xl leading-[1.3] md:text-[4.2svw] md:leading-none"
        >
          <RichText value={manifesto.secondary} />
        </p>
      </div>
    </section>
  );
}
