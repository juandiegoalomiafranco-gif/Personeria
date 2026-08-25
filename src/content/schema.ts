/**
 * Esquema del contenido del sitio.
 *
 * Regla del proyecto: ningún componente escribe texto directamente. Todo el copy
 * vive en `es.ts` / `en.ts` tipado contra este esquema, de modo que cambiar el
 * contenido de la campaña sea editar un archivo y no cazar strings por 40
 * componentes. Lo que NO va aquí es presentación: los spans del grid, las clases
 * y los timings viven en sus componentes y en `lib/motion`.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/** Un fragmento de texto que puede llevar un enlace embebido. */
export type RichNode = string | { readonly text: string; readonly href: string };

/** Texto con enlaces intercalados, p. ej. `["Construyo ", {text:"X", href:"…"}, "."]`. */
export type RichText = readonly RichNode[];

export interface WorkItem {
  /** Identificador estable: se usa como key de React y para el orden del grid. */
  readonly id: string;
  readonly title: string;
  /** Rango de fechas o año, alineado a la derecha del label. */
  readonly period: string;
  /** Etiqueta lima sobre el preview. Omitir para que no aparezca. */
  readonly tag?: string;
  readonly href: string;
  /** Si es true se abre en pestaña nueva y muestra el indicador `↗`. */
  readonly external?: boolean;
  /** Palabra corta junto a la flecha en los externos, p. ej. "tools". */
  readonly externalLabel?: string;
}

export interface SocialLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface SiteContent {
  readonly meta: {
    readonly title: string;
    readonly description: string;
  };

  readonly brand: {
    /** Primera mitad del wordmark, en peso bold. */
    readonly name: string;
    /** Segunda mitad, se renderiza pegada a la primera. */
    readonly suffix: string;
  };

  readonly nav: {
    readonly work: string;
    readonly contact: string;
    /** Etiqueta del switch de tema; la letra del atajo se añade aparte. */
    readonly theme: string;
    readonly sound: string;
  };

  readonly hero: {
    /** Dos líneas cortas en la columna izquierda. */
    readonly eyebrow: readonly string[];
    readonly tagline: string;
    readonly intro: RichText;
    /** Tres líneas del titular gigante. */
    readonly headline: readonly string[];
    /** Palabra que deletrea la tipografía 3D del fondo. */
    readonly type3d: string;
  };

  readonly manifesto: {
    readonly image: { readonly src: string; readonly alt: string };
    /** Párrafo grande en blanco. */
    readonly primary: RichText;
    /** Párrafo grande en gris, con enlaces. */
    readonly secondary: RichText;
  };

  readonly work: {
    readonly title: string;
    readonly items: readonly WorkItem[];
  };

  readonly tunnel: {
    /** Titulares que se van reemplazando con el scroll; cada uno son sus líneas. */
    readonly statements: readonly (readonly string[])[];
    /** Frases sueltas que flotan en 3D dentro del túnel. */
    readonly phrases: readonly string[];
  };

  readonly contact: {
    /** Cuatro segmentos con alineación alterna: izq, der, izq, der. */
    readonly headline: readonly string[];
    readonly type3d: string;
    readonly email: string;
    readonly socials: readonly SocialLink[];
    readonly copyright: string;
  };

  readonly chrome: {
    /** Etiqueta de zona horaria de la barra inferior, p. ej. "GMT-5 CO". */
    readonly timezoneLabel: string;
    /** Coordenadas para el clima; la barra muestra la temperatura real. */
    readonly weather: { readonly latitude: number; readonly longitude: number };
    readonly localeToggleLabel: string;
  };
}
