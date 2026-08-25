import { getContent } from "@/content";

export default function Page() {
  const content = getContent();

  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-4 px-4">
      <p className="font-mono-2 text-l3 text-xs uppercase">Fase 0 — fundación</p>
      <h1
        className="text-l1 text-center text-[7.2svw] leading-none font-bold uppercase lg:text-[6svw]"
        style={{ fontVariationSettings: '"wdth" 120' }}
      >
        {content.brand.name}
        {content.brand.suffix}
      </h1>
    </main>
  );
}
