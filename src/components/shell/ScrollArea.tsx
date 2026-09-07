"use client";

import { forwardRef, type ReactNode } from "react";

/**
 * Contenedor de scroll de la página.
 *
 * La página no scrollea en el `body`: vive dentro de este contenedor fijo con
 * su propio overflow, igual que la referencia. Es lo que permite que Lenis
 * controle la inercia y que los canvas fijos no se muevan.
 *
 * Consecuencia importante: todo `ScrollTrigger` debe apuntar aquí con
 * `scroller`, no a `window`.
 */
export const ScrollArea = forwardRef<HTMLDivElement, { children: ReactNode }>(function ScrollArea(
  { children },
  ref,
) {
  return (
    <div className="fixed inset-0 h-full w-full">
      <div
        ref={ref}
        data-scroll-container
        className="no-scrollbar h-full w-full overflow-y-auto overscroll-contain"
      >
        {/* `main` va aquí y no envolviendo al Shell: el chrome fijo, los canvas
            y el preloader son decorado, y meterlos dentro del landmark
            principal obligaría a un lector de pantalla a atravesarlos para
            llegar al contenido. */}
        <main id="contenido" data-scroll-content>
          {children}
        </main>
      </div>
    </div>
  );
});
