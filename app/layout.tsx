import type { Metadata } from "next";
import { Archivo, Caveat } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"], // permite a versão "larga" dos títulos
  variable: "--font-archivo",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Diogo Pimenta Barbershop",
  description: "Marca o teu corte em menos de um minuto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={`${archivo.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}