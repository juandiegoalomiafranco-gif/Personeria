"use client";

import { useEffect, useRef } from "react";
import { useContent } from "@/providers/LocaleProvider";
import { useScroll } from "@/providers/ScrollProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { mixRgb, parseHex, type Rgb } from "@/lib/color";
import {
  CHAPTERS,
  CHAPTER_COUNT,
  CHAPTER_RUNWAY_VH,
  chapterAt,
  createChapterCursor,
  layerWeight,
} from "@/lib/story/chapters";
import { ChapterBackdrop } from "@/components/animation/ChapterBackdrop";
import { cn } from "@/lib/utils";

/**
 * Cuánto scroll dura el anclaje, en múltiplos del alto del viewport.
 *
 * Sale de cuántos capítulos hay: añadir uno a `CHAPTERS` alarga la pista sola.
 */
export const CHAPTERS_RUNWAY_VH = CHAPTER_COUNT * CHAPTER_RUNWAY_VH;

/**
 * Ventana de entrada y de salida de cada bloque de texto, en unidades de
 * capítulo.
 *
 * La entrada empieza en negativo a propósito: el bloque del capítulo siguiente
 * ya se está montando mientras el anterior todavía se va. Sin ese solape hay un
 * instante con la pantalla vacía entre capítulo y capítulo, y el recorrido se
 * parte en cuatro diapositivas. Y cierra exactamente en 0 para que el primer
 * capítulo esté entero en el progreso 0, no a medio entrar.
 */
const BLOCK_IN: readonly [number, number] = [-0.16, 0];
const BLOCK_OUT: readonly [number, number] = [0.84, 1];

/**
 * Tramo del capítulo en el que se encienden las palabras.
 *
 * Acaba en 0.72 y no en 1: la última palabra tiene que llevar un rato en blanco
 * antes de que el bloque empiece a irse, o el lector nunca llega a ver la frase
 * completa.
 */
const REVEAL: readonly [number, number] = [0.06, 0.72];

/** Opacidad de una palabra todavía sin encender. Es `--label-3` sobre el fondo. */
const WORD_DIM = 0.3;

/**
 * Tipografía del bloque, compartida por el recorrido y su versión estática.
 *
 * Las líneas del copy están cortadas para no pasar de ~22 caracteres, que es lo
 * que cabe a este tamaño sin que el navegador las parta solo: un salto
 * automático rompe el ritmo que se eligió al escribir la frase.
 */
const STATEMENT_CLASS = cn(
  "text-[7.2svw] leading-none font-bold uppercase lg:text-[5.4svw]",
  "[font-variation-settings:'wdth'_120]",
);

