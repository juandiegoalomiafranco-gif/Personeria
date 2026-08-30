"use client";

import { useContent } from "@/providers/LocaleProvider";
import { FitText } from "@/components/animation/FitText";
import { HeroShader } from "@/components/three/HeroShader";
import { ScrollHint } from "@/components/ui/ScrollHint";

/**
 * Sección de apertura, a pantalla completa.
 *
 * Una sola columna centrada: los dos nombres cruzando el ancho de la pantalla y
 * debajo el bloque monoespaciado con la ficha de la candidatura. Nada más — la
 * referencia apoya todo el peso en esas dos piezas.
 *
 * El fondo es el shader de ruido, no la tipografía 3D: el hero ya no declara
 * `data-type3d` ni `data-stickers`, así que ni `InflatedType` ni los stickers de
 * física se montan aquí. Ambos siguen vivos en Contacto.
 *
 * `data-section-bg="void"` deja `--bg` en negro y apaga el degradé del
 * `Backdrop` (`--glow: 0`): el color de esta sección lo pone el shader.
 */
export function Hero() {
  const { hero } = useContent();

  return (
    <section
      id="inicio"
      data-section-bg="void"
      className="relative z-10 flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 lg:h-screen lg:px-14"
    >
      <HeroShader />

      <div className="relative z-10 flex w-full flex-col items-center">
        <FitText
          lines={hero.headline}
          className="text-l1 text-center leading-[0.86] uppercase"
          lineClassName="[font-variation-settings:'wght'_900,'wdth'_115] tracking-[-0.015em]"
          fallbackSize="7svw"
        />

        <ul className="text-l1 mt-5 flex flex-col items-center text-center font-mono text-[11px] leading-[1.55] tracking-[0.14em] uppercase lg:mt-7 lg:text-xs">
          {hero.meta.map((line, index) => (
            <li key={index} className="reveal-mask">
              <span data-reveal-line className="block">
                {line}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ScrollHint label={hero.scrollHint} />
    </section>
  );
}
