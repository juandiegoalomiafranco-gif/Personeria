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
  /**
   * Imagen de la propuesta. Si falta, la tarjeta dibuja un patrón generativo
   * derivado del `id`, para que el grid nunca se vea a medio hacer.
   */
  readonly preview?: { readonly src: string; readonly alt: string };
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
    /** Nombre completo. No se pinta: es la etiqueta accesible del wordmark. */
    readonly name: string;
    /**
     * Wordmark visible, en todos los tamaños.
     *
     * Va abreviado a propósito: el titular del hero ya dice los dos nombres
     * completos, así que repetirlos en la barra solo resta.
     */
    readonly short: string;
  };

  readonly nav: {
    readonly work: string;
    readonly contact: string;
    /** Etiqueta del switch de tema; la letra del atajo se añade aparte. */
    readonly theme: string;
    readonly sound: string;
    /** Etiqueta del botón que abre el menú en pantallas pequeñas. */
    readonly menu: string;
    readonly closeMenu: string;
  };

  readonly hero: {
    /**
     * Titular gigante. Una entrada por línea: en móvil se apilan y a partir de
     * `lg` se unen en una sola, que es el encuadre de la referencia.
     */
    readonly headline: readonly string[];
    /** Bloque monoespaciado centrado bajo el titular: qué, quiénes y dónde. */
    readonly meta: readonly string[];
    /** Etiqueta accesible del indicador de scroll. */
    readonly scrollHint: string;
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

  readonly story: {
    /**
     * La frase que cuenta quiénes son, repartida en capítulos. Cada capítulo
     * son sus líneas, y el componente parte cada línea en palabras para
     * encenderlas una a una con el scroll.
     *
     * Es **una sola oración continua**, no titulares sueltos: el recorrido la
     * va completando. Por eso las líneas terminan sin punto hasta el final.
     *
     * El número de capítulos tiene que coincidir con el de `CHAPTERS` en
     * `lib/story/chapters.ts`: el capítulo *i* del copy se pinta con el tono
     * *i*.
     */
    readonly chapters: readonly (readonly string[])[];
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
    /** Enlace de salto al contenido, visible solo con foco de teclado. */
    readonly skipToContent: string;
  };
}
