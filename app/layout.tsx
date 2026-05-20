import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cantú Propiedades · Tablero",
  description: "Tablero operativo de Cantú Propiedades",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
