"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useContent } from "@/providers/LocaleProvider";
import { useScroll } from "@/providers/ScrollProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ScrollTrigger } from "@/lib/scroll/gsap";
import { createProgressStore } from "@/lib/scroll/progress";
import { VELOCITY_FULL } from "@/lib/scroll/config";
import { mixRgb, parseHex, type Rgb } from "@/lib/color";
import {
  blendValue,
  CHAPTERS,
  CHAPTER_COUNT,
  CHAPTER_RUNWAY_VH,
  chapterAt,
  createChapterCursor,
} from "@/lib/three/chapters";
import { TunnelForeground } from "@/components/animation/TunnelForeground";
import { cn } from "@/lib/utils";

/**
 * Cuánto scroll dura el anclaje, en múltiplos del alto del viewport.
 *
 * Ya no es un número suelto: sale de cuántos capítulos hay. Añadir un capítulo
 * a `CHAPTERS` alarga la pista sola, sin tocar esto.
 */
export const TUNNEL_RUNWAY_VH = CHAPTER_COUNT * CHAPTER_RUNWAY_VH;

/**
 * Ventana de entrada y de salida de cada bloque de texto, en unidades de
 * capítulo.
 *
 * La entrada empieza en negativo a propósito: el bloque del capítulo siguiente
 * ya se está montando mientras el anterior todavía se va. Sin ese solape hay un
 * instante con la pantalla vacía entre capítulo y capítulo, y el recorrido se
 * parte en cuatro diapositivas.
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

/** El canvas pesa: solo se descarga cuando la página ya está interactiva. */
const TunnelCanvas = dynamic(
  () => import("@/components/three/TunnelCanvas").then((m) => m.TunnelCanvas),
  { ssr: false },
);

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
 * El giro: el recorrido por capítulos.
 *
 * Un contenedor alto de verdad con un hijo `sticky top-0`: mientras el padre
 * cruza el viewport, el hijo queda congelado y su contenido se scrubbea con el
 * progreso.
 *
 * Lo que se lee es **una sola frase** repartida en capítulos, y las palabras se
 * encienden una a una conforme el scroll las alcanza — no hay titulares que se
 * releven. Al mismo tiempo el capítulo manda sobre la paleta del túnel, sobre su
 * energía y sobre el fondo de la página, que se interpola en las zonas de
 * solape.
 *
 * Nada de esto pasa por estado de React. El progreso vive en un objeto mutable
 * que lee la escena 3D dentro de su bucle, y el texto y el fondo los escribe
 * este componente directamente sobre el DOM desde el `onUpdate` del trigger:
 * son cientos de escrituras por segundo, y una sola de ellas en estado
 * re-renderizaría el árbol entero.
 */
