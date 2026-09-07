import { damp } from "@/lib/utils";
import { VELOCITY_DECAY } from "./config";

/**
 * Caja mutable para compartir el progreso del scroll con la escena 3D.
 *
 * El progreso cambia cada frame: pasarlo por estado de React re-renderizaría el
 * árbol 60 veces por segundo. Los componentes de three lo leen dentro de su
 * `useFrame`, que ya corre en el ciclo de animación.
 *
 * `active` es la excepción: cambia dos veces en toda la página (al entrar y al
 * salir de la sección) y sí interesa a React, porque decide si el canvas del
 * túnel se dibuja. Por eso tiene suscripción — antes se sondeaba con un
 * `requestAnimationFrame` que corría durante toda la vida de la página solo
 * para leer un booleano.
 */
export interface ProgressStore {
  /** Progreso del pin, de 0 a 1. Se lee dentro de `useFrame`, no por React. */
  value: number;
  /**
   * Velocidad de scroll normalizada, de 0 a 1. Funciona como un pulso: la sube
   * el `ScrollTrigger` mientras hay scroll y la baja el bucle de render.
   *
   * Tiene que decaer desde el render y no desde el trigger porque `onUpdate`
   * **solo dispara mientras el scroll se mueve**. Al soltar la rueda deja de
   * llamarse, y sin alguien que la baje se quedaría congelada en su último
   * valor: las estelas del túnel se quedarían estiradas para siempre.
   */
  readonly velocity: number;
  /** Sube el pulso. Lo llama el `ScrollTrigger` con su velocidad ya normalizada. */
  pushVelocity(next: number): void;
  /** Baja el pulso. Lo llama el bucle de render una vez por frame. */
  decayVelocity(deltaSeconds: number): void;
  /** `true` mientras la sección está anclada, para poder apagar el render. */
  readonly active: boolean;
  /** Cambia `active` y avisa a los suscriptores. Ignora los valores repetidos. */
  setActive(next: boolean): void;
  /** Suscripción con la forma que espera `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void;
}

export function createProgressStore(): ProgressStore {
  const listeners = new Set<() => void>();
  let velocity = 0;
  // En una variable de cierre y no en una propiedad del objeto: así el getter
  // puede exponerla como solo lectura y el único camino para escribirla es
  // `setActive`, que es el que notifica.
  let active = false;

  return {
    value: 0,

    get velocity() {
      return velocity;
    },

    pushVelocity(next: number) {
      velocity = next;
    },

    decayVelocity(deltaSeconds: number) {
      velocity = damp(velocity, 0, VELOCITY_DECAY, deltaSeconds);
    },

    get active() {
      return active;
    },

    setActive(next: boolean) {
      if (active === next) return;
      active = next;
      for (const listener of listeners) listener();
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
