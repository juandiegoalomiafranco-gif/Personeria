import { cn } from "@/lib/utils";

interface ScrollHintProps {
  /** Etiqueta para lectores de pantalla. El punto en sí es decorativo. */
  label: string;
  className?: string;
}

/**
 * Punto al pie del hero que invita a bajar.
 *
 * Va por encima de la fila inferior del chrome, no pegado al borde: ahí abajo ya
 * están el reloj y el readout de coordenadas, y centrado al ras se montaba
 * encima de este último.
 *
 * El bob vive en `globals.css` como `@keyframes scroll-hint`, así que el bloque
 * global de `prefers-reduced-motion` lo detiene dejando el punto visible.
 */
export function ScrollHint({ label, className }: ScrollHintProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 lg:bottom-20",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="border-line-strong scroll-hint flex size-6 items-center justify-center rounded-full border"
      >
        <span className="bg-accent block size-1.5 rounded-full" />
      </span>
    </span>
  );
}
