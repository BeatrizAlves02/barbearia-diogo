"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LIMITE_INATIVIDADE_MARCACAO_MIN } from "@/lib/sessao";

const LIMITE = LIMITE_INATIVIDADE_MARCACAO_MIN * 60_000;

/**
 * Segurança no site dos clientes: uma marcação deixada a meio (ex.: com o nome e o
 * telemóvel escritos) volta ao início se ficar parada demasiado tempo.
 * Não mexe no passo 1 nem na página "Está marcado".
 */
export function ExpirarMarcacao() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [aviso, setAviso] = useState(false);

  const aMeio = pathname.startsWith("/marcar/horario") || pathname.startsWith("/marcar/dados");

  // Mostra o aviso quando chega ao início por ter expirado
  useEffect(() => {
    if (pathname === "/marcar" && params.get("expirou") === "1") {
      setAviso(true);
      window.history.replaceState(null, "", "/marcar");
      const t = setTimeout(() => setAviso(false), 7000);
      return () => clearTimeout(t);
    }
  }, [pathname, params]);

  useEffect(() => {
    if (!aMeio) return;
    let ultima = Date.now();
    const mexeu = () => {
      ultima = Date.now();
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, mexeu, { passive: true }));

    const verificar = () => {
      if (Date.now() - ultima > LIMITE) router.replace("/marcar?expirou=1");
    };
    const intervalo = setInterval(verificar, 15_000);
    document.addEventListener("visibilitychange", verificar);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, mexeu));
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", verificar);
    };
  }, [aMeio, router]);

  if (!aviso) return null;

  return (
    <div role="status" className="fixed inset-x-0 top-4 z-50 mx-auto max-w-sm px-4">
      <button
        type="button"
        onClick={() => setAviso(false)}
        className="w-full rounded-lg border border-texto bg-texto p-4 text-left text-tinta shadow-[0_20px_50px_rgba(0,0,0,0.6)] motion-safe:animate-descer"
      >
        <span className="block text-[10px] font-bold tracking-[0.2em]">A MARCAÇÃO EXPIROU</span>
        <span className="mt-0.5 block text-sm font-bold">Ficou parada muito tempo, por isso recomeçámos. É rápido!</span>
      </button>
    </div>
  );
}
