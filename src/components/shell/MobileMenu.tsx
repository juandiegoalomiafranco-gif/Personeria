"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useContent } from "@/providers/LocaleProvider";
import { useScroll } from "@/providers/ScrollProvider";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { DOTTED } from "@/components/ui/dotted";
import { cn } from "@/lib/utils";

/** Elementos enfocables dentro de la capa, para el ciclo de Tab. */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menú de pantallas pequeñas.
 *
 * La referencia esconde el nav por debajo de `lg` y no ofrece alternativa. En un
 * portafolio da igual; aquí casi todo el tráfico llega desde el teléfono, y sin
 * esto no habría forma de llegar a las propuestas, al contacto, ni de encender
 * la música. Se dibuja con el mismo lenguaje del chrome —mono, mayúsculas,
 * rectángulo punteado— para que no se sienta pegado desde otro sitio.
 *
 * Mientras está abierto detiene Lenis: si no, el scroll de la página sigue
 * corriendo por detrás de la capa.
 */
export function MobileMenu() {
  const { nav } = useContent();
  const { lenis } = useScroll();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Congelar el scroll de fondo mientras la capa está arriba.
  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [open, lenis]);

  // Escape para cerrar y Tab atrapado dentro de la capa: dejar que el foco se
  // escape a lo que hay debajo es el fallo clásico de un menú modal.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Al abrir, el foco entra a la capa; al cerrar, vuelve al botón que la abrió.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    else triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(DOTTED, "pointer-events-auto lg:hidden")}
      >
        {nav.menu}[+]
      </button>

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={nav.menu}
        // `hidden` de verdad cuando está cerrado: con solo opacidad, los
        // enlaces siguen siendo enfocables por debajo de la página.
        hidden={!open}
        className="bg-bg text-l1 pointer-events-auto fixed inset-0 z-[60] flex flex-col justify-between px-4 py-4 lg:hidden"
      >
        <div className="flex justify-end">
          <button type="button" onClick={close} className={cn(DOTTED, "font-mono-2 text-sm")}>
            {nav.closeMenu}[×]
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <a
            href="#propuestas"
            onClick={close}
            className={cn(
              DOTTED,
              "font-sans text-[10svw] leading-none font-bold",
              "[font-variation-settings:'wdth'_120]",
            )}
          >
            {nav.work}
          </a>
          <a
            href="#contacto"
            onClick={close}
            className={cn(
              DOTTED,
              "font-sans text-[10svw] leading-none font-bold",
              "[font-variation-settings:'wdth'_120]",
            )}
          >
            {nav.contact}
          </a>
        </nav>

        <div className="font-mono-2 flex items-center justify-between gap-2 text-sm">
          <ThemeToggle />
          <SoundToggle />
          <LocaleToggle />
        </div>
      </div>
    </>
  );
}
