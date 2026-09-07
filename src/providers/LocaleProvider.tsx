"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, getContent, type Locale, type SiteContent } from "@/content";
import { usePersistentState } from "@/hooks/usePersistentState";

const STORAGE_KEY = "personeria:locale";

// A nivel de módulo para que su identidad sea estable entre renders.
function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

interface LocaleContextValue {
  readonly locale: Locale;
  /** Diccionario ya resuelto: los componentes leen de aquí, nunca importan es/en. */
  readonly content: SiteContent;
  setLocale: (locale: Locale) => void;
  /** Alterna entre los idiomas disponibles, para el botón del globo. */
  toggle: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Idioma del sitio.
 *
 * El default es español y solo cambia si el usuario lo pide con el globo. No se
 * detecta desde `navigator`: el público es un colegio colombiano, así que
 * adivinar solo produciría un parpadeo de idioma en la carga.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = usePersistentState(STORAGE_KEY, isLocale, DEFAULT_LOCALE);

  // `lang` correcto importa para lectores de pantalla y para la separación
  // silábica del navegador.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggle = useCallback(() => {
    const index = LOCALES.indexOf(locale);
    setLocale(LOCALES[(index + 1) % LOCALES.length] ?? DEFAULT_LOCALE);
  }, [locale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, content: getContent(locale), setLocale, toggle }),
    [locale, setLocale, toggle],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale debe usarse dentro de <LocaleProvider>");
  return context;
}

/** Atajo para el caso común: solo necesito el copy. */
export function useContent(): SiteContent {
  return useLocale().content;
}
