import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Next 14.2 no expone Geist en next/font/google, lo cargamos vía el paquete
// oficial `geist`. Sus CSS vars son --font-geist-sans / --font-geist-mono,
// que tailwind.config.ts referencia.
const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cantú Propiedades",
  description: "Tablero operativo · Cantú Propiedades · Coghlan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fontDisplay.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-cream-50 font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
