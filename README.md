# Personería 2026

Sitio de campaña a la Personería Estudiantil. Réplica del sistema visual, de
movimiento y de interacción de una referencia de estudio de diseño: scroll con
inercia, tipografía 3D, física de partículas, túnel hiperespacial scrubbeado por
scroll y audio ambiental generativo.

## Stack

| Pieza                 | Elección                                    |
| --------------------- | ------------------------------------------- |
| Framework             | Next.js 16 (App Router) · React 19          |
| Lenguaje              | TypeScript 5.9 en modo `strict`, cero `any` |
| Estilos               | Tailwind CSS 4 con tokens `@theme`          |
| Scroll                | Lenis sobre contenedor propio               |
| Animación secuencial  | GSAP 3 + ScrollTrigger + SplitText          |
| Animación declarativa | motion 13                                   |
| 3D                    | three · @react-three/fiber · drei · rapier  |
| Audio                 | Web Audio API (motor generativo propio)     |

## Empezar

```bash
npm ci
npm run dev     # http://localhost:3000
```

## Scripts

| Script              | Qué hace                        |
| ------------------- | ------------------------------- |
| `npm run dev`       | Servidor de desarrollo          |
| `npm run build`     | Build de producción             |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm run lint`      | ESLint con linting por tipos    |
| `npm run format`    | Prettier sobre todo el repo     |
| `npm run check`     | Typecheck + lint + format check |

## Estructura

```
src/
├─ app/          layout, página, tokens CSS, fuentes
├─ components/
│  ├─ shell/     chrome fijo: header, barra inferior, retícula, preloader
│  ├─ sections/  las cinco secciones de la página
│  ├─ animation/ primitivas de animación reutilizables
│  ├─ three/     escenas WebGL y shaders
│  └─ ui/        controles: cursor, sonido, tema, idioma
├─ lib/
│  ├─ audio/     motor de sonido generativo
│  ├─ motion/    curvas y duraciones — única fuente de verdad de los timings
│  ├─ scroll/    Lenis y su puente con ScrollTrigger
│  └─ utils.ts   helpers puros
├─ content/      TODO el copy, tipado (es · en)
├─ hooks/
└─ providers/
```

## Dos reglas que sostienen el proyecto

1. **Ningún componente escribe texto.** Todo el copy vive en
   `src/content/{es,en}.ts` tipado contra `schema.ts`. Cambiar el contenido de la
   campaña es editar un archivo.
2. **Ningún componente inventa un timing.** Toda duración, stagger y curva sale
   de `src/lib/motion/`. Si hace falta una nueva, se agrega ahí.

## Anatomía de la página

| Sección    | Fondo        | Qué pasa                                                                                                                        |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Hero       | Negro        | Tipografía 3D inflada girando · los dos nombres a ancho completo                                                                |
| Manifiesto | Negro        | Imagen con distorsión líquida · dos párrafos grandes                                                                            |
| Giro       | Por capítulo | Cuatro capítulos anclados: una frase que se escribe palabra a palabra con el scroll, y con ella cambian paleta, energía y fondo |
| Propuestas | Negro        | Grid asimétrico de 12 columnas con etiquetas lima                                                                               |
| Contacto   | Verde        | Tipografía 3D · titular en cuatro segmentos                                                                                     |

El fondo no es un `background` por sección: es una variable CSS que ScrollTrigger
conmuta, por eso la transición se siente continua. El giro es la excepción — ahí
la variable se escribe en cada frame, interpolada entre el color de un capítulo y
el del siguiente, y por eso ese tramo suspende la transición del `body`.

El giro va **antes** de las propuestas a propósito: es la presentación, no el
epílogo. Su arco visual completo vive en `src/lib/three/chapters.ts`; añadir un
capítulo es añadir una entrada ahí y su texto en `content/`.

## Accesibilidad

`prefers-reduced-motion` desactiva todo el movimiento y deja el contenido
visible y estático — nunca escondido esperando una animación que no va a correr.
