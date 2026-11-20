"use client";

import { useState } from "react";
import Link from "next/link";
import { IconeSeta, IconeVisto } from "@/components/icones";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";

export type Servico = {
  id: string;
  nome: string;
  duracao_min: number;
  preco: number | null;
};

type Props = { barbeiro: string; servicos: Servico[] };

export function EscolherServico({ barbeiro, servicos }: Props) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const servico = servicos.find((s) => s.id === escolhido);

  const proximo = servico
    ? `/marcar/horario?barbeiro=${encodeURIComponent(barbeiro)}&servico=${servico.id}`
    : null;

  return (
    <>
      {/* ---------- Lista de serviços ---------- */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">Serviços</legend>

        {servicos.map((s, i) => {
          const sel = s.id === escolhido;
          return (
            <label
              key={s.id}
              style={{ animationDelay: `${150 + i * 70}ms` }}
              className={`flex min-h-19 cursor-pointer items-center gap-4 rounded border px-4 py-3.5 transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-texto motion-safe:animate-entrar ${
                sel ? "border-texto bg-superficie-2" : "border-borda hover:border-borda-forte hover:bg-superficie"
              }`}
            >
              {/* O rádio verdadeiro fica escondido; desenhamos o nosso por cima */}
              <input
                type="radio"
                name="servico"
                value={s.id}
                checked={sel}
                onChange={() => setEscolhido(s.id)}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200 ${
                  sel ? "border-texto bg-texto" : "border-desativado"
                }`}
              >
                <IconeVisto
                  className={`size-3.5 text-tinta transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    sel ? "scale-100" : "scale-0"
                  }`}
                />
              </span>

              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base font-bold uppercase tracking-wide">{s.nome}</span>
                <span className="text-[13px] text-texto-3">{formatarDuracao(s.duracao_min)}</span>
              </span>

              <span className="text-lg font-extrabold font-stretch-125%">{formatarPreco(s.preco)}</span>
            </label>
          );
        })}
      </fieldset>

      {/* ---------- Resumo fixo em baixo ---------- */}
      <div
        style={{ animationDelay: "350ms" }}
        className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-5 pb-5 motion-safe:animate-entrar"
      >
        <div
          aria-live="polite"
          className={`flex flex-col gap-3.5 rounded-lg border p-4 shadow-[0_-16px_40px_rgba(0,0,0,0.7)] transition-colors duration-300 ${
            servico ? "border-texto bg-texto text-tinta" : "border-borda bg-superficie text-texto"
          }`}
        >
          {/* a "key" faz o texto animar de novo sempre que muda de serviço */}
          <div key={servico?.id ?? "vazio"} className="flex flex-col gap-0.5 motion-safe:animate-entrar">
            <span className="text-base font-bold">
              {servico ? servico.nome : "Nenhum serviço escolhido"}
            </span>
            <span className={`text-sm ${servico ? "text-borda-forte" : "text-texto-3"}`}>
              {servico
                ? `${formatarDuracao(servico.duracao_min)} · ${formatarPreco(servico.preco)}`
                : "Escolhe um serviço para continuares"}
            </span>
          </div>

          {proximo ? (
            <Link
              href={proximo}
              className="group flex h-13 items-center justify-center gap-2.5 rounded bg-bg text-sm font-extrabold tracking-[0.14em] text-texto font-stretch-125% transition-transform active:scale-[0.97]"
            >
              CONTINUAR
              <IconeSeta className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex h-13 cursor-not-allowed items-center justify-center gap-2.5 rounded bg-borda text-sm font-extrabold tracking-[0.14em] text-desativado font-stretch-125%"
            >
              CONTINUAR
              <IconeSeta className="size-5" />
            </span>
          )}
        </div>
      </div>
    </>
  );
}
