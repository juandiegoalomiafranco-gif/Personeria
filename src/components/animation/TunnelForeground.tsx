"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ProgressStore } from "@/lib/scroll/progress";
import { blendValue, chapterAt, createChapterCursor } from "@/lib/three/chapters";
import { createRandom } from "@/lib/three/random";

/**
 * Cuántas estelas pasan por delante del titular.
 *
 * Pocas a propósito. En la referencia lo que cruza por delante del texto es un
 * contenedor cada varios segundos, no una cortina: si esto se llena, deja de
 * leerse como profundidad y pasa a leerse como ruido encima de las palabras.
 */
const COUNT = 14;

/** Semilla del reparto de ángulos y desfases. */
const SEED = 0xf00d;

/** Velocidad base del ciclo, en vueltas por segundo. */
const CYCLE_SPEED = 0.34;

/**
 * Opacidad máxima de una estela al cruzar.
 *
 * Estas pasan por delante de las palabras, así que el techo lo pone la lectura
 * y no el efecto: por encima de 0.4 una estela que cruza una línea la parte en
 * dos y hay que releerla.
 */
const PEAK_OPACITY = 0.38;

/**
 * Estelas de primer plano.
 *
 * El titular del giro va por encima del canvas del túnel, así que todas las
 * estelas quedan por detrás de las palabras y la sección se lee como un texto
 * sobre un fondo animado. En la referencia pasa lo contrario: un contenedor
 * cruza por delante del titular y lo ocluye a mitad de palabra, y eso es lo que
 * mete al lector *dentro* de la escena.
 *
 * Esta capa reproduce esa señal sin mover el texto al 3D — que costaría el
 * control tipográfico, la traducción y el camino de `prefers-reduced-motion`.
 * Son catorce divs con un degradado, cada uno saliendo del punto de fuga en su
 * propio ángulo.
 *
 * Solo se escribe `transform` y `opacity`, que resuelve el compositor sin
 * repintar; y el bucle solo corre mientras la sección está anclada, igual que
 * el canvas.
 */
export function TunnelForeground({ progress }: { progress: ProgressStore }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const cursor = useMemo(() => createChapterCursor(), []);

  // Ángulo de salida y desfase de cada estela. Deterministas: dos cargas de la
  // página reparten el abanico igual.
  const streaks = useMemo(() => {
    const random = createRandom(SEED);
    return Array.from({ length: COUNT }, () => ({
      angle: random() * Math.PI * 2,
      phase: random(),
      // Unas cruzan más rápido que otras; sin esto el abanico late a la vez y
      // se lee como un pulso en lugar de como cosas sueltas pasando.
      rate: 0.7 + random() * 0.8,
      thickness: 1 + Math.round(random() * 2),
    }));
  }, []);

  // El store lo escribe ScrollTrigger fuera de React. Igual que el canvas, esta
  // capa solo se re-renderiza al entrar y al salir de la sección.
  const subscribe = useCallback((onChange: () => void) => progress.subscribe(onChange), [progress]);
  const getSnapshot = useCallback(() => progress.active, [progress]);
  const running = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !running) return;

    const nodes = Array.from(layer.children) as HTMLElement[];
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      // Recortado como en el resto del túnel: volver a una pestaña dormida no
      // debe teletransportar todo el abanico de golpe.
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      chapterAt(progress.value, cursor);
      elapsed += delta * CYCLE_SPEED * blendValue(cursor, (chapter) => chapter.speed);

      // La diagonal, no el ancho: una estela tiene que salirse también por las
      // esquinas de una pantalla apaisada.
      const reach = Math.hypot(window.innerWidth, window.innerHeight) * 0.62;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        const streak = streaks[i];
        if (!node || !streak) continue;

        const t = (elapsed * streak.rate + streak.phase) % 1;

        // Exponencial y no lineal: en perspectiva, algo que viene de frente
        // parece quieto al fondo y se dispara al pasar al lado.
        const travel = (Math.exp(t * 3.1) - 1) / (Math.exp(3.1) - 1);
        const radius = travel * reach;
        const length = 0.25 + travel * 2.4;

        const fadeIn = Math.min(1, t / 0.22);
        const fadeOut = 1 - Math.min(1, Math.max(0, (t - 0.72) / 0.28));

        node.style.transform = `rotate(${streak.angle}rad) translateX(${radius}px) scaleX(${length})`;
        node.style.opacity = `${fadeIn * fadeOut * PEAK_OPACITY}`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, progress, cursor, streaks]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      style={{ opacity: running ? 1 : 0, transition: "opacity 320ms ease-out" }}
    >
      {streaks.map((streak, index) => (
        <span
          key={index}
          className="absolute top-1/2 left-1/2 block"
          style={{
            width: "16vmax",
            height: `${streak.thickness}px`,
            // El origen en el borde izquierdo hace que `rotate` gire alrededor
            // del punto de fuga y `translateX` empuje a lo largo del propio eje
            // de la estela, que es lo que la mantiene apuntando hacia afuera.
            transformOrigin: "0 50%",
            opacity: 0,
            // Bordes desvanecidos con el propio degradado en vez de un
            // `filter: blur`, que obligaría a repintar la capa en cada frame.
            background:
              "linear-gradient(90deg, transparent, var(--label-1) 35%, var(--label-1) 65%, transparent)",
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
