"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconeExterno } from "@/components/icones";

import { INSTAGRAM, TELEFONE, TELEFONE_TEXTO } from "@/lib/contactos";

function IconeTelefone({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

function IconeInstagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * "Falar com a barbearia": ao carregar, abre por baixo duas opções —
 * ligar para o Diogo ou ir ao Instagram.
 */
export function FalarComBarbearia() {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const id = useId();

  // Fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const opcao =
    "group/opcao flex items-center gap-4 px-5 py-4 transition-colors hover:bg-superficie-2 focus-visible:bg-superficie-2 focus-visible:outline-none";

  return (
    <div ref={raiz} className="flex flex-col">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto((a) => !a)}
        className={`flex h-14 items-center justify-center gap-2.5 border text-sm font-bold tracking-[0.12em] font-stretch-125% transition-[border-color,background-color,border-radius,transform] duration-300 active:scale-[0.97] ${
          aberto ? "rounded-t border-texto bg-superficie" : "rounded border-borda-forte hover:border-texto hover:bg-superficie"
        }`}
      >
        FALAR COM A BARBEARIA
        <svg
          viewBox="0 0 12 12"
          className={`size-3 transition-transform duration-300 ${aberto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Painel que abre a deslizar (anima a altura com grid-rows) */}
      <div
        id={id}
        className={`grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            inert={!aberto}
            className={`flex flex-col divide-y divide-borda rounded-b border border-t-0 border-texto bg-superficie transition-opacity duration-300 ${
              aberto ? "opacity-100" : "opacity-0"
            }`}
          >
            <a href={`tel:${TELEFONE}`} className={opcao}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-borda-forte transition-colors group-hover/opcao:border-texto group-hover/opcao:bg-texto group-hover/opcao:text-tinta">
                <IconeTelefone className="size-4" />
              </span>
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[15px] font-bold">Ligar</span>
                <span className="text-sm tabular-nums text-texto-3">{TELEFONE_TEXTO}</span>
              </span>
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={opcao}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-borda-forte transition-colors group-hover/opcao:border-texto group-hover/opcao:bg-texto group-hover/opcao:text-tinta">
                <IconeInstagram className="size-4" />
              </span>
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[15px] font-bold">Instagram</span>
                <span className="text-sm text-texto-3">@diogo.pimenta.barber</span>
              </span>
              <IconeExterno className="size-4 text-texto-3 transition-transform group-hover/opcao:-translate-y-0.5 group-hover/opcao:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
