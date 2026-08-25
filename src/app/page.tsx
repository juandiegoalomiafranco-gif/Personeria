import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { Tunnel } from "@/components/sections/Tunnel";
import { Contact } from "@/components/sections/Contact";

/**
 * Composición de la página.
 *
 * El orden de las secciones es la coreografía: azul → negro → negro → negro →
 * azul. El `data-section-bg` de cada una es lo que la Fase 4 lee para interpolar
 * el fondo con el scroll.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Manifesto />
      <WorkGrid />
      <Tunnel />
      <Contact />
    </>
  );
}
