"use client";

import { useContent } from "@/providers/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Cuánto scroll dura el anclaje, en múltiplos del alto del viewport.
 * Es la pista sobre la que la Fase 6 reparte las ocho etapas del túnel.
 */
export const TUNNEL_RUNWAY_VH = 500;

/**
 * Sección anclada del túnel hiperespacial.
 *
 * El patrón es el de la referencia: un contenedor alto de verdad con un hijo
 * `sticky top-0` a pantalla completa. Mientras el padre pasa por el viewport, el
 * hijo se queda congelado y su contenido se scrubbea con el progreso.
 *
 * En la Fase 3 solo está el andamiaje y el primer titular. El starfield, los
 * anillos, las frases en 3D y el ciclo de titulares llegan en la Fase 6.
 */
export function Tunnel() {
  const { tunnel } = useContent();
  const first = tunnel.statements[0] ?? [];

  return (
    <section
      data-section-bg="void"
      data-tunnel
      className="relative z-10 w-full"
      style={{ height: `${TUNNEL_RUNWAY_VH}vh` }}
    >
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center px-4 py-18 lg:px-14 lg:py-24">
        <h2
          data-tunnel-statement
          className={cn(
            "flex flex-col items-center justify-center text-center",
            "text-[7.2svw] leading-none font-bold uppercase lg:text-[6.8svw]",
          )}
          style={{ fontVariationSettings: '"wdth" 120' }}
        >
          {first.map((line, index) => (
            <span key={index} className="reveal-mask">
              <span data-reveal-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h2>

        {/* Las frases flotan en 3D dentro del túnel (Fase 6). Aquí quedan en el
            DOM, invisibles, para que existan como texto accesible y para los
            buscadores. */}
        <ul className="sr-only">
          {tunnel.phrases.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
