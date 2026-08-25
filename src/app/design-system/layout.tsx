import type { Metadata } from "next";

/** Herramienta interna: fuera del índice de buscadores. */
export const metadata: Metadata = {
  title: "Design system · Personería",
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
