"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/scroll/gsap";
import { useScroll } from "@/providers/ScrollProvider";
import { useStage } from "@/providers/StageProvider";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { DURATION, STAGGER } from "@/lib/motion/durations";
import { GSAP_EASE } from "@/lib/motion/easings";

/** Selectores que orquesta este componente. */
const MASKED = "[data-reveal-line]";
const FADED = "[data-reveal-fade]";
const CARDS = "[data-reveal-card]";

/** Qué token de fondo usa cada tono declarado en `data-section-bg`. */
const BG_TOKENS: Record<string, string> = {
  deep: "var(--bg-deep)",
  void: "var(--bg-void)",
};

/**
 * Intensidad del degradé del fondo por tono de sección.
 *
 * Los tramos negros de la referencia son negro puro: ahí la luz del fondo
 * estorba, porque compite con las tarjetas y con el túnel.
 */
const GLOW_BY_TONE: Record<string, string> = {
  deep: "1",
  void: "0",
};

/**
 * Coreografía de scroll de toda la página.
 *
 * Va en un solo componente en vez de repartida por cada sección a propósito:
 * con `ScrollTrigger.batch` los elementos que entran juntos al viewport se
 * animan como un grupo con un stagger real, cosa imposible si cada uno crea su
 * propio trigger.
 *
 * No renderiza nada. Solo mira el DOM que ya está montado.
 */
export function ScrollChoreography() {
  const { scroller } = useScroll();
  const { ready } = useStage();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!scroller) return;

    // Con movimiento reducido el contenido se queda como lo sirvió el servidor:
    // visible y quieto. Nunca escondido esperando una animación que no corre.
    if (prefersReducedMotion) {
      applySectionBackgrounds();
      ScrollTrigger.refresh();
      return () => {
        for (const trigger of ScrollTrigger.getAll()) trigger.kill();
      };
    }

    if (!ready) return;

    const context = gsap.context(() => {
      // Estado inicial en un layout effect implícito de GSAP: se aplica antes
      // del siguiente paint, así no hay flash del texto ya visible.
      gsap.set(MASKED, { yPercent: 115, opacity: 0 });
      gsap.set(FADED, { yPercent: 40, opacity: 0 });
      gsap.set(CARDS, { y: 40, opacity: 0 });

      ScrollTrigger.batch(MASKED, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            yPercent: 0,
            opacity: 1,
            duration: DURATION.revealLine,
            stagger: STAGGER.lines,
            ease: GSAP_EASE.expoOut,
            overwrite: true,
          }),
      });

      ScrollTrigger.batch(FADED, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            yPercent: 0,
            opacity: 1,
            duration: DURATION.revealHeadline,
            stagger: STAGGER.lines,
            ease: GSAP_EASE.expoOut,
            overwrite: true,
          }),
      });

      ScrollTrigger.batch(CARDS, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: DURATION.revealCard,
            stagger: STAGGER.cards,
            ease: GSAP_EASE.expoOut,
            overwrite: true,
          }),
      });

      applySectionBackgrounds();
    });

    ScrollTrigger.refresh();

    return () => context.revert();
  }, [scroller, ready, prefersReducedMotion]);

  // El layout cambia de alto cuando cargan las fuentes y las imágenes: sin este
  // refresh los triggers quedan midiendo posiciones viejas.
  useEffect(() => {
    if (!scroller) return;
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts.ready.then(refresh);
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [scroller]);

  return null;
}

/**
 * Fondo por sección.
 *
 * En vez de interpolar el color frame a frame, cada sección declara su tono y
 * al cruzar el centro del viewport se conmuta la variable `--bg`. La transición
 * la hace el CSS con los 300ms de la referencia: más barato y el resultado es
 * el mismo crossfade continuo.
 */
function applySectionBackgrounds() {
  const sections = document.querySelectorAll<HTMLElement>("[data-section-bg]");

  for (const section of sections) {
    const token = BG_TOKENS[section.dataset.sectionBg ?? ""];
    if (!token) continue;

    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (!self.isActive) return;
        const root = document.documentElement.style;
        root.setProperty("--bg", token);
        root.setProperty("--glow", GLOW_BY_TONE[section.dataset.sectionBg ?? ""] ?? "1");
      },
    });
  }
}
