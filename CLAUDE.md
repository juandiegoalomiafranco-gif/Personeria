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
  frente (`z-30`) sostiene stickers, túnel y la flecha final, y va por encima
  del header a propósito.
- **El fondo de sección es una variable CSS** (`--bg`), interpolada por scroll.
  No pongas `background` en las secciones.
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
