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

const STORAGE_KEY = "personeria:sound";

type SoundState = "on" | "off";

function isSoundState(value: string | null): value is SoundState {
  return value === "on" || value === "off";
}

interface AudioContextValue {
  /** Lo que el usuario pidió. Puede ser `true` con el audio aún suspendido. */
  readonly enabled: boolean;
  /** El audio está realmente sonando. Es lo que refleja el spinner. */
  readonly running: boolean;
  toggle: () => void;
}

const SoundContext = createContext<AudioContextValue | null>(null);

/**
 * Estado del audio ambiental.
 *
 * Los navegadores no dejan arrancar audio sin un gesto del usuario, así que
 * `enabled` (la intención, que persiste entre visitas) y `running` (la
 * realidad) son dos cosas distintas: si alguien llega con el sonido activado de
 * antes, queda armado y arranca en la primera interacción.
 *
 * El motor generativo se conecta aquí en la Fase 8; por ahora este provider
 * gestiona el estado y el desbloqueo.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState(STORAGE_KEY, isSoundState, "off");
  const [unlocked, setUnlocked] = useState(false);

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

  const toggle = useCallback(() => {
    // Conmutar es en sí mismo el gesto que desbloquea el audio.
    setUnlocked(true);
    setStored(enabled ? "off" : "on");
  }, [enabled, setStored]);

  const value = useMemo<AudioContextValue>(
    () => ({ enabled, running, toggle }),
    [enabled, running, toggle],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): AudioContextValue {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound debe usarse dentro de <AudioProvider>");
  return context;
}
