/**
 * Fondo de ruido del hero.
 *
 * Dos triángulos a pantalla completa y todo el trabajo en el fragment shader:
 * tres octavas de ruido simplex que se realimentan, mezcladas sobre cuatro
 * colores, con viñeta, un halo central y grano de película encima.
 *
 * El GLSL es el de la referencia y no se ha tocado. Lo que sí cambia respecto a
 * ella es el envoltorio (`HeroShader.tsx`): allí el bucle iba a 60 fps, y en
 * este proyecto un canvas ambiental que dibuja a 60 le roba su turno a Lenis.
 */

export const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;

  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;

  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Techo de fps del bucle.
 *
 * El mismo que usa `FrameCap` para los canvas de three, y por la misma razón:
 * Lenis interpola dentro del `requestAnimationFrame` que dibuja el WebGL, así
 * que cada frame caro de shader es una actualización de scroll que no ocurre.
 */
export const SHADER_FPS = 30;

/** Multiplicador del reloj que entra al shader. */
export const SHADER_SPEED = 2;

/** Intensidad del grano de película. */
export const SHADER_GRAIN = 0.3;

/**
 * Tokens de color que lee el shader, en el orden de `u_colors`.
 * Viven en `globals.css` para que el tema claro los pueda redefinir.
 */
export const SHADER_COLOR_VARS = [
  "--hero-shader-1",
  "--hero-shader-2",
  "--hero-shader-3",
  "--hero-shader-4",
] as const;

export const SHADER_BG_VAR = "--hero-shader-bg";

export type Rgb = readonly [number, number, number];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Convierte `#rgb` o `#rrggbb` al triplete 0..1 que espera GLSL.
 *
 * Devuelve negro ante cualquier cosa que no sea hex: el valor sale de una
 * variable CSS y una errata ahí no debe reventar el render del hero.
 */
export function hexToRgb(hex: string): Rgb {
  const digits = HEX.exec(hex.trim())?.[1];
  if (!digits) return [0, 0, 0];

  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((d) => d + d)
          .join("")
      : digits;

  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}
