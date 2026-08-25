"use client";

import { useContent } from "@/providers/LocaleProvider";
import { RevealLines } from "@/components/animation/RevealLines";
import { RichText } from "@/components/animation/RichText";

/**
 * Sección de apertura, a pantalla completa.
 *
 * Grid de dos filas: arriba el bloque de metadatos en tres columnas del grid de
 * 12, abajo el titular gigante anclado al pie con `self-end`. En móvil el orden
 * se invierte (`order-1` / `order-2`) para que el titular quede arriba.
 *
 * El fondo lo pinta el canvas 3D de la Fase 5; aquí solo va el texto.
 */
export function Hero() {
  const { hero } = useContent();

  return (
    <section
      id="inicio"
      data-section-bg="deep"
      className="relative z-10 grid h-dvh w-full grid-cols-12 grid-rows-[auto_1fr] px-4 py-18 lg:h-screen lg:px-14 lg:py-24"
    >
      <div className="order-2 col-span-12 flex flex-col font-mono text-base lg:order-1 lg:grid lg:grid-cols-12">
        <RevealLines
          lines={hero.eyebrow}
          className="hidden p-2 font-sans text-3xl leading-tight font-medium lg:col-span-3 lg:col-start-1 lg:block xl:col-span-2 xl:col-start-1"
        />

        <span className="hidden text-balance lg:col-span-3 lg:col-start-4 lg:block xl:col-span-2 xl:col-start-5">
          <span className="reveal-mask">
            <span data-reveal-line className="block p-2">
              {hero.tagline}
            </span>
          </span>
        </span>

        <p className="col-span-12 mt-auto p-2 lg:col-span-6 lg:col-start-7 lg:mt-0 xl:col-span-4 xl:col-start-9">
          <RichText value={hero.intro} />
        </p>
      </div>

      <RevealLines
        lines={hero.headline}
        className="order-1 col-span-12 self-end px-2 text-[7.2svw] leading-none font-bold uppercase lg:order-2 lg:text-[6svw] xl:text-[5.6svw] 2xl:text-[5svw]"
        lineClassName="[font-variation-settings:'wdth'_120]"
      />
    </section>
  );
}
