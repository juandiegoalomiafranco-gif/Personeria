import { es } from "./es";
import { en } from "./en";
import { DEFAULT_LOCALE, type Locale, type SiteContent } from "./schema";

const DICTIONARIES: Record<Locale, SiteContent> = { es, en };

/** Devuelve el diccionario del idioma pedido, cayendo al default si no existe. */
export function getContent(locale: Locale = DEFAULT_LOCALE): SiteContent {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export { DEFAULT_LOCALE, LOCALES } from "./schema";
export type { Locale, RichText, RichNode, SiteContent, WorkItem, SocialLink } from "./schema";
