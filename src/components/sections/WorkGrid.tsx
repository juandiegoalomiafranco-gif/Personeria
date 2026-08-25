"use client";

import { useContent } from "@/providers/LocaleProvider";

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
      aria-label={work.title}
      className="relative z-10 w-full px-4 py-18 lg:px-14 lg:py-24"
    >
      <div className="grid w-full grid-cols-12">
        {work.items.map((item, index) => (
          <article key={item.id} className={GRID_POSITIONS[index] ?? "col-span-12"}>
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={`${item.title} — ${item.period}`}
              className="group block space-y-3 p-2"
            >
              {/* Slot de media. Hasta que lleguen las imágenes reales de cada
                  propuesta, se muestra un marco con su índice para que la
                  composición del grid sea legible. */}
              <div
                aria-hidden="true"
                className="bg-line border-line-strong pointer-events-none relative flex aspect-square w-full items-center justify-center border select-none"
              >
                <span className="font-mono-2 text-l3 text-xs tabular-nums">
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
