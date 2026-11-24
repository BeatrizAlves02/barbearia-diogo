"use client";

import { useMemo, useState, useTransition } from "react";
import { buscarVagas } from "@/app/marcar/horario/actions";
import { IconeVoltar } from "@/components/icones";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";
import {
  adicionarDias,
  diaDaSemanaCurto,
  diaEmLisboa,
  formatarDiaCurto,
  horaDeFim,
  horaEmLisboa,
  numeroDoDia,
  rotuloDaSemana,
} from "@/lib/datas";
import type { Servico, Vaga } from "./tipos";
import { EsqueletoMarcacao } from "./EsqueletoMarcacao";
import { PainelResumo } from "./PainelResumo";
import { BotaoContinuar } from "./BotaoContinuar";
import { BarraResumoMovel } from "./BarraResumoMovel";
import { EscolhaFeita } from "./EscolhaFeita";

type Props = {
  barbeiro: string; // id do barbeiro ou "qualquer"
  nomeBarbeiro: string;
  servico: Servico;
  hoje: string; // "AAAA-MM-DD" em Lisboa
  vagasIniciais: Vaga[]; // vagas da primeira semana (vêm do servidor)
  nomes: Record<string, string>; // id → nome de cada barbeiro
};

const primeiroDiaComVagas = (vagas: Vaga[]) => (vagas.length ? diaEmLisboa(vagas[0].inicio) : null);

