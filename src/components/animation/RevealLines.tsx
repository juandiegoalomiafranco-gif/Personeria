import { cn } from "@/lib/utils";

interface RevealLinesProps {
  /** Una línea por entrada. Cada una recibe su propia máscara. */
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
}

/**
 * Texto por líneas con máscara de reveal.
 *
 * Cada línea es un span dentro de otro: el de fuera recorta con `overflow`, el
 * de dentro es el que se traslada. Es la estructura que usa la referencia y la
 * razón de que el texto entre "por debajo de un borde" en vez de hacer fade.
 *
 * En la Fase 3 el markup está en su estado final y visible. La Fase 4 anima los
 * `[data-reveal-line]` con GSAP sin tocar este componente.
 */
export function RevealLines({ lines, className, lineClassName }: RevealLinesProps) {
  return (
    <span className={cn("flex flex-col", className)}>
      {lines.map((line, index) => (
        <span key={index} className={cn("reveal-mask", lineClassName)}>
          <span data-reveal-line className="block">
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
