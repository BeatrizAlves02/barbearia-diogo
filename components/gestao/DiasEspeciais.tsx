"use client";

import { useState, useTransition } from "react";
import { apagarDiaEspecial, apagarFerias, fecharHoras, guardarDiaEspecial } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { curta, minutos, paraHora, type Bloqueio, type TurnoEspecial } from "@/lib/horarios";
import { Alternador, SeletorData, SeletorHora } from "./ControlosHorario";

type Escolha = "dia" | "horas" | "aberto";

const AJUDA: Record<Escolha, string> = {
  dia: "Ninguém pode marcar neste dia.",
  horas: "Ninguém pode marcar entre estas horas. O resto do dia fica normal.",
  aberto: "Neste dia trabalhas a estas horas (mesmo que seja dia de folga).",
};

/** Mudar só um dia: fechar o dia todo, fechar umas horas, ou abrir com outro horário */
export function DiasEspeciais({ lista, horasFechadas, hoje }: { lista: TurnoEspecial[]; horasFechadas: Bloqueio[]; hoje: string }) {
  const [dia, setDia] = useState("");
  const [aberto, setAberto] = useState(false);
  const [soHoras, setSoHoras] = useState(false);
  const [abre, setAbre] = useState("09:00");
  const [fecha, setFecha] = useState("19:00");
  const [de, setDe] = useState("14:00");
  const [ate, setAte] = useState("16:00");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();
  const escolha: Escolha = aberto ? "aberto" : soHoras ? "horas" : "dia";

  function guardar() {
    setErro(null);
    iniciar(async () => {
      const r =
        escolha === "horas"
          ? await fecharHoras(dia, de, ate)
          : await guardarDiaEspecial(dia, {
              aberto,
              abre: aberto ? abre : null,
              fecha: aberto ? fecha : null,
              pausa_inicio: null,
              pausa_fim: null,
            });
      if (r.erro) setErro(r.erro);
      else setDia("");
    });
  }

  // Lista única, por data: dias mudados + horas fechadas
  const fimTexto = (iso: string) => (horaEmLisboa(iso) === "00:00" ? "24:00" : horaEmLisboa(iso));
  const itens = [
    ...lista.map((d) => ({
      chave: `d${d.data}`,
      data: d.data,
      texto: d.aberto ? `Aberto · ${formatarHora(curta(d.abre) ?? "")} – ${formatarHora(curta(d.fecha) ?? "")}` : "Fechado o dia todo",
      apagar: () => apagarDiaEspecial(d.data),
    })),
    ...horasFechadas.map((b) => ({
      chave: `b${b.id}`,
      data: diaEmLisboa(b.inicio),
      texto: `Fechado das ${horaEmLisboa(b.inicio)} às ${fimTexto(b.fim)}`,
      apagar: () => apagarFerias(b.id),
    })),
  ].sort((x, y) => x.data.localeCompare(y.data));

  return (
    <section style={{ animationDelay: "80ms" }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">DIAS ESPECIAIS</h2>
        <p className="text-sm text-texto-3">Muda o horário só de um dia.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <SeletorData modo="dia" rotulo="1. DIA" valor={dia} min={hoje} onMudar={setDia} />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">2. NESSE DIA ESTÁS…</span>
          <Alternador
            valor={aberto ? "aberto" : "fechado"}
            onMudar={(v) => setAberto(v === "aberto")}
            opcoes={[
              { valor: "fechado", rotulo: "FECHADO" },
              { valor: "aberto", rotulo: "ABERTO" },
            ]}
          />
        </div>

        {!aberto && (
          <div className="ml-1 flex flex-col gap-3 border-l-2 border-borda-forte pl-4 motion-safe:animate-entrar">
            <span className="text-[10px] tracking-[0.22em] text-texto-3">FECHADO…</span>
            <Alternador
              valor={soHoras ? "horas" : "dia"}
              onMudar={(v) => setSoHoras(v === "horas")}
              opcoes={[
                { valor: "dia", rotulo: "O DIA TODO" },
                { valor: "horas", rotulo: "SÓ UMAS HORAS" },
              ]}
            />
            {soHoras && (
              <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
                <span className="w-9 text-[11px] font-bold tracking-[0.14em] text-texto-3">DAS</span>
                <SeletorHora rotulo="Fechado das" valor={de} max="23:00" onMudar={(h) => { setDe(h); if (minutos(ate) <= minutos(h)) setAte(paraHora(minutos(h) + 30)); }} />
                <span className="px-1 text-[11px] font-bold tracking-[0.14em] text-texto-3">ÀS</span>
                <SeletorHora rotulo="Fechado até às" valor={ate} min={paraHora(minutos(de) + 30)} max="23:30" onMudar={setAte} />
              </div>
            )}
          </div>
        )}

        {aberto && (
          <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
            <SeletorHora rotulo="Abre" valor={abre} max="23:00" onMudar={(h) => { setAbre(h); if (minutos(fecha) < minutos(h)) setFecha(h); }} />
            <span className="text-texto-3">–</span>
            <SeletorHora rotulo="Última marcação" valor={fecha} min={abre} onMudar={setFecha} />
          </div>
        )}

        <p key={escolha} className="text-sm text-texto-2 motion-safe:animate-entrar">{AJUDA[escolha]}</p>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="button"
          disabled={!dia || aGuardar}
          onClick={guardar}
          className={`${classesBotaoPrimario("pequeno")} disabled:pointer-events-none disabled:opacity-40`}
        >
          {aGuardar ? "A GUARDAR…" : !dia ? "ESCOLHE UM DIA" : "GUARDAR"}
        </button>
      </div>

      {itens.length > 0 && (
        <ul className="divide-y divide-borda border-t border-borda">
          {itens.map((i) => (
            <Item key={i.chave} dia={i.data} texto={i.texto} apagar={i.apagar} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Item({ dia, texto, apagar }: { dia: string; texto: string; apagar: () => Promise<unknown> }) {
  const [aApagar, iniciar] = useTransition();
  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-3.5 motion-safe:animate-entrar lg:px-6 ${aApagar ? "opacity-50" : ""}`}>
      <span className="flex flex-col">
        <span className="text-[15px] font-bold">{formatarDiaCurto(dia)}</span>
        <span className="text-sm text-texto-3">{texto}</span>
      </span>
      <button
        type="button"
        aria-label={`Apagar ${formatarDiaCurto(dia)}`}
        disabled={aApagar}
        onClick={() => iniciar(async () => void (await apagar()))}
        className="flex h-9 items-center rounded-full border border-borda-forte px-3 text-[11px] font-bold tracking-[0.12em] text-texto-2 transition-[background-color,color,border-color,transform] hover:border-red-400 hover:bg-red-400 hover:text-tinta active:scale-95"
      >
        APAGAR
      </button>
    </li>
  );
}
