"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** Tema efectivo tras resolver `system` contra la preferencia del sistema. */
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "personeria:theme";

/** Atajo de teclado que cicla el tema, igual que el `THEME[A]` de la referencia. */
export const THEME_SHORTCUT = "a";

// Definida a nivel de módulo: `usePersistentState` la usa como dependencia del
// snapshot, así que su identidad tiene que ser estable.
function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (THEME_MODES as readonly string[]).includes(value);
}

interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Avanza system → light → dark → system. */
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Script que corre antes del primer paint para aplicar el tema guardado.
 * Sin esto hay un flash del tema equivocado en cada carga.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = usePersistentState(STORAGE_KEY, isThemeMode, "system");
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  // Derivado, no estado: así el tema del sistema puede cambiar con la pestaña
  // abierta y todo se recalcula solo.
  const resolved: ResolvedTheme = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;

  // Único efecto: sincronizar el DOM. No hay setState aquí.
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const cycle = useCallback(() => {
    const index = THEME_MODES.indexOf(mode);
    setMode(THEME_MODES[(index + 1) % THEME_MODES.length] ?? "system");
  }, [mode, setMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== THEME_SHORTCUT) return;

      // No secuestrar la tecla mientras se escribe.
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.isContentEditable) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      }

      cycle();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, cycle }),
    [mode, resolved, setMode, cycle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return context;
}
