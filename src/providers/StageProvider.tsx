"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface StageContextValue {
  /** `true` cuando el preloader terminó y el contenido puede empezar a animarse. */
  readonly ready: boolean;
  markReady: () => void;
}

const StageContext = createContext<StageContextValue | null>(null);

/**
 * Semáforo de la puesta en escena.
 *
 * Existe para que nada se anime mientras el preloader sigue en pantalla: si los
 * reveals arrancan antes, el usuario se pierde la mitad de la coreografía
 * detrás de la barra de carga.
 */
export function StageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const value = useMemo<StageContextValue>(() => ({ ready, markReady }), [ready, markReady]);

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function useStage(): StageContextValue {
  const context = useContext(StageContext);
  if (!context) throw new Error("useStage debe usarse dentro de <StageProvider>");
  return context;
}
