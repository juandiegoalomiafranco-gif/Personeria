# Convenciones del proyecto

Contexto para cualquier sesión que trabaje en este repo.

## Qué es

Sitio de campaña a la Personería Estudiantil que replica el sistema visual y de
movimiento de una referencia de estudio de diseño. Ver `README.md` para el mapa
de secciones y el stack.

## Reglas duras

1. **El copy vive en `src/content/`.** Ningún componente escribe texto literal
   visible. Si necesitas una cadena nueva, agrégala al `SiteContent` de
   `schema.ts` y a `es.ts` **y** `en.ts` — los dos diccionarios deben mantenerse
   en paridad estructural.
2. **Los timings viven en `src/lib/motion/`.** Prohibido escribir un
   `cubic-bezier`, una duración o un stagger a mano en un componente. Las curvas
   marcadas `EXACTO` en `easings.ts` están extraídas de la referencia: no las
   toques sin evidencia nueva.
3. **Cero `any`.** El lint corre con información de tipos y falla el CI.
4. **`prefers-reduced-motion` en cada componente animado, sin excepción.** Con
   reduce activo el contenido queda visible y estático, nunca oculto.
5. **El hover solo en punteros finos.** Usa la utilidad `dotted-target`; nunca
   `:hover` desnudo, porque en touch se queda pegado tras el tap.

## Detalles de arquitectura fáciles de romper

- **El scroll no es del navegador.** La página vive en un contenedor fijo con su
  propio overflow y Lenis encima. Todo `ScrollTrigger` debe apuntar a ese
  contenedor con `scroller`, no a `window`. Es el error número uno.
- **Hay dos canvas.** El de fondo (`-z-1`) sostiene la tipografía 3D. El de
  frente (`z-30`) sostiene stickers y la flecha final, y va por encima del
  header a propósito.
- **El fondo de sección es una variable CSS** (`--bg`), interpolada por scroll.
  No pongas `background` en las secciones.
- **Los canvas ambientales no dibujan a 60.** El de fondo y el de stickers van
  en `frameloop="demand"` y los avanza `FrameCap` a 30 fps. Lenis interpola
  dentro del mismo `requestAnimationFrame` que dibuja el WebGL, así que cada
  frame caro de 3D es una actualización de scroll que no ocurre. No los pongas
  en `"always"`. Y nunca uses el `advance()` de r3f para esto: sin argumento de
  estado redibuja **todos** los roots ignorando su `frameloop`, despertando cada
  canvas de la página aunque no esté en pantalla.
- **`position: sticky` crea contexto de apilamiento.** Un z-index puesto en un
  hijo del sticky solo compite _dentro_ de ese div, no contra sus hermanos. Ya
  costó un bug: el titular llevaba `z-40` y el canvas hermano se le pintaba
  encima igual. El z-index va en el elemento sticky, no en su hijo.
- **El relato no tiene nada que se mueva detrás.** Su fondo son cuatro capas de
  degradado ya rasterizadas que se cruzan por opacidad, y el color base va por
  `--bg`. Si alguna vez hace falta que ese fondo cambie de forma, hazlo con otra
  capa y opacidad: reescribir las paradas de un degradado en cada frame repinta
  la pantalla entera (ver el punto de abajo).
- **El fondo degradado se mueve con `transform`, no cambiando el centro del
  gradiente.** Recolocar el centro de un `radial-gradient` obliga a
  rerasterizar a pantalla completa en cada frame; medido, eso subía el arranque
  del scroll de 969 a casi 2000 ms. El foco vive en su propia capa
  (`.backdrop__glow`) y solo se le escribe el `transform`, que resuelve el
  compositor. Y solo cuando el puntero se movió de verdad.
- **Tailwind v4 sin archivo de config.** Los tokens están en `@theme inline`
  dentro de `src/app/globals.css`. `inline` es obligatorio: hace que las clases
  emitan `var(--token)` en vez de copiar el valor, que es lo que permite el
  cambio de tema y de fondo en runtime.

## Cómo probar el scroll

Nunca verifiques el scroll con `element.scrollTo()`. Eso escribe la posición
directamente y se salta todo el camino real del input: Lenis, los listeners y
cualquier overlay que esté tapando la página. Con ese método el sitio pasó todas
las pruebas mientras estaba completamente inmóvil para un usuario.

Usa entrada de verdad:

- rueda: `page.mouse.wheel(0, 400)`
- táctil: `Input.dispatchTouchEvent` por CDP (`page.touchscreen` solo hace tap)
- teclado: `page.keyboard.press('PageDown' | 'End')`

Y ojo con el viewport de los perfiles de dispositivo: el de `iPhone 13` en
Playwright mide 390x664, no 390x844. Tocar por debajo de 664 no llega a la
página y parece un bug que no existe.

## Verificar antes de subir

```bash
npm run check   # typecheck + lint + format
npm run build
```

## Presupuesto de bundle

Los canvas se cargan con `dynamic()` y solo se montan cuando el preloader
termina. three, drei y rapier suman ~810 KB comprimidos: si entran en el bundle
inicial, el sitio no es interactivo hasta que terminan de bajar. Antes de añadir
una dependencia al Shell, mira si puede vivir detrás de un `dynamic()`.

## Notas de compatibilidad

- **ESLint fijado en 9.x.** El `eslint-plugin-react` que trae
  `eslint-config-next@16` no soporta la API de contexto de ESLint 10.
- **TypeScript fijado en 5.9.** `typescript-eslint@8` todavía no acepta TS 7.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
