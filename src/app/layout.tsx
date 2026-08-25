import type { Metadata, Viewport } from "next";
import { getContent } from "@/content";
import { fontVariables } from "./fonts";
import "./globals.css";

const content = getContent();

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // El shell maneja su propio scroll; el zoom del navegador rompería el pin.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#04123f" },
    { media: "(prefers-color-scheme: light)", color: "#e9eaf2" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
