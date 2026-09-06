import { CHAPTERS } from "@/lib/story/chapters";

/**
 * Fondo de la sección del relato.
 *
 * Cuatro capas apiladas, una por capítulo, cada una con su degradado ya
 * resuelto. No se mueve nada: lo único que cambia con el scroll es la opacidad
 * de cada capa, y quien la escribe es el `onUpdate` de la sección — por eso
 * aquí no hay ni estado ni bucle de animación, solo marcado.
 *
 * Ese reparto es deliberado. Un degradado al que se le reescriben las paradas en
 * cada frame obliga al navegador a rerasterizar la pantalla completa; la
 * opacidad de una capa ya rasterizada la resuelve el compositor sin repintar
 * nada. Es la misma lección que dejó escrita el foco del `Backdrop`.
 *
 * Las capas van `absolute inset-0` dentro del contenedor `sticky` de la
 * sección, así que miden exactamente el viewport mientras el pin está activo y
 * se van solas por arriba y por abajo al terminar, sin necesidad de apagarlas.
 */
export function ChapterBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {CHAPTERS.map((chapter, index) => (
        <div
          key={chapter.id}
          data-chapter-layer={index}
          className="absolute inset-0"
          style={{
            // La primera capa es el suelo de la pila y nunca se apaga.
            opacity: index === 0 ? 1 : 0,
            // El color base pinta la capa entera y el tinte florece desde
            // arriba, que es de donde viene el lector: así el degradado empuja
            // hacia abajo en lugar de quedarse centrado y simétrico.
            backgroundColor: `var(${chapter.bgToken})`,
            backgroundImage: `radial-gradient(125% 88% at 50% 0%, var(${chapter.tintToken}), transparent 72%)`,
            willChange: "opacity",
          }}
        />
      ))}
    </div>
  );
}
