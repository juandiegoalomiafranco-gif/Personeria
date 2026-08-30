"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/** Tamaño de la sonda. Cualquiera sirve: solo importa la proporción. */
const PROBE_PX = 100;

/** Diferencia de tamaño por debajo de la cual ya no vale la pena re-renderizar. */
const EPSILON_PX = 0.5;

/** Tope de pasadas de ajuste, por si alguna vez oscilara en vez de converger. */
const MAX_PASSES = 4;

interface FitTextProps {
  /** Una entrada por línea. A partir de `lg` se unen en una sola. */
  lines: readonly string[];
  className?: string;
  /**
   * Clases de la línea. Van en el mismo elemento que el `font-size`, así que
   * aquí las unidades `em` se resuelven contra el tamaño ya ajustado.
   */
  lineClassName?: string;
  /**
   * Tamaño mientras no se ha medido y si JavaScript no corre. Conviene que
   * quede cerca del resultado real para que no se vea el reajuste.
   */
  fallbackSize?: string;
}

/**
 * Texto que se escala hasta ocupar exactamente el ancho de su contenedor.
 *
 * Lo que define el titular de la referencia es que llega de borde a borde. Con
 * un `text-[Nsvw]` fijo eso solo cuadra en el viewport donde se afinó el número
 * y se rompe en cuanto cambia el nombre o el idioma. Aquí se mide el ancho real
 * del texto y se despeja el tamaño que lo hace encajar.
 *
 * Emite la misma estructura que `RevealLines` — máscara fuera, `data-reveal-line`
 * dentro — para que `ScrollChoreography` lo anime sin saber que existe.
 *
 * En móvil respeta el corte de línea del diccionario y ajusta cada línea por
 * separado; a partir de `lg` las une, que es el encuadre de la referencia.
 */
export function FitText({ lines, className, lineClassName, fallbackSize = "9svw" }: FitTextProps) {
  const isDesktop = useIsDesktop();
  const rendered = isDesktop ? [lines.join(" ")] : lines;

  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const passesRef = useRef(0);
  const [sizes, setSizes] = useState<readonly number[] | null>(null);

  // Las dependencias de un efecto no pueden ser un array nuevo en cada render.
  const key = rendered.join(" ");

  const measure = useCallback(() => {
    const container = containerRef.current;
    const measurer = measureRef.current;
    if (!container || !measurer) return;

    // `w-full` en el contenedor no es cosmético: si su ancho dependiera del
    // contenido (un flex con `items-center`, por ejemplo), cada medición
    // agrandaría la fuente, que agrandaría el contenedor, que agrandaría la
    // fuente. Se dispara hasta el infinito en dos o tres frames.
    const available = container.clientWidth;
    if (available === 0) return;

    const range = document.createRange();
    const inkWidth = (el: Element) => {
      range.selectNodeContents(el);
      return range.getBoundingClientRect().width;
    };

    const probes = [...measurer.children];
    const output = [...container.querySelectorAll("[data-fit-line]")];

    setSizes((previous) => {
      const next = probes.map((probe, index) => {
        const current = previous?.[index];
        const real = output[index];

        // Con un tamaño ya aplicado se mide la línea de verdad. La sonda a
        // 100px no reproduce exacto el redondeo de avances del tamaño final:
        // sobraba un 0,3% que, con la máscara recortando, se comía el borde de
        // la primera y la última letra. Esta pasada lo cierra.
        if (current !== undefined && real) {
          const ink = inkWidth(real);
          return ink > 0 ? (current * available) / ink : current;
        }

        const ink = inkWidth(probe);
        return ink > 0 ? (PROBE_PX * available) / ink : PROBE_PX;
      });

      const settled =
        previous?.length === next.length &&
        previous.every((size, index) => Math.abs(size - (next[index] ?? 0)) < EPSILON_PX);

      if (settled || passesRef.current >= MAX_PASSES) return previous ?? next;

      passesRef.current += 1;
      return next;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const remeasure = () => {
      passesRef.current = 0;
      measure();
    };

    remeasure();

    const observer = new ResizeObserver(remeasure);
    observer.observe(container);

    // Observar la sonda es lo que hace que esto funcione con fuentes web.
    // `document.fonts.ready` puede resolver ANTES de que la fuente se pida
    // — se piden en el primer layout que las usa — así que solo con eso se
    // mide con la de respaldo, que es más estrecha, y el titular sale grande y
    // desbordado. El ancho de la sonda sí cambia al entrar la fuente buena, y
    // no realimenta nada porque su tamaño está clavado en `PROBE_PX`.
    const measurer = measureRef.current;
    if (measurer) observer.observe(measurer);

    return () => observer.disconnect();
  }, [measure, key]);

  return (
    <span ref={containerRef} className={cn("relative block w-full", className)}>
      {/* Sonda: fuera de flujo y sin pintar, pero con exactamente la misma
          tipografía que las líneas reales. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={cn("pointer-events-none invisible absolute top-0 left-0", lineClassName)}
        style={{ fontSize: `${PROBE_PX}px` }}
      >
        {/* `w-max` por línea: sin él los hijos se estiran al ancho del más
            largo, y entonces las dos líneas del móvil medirían lo mismo y la
            corta saldría demasiado pequeña. */}
        {rendered.map((line, index) => (
          <span key={index} className="block w-max whitespace-pre">
            {line}
          </span>
        ))}
      </span>

      {/* El tamaño va en la máscara, junto a `lineClassName`, no en el hijo:
          las unidades `em` de esas clases (el `tracking`, el colchón vertical
          de `reveal-mask`) se resuelven contra el `font-size` de SU elemento.
          Con el tamaño en el hijo, un `tracking` en `em` se calculaba contra
          los 16px heredados y el texto salía un 2,5% más ancho de lo medido. */}
      {rendered.map((line, index) => (
        <span
          key={index}
          className={cn("reveal-mask", lineClassName)}
          style={{ fontSize: sizes ? `${sizes[index]}px` : fallbackSize }}
        >
          <span data-fit-line data-reveal-line className="block whitespace-pre">
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
