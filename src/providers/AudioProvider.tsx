"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AudioEngine } from "@/lib/audio/engine";
import type { SfxName } from "@/lib/audio/sfx";

const STORAGE_KEY = "personeria:sound";

type SoundState = "on" | "off";

function isSoundState(value: string | null): value is SoundState {
  return value === "on" || value === "off";
}

interface AudioContextValue {
  /** Lo que el usuario pidió. Persiste entre visitas. */
  readonly enabled: boolean;
  /** El audio está realmente sonando. Es lo que refleja el spinner. */
  readonly running: boolean;
  toggle: () => void;
  /** Dispara un efecto puntual. No hace nada con el sonido apagado. */
  sfx: (name: SfxName) => void;
}

const SoundContext = createContext<AudioContextValue | null>(null);

/**
 * Audio ambiental del sitio.
 *
 * Los navegadores no dejan arrancar audio sin un gesto del usuario, así que
 * `enabled` (la intención, que persiste entre visitas) y `running` (la realidad)
 * son dos cosas distintas: si alguien llega con el sonido activado de antes,
 * queda armado y arranca en la primera interacción.
 *
 * Los ticks de hover se enganchan con un solo listener delegado en vez de un
 * handler por componente: son decenas de elementos y ninguno necesita saber que
 * existe el audio.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState(STORAGE_KEY, isSoundState, "off");
  const [unlocked, setUnlocked] = useState(false);
  // El constructor no toca `window`, así que es seguro también en el servidor.
  const [engine] = useState(() => new AudioEngine());

  const enabled = stored === "on";
  const running = enabled && unlocked;

  // Un solo gesto del usuario desbloquea el audio para toda la sesión.
  useEffect(() => {
    if (!enabled || unlocked) return;

    const unlock = () => setUnlocked(true);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled, unlocked]);

  useEffect(() => {
    if (running) void engine.start();
    else engine.stop();
  }, [running, engine]);

  useEffect(() => () => engine.dispose(), [engine]);

  // Tick al pasar por encima de cualquier target interactivo del chrome.
  useEffect(() => {
    if (!running) return;

    let last: Element | null = null;
    const onOver = (event: PointerEvent) => {
      // `pointerover` burbujea desde los hijos: sin este guardia, un enlace con
      // un span dentro dispararía el tick dos veces.
      const target =
        event.target instanceof Element ? event.target.closest(".dotted-target") : null;
      if (!target || target === last) return;
      last = target;
      engine.sfx("hover");
    };
    const onOut = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".dotted-target") === last) {
        last = null;
      }
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [running, engine]);

  const toggle = useCallback(() => {
    // Conmutar es en sí mismo el gesto que desbloquea el audio.
    setUnlocked(true);
    setStored(enabled ? "off" : "on");
    if (!enabled) engine.sfx("click");
  }, [enabled, setStored, engine]);

  const sfx = useCallback((name: SfxName) => engine.sfx(name), [engine]);

  const value = useMemo<AudioContextValue>(
    () => ({ enabled, running, toggle, sfx }),
    [enabled, running, toggle, sfx],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): AudioContextValue {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound debe usarse dentro de <AudioProvider>");
  return context;
}
