"use client";

import { useState, useTransition } from "react";
import { abrirDias, adicionarFerias, apagarDiaEspecial, apagarFerias, fecharHorasVarios } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { adicionarDias, diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { curta, diaInteiro, minutos, normalizar, paraHora, turnoDoDia, ULTIMA_MAX, ABRE_MIN, type Bloqueio, type TurnoEspecial, type TurnoSemanal } from "@/lib/horarios";
import { feriado } from "@/lib/feriados";
import { Alternador, SeletorData, SeletorHora } from "./ControlosHorario";

type Escolha = "dia" | "horas" | "aberto";

/**
 * Tudo o que muda o horário habitual num ou mais dias:
 * fechar (folga, férias), fechar só umas horas, ou abrir com outro horário.
 */
export function FolgasEFerias({
  semanal,
  especiais,
  bloqueios,
  hoje,
}: {
  semanal: TurnoSemanal[];
  especiais: TurnoEspecial[];
  bloqueios: Bloqueio[];
  hoje: string;
}) {
  const [dias, setDias] = useState<string[]>([]);
  const [aberto, setAberto] = useState(false);
  const [soHoras, setSoHoras] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [abre, setAbre] = useState("09:00");
  const [fecha, setFecha] = useState("19:00");
  const [de, setDe] = useState("14:00");
  const [ate, setAte] = useState("16:00");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  const escolha: Escolha = aberto ? "aberto" : soHoras ? "horas" : "dia";
  const n = dias.length;
  const nesses = n > 1 ? "nestes dias" : "neste dia";
  const ajuda: Record<Escolha, string> = {
    dia: `Ninguém pode marcar ${nesses}.`,
    horas: `Ninguém pode marcar entre estas horas. O resto do dia fica normal.`,
    aberto: `${n > 1 ? "Nestes dias" : "Neste dia"} trabalhas a estas horas.`,
  };

  // O Diogo trabalha nesse dia? (horário habitual + dias mudados + feriados + férias de dia inteiro)
  const deFerias = (d: string) => bloqueios.some((b) => diaInteiro(b) && diaEmLisboa(b.inicio) <= d && d < diaEmLisboa(b.fim));
  const trabalha = (d: string) => turnoDoDia(d, semanal, especiais).aberto && !deFerias(d);
  // Só se pode ABRIR um dia que está fechado, e FECHAR um dia que está aberto.
  // (Dias de férias já marcadas: para abrir, apaga primeiro as férias na lista em baixo.)
  const desativar = (d: string) => (escolha === "aberto" ? trabalha(d) || deFerias(d) : !trabalha(d));

  function mudarEscolha(novoAberto: boolean, novoSoHoras: boolean) {
    setAberto(novoAberto);
    setSoHoras(novoSoHoras);
    setErro(null);
    // tira os dias que deixaram de fazer sentido (ex.: estava a fechar e passou a abrir)
    setDias((ds) => ds.filter((d) => (novoAberto ? !trabalha(d) && !deFerias(d) : trabalha(d))));
  }

  function guardar() {
    setErro(null);
    iniciar(async () => {
      const r =
        escolha === "aberto"
          ? await abrirDias(dias, { aberto: true, abre, fecha: normalizar(fecha), pausa_inicio: null, pausa_fim: null })
          : escolha === "horas"
            ? await fecharHorasVarios(dias, de, ate)
            : await adicionarFerias(dias, mensagem);
      if (r.erro) setErro(r.erro);
      else {
        setDias([]);
        setMensagem("");
      }
    });
  }

  // Lista única, por data
  const fimTexto = (iso: string) => (horaEmLisboa(iso) === "00:00" ? "24:00" : horaEmLisboa(iso));
  const itens = [
    ...especiais.map((d) => ({
      chave: `d${d.data}`,
      data: d.data,
      titulo: formatarDiaCurto(d.data),
      texto: d.aberto
        ? `Aberto · ${formatarHora(curta(d.abre) ?? "")} – ${formatarHora(curta(d.fecha) ?? "")}${(curta(d.fecha) ?? "") < (curta(d.abre) ?? "") ? " (dia seguinte)" : ""}`
        : "Fechado o dia todo",
      apagar: () => apagarDiaEspecial(d.data),
    })),
    ...bloqueios.map((b) => {
      const primeiro = diaEmLisboa(b.inicio);
      if (!diaInteiro(b))
        return {
          chave: `b${b.id}`,
          data: primeiro,
          titulo: formatarDiaCurto(primeiro),
          texto: `Fechado das ${horaEmLisboa(b.inicio)} às ${fimTexto(b.fim)}`,
          apagar: () => apagarFerias(b.id),
        };
      const ultimo = adicionarDias(diaEmLisboa(b.fim), -1);
      return {
        chave: `b${b.id}`,
        data: primeiro,
        titulo: primeiro === ultimo ? formatarDiaCurto(primeiro) : `${formatarDiaCurto(primeiro)} → ${formatarDiaCurto(ultimo)}`,
        texto: b.motivo ? `Fechado · “${b.motivo}”` : "Fechado o dia todo",
        apagar: () => apagarFerias(b.id),
      };
    }),
  ].sort((x, y) => x.data.localeCompare(y.data));

  return (
    <section style={{ animationDelay: "80ms" }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">FOLGAS E FÉRIAS</h2>
        <p className="text-sm text-texto-3">Fecha dias em que trabalhas, ou abre dias em que estás fechado.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">1. O QUE QUERES FAZER?</span>
          <Alternador
            valor={aberto ? "aberto" : "fechado"}
            onMudar={(v) => mudarEscolha(v === "aberto", soHoras)}
            opcoes={[
              { valor: "fechado", rotulo: "FECHAR" },
              { valor: "aberto", rotulo: "ABRIR" },
            ]}
          />
        </div>

        {!aberto && (
          <Alternador
            valor={soHoras ? "horas" : "dia"}
            onMudar={(v) => mudarEscolha(false, v === "horas")}
            opcoes={[
              { valor: "dia", rotulo: "O DIA TODO" },
              { valor: "horas", rotulo: "SÓ UMAS HORAS" },
            ]}
          />
        )}

        <SeletorData
          key={escolha === "aberto" ? "abrir" : "fechar"}
          modo="varios"
          rotulo="2. DIAS (TOCA OU ARRASTA)"
          dias={dias}
          min={hoje}
          onMudar={(ds) => {
            setDias(ds);
            setErro(null);
          }}
          etiqueta={(d) => feriado(d)?.nome}
          desativar={desativar}
          dica={escolha === "aberto" ? "Só dias em que estás fechado" : "Só dias em que estás aberto"}
        />

        {!aberto && (
          <div className="flex flex-col gap-3">
            {soHoras ? (
              <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
                <span className="w-9 text-[11px] font-bold tracking-[0.14em] text-texto-3">DAS</span>
                <SeletorHora rotulo="Fechado das" valor={de} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => { setDe(h); if (minutos(ate) <= minutos(h)) setAte(paraHora(minutos(h) + 30)); }} />
                <span className="px-1 text-[11px] font-bold tracking-[0.14em] text-texto-3">ÀS</span>
                <SeletorHora rotulo="Fechado até às" valor={ate} min={paraHora(minutos(de) + 30)} max="24:00" onMudar={setAte} />
              </div>
            ) : (
              <label className="flex flex-col gap-1.5 motion-safe:animate-entrar">
                <span className="text-[10px] tracking-[0.22em] text-texto-3">MENSAGEM PARA OS CLIENTES (OPCIONAL)</span>
                <input
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  maxLength={60}
                  placeholder="ex.: Férias de verão"
                  className="h-11 rounded border border-borda-forte bg-bg px-3 text-sm outline-none transition-colors placeholder:text-desativado focus:border-texto"
                />
              </label>
            )}
          </div>
        )}

        {aberto && (
          <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
            <SeletorHora rotulo="Abre" valor={abre} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => { setAbre(h); if (minutos(fecha) < minutos(h)) setFecha(h); }} />
            <span className="text-texto-3">–</span>
            <SeletorHora rotulo="Última marcação" valor={fecha} min={abre} max={paraHora(ULTIMA_MAX)} onMudar={setFecha} />
          </div>
        )}

        <p key={`${escolha}${n > 1}`} className="text-sm text-texto-2 motion-safe:animate-entrar">{ajuda[escolha]}</p>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="button"
          disabled={!n || aGuardar}
          onClick={guardar}
          className={`${classesBotaoPrimario("pequeno")} disabled:pointer-events-none disabled:opacity-40`}
        >
          {aGuardar ? "A GUARDAR…" : !n ? "ESCOLHE OS DIAS" : `GUARDAR ${n} ${n === 1 ? "DIA" : "DIAS"}`}
        </button>
      </div>

      {itens.length > 0 && (
        <ul className="divide-y divide-borda border-t border-borda">
          {itens.map((i) => (
            <Item key={i.chave} titulo={i.titulo} texto={i.texto} apagar={i.apagar} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Item({ titulo, texto, apagar }: { titulo: string; texto: string; apagar: () => Promise<unknown> }) {
  const [aApagar, iniciar] = useTransition();
  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-3.5 motion-safe:animate-entrar lg:px-6 ${aApagar ? "opacity-50" : ""}`}>
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-bold">{titulo}</span>
        <span className="truncate text-sm text-texto-3">{texto}</span>
      </span>
      <button
        type="button"
        aria-label={`Apagar ${titulo}`}
        disabled={aApagar}
        onClick={() => iniciar(async () => void (await apagar()))}
        className="flex h-9 shrink-0 items-center rounded-full border border-borda-forte px-3 text-[11px] font-bold tracking-[0.12em] text-texto-2 transition-[background-color,color,border-color,transform] hover:border-red-400 hover:bg-red-400 hover:text-tinta active:scale-95"
      >
        APAGAR
      </button>
    </li>
  );
}
