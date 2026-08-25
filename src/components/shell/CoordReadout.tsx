"use client";

import { useEffect, useRef } from "react";
import { usePointer } from "@/providers/PointerProvider";
import { pad } from "@/lib/utils";

/**
 * Lectura viva de la posición del puntero, `0324 X 0221 Y`.
 *
 * No hace nada funcional: existe para que la interfaz se sienta un instrumento.
 * Se actualiza escribiendo `textContent` desde la suscripción del puntero, no
 * con estado de React — a 120 Hz un re-render por evento no cabe en el frame.
 */
export function CoordReadout({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { subscribe } = usePointer();

  useEffect(() => {
    return subscribe((state) => {
      const element = ref.current;
      if (element) element.textContent = `${pad(state.x)} X ${pad(state.y)} Y`;
    });
  }, [subscribe]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      0000 X 0000 Y
    </span>
  );
}
