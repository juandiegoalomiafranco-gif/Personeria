"use client";

import { useLocale } from "@/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import { DOTTED } from "./dotted";

/** Globo terráqueo de la esquina inferior derecha: alterna español e inglés. */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, content, toggle } = useLocale();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${content.chrome.localeToggleLabel} (${locale.toUpperCase()})`}
      className={cn(DOTTED, "leading-none", className)}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.4" />
        <ellipse cx="12" cy="12" rx="4" ry="9.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 9.2h18M3 14.8h18" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </button>
  );
}
