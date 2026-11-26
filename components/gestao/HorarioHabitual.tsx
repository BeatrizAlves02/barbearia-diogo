"use client";

import { useState, useTransition } from "react";
import { guardarHorarioHabitual } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { IconeVisto } from "@/components/icones";
import { curta, esticar, minutos, normalizar, paraHora, ULTIMA_MAX, ABRE_MIN, type TurnoSemanal } from "@/lib/horarios";
import { Interruptor, SeletorHora } from "./ControlosHorario";

type Linha = { dia_semana: number; aberto: boolean; abre: string; fecha: string; pausa: boolean; pausa_inicio: string; pausa_fim: string };

const NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0]; // a semana começa à segunda

function paraLinhas(inicial: TurnoSemanal[]): Linha[] {
  return ORDEM.map((dia) => {
    const t = inicial.find((x) => x.dia_semana === dia);
    const abre = curta(t?.abre ?? null) ?? "09:00";
    // horas depois da meia-noite ficam "esticadas" (01:00 → 25:00) para as contas darem certo
    const estica = (h: string | null, def: string, inclusivo = false) => paraHora(esticar(curta(h) ?? def, abre, inclusivo));
    return {
      dia_semana: dia,
      aberto: t?.aberto ?? false,
      abre,
      fecha: estica(t?.fecha ?? null, "19:00"),
      pausa: Boolean(t?.pausa_inicio && t?.pausa_fim),
      pausa_inicio: estica(t?.pausa_inicio ?? null, "13:00"),
      pausa_fim: estica(t?.pausa_fim ?? null, "14:00", true),
    };
  });
}

