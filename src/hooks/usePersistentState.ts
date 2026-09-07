"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Evento propio: `storage` solo dispara en OTRAS pestañas, no en la actual. */
const CHANGE_EVENT = "personeria:storage";

/**
 * Respaldo en memoria para cuando `localStorage` está bloqueado (modo privado,
 * cookies de terceros deshabilitadas). Sin esto los toggles dejarían de
 * funcionar por completo en esos navegadores, no solo de recordarse.
 */
const memory = new Map<string, string>();

function emit() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Solo queda el respaldo en memoria: vive lo que dure la pestaña.
  }
}

/**
 * Estado persistido en `localStorage`, leído como fuente externa.
 *
 * Usar `useSyncExternalStore` en vez de `useEffect` + `setState` evita el flash
 * del valor por defecto en el primer frame, y sincroniza entre pestañas gratis.
 *
 * `isValid` debe estar definida a nivel de módulo: si cambia de identidad en
 * cada render, el snapshot se recalcula infinitamente.
 */
export function usePersistentState<T extends string>(
  key: string,
  isValid: (value: string | null) => value is T,
  serverValue: T,
): readonly [T, (next: T) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, []);

  const getSnapshot = useCallback((): T => {
    const raw = read(key);
    return isValid(raw) ? raw : serverValue;
  }, [key, isValid, serverValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => serverValue);

  const set = useCallback(
    (next: T) => {
      write(key, next);
      emit();
    },
    [key],
  );

  return [value, set] as const;
}
