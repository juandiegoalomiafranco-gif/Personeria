/**
 * Retícula técnica de fondo.
 *
 * Cuatro hairlines verticales en los bordes del área de contenido y en sus
 * tercios, dos horizontales en los tercios del viewport, y una cruz en cada
 * intersección. Medido sobre la referencia a 1512×829: verticales en 56px y en
 * los tercios del ancho de contenido; horizontales en 1/3 y 2/3 del alto.
 *
 * Es puramente decorativa: `aria-hidden` y sin eventos.
 */

const VERTICAL_STOPS = [0, 1, 2, 3] as const; // bordes + tercios
const HORIZONTAL_STOPS = [1, 2] as const; // tercios del viewport

function percent(index: number, divisions: number): string {
  return `${(index / divisions) * 100}%`;
}

export function GridOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none" aria-hidden="true">
      {/* Horizontales: recorren todo el ancho del viewport. */}
      {HORIZONTAL_STOPS.map((stop) => (
        <span
          key={`h-${stop}`}
          className="bg-line absolute inset-x-0 h-px"
          style={{ top: percent(stop, 3) }}
        />
      ))}

      {/* Verticales y cruces: viven dentro del área de contenido, así que
          siguen el mismo padding que las secciones. */}
      <div className="absolute inset-y-0 right-4 left-4 lg:right-14 lg:left-14">
        {VERTICAL_STOPS.map((stop) => (
          <span
            key={`v-${stop}`}
            className="bg-line absolute inset-y-0 w-px"
            style={{ left: percent(stop, 3) }}
          />
        ))}

        {HORIZONTAL_STOPS.map((row) =>
          VERTICAL_STOPS.map((column) => (
            <svg
              key={`x-${row}-${column}`}
              className="text-line-strong absolute size-2.5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: percent(column, 3), top: percent(row, 3) }}
              viewBox="0 0 10 10"
              fill="none"
            >
              <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1" />
            </svg>
          )),
        )}
      </div>
    </div>
  );
}
