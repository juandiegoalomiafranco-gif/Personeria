import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import type { QualityTier } from "@/hooks/useQualityTier";

/**
 * Acabado de la tipografía 3D.
 *
 * - `solid`: cuerpo opaco con clearcoat y brillos especulares duros. Es lo que
 *   hace la referencia: su "hello" tapa por completo el degradé del fondo y lo
 *   que lo vuelve caro son los reflejos del lomo, no la transparencia.
 * - `glass`: cristal con transmisión y refracción real.
 *
 * Cambiar entre los dos es editar `TYPE_FINISH`.
 */
export type TypeFinish = "solid" | "glass";

export const TYPE_FINISH: TypeFinish = "solid";

/**
 * Teselación por acabado y escalón de calidad.
 *
 * El cristal pide bastante más resolución de curva que el sólido: la refracción
 * amplifica cada faceta del contorno, así que un perfil que en opaco pasa
 * desapercibido, en cristal se ve como un borde quebrado.
 *
 * Ojo con subirlo: es el producto de los segmentos de curva por los del bisel
 * sobre quince glifos llenos de curvas. A 14x12 la palabra costaba 200.000
 * triángulos por frame y eso se sentía como retraso del scroll, porque Lenis
 * interpola en el mismo `requestAnimationFrame` que dibuja el WebGL.
 */
export const TESSELLATION: Record<
  TypeFinish,
  Record<QualityTier, { curveSegments: number; bevelSegments: number }>
> = {
  solid: {
    high: { curveSegments: 8, bevelSegments: 5 },
    medium: { curveSegments: 8, bevelSegments: 4 },
    low: { curveSegments: 6, bevelSegments: 3 },
  },
  glass: {
    high: { curveSegments: 32, bevelSegments: 8 },
    medium: { curveSegments: 16, bevelSegments: 6 },
    low: { curveSegments: 8, bevelSegments: 4 },
  },
};

/**
 * Geometría de la letra: el inflado.
 *
 * En `ExtrudeGeometry` de three el bisel funciona así, y es lo que hace o
 * deshace el efecto globo:
 *
 * - `bevelOffset` desplaza **todo** el contorno hacia afuera. Es el que engorda
 *   el trazo y convierte un script normal en un tubo.
 * - `bevelSize` hace que la **panza** sobresalga respecto a las caras frontal y
 *   trasera. Es el que da la sección redonda, y el que mata el canto de 90
 *   grados.
 *
 * Los dos cierran las contras de la `e`, la `o` y la `a`, que en un script son
 * pequeñas: la suma tiene que quedar por debajo de la mitad del hueco o la
 * letra se rellena sola y se ve como una mancha.
 *
 * Y `depth` tiene que ser mayor que el doble de `bevelThickness`. Si no, los
 * biseles frontal y trasero casi se tocan, las caras pelean por el z-buffer y
 * salen manchas.
 */
export const GEOMETRY: Record<
  TypeFinish,
  {
    size: number;
    depth: number;
    bevelEnabled: true;
    bevelThickness: number;
    bevelSize: number;
    bevelOffset: number;
  }
> = {
  solid: {
    size: 1,
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.032,
    bevelOffset: 0.026,
  },
  // El cristal se infla más: la refracción necesita espesor para leerse, y una
  // pieza fina se ve como una lámina, no como un globo. 0.62 contra el doble de
  // 0.24, que es 0.48.
  glass: {
    size: 1,
    depth: 0.62,
    bevelEnabled: true,
    bevelThickness: 0.24,
    bevelSize: 0.05,
    bevelOffset: 0.038,
  },
};

/** Tamaño del plano que se pone detrás del texto para que el cristal refracte. */
export const REFRACTION_PLANE = { width: 44, height: 26, z: -8 } as const;

/**
 * Degradé que el cristal refracta.
 *
 * Sin esto la transmisión no tiene nada que muestrear. El canvas del texto es
 * `alpha: true` y el degradé de la página es CSS, **detrás** del canvas; los
 * stickers viven en otro canvas distinto. La transmisión de three muestrea lo
 * que hay dentro de esta escena, así que si no se mete un plano aquí, el
 * cristal refracta vacío y las letras salen fantasmales.
 *
 * El degradé replica el del fondo CSS para que el plano no se note: lo que el
 * usuario ve detrás del texto es el mismo verde, solo que ahora sí es
 * refractable.
 */
export function createRefractionTexture(): Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0a4a2e";
    ctx.fillRect(0, 0, size, size);

    // Foco cálido arriba a la izquierda, como el del fondo de la página.
    const warm = ctx.createRadialGradient(
      size * 0.34,
      size * 0.3,
      0,
      size * 0.34,
      size * 0.3,
      size * 0.62,
    );
    warm.addColorStop(0, "rgba(96, 240, 168, 0.95)");
    warm.addColorStop(1, "rgba(10, 74, 46, 0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, size, size);

    // Contrapunto frío abajo a la derecha, para que la refracción tenga
    // variación de tono y no solo de luminosidad.
    const cool = ctx.createRadialGradient(
      size * 0.82,
      size * 0.86,
      0,
      size * 0.82,
      size * 0.86,
      size * 0.5,
    );
    cool.addColorStop(0, "rgba(64, 214, 220, 0.75)");
    cool.addColorStop(1, "rgba(10, 74, 46, 0)");
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, size, size);
  }

  if (ctx) {
    // Desvanecido radial en alfa.
    //
    // Sin esto el plano tapa el viewport entero: el canvas del texto está en
    // `-z-1` y el degradé CSS en `-z-2`, así que un plano opaco borra el fondo
    // de la página y, con él, el foco que sigue al puntero. Con el alfa cayendo
    // hacia los bordes, la parte brillante queda justo detrás de las letras
    // —que es donde la refracción la necesita— y el resto deja ver el CSS.
    const mask = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.12,
      size * 0.5,
      size * 0.5,
      size * 0.5,
    );
    mask.addColorStop(0, "rgba(0, 0, 0, 1)");
    mask.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
