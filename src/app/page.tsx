import { Hero } from "@/components/sections/Hero";
import { Chapters } from "@/components/sections/Chapters";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { Contact } from "@/components/sections/Contact";

/**
 * Composición de la página.
 *
 * El orden es la narración: el hero da los dos nombres, y en cuanto se scrollea
 * arranca el relato — una sola frase que se escribe palabra a palabra mientras
 * el fondo cambia de tono. De ahí se cae en el manifiesto y en las propuestas
 * concretas.
 *
 * El `data-section-bg` de cada sección es lo que `ScrollChoreography` lee para
 * conmutar el fondo. El relato es la excepción: declara el tono `chapters`, que
 * esa coreografía ignora a propósito, porque su fondo lo escribe él mismo
 * interpolado capítulo a capítulo.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Chapters />
      <Manifesto />
      <WorkGrid />
      <Contact />
    </>
  );
}
