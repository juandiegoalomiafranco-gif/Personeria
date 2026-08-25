"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, ScrollTrigger } from "@/lib/scroll/gsap";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

interface ScrollContextValue {
  /** El contenedor que realmente scrollea. `null` hasta que monta. */
  readonly scroller: HTMLElement | null;
  readonly lenis: Lenis | null;
}

const ScrollContext = createContext<ScrollContextValue>({ scroller: null, lenis: null });

interface ScrollProviderProps {
  containerRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

/**
 * Scroll con inercia sobre el contenedor propio de la página.
 *
 * Dos detalles que son la diferencia entre que funcione y que no:
 *
 * 1. Lenis recibe `wrapper` y `content` explícitos. Sin eso intenta controlar
 *    el `window`, que aquí no scrollea nunca.
 * 2. `ScrollTrigger.defaults({ scroller })` hace que todo trigger del proyecto
 *    mida contra este contenedor. Es el error número uno al replicar sitios con
 *    scroll custom: los triggers apuntan a `window` y no disparan jamás.
 *
 * Con `prefers-reduced-motion` no se instancia Lenis: el contenedor conserva su
 * scroll nativo y ScrollTrigger trabaja contra él igual.
 */
export function ScrollProvider({ containerRef, children }: ScrollProviderProps) {
  const [value, setValue] = useState<ScrollContextValue>({ scroller: null, lenis: null });
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const wrapper = containerRef.current;
    const content = wrapper?.firstElementChild;
    if (!wrapper || !(content instanceof HTMLElement)) return;

    ScrollTrigger.defaults({ scroller: wrapper });

    if (prefersReducedMotion) {
      setValue({ scroller: wrapper, lenis: null });
      ScrollTrigger.refresh();
      return () => {
        ScrollTrigger.defaults({ scroller: undefined });
      };
    }

    const lenis = new Lenis({
      wrapper,
      content,
      // 0.1 deja una estela de ~1s: es el peso que tiene la referencia.
      lerp: 0.1,
      smoothWheel: true,
      // El scroll táctil nativo ya tiene su propia inercia; duplicarla se siente
      // resbaloso y rompe el gesto de "flick".
      syncTouch: false,
    });

    // Envuelto en flecha en vez de pasar `ScrollTrigger.update` suelto: el
    // método depende de su `this` y desprenderlo lo rompe.
    lenis.on("scroll", () => ScrollTrigger.update());

    // Un solo reloj para Lenis y GSAP: dos rAF independientes producen un
    // desfase de un frame entre el scroll y lo que se anima con él.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    setValue({ scroller: wrapper, lenis });
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      ScrollTrigger.defaults({ scroller: undefined });
      setValue({ scroller: null, lenis: null });
    };
  }, [containerRef, prefersReducedMotion]);

  // Llevar el foco a la vista.
  //
  // El navegador solo hace scroll automático hacia el elemento enfocado cuando
  // el scroll es suyo. Aquí no lo es, así que al tabular hacia una propuesta que
  // está más abajo el foco se iba a un elemento invisible y el usuario de
  // teclado quedaba perdido.
  useEffect(() => {
    const { scroller, lenis } = value;
    if (!scroller) return;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const box = target.getBoundingClientRect();
      const margin = window.innerHeight * 0.15;
      if (box.top >= margin && box.bottom <= window.innerHeight - margin) return;

      if (lenis) {
        lenis.scrollTo(target, { offset: -window.innerHeight * 0.35 });
      } else {
        target.scrollIntoView({ block: "center", behavior: "auto" });
      }
    };

    scroller.addEventListener("focusin", onFocusIn);
    return () => scroller.removeEventListener("focusin", onFocusIn);
  }, [value]);

  const memo = useMemo(() => value, [value]);
  return <ScrollContext.Provider value={memo}>{children}</ScrollContext.Provider>;
}

export function useScroll(): ScrollContextValue {
  return useContext(ScrollContext);
}
