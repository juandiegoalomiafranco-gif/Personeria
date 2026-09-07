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
import { SCROLL_LERP, TOUCH_MULTIPLIER } from "@/lib/scroll/config";

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
      lerp: SCROLL_LERP,
      smoothWheel: true,
      // Lenis también maneja el táctil.
      //
      // Con `syncTouch: false` la idea era dejar la inercia nativa del sistema,
      // pero sobre un contenedor propio no funciona: el rAF de Lenis reescribe
      // la posición del scroll en cada frame y deshace lo que el dedo acababa de
      // mover. El resultado era una página completamente inmóvil en el celular.
      // Con `true` hay una sola fuente de verdad para la posición.
      syncTouch: true,
      touchMultiplier: TOUCH_MULTIPLIER,
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

  // Scroll con teclado.
  //
  // El navegador mueve un contenedor con las flechas solo cuando ese contenedor
  // tiene el foco, y aquí el foco vive en los enlaces del contenido. Sin esto,
  // las flechas, AvPág y Fin no movían la página en absoluto: quien no usa
  // ratón se quedaba encerrado en el hero.
  useEffect(() => {
    const { scroller, lenis } = value;
    if (!scroller) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // No secuestrar teclas mientras se escribe o dentro de un diálogo, que
      // trae su propia navegación.
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.isContentEditable) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
        if (target.closest('[role="dialog"]:not([hidden])')) return;
      }

      const page = window.innerHeight * 0.9;
      const step = window.innerHeight * 0.18;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const current = lenis ? lenis.scroll : scroller.scrollTop;

      let next: number | null = null;
      switch (event.key) {
        case "ArrowDown":
          next = current + step;
          break;
        case "ArrowUp":
          next = current - step;
          break;
        case "PageDown":
          next = current + page;
          break;
        case "PageUp":
          next = current - page;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = max;
          break;
        case " ":
          next = current + (event.shiftKey ? -page : page);
          break;
        default:
          return;
      }

      event.preventDefault();
      const clamped = Math.min(max, Math.max(0, next));
      if (lenis) lenis.scrollTo(clamped);
      else scroller.scrollTo({ top: clamped, behavior: "smooth" });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [value]);

  const memo = useMemo(() => value, [value]);
  return <ScrollContext.Provider value={memo}>{children}</ScrollContext.Provider>;
}

export function useScroll(): ScrollContextValue {
  return useContext(ScrollContext);
}
