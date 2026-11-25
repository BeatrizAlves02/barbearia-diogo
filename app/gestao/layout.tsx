import type { Metadata, Viewport } from "next";

/* Área do barbeiro: não aparece no Google e pode ser "instalada" no telemóvel */
export const metadata: Metadata = {
  title: "Gestão · Diogo Pimenta",
  robots: { index: false, follow: false },
  manifest: "/gestao.webmanifest",
  appleWebApp: { capable: true, title: "Gestão", statusBarStyle: "black-translucent" },
  icons: { apple: "/icone-gestao-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
