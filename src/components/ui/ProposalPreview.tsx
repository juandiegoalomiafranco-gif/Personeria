import { createRandom } from "@/lib/three/random";

/**
 * Preview generativo de una propuesta.
 *
 * Las tarjetas estaban vacías: un cuadrado con borde y su número. En la
 * referencia cada una lleva su propio gráfico, y sin eso la sección se lee como
 * un wireframe por terminar.
 *
 * Cada dibujo se deriva del `id` de la propuesta, así que es **estable**: el
 * mismo id da siempre la misma composición, en el servidor y en el cliente
 * —sin eso habría desajuste de hidratación— y entre recargas.
 *
 * Va en SVG y no en un canvas más. Son diez tarjetas visibles a la vez, y diez
 * contextos WebGL nos devolverían justo al problema de scroll que costó dos
 * rondas cerrar. Un SVG con transformaciones lo resuelve el compositor gratis.
 */

/** Los cinco arquetipos de composición. */
const VARIANTS = ["rings", "bars", "grid", "diagonals", "orbit"] as const;
type Variant = (typeof VARIANTS)[number];

/** Paleta del preview, en variables de tema para que siga el tema claro. */
const INK = "var(--accent)";
const SOFT = "var(--label-3)";
const MID = "var(--label-2)";

/** Hash estable de una cadena, para sembrar el generador. */
function seedFrom(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickVariant(seed: number): Variant {
  return VARIANTS[seed % VARIANTS.length] ?? "rings";
}

function Rings({ random }: { random: () => number }) {
  const count = 4 + Math.floor(random() * 3);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const r = 8 + i * (36 / count);
        return (
          <circle
            key={i}
            cx={50 + (random() - 0.5) * 14}
            cy={50 + (random() - 0.5) * 14}
            r={r}
            fill="none"
            stroke={i === count - 1 ? INK : SOFT}
            strokeWidth={i === count - 1 ? 1.6 : 0.8}
          />
        );
      })}
    </g>
  );
}

function Bars({ random }: { random: () => number }) {
  const count = 7 + Math.floor(random() * 5);
  const gap = 76 / count;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const height = 12 + random() * 56;
        return (
          <rect
            key={i}
            x={12 + i * gap}
            y={78 - height}
            width={gap * 0.55}
            height={height}
            fill={random() > 0.75 ? INK : SOFT}
          />
        );
      })}
    </g>
  );
}

function Grid({ random }: { random: () => number }) {
  const side = 5 + Math.floor(random() * 3);
  const step = 68 / (side - 1);
  return (
    <g>
      {Array.from({ length: side * side }, (_, i) => {
        const on = random() > 0.72;
        return (
          <circle
            key={i}
            cx={16 + (i % side) * step}
            cy={16 + Math.floor(i / side) * step}
            r={on ? 3.2 : 1.4}
            fill={on ? INK : SOFT}
          />
        );
      })}
    </g>
  );
}

function Diagonals({ random }: { random: () => number }) {
  const count = 6 + Math.floor(random() * 5);
  const gap = 100 / count;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <line
          key={i}
          x1={-20 + i * gap}
          y1={110}
          x2={30 + i * gap}
          y2={-10}
          stroke={random() > 0.78 ? INK : SOFT}
          strokeWidth={1 + random() * 2.4}
        />
      ))}
    </g>
  );
}

function Orbit({ random }: { random: () => number }) {
  const count = 3 + Math.floor(random() * 4);
  const radius = 26 + random() * 8;
  return (
    <g>
      <circle cx={50} cy={50} r={radius} fill="none" stroke={SOFT} strokeWidth={0.8} />
      <circle cx={50} cy={50} r={7 + random() * 5} fill={INK} />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + random();
        return (
          <circle
            key={i}
            cx={50 + Math.cos(angle) * radius}
            cy={50 + Math.sin(angle) * radius}
            r={2 + random() * 3}
            fill={MID}
          />
        );
      })}
    </g>
  );
}

export function ProposalPreview({ id }: { id: string }) {
  const seed = seedFrom(id);
  const variant = pickVariant(seed);
  const random = createRandom(seed);

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      // La rotación lentísima es lo único que se anima, y es una transformación
      // pura: la resuelve el compositor sin repintar. Se apaga con movimiento
      // reducido desde `globals.css`.
      className="proposal-preview absolute inset-0 h-full w-full"
    >
      {/* La diagonal de un cuadrado mide 1.41 veces su lado, así que una figura
          que llena el viewBox se sale por las esquinas en cuanto rota. Con 0.7
          —el inverso de esa diagonal— cabe girada en cualquier ángulo, y de
          paso le queda aire dentro de la tarjeta. */}
      <g transform="translate(50 50) scale(0.7) translate(-50 -50)">
        {variant === "rings" ? <Rings random={random} /> : null}
        {variant === "bars" ? <Bars random={random} /> : null}
        {variant === "grid" ? <Grid random={random} /> : null}
        {variant === "diagonals" ? <Diagonals random={random} /> : null}
        {variant === "orbit" ? <Orbit random={random} /> : null}
      </g>
    </svg>
  );
}
