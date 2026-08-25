"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface PointerState {
  /** Posición en píxeles de viewport. */
  x: number;
  y: number;
  /** Posición normalizada a [-1, 1], con el origen en el centro. Para WebGL. */
  nx: number;
  ny: number;
  down: boolean;
  /** `false` hasta el primer movimiento real, para no dibujar el cursor en 0,0. */
  active: boolean;
}

type Listener = (state: Readonly<PointerState>) => void;

interface PointerContextValue {
  /** Estado mutable. Léelo dentro de tu propio rAF; nunca dispara re-render. */
  readonly state: Readonly<PointerState>;
  /** Se llama una vez por frame mientras el puntero se mueva. */
  subscribe: (listener: Listener) => () => void;
}

const PointerContext = createContext<PointerContextValue | null>(null);

/**
 * Distribuye la posición del puntero sin re-renderizar React.
 *
 * A 120 Hz un `useState` por evento tumbaría el frame budget, así que el estado
 * vive en un objeto mutable y los consumidores se suscriben para escribir
 * directo al DOM o a un uniform de three.
 *
 * El store se crea una sola vez con un inicializador perezoso en vez de con
 * refs: los refs no pueden leerse durante el render, y el valor del contexto se
 * arma justamente ahí.
 */
export function PointerProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => {
    const state: PointerState = { x: 0, y: 0, nx: 0, ny: 0, down: false, active: false };
    const listeners = new Set<Listener>();

    const value: PointerContextValue = {
      state,
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };

    return { state, listeners, value };
  });

  useEffect(() => {
    const { state, listeners } = store;
    let frame = 0;
    let dirty = false;

    const flush = () => {
      frame = 0;
      dirty = false;
      for (const listener of listeners) listener(state);
    };

    // Los eventos de puntero llegan más rápido que los frames: acumulamos y
    // notificamos una sola vez por rAF.
    const schedule = () => {
      if (dirty) return;
      dirty = true;
      frame = requestAnimationFrame(flush);
    };

    const onMove = (event: PointerEvent) => {
      state.x = event.clientX;
      state.y = event.clientY;
      state.nx = (event.clientX / window.innerWidth) * 2 - 1;
      state.ny = -((event.clientY / window.innerHeight) * 2 - 1);
      state.active = true;
      schedule();
    };

    const onDown = () => {
      state.down = true;
      schedule();
    };

    const onUp = () => {
      state.down = false;
      schedule();
    };

    const onLeave = () => {
      state.active = false;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [store]);

  return <PointerContext.Provider value={store.value}>{children}</PointerContext.Provider>;
}

export function usePointer(): PointerContextValue {
  const context = useContext(PointerContext);
  if (!context) throw new Error("usePointer debe usarse dentro de <PointerProvider>");
  return context;
}
