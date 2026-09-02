import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { Tunnel } from "@/components/sections/Tunnel";
import { Contact } from "@/components/sections/Contact";

/**
 * Composición de la página.
 *
 * El orden es la narración: el hero presenta los nombres, el manifiesto los
 * sitúa, el giro cuenta quiénes son en una sola frase que se completa con el
 * scroll, y de ahí se cae en las propuestas concretas. El giro va **antes** de
 * las propuestas justamente por eso: es la presentación, no el epílogo.
 *
 * El `data-section-bg` de cada sección es lo que `ScrollChoreography` lee para
 * conmutar el fondo. El giro es la excepción: declara el tono `chapters`, que
 * esa coreografía ignora a propósito, porque su fondo lo escribe él mismo
 * interpolado capítulo a capítulo.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Tunnel />
      <WorkGrid />
      <Contact />
    </>
  );
}
