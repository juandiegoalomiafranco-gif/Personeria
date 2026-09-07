import { createDrone, type DroneNodes } from "./drone";
import { playSfx, type SfxName } from "./sfx";

/**
 * Volumen del ambiente. Calibrado contra la referencia, que mide unos
 * -45 dBFS: tiene que estar por debajo del umbral de "esto es música" y quedarse
 * en "la página tiene aire".
 */
const AMBIENT_LEVEL = 0.07;

/** Segundos que tarda en entrar y salir. Un corte seco delataría el mecanismo. */
const FADE_IN = 3.5;
const FADE_OUT = 1.2;

/**
 * Motor de audio del sitio.
 *
 * Toda la síntesis vive detrás de esta clase para que el resto de la aplicación
 * solo tenga que llamar a `start`, `stop` y `sfx`. El `AudioContext` se crea
 * perezosamente en el primer `start`: instanciarlo antes del gesto del usuario
 * lo dejaría suspendido y contando como reproducción bloqueada.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private drone: DroneNodes | null = null;
  private started = false;

  /** `true` cuando el contexto existe y está corriendo. */
  get running(): boolean {
    return this.started && this.context?.state === "running";
  }

  /** Arranca (o reanuda) el ambiente. Debe llamarse desde un gesto del usuario. */
  async start(): Promise<void> {
    const context = this.ensureContext();
    if (context.state === "suspended") await context.resume();

    if (!this.started) {
      this.buildGraph(context);
      this.started = true;
    }

    const master = this.master;
    if (!master) return;

    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    // Rampa exponencial: el oído percibe el volumen en logarítmico, así que una
    // lineal se sentiría como que entra de golpe y luego se estanca.
    master.gain.exponentialRampToValueAtTime(AMBIENT_LEVEL, now + FADE_IN);
  }

  /** Baja el ambiente y suspende el contexto para no gastar CPU en silencio. */
  stop(): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT);

    window.setTimeout(
      () => {
        if (this.context === context && master.gain.value <= 0.001) {
          void context.suspend();
        }
      },
      FADE_OUT * 1000 + 120,
    );
  }

  /** Dispara un efecto de interfaz. No hace nada si el sonido está apagado. */
  sfx(name: SfxName): void {
    if (!this.running || !this.context || !this.sfxBus) return;
    playSfx(this.context, this.sfxBus, name);
  }

  /** Libera todo. Solo al desmontar la aplicación. */
  dispose(): void {
    this.drone?.dispose();
    this.master?.disconnect();
    this.sfxBus?.disconnect();
    void this.context?.close();
    this.drone = null;
    this.master = null;
    this.sfxBus = null;
    this.context = null;
    this.started = false;
  }

  private ensureContext(): AudioContext {
    this.context ??= new AudioContext({ latencyHint: "playback" });
    return this.context;
  }

  private buildGraph(context: AudioContext): void {
    const master = context.createGain();
    master.gain.value = 0.0001;

    // Red de seguridad: si alguna vez se suman demasiadas voces, el limitador
    // evita que el sitio pegue un grito en los audífonos de alguien.
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.25;

    master.connect(limiter).connect(context.destination);

    const drone = createDrone(context);
    drone.output.connect(master);

    // Los efectos van más altos que el ambiente pero por el mismo limitador.
    const sfxBus = context.createGain();
    sfxBus.gain.value = 1 / AMBIENT_LEVEL;
    sfxBus.connect(master);

    this.master = master;
    this.sfxBus = sfxBus;
    this.drone = drone;
  }
}