export function Tunnel() {
  const { tunnel } = useContent();
  const { scroller } = useScroll();
  const { resolved } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [progress] = useState(createProgressStore);

  useEffect(() => {
    const section = sectionRef.current;
    if (!scroller || !section || prefersReducedMotion) return;

    const cursor = createChapterCursor();
    const root = document.documentElement;

    // Los fondos de capítulo se leen del CSS y no de una constante de JS para
    // que el tema claro pueda redefinirlos sin tocar el 3D — el mismo camino que
    // usa `HeroShader`. Se leen a mano y no por frame: `getComputedStyle` fuerza
    // un recálculo de estilo.
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
    // lleva el tema anterior: al arrancar en oscuro se leían los cuatro fondos
    // del tema claro y el giro se quedaba en blanco toda la sección. Un rAF cae
    // después de todo el commit, cuando el atributo ya es el definitivo.
    const themeFrame = requestAnimationFrame(readBackgrounds);

    const blocks = Array.from(section.querySelectorAll<HTMLElement>("[data-chapter]"));
    const words = blocks.map((block) =>
      Array.from(block.querySelectorAll<HTMLElement>("[data-word]")),
    );
    const ticks = Array.from(section.querySelectorAll<HTMLElement>("[data-tick]"));

    /** Devuelve el fondo del sitio a lo que esperan las secciones vecinas. */
    const releaseBackground = () => {
      root.classList.remove("bg-scrub");
      root.style.setProperty("--bg", "var(--bg-void)");
      root.style.setProperty("--glow", "0");
    };

    const paint = (value: number) => {
      chapterAt(value, cursor);

      // Fondo y luz del capítulo.
      const from = backgrounds[cursor.index] ?? backgrounds[0];
      const to = backgrounds[cursor.next] ?? from;
      if (from && to) root.style.setProperty("--bg", mixRgb(from, to, cursor.blend));
      root.style.setProperty("--glow", `${blendValue(cursor, (chapter) => chapter.glow)}`);

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
        progress.value = self.progress;

        // El pulso de velocidad. Se recorta a 1 porque `getVelocity()` devuelve
        // píxeles por segundo sin techo —un golpe de rueda pasa de 5000 sin
        // esfuerzo— y sin recortarlo las estelas se irían a longitudes
        // absurdas en un solo frame. Quien lo baja es el bucle de render.
        progress.pushVelocity(Math.min(1, Math.abs(self.getVelocity()) / VELOCITY_FULL));

        // Solo se pinta dentro de la sección. `onUpdate` también dispara en el
        // frame en el que se sale, después de que `onToggle` haya devuelto el
        // fondo: sin esta guarda, ese último pintado volvía a escribir el color
        // del capítulo y el sitio se quedaba con el fondo del giro al llegar al
        // hero.
        if (self.isActive) paint(self.progress);
      },
      onToggle: (self) => {
        progress.setActive(self.isActive);

        if (self.isActive) {
          // Mientras el fondo se escribe por frame hay que apagar su transición.
          // Si no, cada escritura arranca una transición nueva de 300 ms y el
          // color queda persiguiendo al scroll con un retraso muy visible.
          root.classList.add("bg-scrub");
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
      paint(trigger.progress);
    }

    return () => {
      cancelAnimationFrame(themeFrame);
      trigger.kill();
      releaseBackground();
    };
  }, [scroller, prefersReducedMotion, progress, resolved]);

  const chapters = tunnel.chapters;

  // Con movimiento reducido no hay recorrido: la frase se lee entera, de una
  // vez, apilada y quieta. Antes esto dejaba quinientos vh de negro con un solo
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
        <ul className="sr-only">
          {tunnel.phrases.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      data-section-bg="chapters"
      className="relative z-10 w-full"
      style={{ height: `${TUNNEL_RUNWAY_VH}vh` }}
    >
      <TunnelCanvas phrases={tunnel.phrases} progress={progress} />

      {/* El `z-40` va aquí, no en el `p`.

          `position: sticky` crea un contexto de apilamiento propio, así que
          cualquier z-index de un hijo solo compite DENTRO de este div. El
          canvas del túnel es hermano suyo con `z-30`, y sin este z-40 se
          pintaba por encima del bloque entero: las estelas cruzaban por encima
          de las letras y lo dejaban ilegible. */}
      <div className="sticky top-0 z-40 h-dvh w-full">
        <div className="relative h-full w-full">
          {/* Velo de legibilidad.

              A la densidad de los últimos capítulos el radial llega al centro
              del encuadre, y ahí es donde están las palabras: las que todavía no
              se han encendido —que van al 30%— quedaban directamente ilegibles
              sobre las estelas. Este degradado hunde el centro sin tocar los
              bordes, así que el efecto se sigue viendo entero por fuera del
              bloque de texto.

              Se tiñe con `--bg`, no con negro: como el fondo lo escribe el
              propio capítulo en cada frame, el velo cambia de color con él en
              vez de dejar una mancha oscura sobre el verde. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 62% 42% at 50% 50%, color-mix(in oklab, var(--bg) 88%, transparent), transparent 74%)",
            }}
          />

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

      {/* Por encima del titular a propósito: es lo que hace que algo pase por
          delante de las palabras en vez de siempre por detrás. Va de hermano del
          sticky, no dentro, porque un z-index dentro de un sticky solo compite
          contra sus propios hermanos. */}
      <TunnelForeground progress={progress} />
    </section>
  );
}
