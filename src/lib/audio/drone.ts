/**
 * Drone ambiental generativo.
 *
 * El diseño sale de medir el audio de la referencia: 51% de la energía entre 20
 * y 60 Hz, 35% entre 150 y 400 Hz, prácticamente nada por encima de 3 kHz, a
 * unos -45 dBFS. O sea, un colchón de subgraves con un pad encima, muy bajo.
 *
 * "Infinito" no es un truco: cada voz respira con su propio LFO y los periodos
 * son primos entre sí (17, 23, 29, 37, 43, 47, 59, 61 y 53 segundos), así que la combinación
 * tarda horas en repetirse. No hay loop que puedas reconocer.
 */

interface VoiceSpec {
  /** Frecuencia en Hz. Voicing de Mi menor, repartido por las bandas objetivo. */
  readonly hz: number;
  readonly type: OscillatorType;
  /** Amplitud relativa. Calibrada para reproducir el reparto espectral medido. */
  readonly level: number;
  /** Periodo del LFO de volumen, en segundos. Primos entre sí. */
  readonly breath: number;
  /** Cuánto baja el LFO, de 0 (no respira) a 1 (llega a silencio). */
  readonly depth: number;
  /** Desafinación en cents. El batido entre voces es lo que da vida al drone. */
  readonly detune: number;
}

/**
 * Voces del drone.
 *
 * Los niveles están calibrados contra el reparto de energía medido en la
 * referencia: 51% entre 20 y 60 Hz, 8% entre 60 y 150, 35% entre 150 y 400, 5%
 * entre 400 y 1k y una pizca por encima. Como la potencia va con el cuadrado de
 * la amplitud, para que el pad pese un 35% frente al 51% del sub necesita
 * amplitud 0.83 respecto a él, no 0.13 — que fue el error del primer intento.
 *
 * Casi todas son senoidales a propósito: una sierra reparte energía por
 * armónicos que no se pueden controlar por banda. La triangular de B3 aporta el
 * grano justo para que el conjunto no suene a tono de prueba.
 */
const VOICES: readonly VoiceSpec[] = [
  { hz: 41.2, type: "sine", level: 1.05, breath: 17, depth: 0.32, detune: 0 }, // Mi1, sub
  { hz: 61.7, type: "sine", level: 0.36, breath: 23, depth: 0.34, detune: -5 }, // Si1
  { hz: 82.4, type: "sine", level: 0.2, breath: 29, depth: 0.36, detune: 4 }, // Mi2
  { hz: 196.0, type: "sine", level: 0.49, breath: 37, depth: 0.38, detune: -3 }, // Sol3
  { hz: 246.9, type: "triangle", level: 0.44, breath: 43, depth: 0.4, detune: 6 }, // Si3
  { hz: 329.6, type: "sine", level: 0.33, breath: 47, depth: 0.42, detune: -6 }, // Mi4
  { hz: 493.9, type: "sine", level: 0.28, breath: 59, depth: 0.45, detune: 3 }, // Si4
  { hz: 1318.5, type: "sine", level: 0.085, breath: 61, depth: 0.55, detune: -8 }, // Mi6
];

/** Periodo del barrido del filtro maestro, en segundos. */
const SWEEP_PERIOD = 53;
const SWEEP_MIN_HZ = 900;
const SWEEP_MAX_HZ = 2400;

export interface DroneNodes {
  output: AudioNode;
  dispose: () => void;
}

/**
 * Impulso sintético para la reverb.
 *
 * Ruido con caída exponencial. No pretende simular una sala real: solo pega las
 * voces entre sí para que el drone suene como un espacio y no como cuatro
 * osciladores sueltos.
 */
function createImpulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return impulse;
}

/** Conecta un LFO sinusoidal lento a un `AudioParam`. */
function attachLfo(
  context: AudioContext,
  target: AudioParam,
  periodSeconds: number,
  amount: number,
  phase: number,
): OscillatorNode {
  const lfo = context.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 1 / periodSeconds;

  const depth = context.createGain();
  depth.gain.value = amount;

  lfo.connect(depth).connect(target);
  // Arrancar desfasado evita que todas las voces respiren al unísono, que es lo
  // que delataría el mecanismo.
  lfo.start(context.currentTime + phase);

  return lfo;
}

/** Construye el grafo del drone y devuelve su salida. */
export function createDrone(context: AudioContext): DroneNodes {
  const output = context.createGain();
  output.gain.value = 1;

  // Filtro maestro: barre lento y es lo que hace que el drone "respire" en
  // conjunto. También garantiza el techo de agudos que medimos.
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = (SWEEP_MIN_HZ + SWEEP_MAX_HZ) / 2;
  filter.Q.value = 0.6;

  const sweep = attachLfo(
    context,
    filter.frequency,
    SWEEP_PERIOD,
    (SWEEP_MAX_HZ - SWEEP_MIN_HZ) / 2,
    0,
  );

  const reverb = context.createConvolver();
  reverb.buffer = createImpulse(context, 4.5, 2.6);

  const dry = context.createGain();
  dry.gain.value = 0.75;
  const wet = context.createGain();
  wet.gain.value = 0.45;

  filter.connect(dry).connect(output);
  filter.connect(reverb).connect(wet).connect(output);

  const oscillators: OscillatorNode[] = [sweep];

  VOICES.forEach((voice, index) => {
    const osc = context.createOscillator();
    osc.type = voice.type;
    osc.frequency.value = voice.hz;
    osc.detune.value = voice.detune;

    const gain = context.createGain();
    // El LFO oscila entre -1 y 1, así que el valor base se pone en el centro
    // del recorrido y la profundidad es la mitad del rango.
    const half = voice.level * voice.depth * 0.5;
    gain.gain.value = voice.level - half;

    const breath = attachLfo(context, gain.gain, voice.breath, half, index * 1.7);

    osc.connect(gain).connect(filter);
    osc.start();

    oscillators.push(osc, breath);
  });

  return {
    output,
    dispose() {
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          // Ya detenido: no hay nada que hacer.
        }
        osc.disconnect();
      }
      output.disconnect();
    },
  };
}
