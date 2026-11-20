"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconeVisto } from "@/components/icones";
import type { Pais } from "@/lib/validar";

type Props = {
  paises: Pais[];
  valor: string;
  onMudar: (codigo: string) => void;
};

/* "Áfr" → "afr": para pesquisar sem ligar a acentos nem maiúsculas */
const simples = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Escolha do país do telemóvel, com o estilo do site:
 * botão "PT +351", painel com pesquisa, países mais comuns no topo.
 * Funciona com teclado (setas, Enter, Esc).
 * O painel posiciona-se pelo primeiro antepassado com "relative" (a caixa do telefone).
 */
export function SeletorPais({ paises, valor, onMudar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const id = useId();

  const atual = paises.find((p) => p.codigo === valor) ?? paises[0];

  const filtrados = useMemo(() => {
    const q = simples(pesquisa.trim()).replace(/^\+/, "");
    if (!q) return paises;
    return paises.filter(
      (p) =>
        simples(p.nome).includes(q) || p.codigo.toLowerCase() === q || p.indicativo.slice(1).startsWith(q)
    );
  }, [paises, pesquisa]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  // Mantém a opção ativa visível ao usar as setas
  useEffect(() => {
    if (!aberto) return;
    lista.current?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo, aberto]);

  function abrir() {
    setPesquisa("");
    setAtivo(Math.max(0, paises.findIndex((p) => p.codigo === valor)));
    setAberto(true);
  }

  function escolher(p: Pais) {
    onMudar(p.codigo);
    setAberto(false);
    botao.current?.focus();
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtrados[ativo]) escolher(filtrados[ativo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setAberto(false);
      botao.current?.focus();
    }
  }

  const semPesquisa = !pesquisa.trim();
  const nComuns = paises.filter((p) => p.comum).length;

  return (
    <div ref={raiz} className="h-full shrink-0">
      <input type="hidden" name="pais" value={atual.codigo} />

      <button
        ref={botao}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`País do número: ${atual.nome} (${atual.indicativo})`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !aberto) {
            e.preventDefault();
            abrir();
          }
        }}
        className="group flex h-full items-center gap-2 rounded-l border-r border-borda pl-4 pr-3 text-base text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto focus-visible:bg-superficie-2 focus-visible:text-texto focus-visible:outline-none"
      >
        <span className="rounded-[3px] border border-borda-forte px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-texto-3 transition-colors group-hover:border-texto-3 group-hover:text-texto-2">
          {atual.codigo}
        </span>
        <span className="tabular-nums">{atual.indicativo}</span>
        <svg
          viewBox="0 0 12 12"
          className={`size-3 text-texto-3 transition-transform duration-300 ${aberto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 origin-top overflow-hidden rounded-lg border border-borda-forte bg-superficie shadow-[0_24px_60px_rgba(0,0,0,0.75)] motion-safe:animate-[descer_0.25s_cubic-bezier(0.22,1,0.36,1)_backwards]">
          {/* Pesquisa */}
          <div className="flex items-center gap-3 border-b border-borda px-4">
            <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-texto-3" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13.5 13.5L17 17" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              type="text"
              value={pesquisa}
              onChange={(e) => {
                setPesquisa(e.target.value);
                setAtivo(0);
              }}
              onKeyDown={teclas}
              placeholder="Procurar país ou indicativo"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-lista`}
              aria-activedescendant={filtrados[ativo] ? `${id}-${filtrados[ativo].codigo}` : undefined}
              aria-label="Procurar país"
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-texto outline-none placeholder:text-desativado"
            />
          </div>

          {/* Lista */}
          <ul ref={lista} id={`${id}-lista`} role="listbox" aria-label="Países" className="max-h-72 overflow-y-auto overscroll-contain py-1.5 [scrollbar-color:var(--color-borda-forte)_transparent] [scrollbar-width:thin]">
            {filtrados.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-texto-3">Nenhum país encontrado.</li>
            )}
            {filtrados.map((p, i) => {
              const escolhido = p.codigo === atual.codigo;
              const realce = i === ativo;
              return (
                <li key={p.codigo} role="presentation">
                  {semPesquisa && i === 0 && nComuns > 0 && (
                    <p className="px-4 pb-1.5 pt-2 text-[10px] tracking-[0.22em] text-texto-3">MAIS COMUNS</p>
                  )}
                  {semPesquisa && i === nComuns && (
                    <p className="mt-1.5 border-t border-borda px-4 pb-1.5 pt-3.5 text-[10px] tracking-[0.22em] text-texto-3">
                      TODOS OS PAÍSES
                    </p>
                  )}
                  <div
                    id={`${id}-${p.codigo}`}
                    data-indice={i}
                    role="option"
                    aria-selected={escolhido}
                    onMouseMove={() => setAtivo(i)}
                    onClick={() => escolher(p)}
                    className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded px-2.5 py-2.5 text-[15px] transition-colors ${
                      realce ? "bg-superficie-2 text-texto" : "text-texto-2"
                    }`}
                  >
                    <span
                      className={`w-8 shrink-0 rounded-[3px] border py-0.5 text-center text-[10px] font-bold tracking-wider ${
                        escolhido ? "border-texto bg-texto text-tinta" : "border-borda-forte text-texto-3"
                      }`}
                    >
                      {p.codigo}
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${escolhido ? "font-bold text-texto" : ""}`}>{p.nome}</span>
                    <span className="tabular-nums text-sm text-texto-3">{p.indicativo}</span>
                    <IconeVisto className={`size-4 shrink-0 ${escolhido ? "text-texto" : "invisible"}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
