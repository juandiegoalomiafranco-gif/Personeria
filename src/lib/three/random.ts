/**
 * Generador pseudoaleatorio con semilla (mulberry32).
 *
 * Se usa en vez de `Math.random()` para todo lo que se calcula durante el
 * render: el compilador de React no puede memoizar una función impura, y además
 * una semilla fija hace que el campo de estrellas sea reproducible entre
 * recargas, que es lo que permite calibrarlo contra los frames de referencia.
 */
export function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