export function EscolherHorario({ barbeiro, nomeBarbeiro, servico, hoje, vagasIniciais, nomes }: Props) {
  const [inicioSemana, setInicioSemana] = useState(hoje);
  const [vagas, setVagas] = useState<Vaga[]>(vagasIniciais);
  const [diaSel, setDiaSel] = useState<string | null>(() => primeiroDiaComVagas(vagasIniciais));
  const [vagaSel, setVagaSel] = useState<Vaga | null>(null);
  const [aCarregar, iniciarTransicao] = useTransition();

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => adicionarDias(inicioSemana, i)),
    [inicioSemana]
  );

  // Agrupa as vagas por dia. No "primeiro disponível" fica só uma por hora
  // (a do primeiro barbeiro livre, porque a base de dados já as ordena assim).
  const vagasPorDia = useMemo(() => {
    const mapa = new Map<string, Vaga[]>();
    const vistas = new Set<string>();
    for (const v of vagas) {
      if (vistas.has(v.inicio)) continue;
      vistas.add(v.inicio);
      const dia = diaEmLisboa(v.inicio);
      mapa.set(dia, [...(mapa.get(dia) ?? []), v]);
    }
    return mapa;
  }, [vagas]);

  const vagasDoDia = diaSel ? vagasPorDia.get(diaSel) ?? [] : [];
  const grupos = [
    { nome: "Manhã", vagas: vagasDoDia.filter((v) => Number(horaEmLisboa(v.inicio).slice(0, 2)) < 13) },
    { nome: "Tarde", vagas: vagasDoDia.filter((v) => Number(horaEmLisboa(v.inicio).slice(0, 2)) >= 13) },
  ];

  function mudarSemana(direcao: 1 | -1) {
    const novoInicio = adicionarDias(inicioSemana, direcao * 7);
    if (novoInicio < hoje) return;
    setInicioSemana(novoInicio);
    setVagaSel(null);
    iniciarTransicao(async () => {
      const novas = await buscarVagas(barbeiro, servico.id, novoInicio, adicionarDias(novoInicio, 6));
      setVagas(novas);
      setDiaSel(primeiroDiaComVagas(novas));
    });
  }

  // Textos do resumo
  const nomeAtribuido = vagaSel ? nomes[vagaSel.barbeiro_id] ?? nomeBarbeiro : nomeBarbeiro;
  const diaTexto = vagaSel ? formatarDiaCurto(diaEmLisboa(vagaSel.inicio)) : null;
  const horaTexto = vagaSel
    ? `${horaEmLisboa(vagaSel.inicio)} – ${horaDeFim(vagaSel.inicio, servico.duracao_min)}`
    : null;

  const proximo = vagaSel
    ? `/marcar/dados?barbeiro=${vagaSel.barbeiro_id}&servico=${servico.id}&inicio=${encodeURIComponent(vagaSel.inicio)}`
    : null;

  return (
    <EsqueletoMarcacao
      passo={2}
      voltar="/marcar"
      titulo="Dia e hora"
      subtitulo="Escolhe quando queres vir."
      comBarraMovel
      lateral={
        <PainelResumo
          linhas={[
            { rotulo: "Serviço", valor: servico.nome, detalhe: formatarDuracao(servico.duracao_min) },
            diaTexto && horaTexto
              ? { rotulo: "Data e hora", valor: diaTexto, detalhe: horaTexto }
              : { rotulo: "Data e hora", valor: "Por escolher", vazio: true },
          ]}
          total={formatarPreco(servico.preco)}
          acao={<BotaoContinuar href={proximo}>CONTINUAR</BotaoContinuar>}
        />
      }
    >
      {/* ---------- Escolhas já feitas ---------- */}
      <div className="divide-y divide-borda rounded border border-borda motion-safe:animate-entrar">
        <EscolhaFeita
          rotulo="Serviço"
          valor={servico.nome}
          detalhe={`${formatarDuracao(servico.duracao_min)} · ${formatarPreco(servico.preco)}`}
          inicial={servico.nome.charAt(0)}
          alterar="/marcar"
        />
      </div>

      {/* ---------- Semana ---------- */}
      <section className="flex flex-col gap-3 motion-safe:animate-entrar" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-[0.24em]">
            {rotuloDaSemana(dias[0], dias[6]).toUpperCase()}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => mudarSemana(-1)}
              disabled={inicioSemana <= hoje || aCarregar}
              className="flex size-11 items-center justify-center rounded-full border border-borda transition-[border-color,opacity,transform] hover:border-texto active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <IconeVoltar />
            </button>
            <button
              type="button"
              aria-label="Semana seguinte"
              onClick={() => mudarSemana(1)}
              disabled={aCarregar}
              className="flex size-11 items-center justify-center rounded-full border border-borda transition-[border-color,opacity,transform] hover:border-texto active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <IconeVoltar className="size-5 rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 lg:gap-2">
          {dias.map((dia) => {
            const temVagas = !aCarregar && vagasPorDia.has(dia);
            const sel = dia === diaSel && !aCarregar;
            return (
              <button
                key={dia}
                type="button"
                aria-pressed={sel}
                disabled={!temVagas}
                onClick={() => {
                  setDiaSel(dia);
                  setVagaSel(null);
                }}
                className={`flex h-17 flex-col items-center justify-center gap-1 rounded border transition-[background-color,border-color,color,transform] duration-200 active:scale-95 lg:h-20 ${
                  aCarregar
                    ? "animate-pulse border-borda text-texto-3"
                    : sel
                      ? "border-texto bg-texto text-tinta"
                      : temVagas
                        ? "border-borda hover:border-texto"
                        : "border-transparent text-desativado"
                }`}
              >
                <span className="text-[10px] tracking-[0.12em]">{dia === hoje ? "HOJE" : diaDaSemanaCurto(dia)}</span>
                <span className="text-lg font-extrabold font-stretch-125%">{numeroDoDia(dia)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Horas ---------- */}
      {aCarregar ? (
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-12 rounded bg-superficie motion-safe:animate-pulse" />
          ))}
        </div>
      ) : vagasDoDia.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded border border-borda p-5 motion-safe:animate-entrar">
          <p className="text-sm text-texto-2">Sem horários livres nesta semana.</p>
          <button
            type="button"
            onClick={() => mudarSemana(1)}
            className="link-sublinhado text-sm font-bold"
          >
            Ver a semana seguinte →
          </button>
        </div>
      ) : (
        <fieldset key={diaSel} className="flex flex-col gap-5">
          <legend className="sr-only">Horas livres</legend>
          {grupos.map(
            (grupo) =>
              grupo.vagas.length > 0 && (
                <div key={grupo.nome} className="flex flex-col gap-2.5">
                  <span className="text-[10px] tracking-[0.24em] text-texto-3">{grupo.nome.toUpperCase()}</span>
                  <div className="grid grid-cols-4 gap-2 lg:grid-cols-6">
                    {grupo.vagas.map((v, i) => {
                      const sel = vagaSel?.inicio === v.inicio;
                      return (
                        <label
                          key={v.inicio}
                          style={{ animationDelay: `${i * 30}ms` }}
                          className={`flex h-12 cursor-pointer items-center justify-center rounded border text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-texto motion-safe:animate-entrar ${
                            sel ? "scale-105 border-texto bg-texto text-tinta" : "border-borda hover:border-texto"
                          }`}
                        >
                          <input
                            type="radio"
                            name="hora"
                            value={v.inicio}
                            checked={sel}
                            onChange={() => setVagaSel(v)}
                            className="sr-only"
                          />
                          {horaEmLisboa(v.inicio)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )
          )}
        </fieldset>
      )}

      <BarraResumoMovel
        titulo={diaTexto ?? "Nenhuma hora escolhida"}
        subtitulo={
          horaTexto
            ? `${horaTexto} · ${servico.nome}${barbeiro === "qualquer" ? ` com ${nomeAtribuido}` : ""}`
            : "Escolhe um dia e uma hora"
        }
        href={proximo}
      />
    </EsqueletoMarcacao>
  );
}
