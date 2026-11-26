"use client";

import { useEffect, useState, useTransition } from "react";
import { sairPorInatividade } from "@/app/gestao/actions";
import { LIMITE_INATIVIDADE_GESTAO_MIN, registarAtividade, ultimaAtividade } from "@/lib/sessao";

const LIMITE = LIMITE_INATIVIDADE_GESTAO_MIN * 60_000;
const AVISO_ANTES = 60_000; // avisa 1 minuto antes de sair

/**
 * Segurança: se o Diogo não mexer na app durante algum tempo, a sessão termina.
 * Avisa 1 minuto antes, com um botão para continuar.
 */
export function SessaoInativa() {
  const [falta, setFalta] = useState<number | null>(null); // segundos até sair (só no último minuto)
  const [, iniciar] = useTransition();

  useEffect(() => {
    registarAtividade();
    let ultimaGravacao = Date.now();

    // Cada toque/tecla/scroll conta como "estou a usar" (gravado no máximo de 20 em 20 s)
    const mexeu = () => {
      if (Date.now() - ultimaGravacao > 20_000) {
        registarAtividade();
        ultimaGravacao = Date.now();
      }
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach((e) => window.addEventListener(e, mexeu, { passive: true }));

    const verificar = () => {
      const parado = Date.now() - ultimaAtividade();
      if (parado >= LIMITE) {
        iniciar(() => sairPorInatividade());
      } else if (parado >= LIMITE - AVISO_ANTES) {
        setFalta(Math.ceil((LIMITE - parado) / 1000));
      } else {
        setFalta(null);
      }
    };
    const intervalo = setInterval(verificar, 1000);
    document.addEventListener("visibilitychange", verificar);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, mexeu));
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", verificar);
    };
  }, []);

  if (falta === null) return null;

  return (
    <div role="alertdialog" aria-live="assertive" className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm lg:items-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-borda-forte bg-superficie p-6 motion-safe:animate-entrar">
        <span className="text-[10px] tracking-[0.24em] text-texto-3">SEGURANÇA</span>
        <p className="text-lg font-bold leading-snug">
          Ainda estás aí? A sessão termina daqui a <span className="tabular-nums">{falta}</span> s.
        </p>
        <button
          type="button"
          onClick={() => {
            registarAtividade();
            setFalta(null);
          }}
          className="flex h-12 items-center justify-center rounded bg-texto text-sm font-extrabold tracking-[0.14em] text-tinta font-stretch-125% transition-transform active:scale-[0.97]"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
