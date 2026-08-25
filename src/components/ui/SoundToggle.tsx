"use client";

import { useEffect, useState } from "react";
import { useSound } from "@/providers/AudioProvider";
import { useContent } from "@/providers/LocaleProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { DOTTED } from "./dotted";

/** Los cuatro fotogramas del spinner ASCII, en orden. */
const SPINNER = ["|", "/", "-", "\\"] as const;
const FRAME_MS = 120;

/**
 * Interruptor del audio, `SOUND[|]`.
 *
 * Mientras suena, el carácter entre corchetes cicla `| / - \` — un spinner
 * ASCII que hace de indicador de reproducción sin ocupar más espacio que un
 * carácter. Detenido muestra una barra fija.
 */
export function SoundToggle({ className }: { className?: string }) {
  const { running, toggle } = useSound();
  const { nav } = useContent();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!running || prefersReducedMotion) return;
    const interval = setInterval(
      () => setFrame((current) => (current + 1) % SPINNER.length),
      FRAME_MS,
    );
    return () => clearInterval(interval);
  }, [running, prefersReducedMotion]);

  const glyph = running ? (SPINNER[frame] ?? "|") : "|";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={running}
      aria-label={`${nav.sound}: ${running ? "on" : "off"}`}
      className={cn(DOTTED, "inline-flex shrink-0 items-baseline tabular-nums", className)}
    >
      {nav.sound}[<span className="inline-block w-[1ch] text-center">{glyph}</span>]
    </button>
  );
}
