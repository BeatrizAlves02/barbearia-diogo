"use client";

import { useState } from "react";

/**
 * Caixa com título e explicação. No telemóvel e tablet começa fechada (só o título)
 * e abre com a setinha; no computador está sempre aberta.
 */
export function Dobravel({
  titulo,
  descricao,
  children,
  atraso = 0,
}: {
  titulo: string;
  descricao: React.ReactNode;
  children: React.ReactNode;
  atraso?: number;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <section style={{ animationDelay: `${atraso}ms` }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div
        onClick={() => setAberto((a) => !a)}
        className={`flex cursor-pointer items-start justify-between gap-4 p-5 lg:cursor-auto lg:border-b lg:border-borda lg:p-6 ${aberto ? "border-b border-borda" : ""}`}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">{titulo}</h2>
          <div className="text-sm text-texto-3">{descricao}</div>
        </div>
        <button
          type="button"
          aria-expanded={aberto}
          aria-label={aberto ? `Fechar ${titulo.toLowerCase()}` : `Abrir ${titulo.toLowerCase()}`}
          onClick={(e) => {
            e.stopPropagation();
            setAberto((a) => !a);
          }}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border border-borda-forte text-texto-2 transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 lg:hidden ${
            aberto ? "rotate-180 bg-texto text-tinta" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className={aberto ? "motion-safe:animate-entrar" : "max-lg:hidden"}>{children}</div>
    </section>
  );
}
