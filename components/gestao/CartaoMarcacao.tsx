"use client";

import { useState, useTransition } from "react";
import {
  cancelarMarcacao,
  concluirMarcacao,
  marcarFalta,
  reabrirMarcacao,
  type Resultado,
} from "@/app/gestao/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarPreco } from "@/lib/formatar";

export type MarcacaoAgenda = {
  id: string;
  dia: string; // "2026-11-25" (em Lisboa)
  horaInicio: string; // "09:00"
  horaFim: string; // "10:00"
  cliente: string;
  telefoneTexto: string | null; // "932 506 203"
  telefoneLink: string | null; // "+351932506203"
  nota: string | null;
  estado: "confirmada" | "chegou" | "concluida" | "faltou" | "cancelada";
  servico: string;
  preco: number | null;
  valorCobrado: number | null;
  metodo: "mbway" | "dinheiro" | null;
  motivo: string | null;
  agora: boolean; // está a decorrer neste momento
  comecou: boolean; // a hora de início já chegou
  passou: boolean; // a hora de fim já passou
};

type IconeProps = { className?: string };

export function IconeMbway({ className = "" }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}

export function IconeDinheiro({ className = "" }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v5M18 9.5v5" />
    </svg>
  );
}

function IconeEditar({ className = "" }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    </svg>
  );
}

const ESTADOS: Record<MarcacaoAgenda["estado"], { texto: string; classes: string }> = {
  confirmada: { texto: "MARCADA", classes: "border-borda-forte text-texto-2" },
  chegou: { texto: "CHEGOU", classes: "border-texto text-texto" },
  concluida: { texto: "CONCLUÍDA", classes: "border-texto bg-texto text-tinta" },
  faltou: { texto: "FALTOU", classes: "border-red-400/50 text-red-300" },
  cancelada: { texto: "CANCELADA", classes: "border-borda text-desativado" },
};

const METODOS = {
  mbway: { texto: "MB Way", Icone: IconeMbway },
  dinheiro: { texto: "Dinheiro", Icone: IconeDinheiro },
} as const;

/* Botões com contorno: ao passar o rato enchem-se de branco */
const botaoContorno =
  "flex h-10 items-center justify-center rounded border border-borda-forte px-4 text-xs font-bold tracking-[0.12em] transition-[background-color,color,border-color,transform] duration-200 hover:border-texto hover:bg-texto hover:text-tinta active:scale-[0.96] lg:h-11";

type Painel = null | "concluir" | "cancelar";

