"use client";

import { useState, useTransition } from "react";
import {
  cancelarMarcacao,
  concluirMarcacao,
  marcarFalta,
  reabrirMarcacao,
  type Resultado,
} from "@/app/gestao/actions";
import { formatarPreco } from "@/lib/formatar";

export type MarcacaoAgenda = {
  id: string;
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
};

const ESTADOS: Record<MarcacaoAgenda["estado"], { texto: string; classes: string }> = {
  confirmada: { texto: "MARCADA", classes: "border-borda-forte text-texto-2" },
  chegou: { texto: "CHEGOU", classes: "border-texto text-texto" },
  concluida: { texto: "CONCLUÍDA", classes: "border-texto bg-texto text-tinta" },
  faltou: { texto: "FALTOU", classes: "border-red-400/50 text-red-300" },
  cancelada: { texto: "CANCELADA", classes: "border-borda text-desativado" },
};

const METODOS = { mbway: "MB Way", dinheiro: "Dinheiro" } as const;

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
  const estado = ESTADOS[m.estado];
  const wa = m.telefoneLink ? `https://wa.me/${m.telefoneLink.replace(/\D/g, "")}` : null;

  return (
    <li
      style={{ animationDelay: `${atraso}ms` }}
      className={`rounded-lg border bg-superficie motion-safe:animate-entrar ${
        m.agora ? "border-texto shadow-[0_0_0_1px_var(--color-texto)]" : "border-borda"
      } ${aGuardar ? "opacity-70" : ""}`}
    >
      <div className={`flex gap-4 p-4 lg:p-5 ${inativa ? "opacity-55" : ""}`}>
        {/* Hora */}
        <div className="flex w-14 shrink-0 flex-col items-start">
          <span className="text-lg font-extrabold tabular-nums leading-tight font-stretch-125%">{m.horaInicio}</span>
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
            <span className={`truncate text-base font-bold ${m.estado === "cancelada" ? "line-through" : ""}`}>{m.cliente}</span>
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
                className="flex h-9 items-center gap-2 rounded-full border border-borda-forte px-3 text-xs tabular-nums transition-colors hover:border-texto active:scale-95"
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
                  className="flex h-9 items-center gap-2 rounded-full border border-borda-forte px-3 text-xs transition-colors hover:border-texto active:scale-95"
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
      <div className="border-t border-borda px-4 py-3 lg:px-5">
        {m.estado === "concluida" && painel === null && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="text-texto-3">Pago · </span>
              <span className="font-bold">{formatarPreco(m.valorCobrado)}</span>
              <span className="text-texto-3"> · {m.metodo ? METODOS[m.metodo] : "—"}</span>
            </span>
            <span className="flex gap-4">
              <BotaoTexto onClick={() => setPainel("concluir")}>Editar</BotaoTexto>
              <BotaoTexto onClick={() => executar(() => reabrirMarcacao(m.id))}>Desfazer</BotaoTexto>
            </span>
          </div>
        )}

        {inativa && (
          <div className="flex justify-end">
            <BotaoTexto onClick={() => executar(() => reabrirMarcacao(m.id))}>Desfazer</BotaoTexto>
          </div>
        )}

        {(m.estado === "confirmada" || m.estado === "chegou") && painel === null && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPainel("concluir")}
              className="flex h-10 flex-1 items-center justify-center rounded bg-texto text-xs font-extrabold tracking-[0.14em] text-tinta font-stretch-125% transition-transform active:scale-[0.97]"
            >
              CONCLUIR
            </button>
            <button
              type="button"
              onClick={() => executar(() => marcarFalta(m.id))}
              className="flex h-10 items-center rounded border border-borda-forte px-4 text-xs font-bold tracking-[0.12em] transition-colors hover:border-texto active:scale-[0.97]"
            >
              FALTOU
            </button>
            <button
              type="button"
              onClick={() => setPainel("cancelar")}
              className="flex h-10 items-center rounded border border-borda-forte px-4 text-xs font-bold tracking-[0.12em] transition-colors hover:border-red-400 hover:text-red-300 active:scale-[0.97]"
            >
              CANCELAR
            </button>
          </div>
        )}

        {/* Concluir: quanto cobrou e como pagou */}
        {painel === "concluir" && (
          <div className="flex flex-col gap-3 motion-safe:animate-entrar">
            <div className="flex gap-2">
              <label className="flex h-11 w-28 items-center rounded border border-borda-forte bg-bg focus-within:border-texto">
                <span className="sr-only">Valor cobrado</span>
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                  className="h-full w-full min-w-0 bg-transparent pl-3 text-base font-bold tabular-nums outline-none"
                />
                <span className="pr-3 text-texto-3">€</span>
              </label>
              {(["mbway", "dinheiro"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  aria-pressed={metodo === op}
                  onClick={() => setMetodo(op)}
                  className={`flex h-11 flex-1 items-center justify-center rounded border text-xs font-bold tracking-[0.12em] transition-colors active:scale-[0.97] ${
                    metodo === op ? "border-texto bg-texto text-tinta" : "border-borda-forte hover:border-texto"
                  }`}
                >
                  {METODOS[op].toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-4">
              <BotaoTexto onClick={() => setPainel(null)}>Voltar</BotaoTexto>
              <button
                type="button"
                disabled={!metodo || aGuardar}
                onClick={() => metodo && executar(() => concluirMarcacao(m.id, valor, metodo))}
                className="flex h-10 items-center rounded bg-texto px-5 text-xs font-extrabold tracking-[0.14em] text-tinta font-stretch-125% transition-[opacity,transform] active:scale-[0.97] disabled:opacity-40"
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
              placeholder="Motivo (opcional) — ex.: mudei o horário"
              className="h-11 rounded border border-borda-forte bg-bg px-3 text-sm outline-none placeholder:text-desativado focus:border-texto"
            />
            <div className="flex items-center justify-end gap-4">
              <BotaoTexto onClick={() => setPainel(null)}>Voltar</BotaoTexto>
              <button
                type="button"
                disabled={aGuardar}
                onClick={() => executar(() => cancelarMarcacao(m.id, motivo))}
                className="flex h-10 items-center rounded border border-red-400 px-5 text-xs font-bold tracking-[0.12em] text-red-300 transition-[background-color,transform] hover:bg-red-400/10 active:scale-[0.97] disabled:opacity-40"
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

function BotaoTexto({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="link-sublinhado text-sm text-texto-2 hover:text-texto">
      {children}
    </button>
  );
}
