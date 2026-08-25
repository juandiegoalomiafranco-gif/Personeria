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
        <div data-scroll-content>{children}</div>
      </div>
    </div>
  );
});