/** Interpolación normalizada dentro de un tramo, recortada a [0,1]. */
function within(value: number, [start, end]: readonly [number, number]): number {
  if (end === start) return value >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

/**
 * El relato: quiénes son, en una sola frase que se escribe con el scroll.
 *
 * Un contenedor alto de verdad con un hijo `sticky top-0`: mientras el padre
 * cruza el viewport, el hijo queda congelado y su contenido se scrubbea con el
 * progreso.
 *
 * Lo que se lee es **una sola frase** repartida en capítulos, y las palabras se
 * encienden una a una conforme el scroll las alcanza — no hay titulares que se
 * releven. Detrás no hay nada que se mueva: solo cuatro capas de degradado que
 * se cruzan por opacidad, de modo que el fondo cambie de tono a lo largo del
 * recorrido sin que aparezca ni una partícula.
 *
 * Nada de esto pasa por estado de React. El texto, el fondo y las marcas los
 * escribe este componente directamente sobre el DOM desde el `onUpdate` del
 * trigger: son cientos de escrituras por segundo, y una sola de ellas en estado
 * re-renderizaría el árbol entero.
 */
export function Chapters() {
  const { story } = useContent();
  const { scroller } = useScroll();
  const { resolved } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!scroller || !section || prefersReducedMotion) return;

    const cursor = createChapterCursor();
    const root = document.documentElement;

    // Los colores base se leen del CSS y no de una constante de JS para que el
    // tema claro los redefina sin tocar este archivo. Se leen a mano y no por
    // frame: `getComputedStyle` fuerza un recálculo de estilo.
    let backgrounds: Rgb[] = CHAPTERS.map(() => [0, 0, 0] as const);
    const readBackgrounds = () => {
      const styles = getComputedStyle(root);
      backgrounds = CHAPTERS.map((chapter) => parseHex(styles.getPropertyValue(chapter.bgToken)));
    };

    readBackgrounds();

    // Y otra vez en el siguiente frame.
    //
    // Quien escribe `data-theme` es el efecto de `ThemeProvider`, que está por
    // encima en el árbol, y React corre los efectos de los hijos ANTES que los
    // del padre. Así que en el momento de la línea de arriba el atributo todavía
    // lleva el tema anterior: al arrancar en oscuro se leían los cuatro colores
    // del tema claro y la sección se quedaba en blanco. Un rAF cae después de
    // todo el commit, cuando el atributo ya es el definitivo.
    const themeFrame = requestAnimationFrame(readBackgrounds);

    const blocks = Array.from(section.querySelectorAll<HTMLElement>("[data-chapter]"));
    const words = blocks.map((block) =>
      Array.from(block.querySelectorAll<HTMLElement>("[data-word]")),
    );
    const layers = Array.from(section.querySelectorAll<HTMLElement>("[data-chapter-layer]"));
    const ticks = Array.from(section.querySelectorAll<HTMLElement>("[data-tick]"));

    /** Devuelve el fondo del sitio a lo que esperan las secciones vecinas. */
    const releaseBackground = () => {
      root.classList.remove("bg-scrub");
      root.style.setProperty("--bg", "var(--bg-void)");
      root.style.setProperty("--glow", "0");
    };

    const paint = (value: number) => {
      chapterAt(value, cursor);

      // El color del `body`. Va interpolado para que no haya costura entre la
      // capa del degradado y lo que queda fuera de ella.
      const from = backgrounds[cursor.index] ?? backgrounds[0];
      const to = backgrounds[cursor.next] ?? from;
      if (from && to) root.style.setProperty("--bg", mixRgb(from, to, cursor.blend));

      // Las capas del degradado: lo único que se les toca es la opacidad.
      for (let i = 0; i < layers.length; i += 1) {
        const layer = layers[i];
        if (!layer) continue;
        layer.style.opacity = `${layerWeight(cursor.position, i)}`;
      }

      blocks.forEach((block, index) => {
        // Cuánto lleva recorrido el capítulo de este bloque: negativo antes de
        // empezar, mayor que 1 cuando ya pasó.
        const local = cursor.position - index;
        const presence = within(local, BLOCK_IN) * (1 - within(local, BLOCK_OUT));

        // Fuera de su ventana el bloque sale del árbol de pintado. Sin esto los
        // cuatro se apilan traslúcidos sobre el mismo centro.
        if (presence <= 0) {
          block.style.visibility = "hidden";
          block.style.opacity = "0";
          return;
        }

        block.style.visibility = "visible";
        block.style.opacity = `${presence}`;
        // Entra desde abajo y sale hacia arriba. Solo `transform` y `opacity`:
        // las dos las resuelve el compositor sin repintar.
        const enter = (1 - within(local, BLOCK_IN)) * 9;
        const leave = within(local, BLOCK_OUT) * 7;
        block.style.transform = `translate3d(0, ${enter - leave}%, 0)`;

        // El cabezal de lectura, en unidades de palabra.
        const line = words[index];
        if (!line || line.length === 0) return;
        const head = within(local, REVEAL) * line.length;

        for (let i = 0; i < line.length; i += 1) {
          const word = line[i];
          if (!word) continue;
          // La palabra `i` cruza de gris a blanco mientras el cabezal la
          // atraviesa, así que en cualquier momento hay una a medio encender.
          // Eso es lo que hace que el efecto se lea como un scrub y no como un
          // stagger que corre solo.
          const lit = Math.min(1, Math.max(0, head - i));
          word.style.opacity = `${WORD_DIM + (1 - WORD_DIM) * lit}`;
        }
      });

      for (let i = 0; i < ticks.length; i += 1) {
        const tick = ticks[i];
        if (!tick) continue;
        tick.style.opacity = i === cursor.index ? "1" : "0.25";
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        // Solo se pinta dentro de la sección. `onUpdate` también dispara en el
        // frame en el que se sale, después de que `onToggle` haya devuelto el
        // fondo: sin esta guarda, ese último pintado volvía a escribir el color
        // del capítulo y el sitio se quedaba con él al llegar al hero.
        if (self.isActive) paint(self.progress);
      },
      onToggle: (self) => {
        if (self.isActive) {
          // Mientras el fondo se escribe por frame hay que apagar su transición.
          // Si no, cada escritura arranca una transición nueva de 300 ms y el
          // color queda persiguiendo al scroll con un retraso muy visible.
          root.classList.add("bg-scrub");
          // Aquí no hay luz de puntero: el fondo tiene que leerse constante.
          root.style.setProperty("--glow", "0");
          // El tema pudo cambiar mientras la sección estaba fuera de pantalla.
          readBackgrounds();
          paint(self.progress);
        } else {
          releaseBackground();
        }
      },
    });

    // El primer pintado no puede esperar al primer `onUpdate`: si la página
    // carga con el scroll ya dentro de la sección —una recarga a media página—
    // los bloques se quedarían con la opacidad del render del servidor.
    if (trigger.isActive) {
      root.classList.add("bg-scrub");
      root.style.setProperty("--glow", "0");
      paint(trigger.progress);
    }

    return () => {
      cancelAnimationFrame(themeFrame);
      trigger.kill();
      releaseBackground();
    };
  }, [scroller, prefersReducedMotion, resolved]);

  const chapters = story.chapters;

  // Con movimiento reducido no hay recorrido: la frase se lee entera, de una
  // vez, apilada y quieta. Antes esto dejaba quinientos vh de vacío con un solo
  // titular, que es peor que no tener la sección.
  if (prefersReducedMotion) {
    return (
      <section data-section-bg="void" className="relative z-10 w-full px-4 py-18 lg:px-14 lg:py-24">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          {chapters.map((lines, index) => (
            <p key={index} className={cn(STATEMENT_CLASS, "text-center")}>
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      // Un tono que `ScrollChoreography` no conoce y por tanto ignora: el fondo
      // de esta sección lo escribe ella misma, interpolado capítulo a capítulo.
      data-section-bg="chapters"
      className="relative z-10 w-full"
      style={{ height: `${CHAPTERS_RUNWAY_VH}vh` }}
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <ChapterBackdrop />

        <div className="relative h-full w-full">
          {chapters.map((lines, index) => (
            <p
              key={index}
              data-chapter={index}
              className={cn(
                STATEMENT_CLASS,
                "absolute inset-0 flex flex-col items-center justify-center text-center",
                "px-4 py-18 lg:px-14 lg:py-24",
              )}
              style={{ willChange: "transform, opacity" }}
            >
              {lines.map((line) => (
                <span key={line} className="reveal-mask">
                  <span className="block">
                    {line.split(" ").map((word, position) => (
                      <span
                        key={`${word}-${position}`}
                        data-word
                        // El espacio va dentro del span y no entre spans: con
                        // `inline-block` los saltos de línea del JSX no producen
                        // espacio, y las palabras se pegarían unas a otras.
                        className="inline-block whitespace-pre"
                        style={{ opacity: WORD_DIM }}
                      >
                        {position === 0 ? word : ` ${word}`}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </p>
          ))}

          {/* Dónde va el lector dentro del recorrido. Cuatro marcas bastan: es
              una señal de orientación, no un control.

              Van altas a propósito: el `Chrome` es un `fixed inset-0 z-50` con
              su fila de lectura pegada abajo, así que a `bottom-8` las marcas
              caían justo detrás del readout de coordenadas y no se veían. */}
          <div
            aria-hidden="true"
            className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-2 lg:bottom-24"
          >
            {chapters.map((_, index) => (
              <span
                key={index}
                data-tick
                className="bg-accent block h-0.5 w-6 transition-opacity duration-300"
                style={{ opacity: index === 0 ? 1 : 0.25 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