/** Horário de todas as semanas: dias abertos, horas e pausa */
export function HorarioHabitual({ inicial }: { inicial: TurnoSemanal[] }) {
  const [original, setOriginal] = useState(() => paraLinhas(inicial));
  const [linhas, setLinhas] = useState(original);
  const [erro, setErro] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [aGuardar, iniciar] = useTransition();

  const alterado = JSON.stringify(linhas) !== JSON.stringify(original);

  function mudar(dia: number, alteracao: Partial<Linha>) {
    setGuardado(false);
    setLinhas((ls) =>
      ls.map((l) => {
        if (l.dia_semana !== dia) return l;
        const n = { ...l, ...alteracao };
        // mantém as horas sempre coerentes enquanto se carrega nos botões
        if (minutos(n.fecha) < minutos(n.abre)) n.fecha = n.abre;
        if (minutos(n.fecha) > ULTIMA_MAX) n.fecha = paraHora(ULTIMA_MAX);
        if (n.pausa) {
          if (minutos(n.pausa_inicio) <= minutos(n.abre)) n.pausa_inicio = paraHora(minutos(n.abre) + 30);
          if (minutos(n.pausa_fim) <= minutos(n.pausa_inicio)) n.pausa_fim = paraHora(minutos(n.pausa_inicio) + 30);
        }
        return n;
      })
    );
  }

  function guardar() {
    setErro(null);
    iniciar(async () => {
      const r = await guardarHorarioHabitual(
        linhas.map((l) => ({
          dia_semana: l.dia_semana,
          aberto: l.aberto,
          abre: l.aberto ? l.abre : null,
          fecha: l.aberto ? normalizar(l.fecha) : null,
          pausa_inicio: l.aberto && l.pausa ? normalizar(l.pausa_inicio) : null,
          pausa_fim: l.aberto && l.pausa ? normalizar(l.pausa_fim) : null,
        }))
      );
      if (r.erro) setErro(r.erro);
      else {
        setOriginal(linhas);
        setGuardado(true);
      }
    });
  }

  return (
    <section className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">HORÁRIO HABITUAL</h2>
        <p className="text-sm text-texto-3">
          Hora de abrir – hora da última marcação.
          <br />
          <strong className="font-bold text-texto-2">Vale para todas as semanas.</strong>
        </p>
      </div>

      <ul className="divide-y divide-borda">
        {linhas.map((l) => (
          <li key={l.dia_semana} className={`flex flex-col gap-3 px-5 py-4 transition-colors lg:px-6 ${l.aberto ? "" : "bg-bg/40"}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex w-32 items-center gap-3">
                <Interruptor ligado={l.aberto} onMudar={(v) => mudar(l.dia_semana, { aberto: v })} rotulo={`${NOMES[l.dia_semana]} aberto`} />
                <span className={`text-[15px] font-bold ${l.aberto ? "" : "text-texto-3"}`}>{NOMES[l.dia_semana]}</span>
              </div>

              {l.aberto ? (
                <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
                  <SeletorHora rotulo={`${NOMES[l.dia_semana]}: abre`} valor={l.abre} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => mudar(l.dia_semana, { abre: h })} />
                  <span className="text-texto-3">–</span>
                  <SeletorHora rotulo={`${NOMES[l.dia_semana]}: última marcação`} valor={l.fecha} min={l.abre} max={paraHora(ULTIMA_MAX)} onMudar={(h) => mudar(l.dia_semana, { fecha: h })} />
                  {!l.pausa && (
                    <button
                      type="button"
                      onClick={() => mudar(l.dia_semana, { pausa: true })}
                      className="ml-1 rounded-full border border-dashed border-borda-forte px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-texto-3 transition-[border-color,color,transform] hover:border-texto hover:text-texto active:scale-95"
                    >
                      + PAUSA
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm text-texto-3">Fechado · folga</span>
              )}
            </div>

            {l.aberto && l.pausa && (
              <div className="flex flex-wrap items-center gap-2 pl-0 motion-safe:animate-entrar sm:pl-36">
                <span className="flex w-full items-center justify-between text-[10px] tracking-[0.2em] text-texto-3 sm:w-14">
                  PAUSA
                  <button
                    type="button"
                    aria-label="Tirar pausa"
                    onClick={() => mudar(l.dia_semana, { pausa: false })}
                    className="text-[10px] font-bold tracking-[0.14em] text-texto-3 underline-offset-4 hover:text-texto hover:underline sm:hidden"
                  >
                    TIRAR
                  </button>
                </span>
                <SeletorHora rotulo={`${NOMES[l.dia_semana]}: pausa começa`} valor={l.pausa_inicio} min={paraHora(minutos(l.abre) + 30)} max={paraHora(minutos(l.fecha) - 30)} onMudar={(h) => mudar(l.dia_semana, { pausa_inicio: h })} />
                <span className="text-texto-3">–</span>
                <SeletorHora rotulo={`${NOMES[l.dia_semana]}: pausa acaba`} valor={l.pausa_fim} min={paraHora(minutos(l.pausa_inicio) + 30)} max={l.fecha} onMudar={(h) => mudar(l.dia_semana, { pausa_fim: h })} />
                <button
                  type="button"
                  aria-label="Tirar pausa"
                  onClick={() => mudar(l.dia_semana, { pausa: false })}
                  className="hidden size-9 sm:flex items-center justify-center rounded-full text-texto-3 transition-[background-color,color,transform] hover:bg-superficie-2 hover:text-texto active:scale-90"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t border-borda p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <p className="text-sm empty:hidden sm:min-h-5" aria-live="polite">
          {erro ? (
            <span className="text-red-400">{erro}</span>
          ) : guardado ? (
            <span className="flex items-center gap-2 text-texto motion-safe:animate-entrar">
              <IconeVisto className="size-4" /> Horário guardado.
            </span>
          ) : alterado ? (
            <span className="text-texto-2">Tens alterações por guardar.</span>
          ) : null}
        </p>
        <div className="flex items-center gap-3 max-sm:flex-row-reverse">
          {alterado && (
            <button type="button" onClick={() => setLinhas(original)} className="link-sublinhado text-sm text-texto-2 hover:text-texto">
              Desfazer
            </button>
          )}
          <button
            type="button"
            disabled={!alterado || aGuardar}
            onClick={guardar}
            className={`${classesBotaoPrimario("pequeno")} w-full min-w-44 disabled:pointer-events-none disabled:opacity-40 sm:w-auto`}
          >
            {aGuardar ? "A GUARDAR…" : "GUARDAR HORÁRIO"}
          </button>
        </div>
      </div>
    </section>
  );
}