export function CartaoMarcacao({ m, atraso = 0 }: { m: MarcacaoAgenda; atraso?: number }) {
  const [painel, setPainel] = useState<Painel>(null);
  const [valor, setValor] = useState(String(m.valorCobrado ?? m.preco ?? ""));
  const [metodo, setMetodo] = useState<"mbway" | "dinheiro" | null>(m.metodo);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  function executar(acao: () => Promise<Resultado>) {
    setErro(null);
    iniciar(async () => {
      const r = await acao();
      if (r.erro) setErro(r.erro);
      else setPainel(null);
    });
  }

  const inativa = m.estado === "cancelada" || m.estado === "faltou";
  // Já passou e ainda não foi fechada: falta registar se foi feita ou se o cliente faltou
  const porFechar = m.passou && (m.estado === "confirmada" || m.estado === "chegou");
  const estado = porFechar ? { texto: "POR FECHAR", classes: "border-dashed border-texto text-texto" } : ESTADOS[m.estado];
  const wa = m.telefoneLink ? `https://wa.me/${m.telefoneLink.replace(/\D/g, "")}` : null;
  const Pago = m.metodo ? METODOS[m.metodo] : null;

  return (
    <li
      style={{ animationDelay: `${atraso}ms` }}
      className={`rounded-lg border bg-superficie transition-[border-color,opacity] duration-300 motion-safe:animate-entrar hover:border-borda-forte lg:flex ${
        m.agora ? "border-texto shadow-[0_0_0_1px_var(--color-texto)]" : "border-borda"
      } ${aGuardar ? "opacity-70" : ""}`}
    >
      <div className={`flex gap-4 p-4 lg:flex-1 lg:gap-6 lg:p-6 ${inativa ? "opacity-55" : ""}`}>
        {/* Hora */}
        <div className="flex w-14 shrink-0 flex-col items-start lg:w-16">
          <span className="text-lg font-extrabold tabular-nums leading-tight font-stretch-125% lg:text-xl">{m.horaInicio}</span>
          <span className="text-xs tabular-nums text-texto-3">{m.horaFim}</span>
          {m.agora && (
            <span className="mt-2 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em]">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 rounded-full bg-texto motion-safe:animate-ping" />
                <span className="relative size-1.5 rounded-full bg-texto" />
              </span>
              AGORA
            </span>
          )}
        </div>

        {/* Cliente e serviço */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <span className={`truncate text-base font-bold lg:text-lg ${m.estado === "cancelada" ? "line-through" : ""}`}>{m.cliente}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] ${estado.classes}`}>
              {estado.texto}
            </span>
          </div>
          <span className="text-sm text-texto-2">
            {m.servico} · {formatarPreco(m.preco)}
          </span>
          {m.nota && <p className="mt-1 rounded bg-superficie-2 px-3 py-2 text-sm italic text-texto-2">“{m.nota}”</p>}
          {m.estado === "cancelada" && m.motivo && <p className="text-xs text-texto-3">Motivo: {m.motivo}</p>}

          {/* Contactos */}
          {m.telefoneLink && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`tel:${m.telefoneLink}`}
                className="flex h-9 items-center gap-2 rounded-full border border-borda-forte px-3 text-xs tabular-nums transition-[background-color,color,border-color,transform] duration-200 hover:border-texto hover:bg-texto hover:text-tinta active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
                {m.telefoneTexto}
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center gap-2 rounded-full border border-borda-forte px-3 text-xs transition-[background-color,color,border-color,transform] duration-200 hover:border-texto hover:bg-texto hover:text-tinta active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Ações ---------- */}
      <div className="border-t border-borda px-4 py-3 lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l lg:p-5">
        {/* Concluída: valor e forma de pagamento em destaque */}
        {m.estado === "concluida" && painel === null && (
          <div className="flex items-center justify-between gap-3 motion-safe:animate-entrar lg:flex-col lg:items-stretch lg:gap-4">
            <div className="flex items-center gap-3">
              {Pago && (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-texto text-tinta">
                  <Pago.Icone className="size-5" />
                </span>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] tracking-[0.2em] text-texto-3">PAGO</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tabular-nums font-stretch-125%">{formatarPreco(m.valorCobrado)}</span>
                  <span className="text-sm font-bold text-texto-2">{Pago?.texto ?? "—"}</span>
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setPainel("concluir")} className={`${botaoContorno} gap-2`}>
              <IconeEditar className="size-3.5" />
              EDITAR
            </button>
          </div>
        )}

        {inativa && (
          <div className="flex justify-end lg:justify-stretch">
            <button type="button" onClick={() => executar(() => reabrirMarcacao(m.id))} className={`${botaoContorno} lg:w-full`}>
              DESFAZER
            </button>
          </div>
        )}

        {(m.estado === "confirmada" || m.estado === "chegou") && painel === null && (
          // Antes da hora: pode cancelar. Depois de começar: pode marcar que faltou.
          <div className="grid grid-cols-[1fr_auto] gap-2 lg:grid-cols-1">
            <button type="button" onClick={() => setPainel("concluir")} className={classesBotaoPrimario("pequeno")}>
              CONCLUIR
            </button>
            {m.comecou && (
              <button type="button" onClick={() => executar(() => marcarFalta(m.id))} className={botaoContorno}>
                FALTOU
              </button>
            )}
            {!m.comecou && (
              <button
                type="button"
                onClick={() => setPainel("cancelar")}
                className={`${botaoContorno} hover:border-red-400 hover:bg-red-400 hover:text-tinta`}
              >
                CANCELAR
              </button>
            )}
          </div>
        )}

        {/* Concluir / editar: quanto cobrou e como pagou */}
        {painel === "concluir" && (
          <div className="flex flex-col gap-3 motion-safe:animate-entrar">
            <div className="flex flex-wrap gap-2">
              <label className="flex h-11 w-28 items-center rounded border border-borda-forte bg-bg transition-colors focus-within:border-texto lg:w-full">
                <span className="sr-only">Valor cobrado</span>
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                  autoFocus
                  className="h-full w-full min-w-0 bg-transparent pl-3 text-lg font-bold tabular-nums outline-none"
                />
                <span className="pr-3 text-texto-3">€</span>
              </label>
              {(["mbway", "dinheiro"] as const).map((op) => {
                const { texto, Icone } = METODOS[op];
                const ativo = metodo === op;
                return (
                  <button
                    key={op}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setMetodo(op)}
                    className={`flex h-11 flex-1 items-center justify-center gap-2 rounded border text-xs font-bold tracking-[0.12em] transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.96] ${
                      ativo ? "border-texto bg-texto text-tinta" : "border-borda-forte hover:border-texto hover:bg-superficie-2"
                    }`}
                  >
                    <Icone className="size-4" />
                    {texto.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setPainel(null)} className="link-sublinhado text-sm text-texto-2 hover:text-texto">
                Voltar
              </button>
              <button
                type="button"
                disabled={!metodo || aGuardar}
                onClick={() => metodo && executar(() => concluirMarcacao(m.id, valor, metodo))}
                className={`${classesBotaoPrimario("pequeno")} disabled:pointer-events-none disabled:opacity-40`}
              >
                {aGuardar ? "A GUARDAR…" : "GUARDAR"}
              </button>
            </div>
          </div>
        )}

        {/* Cancelar: motivo opcional */}
        {painel === "cancelar" && (
          <div className="flex flex-col gap-3 motion-safe:animate-entrar">
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={200}
              autoFocus
              placeholder="Motivo (opcional) — ex.: mudei o horário"
              className="h-11 rounded border border-borda-forte bg-bg px-3 text-sm outline-none transition-colors placeholder:text-desativado focus:border-texto"
            />
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setPainel(null)} className="link-sublinhado text-sm text-texto-2 hover:text-texto">
                Voltar
              </button>
              <button
                type="button"
                disabled={aGuardar}
                onClick={() => executar(() => cancelarMarcacao(m.id, motivo))}
                className="flex h-11 items-center rounded border border-red-400 px-5 text-xs font-bold tracking-[0.12em] text-red-300 transition-[background-color,color,transform] duration-200 hover:bg-red-400 hover:text-tinta active:scale-[0.96] disabled:opacity-40"
              >
                {aGuardar ? "A CANCELAR…" : "JÁ NÃO VOU FAZER"}
              </button>
            </div>
          </div>
        )}

        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      </div>
    </li>
  );
}
