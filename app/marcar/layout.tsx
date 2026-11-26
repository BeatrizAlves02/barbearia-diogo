import { Suspense } from "react";
import { SegurancaCliente } from "@/components/SegurancaCliente";

/* Comum a todos os passos da marcação */
export default function MarcarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense>
        <SegurancaCliente />
      </Suspense>
    </>
  );
}
