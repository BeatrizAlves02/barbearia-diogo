"use client";

import { useState, useTransition } from "react";
import { apagarDiaEspecial, guardarDiaEspecial } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { formatarDiaCurto } from "@/lib/datas";
import { curta, minutos, paraHora, type TurnoEspecial } from "@/lib/horarios";
import { Alternador, CampoData, SeletorHora } from "./ControlosHorario";

/** Dias com horário diferente do habitual: abrir numa folga, fechar um dia, ou mudar as horas */
export function DiasEspeciais({ lista, hoje }: { lista: TurnoEspecial[]; hoje: string }) {
  const [dia, setDia] = useState("");
  const [modo, setModo] = useState<"fechado" | "aberto">("fechado");
  const [abre, setAbre] = useState("09:00");
  const [fecha, setFecha] = useState("19:00");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  function guardar() {
    setErro(null);
    iniciar(async () => {
      const r = await guardarDiaEspecial(dia, {
        aberto: modo === "aberto",
        abre: modo === "aberto" ? abre : null,
        fecha: modo === "aberto" ? fecha : null,
        pausa_inicio: null,
        pausa_fim: null,
      });
      if (r.erro) setErro(r.erro);
      else setDia("");
    });
  }

  return (
    <section style={{ animationDelay: "80ms" }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">DIAS ESPECIAIS</h2>
        <p className="text-sm text-texto-3">Abrir num dia de folga, fechar um dia ou mudar só o horário desse dia.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <CampoData rotulo="DIA" valor={dia} min={hoje} onMudar={setDia} />
        <Alternador
          valor={modo}
          onMudar={setModo}
          opcoes={[
            { valor: "fechado", rotulo: "FECHADO" },
            { valor: "aberto", rotulo: "ABERTO" },
          ]}
        />
        {modo === "aberto" && (
          <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
            <SeletorHora rotulo="Abre" valor={abre} max="23:30" onMudar={(h) => { setAbre(h); if (minutos(fecha) <= minutos(h)) setFecha(paraHora(minutos(h) + 30)); }} />
            <span className="text-texto-3">–</span>
            <SeletorHora rotulo="Fecha" valor={fecha} min={paraHora(minutos(abre) + 30)} onMudar={setFecha} />
          </div>
        )}
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="button"
          disabled={!dia || aGuardar}
          onClick={guardar}
          className={`${classesBotaoPrimario("pequeno")} disabled:pointer-events-none disabled:opacity-40`}
        >
          {aGuardar ? "A GUARDAR…" : "GUARDAR DIA"}
        </button>
      </div>

      {lista.length > 0 && (
        <ul className="divide-y divide-borda border-t border-borda">
          {lista.map((d) => (
            <ItemDia key={d.data} d={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemDia({ d }: { d: TurnoEspecial }) {
  const [aApagar, iniciar] = useTransition();
  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-3.5 motion-safe:animate-entrar lg:px-6 ${aApagar ? "opacity-50" : ""}`}>
      <span className="flex flex-col">
        <span className="text-[15px] font-bold">{formatarDiaCurto(d.data)}</span>
        <span className="text-sm text-texto-3">
          {d.aberto ? `Aberto · ${formatarHora(curta(d.abre) ?? "")} – ${formatarHora(curta(d.fecha) ?? "")}` : "Fechado"}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Apagar ${formatarDiaCurto(d.data)}`}
        disabled={aApagar}
        onClick={() => iniciar(async () => void (await apagarDiaEspecial(d.data)))}
        className="flex h-9 items-center rounded-full border border-borda-forte px-3 text-[11px] font-bold tracking-[0.12em] text-texto-2 transition-[background-color,color,border-color,transform] hover:border-red-400 hover:bg-red-400 hover:text-tinta active:scale-95"
      >
        APAGAR
      </button>
    </li>
  );
}
