import { Suspense } from "react";
import Image from "next/image";
import { FormularioEntrar } from "@/components/gestao/FormularioEntrar";

export default function EntrarPagina() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <div className="flex flex-col items-center gap-5 text-center motion-safe:animate-entrar">
        <Image src="/logo.svg" alt="" width={52} height={60} priority />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.3em] text-texto-3">DIOGO PIMENTA · BARBERSHOP</span>
          <h1 className="text-3xl font-extrabold uppercase leading-none font-stretch-125%">Gestão</h1>
        </div>
      </div>

      <Suspense>
        <FormularioEntrar />
      </Suspense>
    </main>
  );
}
