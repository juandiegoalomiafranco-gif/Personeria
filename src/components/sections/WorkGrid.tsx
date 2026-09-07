"use client";

import Image from "next/image";
import { useContent } from "@/providers/LocaleProvider";
import { ProposalPreview } from "@/components/ui/ProposalPreview";

/**
 * Posición de cada tarjeta dentro del grid de 12 columnas.
 *
 * Transcritas una a una del HTML de la referencia: la asimetría es deliberada,
 * las tarjetas caen en columnas distintas en cada fila para que el ojo baje en
 * zigzag en vez de en línea recta. Va aquí y no en `content/` porque es
 * presentación, no contenido.
 */
const GRID_POSITIONS = [
  "col-span-12 lg:col-span-8 lg:col-start-5",
  "col-span-12 lg:col-start-1 lg:col-span-6 xl:col-span-5",
  "col-span-12 lg:col-span-6 xl:col-span-5 lg:col-start-7 xl:col-start-7",
  "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-6 xl:col-span-3",
  "col-span-6 lg:col-start-9 lg:col-span-4 xl:col-start-10 xl:col-span-3",
  "col-span-12 lg:col-start-1 lg:col-span-4 xl:col-start-1 xl:col-span-3",
  "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-5 xl:col-span-3",
  "col-span-6 lg:col-start-9 lg:col-span-4 xl:col-start-9 xl:col-span-3",
  "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-6 xl:col-span-3",
  "col-span-6 lg:col-start-9 lg:col-span-4 xl:col-start-10 xl:col-span-3",
] as const;

export function WorkGrid() {
  const { work } = useContent();

  return (
    <section
      id="propuestas"
      data-section-bg="void"
      aria-labelledby="propuestas-heading"
      className="relative z-10 w-full px-4 py-18 lg:px-14 lg:py-24"
    >
      <h2
        id="propuestas-heading"
        className="reveal-mask text-l1 mb-8 text-[9svw] leading-none font-bold uppercase lg:mb-14 lg:text-[3.4svw]"
        style={{ fontVariationSettings: '"wdth" 120' }}
      >
        <span data-reveal-line className="block">
          {work.title}
        </span>
      </h2>

      <div className="grid w-full grid-cols-12">
        {work.items.map((item, index) => (
          <article
            key={item.id}
            data-reveal-card
            className={GRID_POSITIONS[index] ?? "col-span-12"}
          >
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={`${item.title} — ${item.period}`}
              className="group block space-y-3 p-2"
            >
              {/* Slot de media. Con imagen real la usa; si no, dibuja un
                  patrón generativo derivado del `id`. Antes aquí solo había un
                  marco vacío con un número, y la sección se leía como un
                  wireframe sin terminar. */}
              <div
                aria-hidden="true"
                className="bg-line border-line-strong pointer-events-none relative aspect-square w-full overflow-hidden border select-none"
              >
                {item.preview ? (
                  <Image
                    src={item.preview.src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <ProposalPreview id={item.id} />
                )}
                <span className="font-mono-2 text-l3 absolute bottom-1 left-1.5 text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.tag ? (
                  <span className="bg-accent text-on-accent font-mono-2 pointer-events-none absolute top-0 right-0 z-10 px-1 text-xs uppercase select-none">
                    {item.tag}
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 items-center justify-between gap-3 text-xs uppercase lg:text-sm">
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <div className="font-mono-2 flex shrink-0 items-center gap-2 whitespace-nowrap tabular-nums sm:gap-3">
                  <span>{item.period}</span>
                  {item.external ? (
                    <span className="hidden items-center gap-1 lg:inline-flex" aria-hidden="true">
                      <span>{item.externalLabel}</span>
                      <span>↗</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
