"use client";

import { THEME_SHORTCUT, useTheme } from "@/providers/ThemeProvider";
import { useContent } from "@/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import { DOTTED } from "./dotted";

/**
 * Conmutador de tema, `THEME[A]`.
 *
 * La letra entre corchetes es el atajo de teclado, no un estado. El modo actual
 * (system / light / dark) va en el `aria-label` porque visualmente el chrome se
 * mantiene idéntico — igual que en la referencia.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, cycle } = useTheme();
  const { nav } = useContent();

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${nav.theme}: ${mode}`}
      className={cn(DOTTED, className)}
    >
      {nav.theme}[{THEME_SHORTCUT.toUpperCase()}]
    </button>
  );
}
