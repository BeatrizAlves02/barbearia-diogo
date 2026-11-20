"use client";

import { useState } from "react";
import { IconeVisto } from "@/components/icones";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";
import type { Servico } from "./tipos";
import { EsqueletoMarcacao } from "./EsqueletoMarcacao";
import { PainelResumo } from "./PainelResumo";
import { BotaoContinuar } from "./BotaoContinuar";
import { BarbeiroEscolhido } from "./BarbeiroEscolhido";
import { BarraResumoMovel } from "./BarraResumoMovel";

type Props = { barbeiro: string; nomeBarbeiro: string; servicos: Servico[] };

export function EscolherServico({ barbeiro, nomeBarbeiro, servicos }: Props) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const servico = servicos.find((s) => s.id === escolhido);

  const proximo = servico
    ? `/marcar/horario?barbeiro=${encodeURIComponent(barbeiro)}&servico=${servico.id}`
    : null;

  return (
    <EsqueletoMarcacao
      passo={2}
      voltar="/marcar"
      titulo="O que queres marcar?"
      subtitulo="Escolhe o serviço."
      comBarraMovel
      lateral={
        <PainelResumo
          linhas={[
            { rotulo: "Barbeiro", valor: nomeBarbeiro },
            servico
              ? { rotulo: "Serviço", valor: servico.nome, detalhe: formatarDuracao(servico.duracao_min) }
              : { rotulo: "Serviço", valor: "Por escolher", vazio: true },
            { rotulo: "Data e hora", valor: "Escolhes a seguir", vazio: true },
          ]}
          total={servico ? formatarPreco(servico.preco) : undefined}
          acao={<BotaoContinuar href={proximo}>CONTINUAR</BotaoContinuar>}
        />
      }
    >
      <BarbeiroEscolhido nome={nomeBarbeiro} />

      {/* ---------- Lista de serviços ---------- */}
      <fieldset className="flex flex-col gap-2.5 lg:gap-3">
        <legend className="sr-only">Serviços</legend>

        {servicos.map((s, i) => {
          const sel = s.id === escolhido;
          return (
            <label
              key={s.id}
              style={{ animationDelay: `${150 + i * 70}ms` }}
              className={`flex min-h-19 cursor-pointer items-center gap-4 rounded border px-4 py-3.5 transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-texto motion-safe:animate-entrar lg:min-h-24 lg:px-6 ${
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
                <span className="text-base font-bold uppercase tracking-wide lg:text-lg">{s.nome}</span>
                <span className="text-[13px] text-texto-3">{formatarDuracao(s.duracao_min)}</span>
              </span>

              <span className="text-lg font-extrabold font-stretch-125% lg:text-xl">{formatarPreco(s.preco)}</span>
            </label>
          );
        })}
      </fieldset>

      <BarraResumoMovel
        titulo={servico ? servico.nome : "Nenhum serviço escolhido"}
        subtitulo={
          servico
            ? `${formatarDuracao(servico.duracao_min)} · ${formatarPreco(servico.preco)}`
            : "Escolhe um serviço para continuares"
        }
        href={proximo}
      />
    </EsqueletoMarcacao>
  );
}
