import { Geist_Mono, Martian_Mono, Roboto_Flex } from "next/font/google";

/**
 * Sustitutas libres de las tipografías de la referencia.
 *
 * `next/font/google` las descarga en build y las auto-hospeda, así que en
 * producción no hay request a Google ni FOIT. Cambiar de familia es editar
 * este archivo y nada más: `globals.css` consume solo las variables.
 */

/** Display y cuerpo. Eje `wdth` para el `wdth 120` de los titulares. */
export const fontSans = Roboto_Flex({
  subsets: ["latin"],
  variable: "--font-roboto-flex",
  axes: ["wdth"],
  display: "swap",
});

/** Mono de cuerpo: readouts, metadatos, labels pequeños. */
export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/** Mono ancha del chrome: nav, barra inferior, etiquetas técnicas. */
export const fontMono2 = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian-mono",
  axes: ["wdth"],
  display: "swap",
});

export const fontVariables = [fontSans.variable, fontMono.variable, fontMono2.variable].join(" ");
