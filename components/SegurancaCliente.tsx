"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LIMITE_INATIVIDADE_CLIENTE_MIN } from "@/lib/sessao";

const LIMITE = LIMITE_INATIVIDADE_CLIENTE_MIN * 60_000;

/**
 * Segurança e arrumação no site dos clientes:
 *  - ao abrir ou recarregar a página, começa sempre no topo (o telemóvel não "salta" para o meio);
 *  - se ficar parado muito tempo, volta à página inicial, no topo
 *    (assim ninguém encontra uma marcação a meio, com nome e telemóvel escritos).
 */
export function SegurancaCliente() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [aviso, setAviso] = useState(false);

  // Começar sempre no topo
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // Aviso quando volta ao início por ter expirado uma marcação a meio
  useEffect(() => {
    if (pathname === "/" && params.get("expirou") === "1") {
      setAviso(true);
      window.history.replaceState(null, "", "/");
      const t = setTimeout(() => setAviso(false), 7000);
      return () => clearTimeout(t);
    }
  }, [pathname, params]);

  // Muito tempo sem mexer → volta ao início
  useEffect(() => {
    let ultima = Date.now();
    const mexeu = () => {
      ultima = Date.now();
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, mexeu, { passive: true }));

    const verificar = () => {
      if (Date.now() - ultima < LIMITE) return;
      ultima = Date.now();
      const aMeio = pathname.startsWith("/marcar/horario") || pathname.startsWith("/marcar/dados");
      if (pathname !== "/") router.replace(aMeio ? "/?expirou=1" : "/");
      window.scrollTo(0, 0);
    };
    const intervalo = setInterval(verificar, 15_000);
    document.addEventListener("visibilitychange", verificar);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, mexeu));
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", verificar);
    };
  }, [pathname, router]);

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
