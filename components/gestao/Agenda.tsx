"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconeVisto } from "@/components/icones";
import { formatarPreco } from "@/lib/formatar";
import {
  adicionarDias,
  dataValida,
  diaDaSemanaCurto,
  formatarDiaLongo,
  nomeDoMes,
  numeroDoDia,
  primeiroDoMes,
  segundaDaSemana,
} from "@/lib/datas";
import { CartaoMarcacao, IconeDinheiro, IconeMbway, type MarcacaoAgenda } from "./CartaoMarcacao";

type Props = {
  hoje: string;
  dia: string; // dia pedido no endereço
  grelha: string[]; // todos os dias carregados (o mês inteiro, em semanas completas)
  folgas: string[]; // dias em que o Diogo não trabalha
  marcacoes: MarcacaoAgenda[];
  erro: string | null;
};

function Seta({ para }: { para: "esq" | "dir" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={para === "esq" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

const botaoSeta =
  "flex items-center justify-center rounded-full text-texto-3 transition-[background-color,color,transform] duration-200 hover:bg-superficie-2 hover:text-texto active:scale-90";

export function Agenda({ hoje, dia: diaPedido, grelha, folgas, marcacoes, erro }: Props) {
  const router = useRouter();
  const [aNavegar, iniciar] = useTransition();

  const mesCarregado = diaPedido.slice(0, 7);

  // O dia escolhido vem do endereço (?dia=…). Dentro do mês carregado, mudar de dia só
  // muda o endereço (sem ir ao servidor), por isso é instantâneo — e o "voltar atrás" do browser funciona.
  const params = useSearchParams();
  const doEndereco = params.get("dia") ?? hoje;
  const dia = dataValida(doEndereco) && doEndereco.slice(0, 7) === mesCarregado ? doEndereco : diaPedido;

  function irPara(d: string) {
    const url = d === hoje ? "/gestao" : `/gestao?dia=${d}`;
    if (d.slice(0, 7) === mesCarregado) {
      // Mesmo mês: os dados já cá estão → troca instantânea
      window.history.pushState(null, "", url);
    } else {
      // Outro mês: pede ao servidor
      iniciar(() => router.push(url));
    }
  }

  // Marcações agrupadas por dia + estado de cada dia
  const porDia = useMemo(() => {
    const mapa = new Map<string, MarcacaoAgenda[]>();
    for (const m of marcacoes) mapa.set(m.dia, [...(mapa.get(m.dia) ?? []), m]);
    return mapa;
  }, [marcacoes]);

  const diasDeFolga = useMemo(() => new Set(folgas), [folgas]);

  function resumo(d: string) {
    const ativas = (porDia.get(d) ?? []).filter((m) => m.estado !== "cancelada");
    const fechado = ativas.length > 0 && ativas.every((m) => m.estado === "concluida" || m.estado === "faltou");
    const porFechar = ativas.some((m) => m.passou && (m.estado === "confirmada" || m.estado === "chegou"));
    return { n: ativas.length, fechado, porFechar, folga: diasDeFolga.has(d) };
  }

  const doDia = porDia.get(dia) ?? [];
  const ativas = doDia.filter((m) => m.estado !== "cancelada");
  const concluidas = ativas.filter((m) => m.estado === "concluida");
  const fechadas = ativas.filter((m) => m.estado === "concluida" || m.estado === "faltou");
  const soma = (metodo?: string) =>
    concluidas.filter((m) => !metodo || m.metodo === metodo).reduce((t, m) => t + (m.valorCobrado ?? 0), 0);
  const faturado = soma();
  const mbway = soma("mbway");
  const dinheiro = soma("dinheiro");
  const progresso = ativas.length ? Math.round((fechadas.length / ativas.length) * 100) : 0;
  const diaFechado = resumo(dia).fechado;
  const diaDeFolga = diasDeFolga.has(dia);

  const semana = Array.from({ length: 7 }, (_, i) => adicionarDias(segundaDaSemana(dia), i));
  const grelhaDoMes = grelha.filter((d) => d >= segundaDaSemana(primeiroDoMes(dia)));

  return (
    <div className="lg:mt-8 lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-12">
      {/* ================= Coluna do dia ================= */}
      <aside>
        <section className="mt-6 flex flex-col gap-4 motion-safe:animate-entrar lg:mt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-[10px] tracking-[0.24em] text-texto-3">
                {dia === hoje ? "HOJE" : "AGENDA"}
                {diaDeFolga && (
                  <span className="rounded-full border border-borda-forte px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-texto-2">
                    FOLGA
                  </span>
                )}
                {aNavegar && (
                  <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
              </span>
              <h1 key={dia} className="text-2xl font-extrabold uppercase leading-none font-stretch-125% motion-safe:animate-entrar lg:text-4xl">
                {formatarDiaLongo(dia)}
              </h1>
            </div>
            {dia !== hoje && (
              <button
                type="button"
                onClick={() => irPara(hoje)}
                className="shrink-0 rounded-full border border-borda-forte px-4 py-2 text-[11px] font-bold tracking-[0.16em] transition-[background-color,color,border-color,transform] duration-200 hover:border-texto hover:bg-texto hover:text-tinta active:scale-95 motion-safe:animate-entrar"
              >
                HOJE
              </button>
            )}
          </div>

          {/* Telemóvel: faixa da semana */}
          <div className={`flex items-center gap-1.5 transition-opacity lg:hidden ${aNavegar ? "opacity-50" : ""}`}>
            <button type="button" onClick={() => irPara(adicionarDias(dia, -7))} aria-label="Semana anterior" className={`${botaoSeta} h-16 w-8 rounded`}>
              <Seta para="esq" />
            </button>
            <ol className="grid flex-1 grid-cols-7 gap-1.5">
              {semana.map((d) => {
                const r = resumo(d);
                const sel = d === dia;
                return (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => irPara(d)}
                      aria-current={sel ? "date" : undefined}
                      className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded border transition-[background-color,border-color,color,transform] duration-200 active:scale-90 ${
                        sel
                          ? "border-texto bg-texto text-tinta"
                          : `border-borda hover:-translate-y-0.5 hover:border-borda-forte hover:bg-superficie ${r.folga ? `${RISCAS} text-desativado` : ""}`
                      }`}
                    >
                      <span className={`text-[9px] tracking-[0.14em] ${sel ? "" : d === hoje ? "font-bold text-texto" : "text-texto-3"}`}>
                        {diaDaSemanaCurto(d)}
                      </span>
                      <span className="text-lg font-extrabold leading-none font-stretch-125%">{numeroDoDia(d)}</span>
                      <Indicador r={r} sel={sel} />
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => irPara(adicionarDias(dia, 7))} aria-label="Semana seguinte" className={`${botaoSeta} h-16 w-8 rounded`}>
              <Seta para="dir" />
            </button>
          </div>

          {/* Computador: calendário do mês */}
          <div className={`hidden rounded-lg border border-borda bg-superficie p-5 transition-opacity lg:block ${aNavegar ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <span key={dia.slice(0, 7)} className="text-sm font-extrabold tracking-[0.16em] font-stretch-125% motion-safe:animate-entrar">
                {nomeDoMes(dia).toUpperCase()}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => irPara(primeiroDoMes(dia, -1))} aria-label="Mês anterior" className={`${botaoSeta} size-9`}>
                  <Seta para="esq" />
                </button>
                <button type="button" onClick={() => irPara(primeiroDoMes(dia, 1))} aria-label="Mês seguinte" className={`${botaoSeta} size-9`}>
                  <Seta para="dir" />
                </button>
              </span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d) => (
                <span key={d} className="pb-2 text-[9px] tracking-[0.16em] text-texto-3">
                  {d}
                </span>
              ))}
              {grelhaDoMes.map((d) => {
                const r = resumo(d);
                const sel = d === dia;
                const foraDoMes = d.slice(0, 7) !== dia.slice(0, 7);
                const passado = d < hoje;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => irPara(d)}
                    aria-current={sel ? "date" : undefined}
                    aria-label={`${formatarDiaLongo(d)}${r.folga ? ", folga" : ""}${r.fechado ? ", dia fechado" : r.n ? `, ${r.n} marcações` : ""}`}
                    className={`relative flex h-12 flex-col items-center justify-center rounded transition-[background-color,color,transform,box-shadow] duration-200 active:scale-90 ${
                      sel
                        ? "bg-texto text-tinta shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
                        : `hover:-translate-y-0.5 hover:bg-superficie-2 ${d === hoje ? "ring-1 ring-texto ring-inset" : ""} ${r.folga ? `${RISCAS} text-desativado` : ""}`
                    } ${foraDoMes ? "opacity-30" : passado && !sel && !r.folga ? "text-texto-3" : ""}`}
                  >
                    <span className="text-[15px] font-bold tabular-nums">{numeroDoDia(d)}</span>
                    <Indicador r={r} sel={sel} />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-4 border-t border-borda pt-3 text-[11px] text-texto-3">
              <span className="flex items-center gap-1.5">
                <IconeVisto className="size-3 text-texto" /> dia fechado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-texto" /> por fechar
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`size-3 rounded-sm border border-borda ${RISCAS}`} /> folga
              </span>
            </p>
          </div>
        </section>

        {/* ---------- Resumo do dia ---------- */}
        <div key={`resumo-${dia}`} className="mt-5 flex flex-col gap-3 motion-safe:animate-entrar">
          <div className="rounded-lg border border-borda bg-superficie p-4 lg:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] tracking-[0.2em] text-texto-3">FATURADO</span>
                <span className="text-3xl font-extrabold tabular-nums font-stretch-125% lg:text-4xl">{formatarPreco(faturado)}</span>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[9px] tracking-[0.2em] text-texto-3">FECHADAS</span>
                <span className="flex items-center gap-1.5 text-xl font-extrabold tabular-nums font-stretch-125%">
                  {diaFechado && <IconeVisto className="size-4" />}
                  {fechadas.length}/{ativas.length}
                </span>
              </div>
            </div>
            {/* Barra de progresso do dia */}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-superficie-2">
              <div
                className="h-full rounded-full bg-texto transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-texto-3">
              {ativas.length === 0
                ? "Sem marcações."
                : diaFechado
                  ? "Dia fechado. Bom trabalho!"
                  : `${ativas.length - fechadas.length} por fechar`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { rotulo: "MB WAY", valor: mbway, Icone: IconeMbway },
              { rotulo: "DINHEIRO", valor: dinheiro, Icone: IconeDinheiro },
            ].map(({ rotulo, valor, Icone }) => (
              <div key={rotulo} className="flex flex-col gap-3 rounded-lg border border-borda bg-superficie p-4 lg:p-5">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-texto-2">
                  <span className="flex size-7 items-center justify-center rounded-full border border-borda-forte">
                    <Icone className="size-3.5" />
                  </span>
                  {rotulo}
                </span>
                <span className="text-2xl font-extrabold tabular-nums font-stretch-125%">{formatarPreco(valor)}</span>
                <div className="h-1 overflow-hidden rounded-full bg-superficie-2">
                  <div
                    className="h-full rounded-full bg-texto-2 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${faturado ? Math.round((valor / faturado) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= Marcações ================= */}
      <div className={`transition-opacity ${aNavegar ? "pointer-events-none opacity-50" : ""}`}>
        <h2 className="mt-8 flex items-center justify-between text-[10px] tracking-[0.24em] text-texto-3 lg:mt-0">
          MARCAÇÕES DO DIA
          <span className="tabular-nums">{ativas.length}</span>
        </h2>

        {erro ? (
          <p className="mt-4 text-sm text-red-400">Não foi possível carregar as marcações: {erro}</p>
        ) : doDia.length === 0 ? (
          <div key={`vazio-${dia}`} className="mt-4 rounded-lg border border-dashed border-borda px-5 py-12 text-center motion-safe:animate-entrar lg:py-24">
            <p className="font-mao text-4xl">{diaDeFolga ? "dia de folga!" : "dia livre!"}</p>
            <p className="mt-1 text-sm text-texto-3">{diaDeFolga ? "Neste dia não se trabalha. Aproveita!" : "Sem marcações neste dia."}</p>
          </div>
        ) : (
          <ul key={`lista-${dia}`} className="mt-4 flex flex-col gap-3">
            {doDia.map((m, i) => (
              <CartaoMarcacao key={m.id} m={m} atraso={i * 60} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Riscas diagonais discretas para os dias de folga */
const RISCAS = "bg-[repeating-linear-gradient(135deg,transparent_0_5px,rgba(255,255,255,0.06)_5px_7px)]";

/* Por baixo do número do dia: ✓ se está fechado, senão quantas marcações tem (com ponto se há por fechar) */
function Indicador({ r, sel }: { r: { n: number; fechado: boolean; porFechar: boolean; folga: boolean }; sel: boolean }) {
  if (r.fechado) return <IconeVisto className={`size-3 ${sel ? "" : "text-texto"}`} />;
  if (!r.n) return <span className="h-3" />;
  return (
    <span className={`flex h-3 items-center gap-1 text-[10px] font-bold tabular-nums leading-3 ${sel ? "" : "text-texto-2"}`}>
      {r.porFechar && <span className={`size-1.5 rounded-full ${sel ? "bg-tinta" : "bg-texto"}`} />}
      {r.n}
    </span>
  );
}
