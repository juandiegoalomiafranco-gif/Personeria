/**
 * Efectos de interfaz.
 *
 * En la grabación de la referencia se oyen ticks muy cortos al pasar el mouse
 * por encima de los elementos. Están sintetizados, no muestreados: un click de
 * 40 ms no justifica descargar un archivo.
 */

export type SfxName = "hover" | "click";

interface SfxSpec {
  /** Frecuencia del tono, en Hz. */
  readonly frequency: number;
  /** Duración total, en segundos. */
  readonly duration: number;
  /** Pico de volumen. Muy bajo: es un detalle, no un aviso. */
  readonly level: number;
  readonly type: OscillatorType;
}

const SPECS: Record<SfxName, SfxSpec> = {
  hover: { frequency: 2100, duration: 0.035, level: 0.035, type: "triangle" },
  click: { frequency: 1300, duration: 0.06, level: 0.06, type: "square" },
};

/**
 * Dispara un efecto puntual.
 *
 * Cada disparo crea sus nodos y los deja morir: son objetos de 40 ms y el
 * navegador los recoge solo. Reutilizar un oscilador obligaría a gestionar
 * estado para algo que no lo necesita.
 */
export function playSfx(context: AudioContext, destination: AudioNode, name: SfxName): void {
  const spec = SPECS[name];
  const now = context.currentTime;

  const osc = context.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.frequency, now);
  // Caída de tono: sin ella suena a pitido de electrodoméstico.
  osc.frequency.exponentialRampToValueAtTime(spec.frequency * 0.55, now + spec.duration);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(spec.level, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

  // Recorta el filo del click: el ataque cuadrado sin filtrar se oye barato.
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = spec.frequency;
  filter.Q.value = 1.4;

  osc.connect(filter).connect(gain).connect(destination);
  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}
