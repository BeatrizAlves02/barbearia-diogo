"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarPreco } from "@/lib/formatar";
import { adicionarDias, formatarDiaLongo, nomeDoMes } from "@/lib/datas";
import type { Resumo, Vista } from "@/lib/faturacao";
import { IconeDinheiro, IconeMbway } from "./CartaoMarcacao";

type Props = {
  vista: Vista;
  de: string;
  ate: string; // exclusivo
  hoje: string;
  anteriorData: string;
  seguinteData: string;
  resumo: Resumo;
  erro: string | null;
};

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const ROTULOS: Record<Vista, string> = { dia: "DIA", semana: "SEMANA", mes: "MÊS", ano: "ANO" };
const ANTERIOR: Record<Vista, string> = { dia: "que no dia anterior", semana: "que na semana anterior", mes: "que no mês anterior", ano: "que no ano anterior" };
const ESTE: Record<Vista, string> = { dia: "Ir para hoje", semana: "Ir para esta semana", mes: "Ir para este mês", ano: "Ir para este ano" };

function tituloDoPeriodo(vista: Vista, de: string, ate: string) {
  if (vista === "dia") return formatarDiaLongo(de);
  if (vista === "mes") return nomeDoMes(de);
  if (vista === "ano") return de.slice(0, 4);
  const fim = adicionarDias(ate, -1);
  const [a, b] = [new Date(`${de}T12:00:00Z`), new Date(`${fim}T12:00:00Z`)];
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()} – ${b.getUTCDate()} ${MESES_CURTOS[b.getUTCMonth()]} ${b.getUTCFullYear()}`
    : `${a.getUTCDate()} ${MESES_CURTOS[a.getUTCMonth()]} – ${b.getUTCDate()} ${MESES_CURTOS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

function Seta({ para }: { para: "esq" | "dir" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={para === "esq" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export function Faturacao({ vista, de, ate, hoje, anteriorData, seguinteData, resumo, erro }: Props) {
  const router = useRouter();
  const [aNavegar, iniciar] = useTransition();
  const ir = (v: Vista, data: string) => iniciar(() => router.push(`/gestao/faturacao?vista=${v}&data=${data}`, { scroll: false }));

  const contemHoje = de <= hoje && hoje < ate;
  const podeAvancar = seguinteData <= hoje; // não faz sentido ver faturação do futuro
  const { total, anterior } = resumo;
  const diferenca = anterior ? Math.round(((total - anterior) / anterior) * 100) : null;
  // por baixo do dia: "Hoje" ou "Ontem"
  const relativo = vista === "dia" ? (de === hoje ? "Hoje" : de === adicionarDias(hoje, -1) ? "Ontem" : null) : null;

  return (
    <div className="mt-6 flex flex-col gap-6 lg:mt-8">
      {/* ---------- Período (igual em todos os ecrãs: título → tipo de período → setas) ---------- */}
      <div className="flex flex-col gap-4 motion-safe:animate-entrar lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">FATURAÇÃO</span>
          <h1 key={de + vista} className="mt-1 text-3xl leading-none font-extrabold uppercase font-stretch-125% motion-safe:animate-entrar lg:text-5xl">
            {tituloDoPeriodo(vista, de, ate)}
          </h1>
          {relativo && <p key={`r${de}`} className="mt-1.5 text-sm text-texto-3 motion-safe:animate-entrar">{relativo}</p>}
        </div>

        {/* Tipo de período em cima, setas por baixo — no computador ficam ao lado do título */}
        <div className="flex w-full max-w-md shrink-0 flex-col gap-3 lg:w-[26rem]">
        <div className="flex w-full gap-1 rounded-full border border-borda p-1">
          {(Object.keys(ROTULOS) as Vista[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === vista}
              onClick={() => ir(v, contemHoje ? hoje : de)}
              className={`flex h-9 flex-1 items-center justify-center rounded-full text-[11px] font-bold tracking-[0.14em] transition-[background-color,color,transform] duration-200 active:scale-95 ${
                v === vista ? "bg-texto text-tinta" : "text-texto-2 hover:bg-superficie-2 hover:text-texto"
              }`}
            >
              {ROTULOS[v]}
            </button>
          ))}
        </div>

        {/* Andar entre períodos: sempre no mesmo sítio e com o mesmo tamanho (nada salta) */}
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-1 rounded-full border border-borda p-1">
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => ir(vista, anteriorData)}
            className="flex size-9 items-center justify-center rounded-full text-texto-2 transition-[background-color,color,transform] hover:bg-superficie-2 hover:text-texto active:scale-90"
          >
            <Seta para="esq" />
          </button>
          <button
            type="button"
            disabled={contemHoje}
            onClick={() => ir(vista, hoje)}
            className="h-9 truncate rounded-full px-2 text-[11px] font-bold tracking-[0.14em] text-texto transition-[background-color,color,opacity,transform] hover:bg-superficie-2 active:scale-95 disabled:pointer-events-none disabled:opacity-25"
          >
            {ESTE[vista].toUpperCase()}
          </button>
          <button
            type="button"
            aria-label="Período seguinte"
            disabled={!podeAvancar}
            onClick={() => ir(vista, seguinteData)}
            className="flex size-9 items-center justify-center rounded-full text-texto-2 transition-[background-color,color,opacity,transform] hover:bg-superficie-2 hover:text-texto active:scale-90 disabled:pointer-events-none disabled:opacity-25"
          >
            <Seta para="dir" />
          </button>
        </div>
        </div>
      </div>

      {erro && <p className="rounded border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">Não foi possível carregar a faturação.</p>}

      <div
        className={`grid gap-5 transition-opacity lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:items-start lg:gap-8 ${aNavegar ? "pointer-events-none opacity-50" : ""}`}
      >
        {/* ================= Coluna dos números ================= */}
        <div className="flex flex-col gap-4">
          <section key={`t${de}${vista}`} className="rounded-lg border border-borda bg-superficie p-5 motion-safe:animate-entrar lg:p-6">
            <span className="text-[10px] tracking-[0.22em] text-texto-3">FATURADO</span>
            <p className="mt-1 text-5xl font-extrabold tabular-nums font-stretch-125% lg:text-6xl">{formatarPreco(total)}</p>
            <p className="mt-2 text-sm text-texto-3">
              {diferenca === null ? (
                anterior === 0 && total > 0 ? (
                  "Sem faturação no período anterior."
                ) : (
                  " "
                )
              ) : (
                <>
                  <span className={`font-bold ${diferenca >= 0 ? "text-texto" : "text-texto-2"}`}>
                    {diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "="} {Math.abs(diferenca)}%
                  </span>{" "}
                  {diferenca === 0 ? "igual ao período anterior" : `${diferenca > 0 ? "mais" : "menos"} ${ANTERIOR[vista]}`} ({formatarPreco(anterior)})
                </>
              )}
            </p>

            {/* MB Way vs Dinheiro: uma barra dividida, com os nomes e valores escritos */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-superficie-2">
                {total > 0 && (
                  <>
                    <div className="h-full rounded-l-full bg-texto transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${(resumo.mbway / total) * 100}%` }} />
                    <div
                      className="h-full rounded-r-full bg-[repeating-linear-gradient(135deg,var(--color-texto-3)_0_2px,transparent_2px_5px)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${(resumo.dinheiro / total) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { rotulo: "MB WAY", valor: resumo.mbway, Icone: IconeMbway, amostra: "bg-texto" },
                  { rotulo: "DINHEIRO", valor: resumo.dinheiro, Icone: IconeDinheiro, amostra: "bg-[repeating-linear-gradient(135deg,var(--color-texto-3)_0_2px,transparent_2px_5px)] border border-texto-3" },
                ].map(({ rotulo, valor, Icone, amostra }) => (
                  <div key={rotulo} className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-texto-2">
                      <span className={`size-2.5 rounded-sm ${amostra}`} aria-hidden="true" />
                      <Icone className="size-3.5" />
                      {rotulo}
                    </span>
                    <span className="text-xl font-extrabold tabular-nums font-stretch-125%">{formatarPreco(valor)}</span>
                    <span className="text-xs text-texto-3 tabular-nums">{total ? Math.round((valor / total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div key={`k${de}${vista}`} className="grid grid-cols-3 gap-3 motion-safe:animate-entrar">
            {[
              { rotulo: "CONCLUÍDAS", valor: String(resumo.concluidas) },
              { rotulo: "FALTARAM", valor: String(resumo.faltas) },
              { rotulo: "CANCELADAS", valor: String(resumo.canceladas) },
            ].map((k) => (
              <div key={k.rotulo} className="flex flex-col gap-1 rounded-lg border border-borda bg-superficie p-4 lg:p-5">
                <span className="text-[9px] tracking-[0.2em] text-texto-3">{k.rotulo}</span>
                <span className="text-2xl font-extrabold tabular-nums font-stretch-125%">{k.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= Gráfico + serviços ================= */}
        <div className="flex flex-col gap-4">
          <Grafico key={`g${de}${vista}`} resumo={resumo} vista={vista} hoje={hoje} />

          <section key={`s${de}${vista}`} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
            <h2 className="border-b border-borda px-5 py-4 text-[10px] tracking-[0.22em] text-texto-3 lg:px-6">{vista === "dia" ? "MARCAÇÕES CONCLUÍDAS" : "POR SERVIÇO"}</h2>
            {resumo.concluidas === 0 ? (
              <p className="px-5 py-6 text-sm text-texto-3 lg:px-6">Ainda não há marcações concluídas neste período.</p>
            ) : vista === "dia" ? (
              <ul className="divide-y divide-borda">
                {resumo.lista.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm lg:px-6">
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="font-bold tabular-nums">{m.hora}</span>
                      <span className="truncate">{m.cliente}</span>
                      <span className="hidden text-texto-3 sm:inline">{m.servico}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      {m.metodo === "mbway" ? <IconeMbway className="size-3.5 text-texto-3" /> : m.metodo === "dinheiro" ? <IconeDinheiro className="size-3.5 text-texto-3" /> : null}
                      <span className="font-bold">{formatarPreco(m.valor)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-4 px-5 py-5 lg:px-6">
                {resumo.servicos.map((s) => (
                  <li key={s.nome} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        <span className="font-bold">{s.nome}</span> <span className="text-texto-3">× {s.n}</span>
                      </span>
                      <span className="font-bold tabular-nums">{formatarPreco(s.total)}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-superficie-2">
                      <span
                        className="block h-full rounded-full bg-texto-2 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${total ? (s.total / total) * 100 : 0}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* Gráfico de barras: quanto se faturou em cada hora/dia/mês. Passar o rato (ou tocar) mostra o detalhe. */
function Grafico({ resumo, vista, hoje }: { resumo: Resumo; vista: Vista; hoje: string }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const { barras } = resumo;
  const max = Math.max(...barras.map((b) => b.total), 0);
  // escala "redonda" para as linhas de referência
  const passo = max <= 20 ? 5 : max <= 50 ? 10 : max <= 100 ? 25 : max <= 250 ? 50 : max <= 500 ? 100 : max <= 1000 ? 250 : max <= 2500 ? 500 : 1000;
  const topo = Math.max(passo, Math.ceil(max / passo) * passo);
  const linhas = Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo);
  const muitas = barras.length > 14;
  const b = ativo === null ? null : barras[ativo];
  const ehHoje = (chave: string) => chave === hoje || chave === hoje.slice(0, 7);

  return (
    <section className="rounded-lg border border-borda bg-superficie p-5 motion-safe:animate-entrar lg:p-6">
      <div className="flex min-h-10 items-start justify-between gap-3">
        <h2 className="text-[10px] tracking-[0.22em] text-texto-3">
          {vista === "dia" ? "POR HORA" : vista === "ano" ? "POR MÊS" : "POR DIA"}
        </h2>
        {/* Detalhe da barra ativa (no sítio do tooltip, para funcionar bem também no telemóvel) */}
        <div aria-live="polite" className="text-right text-sm">
          {b ? (
            <span key={b.chave} className="flex flex-col items-end motion-safe:animate-entrar">
              <span className="font-bold">
                {b.dica} · {formatarPreco(b.total)}
              </span>
              <span className="text-xs text-texto-3">
                {b.n} {b.n === 1 ? "marcação" : "marcações"}
                {b.total > 0 && ` · MB Way ${formatarPreco(b.mbway)} · Dinheiro ${formatarPreco(b.dinheiro)}`}
              </span>
            </span>
          ) : (
            <span className="text-xs text-texto-3">Toca numa barra para ver o detalhe</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        {/* Eixo dos valores */}
        <div className="relative h-48 w-10 shrink-0 text-right text-[10px] text-texto-3 tabular-nums lg:h-64">
          {linhas.map((v) => (
            <span key={v} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(v / topo) * 100}%` }}>
              {v} €
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Linhas de referência (discretas) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 lg:h-64" aria-hidden="true">
            {linhas.map((v) => (
              <span key={v} className={`absolute inset-x-0 border-t ${v === 0 ? "border-borda-forte" : "border-borda/60"}`} style={{ bottom: `${(v / topo) * 100}%` }} />
            ))}
          </div>

          <div className="relative flex h-48 items-end gap-[2px] lg:h-64" onMouseLeave={() => setAtivo(null)}>
            {barras.map((x, i) => (
              <button
                key={x.chave}
                type="button"
                aria-label={`${x.dica}: ${formatarPreco(x.total)}`}
                onMouseEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onClick={() => setAtivo(ativo === i ? null : i)}
                className="group flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <span
                  className={`block w-full max-w-10 origin-bottom rounded-t-[4px] transition-[height,background-color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:animate-[crescer_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards] ${
                    ativo === i ? "bg-texto" : ativo === null ? "bg-texto/85" : "bg-texto/35"
                  } ${x.total === 0 ? "opacity-0" : ""}`}
                  style={{ height: `${(x.total / topo) * 100}%`, animationDelay: `${i * 18}ms` }}
                />
              </button>
            ))}
          </div>

          {/* Rótulos por baixo (no mês, só alguns para não se atropelarem) */}
          <div className="mt-2 flex gap-[2px] text-[10px] text-texto-3">
            {barras.map((x, i) => (
              <span
                key={x.chave}
                className={`min-w-0 flex-1 text-center tabular-nums ${ativo === i || ehHoje(x.chave) ? "font-bold text-texto" : ""}`}
              >
                {!muitas || i === 0 || (i + 1) % 5 === 0 || ativo === i || ehHoje(x.chave) ? x.rotulo : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
