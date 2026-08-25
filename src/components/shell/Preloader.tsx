"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION } from "@/lib/motion/durations";
import { EASE, toCss } from "@/lib/motion/easings";
import { toMs } from "@/lib/motion/durations";

/** Progreso mínimo visible para que la barra no aparezca vacía y desaparezca. */
const FLOOR = 0.12;

interface PreloaderProps {
  /** Se llama una vez cuando la barra terminó de salir. */
  onDone?: () => void;
}

/**
 * Barra de carga de 140×6px centrada en pantalla.
 *
 * Espera a `document.fonts.ready` porque el reveal inicial anima texto: animar
 * antes de que la variable font resuelva produce un salto de métricas a media
 * animación. Las curvas y duraciones son las exactas de la referencia.
 */
export function Preloader({ onDone }: PreloaderProps) {
  const [progress, setProgress] = useState(FLOOR);
  const [hidden, setHidden] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let frame = 0;
    let settled = false;

    // Avance sintético mientras cargan las fuentes: se acerca a 0.9 sin llegar,
    // para que el salto a 1 coincida con el evento real y no antes.
    const creep = () => {
      setProgress((current) => (settled ? current : current + (0.9 - current) * 0.04));
      frame = requestAnimationFrame(creep);
    };
    frame = requestAnimationFrame(creep);

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      settled = true;
      cancelAnimationFrame(frame);
      setProgress(1);
    };

    void document.fonts.ready.then(finish);
    // Red lenta o fuentes que nunca resuelven: no dejamos al usuario esperando.
    const timeout = setTimeout(finish, 4000);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (progress < 1) return;
    const timeout = setTimeout(() => {
      setHidden(true);
      onDone?.();
    }, DURATION.preloaderFill * 1000);
    return () => clearTimeout(timeout);
  }, [progress, onDone]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 left-1/2 z-[90] flex h-4 w-[140px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{
        opacity: hidden ? 0 : 1,
        transition: `opacity ${toMs(DURATION.preloaderFade)} ${toCss(EASE.preloaderFade)}`,
      }}
    >
      <div className="bg-l3 relative h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-l1 absolute inset-y-0 left-0 rounded-full will-change-[width]"
          style={{
            width: `${(progress * 100).toFixed(1)}%`,
            transition: `width ${toMs(DURATION.preloaderFill)} ${toCss(EASE.preloaderFill)}`,
          }}
        />
      </div>
    </div>
  );
}
