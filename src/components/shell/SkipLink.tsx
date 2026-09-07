"use client";

import { useContent } from "@/providers/LocaleProvider";

/**
 * Enlace para saltar al contenido.
 *
 * Invisible hasta que recibe foco. Sin él, quien navega con teclado tiene que
 * pasar por todo el chrome en cada carga antes de llegar a lo que vino a leer.
 * Va primero en el DOM a propósito: tiene que ser lo primero que reciba el Tab.
 */
export function SkipLink() {
  const { chrome } = useContent();

  return (
    <a
      href="#contenido"
      className="bg-accent text-on-accent font-mono-2 sr-only z-[110] rounded-none px-4 py-3 text-sm uppercase focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4"
    >
      {chrome.skipToContent}
    </a>
  );
}
