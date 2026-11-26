import { Suspense } from "react";
import { ExpirarMarcacao } from "@/components/marcar/ExpirarMarcacao";

/* Comum a todos os passos da marcação */
export default function MarcarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense>
        <ExpirarMarcacao />
      </Suspense>
    </>
  );
}
