import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registro único de los plugins de GSAP.
 *
 * Importa desde aquí y nunca directo de `gsap/ScrollTrigger`: registrar dos
 * veces en módulos distintos crea instancias que no se ven entre sí y los
 * triggers dejan de refrescarse.
 *
 * Solo ScrollTrigger. El reveal de texto no usa SplitText: las líneas ya vienen
 * separadas del diccionario de contenido y cada una trae su propia máscara, así
 * que partir el texto en runtime sería trabajo de más y un plugin de más en el
 * bundle.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
