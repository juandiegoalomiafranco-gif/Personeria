"use client";

import { useState } from "react";
import { EASE, toCss, type Bezier } from "@/lib/motion/easings";
import { DURATION, STAGGER } from "@/lib/motion/durations";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Página interna de calibración. No se enlaza desde ningún lado.
 *
 * Sirve para comparar tokens, escala tipográfica y curvas contra los frames de
 * la referencia sin tener que scrollear el sitio real.
 */

const COLOR_TOKENS = [
  ["--bg", "Fondo actual"],
  ["--bg-deep", "Fondo azul (hero, contacto)"],
  ["--bg-void", "Fondo negro (secciones medias)"],
  ["--label-1", "Texto primario"],
  ["--label-2", "Texto secundario"],
  ["--label-3", "Texto terciario"],
  ["--accent", "Acento lima"],
  ["--line", "Hairline de retícula"],
  ["--line-strong", "Cruces de retícula"],
  ["--type3d-base", "Tipografía 3D base"],
  ["--chapter-tint-2", "Relato · tinte 2"],
  ["--chapter-tint-3", "Relato · tinte 3"],
] as const;

const TYPE_SCALE = [
  ["Display", "text-[7.2svw] lg:text-[6svw] xl:text-[5.6svw] 2xl:text-[5svw]", "Personería"],
  ["Manifiesto", "text-xl md:text-[4.2svw]", "Claridad primero"],
  ["Cuerpo", "text-base", "Pensar en sistemas"],
  ["Mono", "font-mono text-sm", "0324 X 0221 Y"],
  ["Mono 2", "font-mono-2 text-xs uppercase", "GMT-5 CO 22:27"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-line border-t py-10">
      <h2 className="font-mono-2 text-l3 mb-6 text-xs uppercase">{title}</h2>
      {children}
    </section>
  );
}

function EaseDemo({ name, curve, playing }: { name: string; curve: Bezier; playing: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-l2 w-36 shrink-0 font-mono text-xs">{name}</span>
      <div className="bg-line relative h-1 flex-1 rounded-full">
        <div
          className="bg-accent absolute top-1/2 size-3 -translate-y-1/2 rounded-full"
          style={{
            left: playing ? "calc(100% - 0.75rem)" : "0%",
            transition: `left 1200ms ${toCss(curve)}`,
          }}
        />
      </div>
      <code className="text-l3 w-64 shrink-0 font-mono text-[11px]">{toCss(curve)}</code>
    </div>
  );
}

export default function DesignSystemPage() {
  const { mode, resolved, cycle } = useTheme();
  const [playing, setPlaying] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-24 lg:px-14">
      <header className="flex flex-wrap items-baseline justify-between gap-4 pb-10">
        <h1 className="text-3xl font-bold" style={{ fontVariationSettings: '"wdth" 120' }}>
          Design system
        </h1>
        <button
          type="button"
          onClick={cycle}
          className="dotted-target font-mono-2 cursor-pointer p-2 text-xs uppercase"
        >
          Tema: {mode} → {resolved}
        </button>
      </header>

      <Section title="Tokens de color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map(([token, label]) => (
            <div key={token} className="border-line border p-3">
              <div
                className="border-line mb-3 h-14 w-full border"
                style={{ background: `var(${token})` }}
              />
              <p className="text-l1 font-mono text-[11px]">{token}</p>
              <p className="text-l3 font-mono text-[11px]">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Escala tipográfica">
        <div className="space-y-6">
          {TYPE_SCALE.map(([label, classes, sample]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-l3 font-mono text-[11px]">
                {label} · {classes}
              </span>
              <span
                className={cn(classes, "text-l1 leading-none font-bold")}
                style={{ fontVariationSettings: '"wdth" 120' }}
              >
                {sample}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Curvas de easing">
        <button
          type="button"
          onClick={() => setPlaying((current) => !current)}
          className="dotted-target font-mono-2 mb-6 cursor-pointer p-2 text-xs uppercase"
        >
          {playing ? "Volver" : "Reproducir"}
        </button>
        <div className="space-y-3">
          {Object.entries(EASE).map(([name, curve]) => (
            <EaseDemo key={name} name={name} curve={curve} playing={playing} />
          ))}
        </div>
      </Section>

      <Section title="Duraciones y stagger">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {Object.entries(DURATION).map(([name, seconds]) => (
            <div key={name} className="flex justify-between font-mono text-xs">
              <span className="text-l2">DURATION.{name}</span>
              <span className="text-l1 tabular-nums">{seconds}s</span>
            </div>
          ))}
          {Object.entries(STAGGER).map(([name, seconds]) => (
            <div key={name} className="flex justify-between font-mono text-xs">
              <span className="text-l2">STAGGER.{name}</span>
              <span className="text-accent tabular-nums">{seconds}s</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
