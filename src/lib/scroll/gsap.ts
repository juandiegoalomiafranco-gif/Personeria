import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Registro único de los plugins de GSAP.
 *
 * Importa desde aquí y nunca directo de `gsap/ScrollTrigger`: registrar dos
 * veces en módulos distintos crea instancias que no se ven entre sí y los
 * triggers dejan de refrescarse.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText };
