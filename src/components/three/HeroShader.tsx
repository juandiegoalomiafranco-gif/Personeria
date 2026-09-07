"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { AMBIENT_DPR, useQualityTier } from "@/hooks/useQualityTier";
import { useScroll } from "@/providers/ScrollProvider";
import { useStage } from "@/providers/StageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import {
  FRAGMENT_SHADER,
  SHADER_BG_VAR,
  SHADER_COLOR_VARS,
  SHADER_FPS,
  SHADER_GRAIN,
  SHADER_SPEED,
  VERTEX_SHADER,
  hexToRgb,
} from "@/lib/three/heroShader";

/** Compila una etapa y devuelve `null` si el driver la rechaza. */
function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Sin este aviso un shader que no compila se ve igual que un fondo negro
    // intencional, y cuesta muchísimo descubrir por qué no pasa nada.
    console.warn("HeroShader: shader no compila —", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

interface Ctx {
  readonly gl: WebGLRenderingContext;
  readonly resolution: WebGLUniformLocation | null;
  readonly time: WebGLUniformLocation | null;
  readonly grain: WebGLUniformLocation | null;
  readonly colors: WebGLUniformLocation | null;
  readonly bg: WebGLUniformLocation | null;
}

/** Crea el contexto, enlaza el programa y deja el quad listo para dibujar. */
function createContext(canvas: HTMLCanvasElement): Ctx | null {
  const gl = canvas.getContext("webgl", {
    // Fondo opaco: sin canal alfa el compositor no tiene que mezclarlo.
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("HeroShader: el programa no enlaza —", gl.getProgramInfoLog(program));
    return null;
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    grain: gl.getUniformLocation(program, "u_grain"),
    colors: gl.getUniformLocation(program, "u_colors"),
    bg: gl.getUniformLocation(program, "u_bg"),
  };
}

/** Lee los cuatro colores y el fondo de las variables CSS, ya en 0..1. */
function readPalette(): { colors: Float32Array; bg: readonly [number, number, number] } {
  const styles = getComputedStyle(document.documentElement);
  const colors = new Float32Array(
    SHADER_COLOR_VARS.flatMap((name) => [...hexToRgb(styles.getPropertyValue(name))]),
  );
  return { colors, bg: hexToRgb(styles.getPropertyValue(SHADER_BG_VAR)) };
}

/**
 * Fondo del hero: dos triángulos a pantalla completa con el shader de ruido.
 *
 * Tres cosas lo separan de un canvas WebGL cualquiera, y las tres son reglas
 * del proyecto:
 *
 * 1. Dibuja a 30 fps, no a 60. Lenis interpola dentro del mismo rAF, así que un
 *    frame caro de shader es scroll que no se actualiza.
 * 2. Para el bucle en cuanto el hero sale del viewport o la pestaña se oculta.
 *    El observer se ancla al contenedor de scroll, no a `window`: la página vive
 *    en un div con su propio overflow y contra `window` todo intersecta siempre.
 * 3. Con `prefers-reduced-motion` dibuja un único frame y no agenda nada. El
 *    fondo queda visible y quieto, nunca en negro esperando una animación.
 *
 * Los colores salen de variables CSS (`--hero-shader-*`) en vez de estar
 * escritos aquí, que es lo que permite que el tema claro los redefina.
 */
export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<Ctx | null>(null);
  const { scroller } = useScroll();
  const { ready } = useStage();
  const { resolved } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const tier = useQualityTier();

  // El contexto se pierde cuando el sistema resetea la GPU. Sin volver a
  // enlazar el programa el hero se queda tapado para siempre.
  const [generation, setGeneration] = useState(0);
  const restore = useCallback(() => {
    ctxRef.current = null;
    setGeneration((value) => value + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // El contexto se crea UNA vez y sobrevive a las repeticiones del efecto.
    // Un canvas solo admite un contexto: si se destruyera al limpiar, el
    // `getContext` de la pasada siguiente devolvería ese mismo objeto ya
    // perdido y el shader no volvería nunca. En React 19 el efecto se ejecuta
    // dos veces en desarrollo, así que el fallo aparece de inmediato.
    ctxRef.current ??= createContext(canvas);
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { gl } = ctx;

    // Uniforms constantes: fuera del bucle. La versión de la referencia
    // reconstruía el Float32Array de colores en cada frame.
    const palette = readPalette();
    gl.uniform3fv(ctx.colors, palette.colors);
    gl.uniform3f(ctx.bg, ...palette.bg);
    gl.uniform1f(ctx.grain, SHADER_GRAIN);

    const draw = (timeMs: number) => {
      gl.uniform1f(ctx.time, timeMs * 0.001 * SHADER_SPEED);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let raf = 0;
    let running = false;
    let last = 0;
    const interval = 1000 / SHADER_FPS;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < interval) return;
      last = now;
      draw(now);
    };

    const start = () => {
      if (running || prefersReducedMotion || !ready) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, AMBIENT_DPR[tier]);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      const changed = canvas.width !== width || canvas.height !== height;

      if (changed) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(ctx.resolution, width, height);
      }
      // Un canvas recién redimensionado sale vacío: si el bucle está parado hay
      // que repintarlo a mano.
      if (!running) draw(0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Fuera del viewport o con la pestaña oculta no hay nada que animar.
    let inView = true;
    const sync = () => {
      if (inView && document.visibilityState === "visible") start();
      else stop();
    };

    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inView = entry.isIntersecting;
        sync();
      },
      { root: scroller ?? null, threshold: 0 },
    );
    intersection.observe(canvas);

    document.addEventListener("visibilitychange", sync);

    const onLost = (event: Event) => {
      // Sin `preventDefault` el navegador nunca emite `webglcontextrestored`.
      event.preventDefault();
      stop();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", restore);

    sync();

    // Se para el bucle y se sueltan los listeners, pero NO se tocan los
    // recursos de GPU: son del canvas y tienen que sobrevivir al efecto.
    return () => {
      stop();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", restore);
    };
  }, [ready, prefersReducedMotion, resolved, scroller, tier, generation, restore]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // El color de fondo importa: si WebGL no está disponible el canvas se
      // queda sin pintar y el compositor lo resuelve en blanco, que tapa el
      // titular. Con esto, sin shader el hero queda en su color plano.
      style={{ backgroundColor: "var(--hero-shader-bg)" }}
      // `pointer-events: none` no es cosmético: el canvas cubre el hero entero
      // y sin esto se come la rueda antes de que llegue al contenedor de scroll.
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
