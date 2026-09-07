"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Suscribe a una media query con `useSyncExternalStore`.
 *
 * `matchMedia` es una fuente externa, así que este es el hook correcto: evita el
 * ciclo render → efecto → setState → render que produce un flash del valor
 * equivocado en el primer frame.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // En el servidor no hay media queries. `false` es el valor conservador: nada
  // de movimiento reducido, nada de hover, layout móvil.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** `true` cuando el usuario pidió menos movimiento en su sistema operativo. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** `true` solo con puntero fino y hover real: descarta touch. */
export function useHasFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** `true` a partir del breakpoint `lg` de Tailwind (1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
