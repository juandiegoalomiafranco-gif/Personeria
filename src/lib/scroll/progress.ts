/**
 * Caja mutable para compartir el progreso del scroll con la escena 3D.
 *
 * El progreso cambia cada frame: pasarlo por estado de React re-renderizaría el
 * árbol 60 veces por segundo. Los componentes de three lo leen dentro de su
 * `useFrame`, que ya corre en el ciclo de animación.
 */
export interface ProgressStore {
  /** Progreso del pin, de 0 a 1. */
  value: number;
  /** `true` mientras la sección está anclada, para poder apagar el render. */
  active: boolean;
}

export function createProgressStore(): ProgressStore {
  return { value: 0, active: false };
}
