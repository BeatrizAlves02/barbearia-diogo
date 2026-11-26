"use client";

import { useState, useTransition } from "react";
import { adicionarFerias, apagarDiaEspecial, apagarFerias, fecharHorasVarios, guardarHorariosDosDias } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { adicionarDias, diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { acrescentarHoras, curta, diaInteiro, minutos, normalizar, paraHora, turnoDoDia, ULTIMA_MAX, ABRE_MIN, type Bloqueio, type TurnoEspecial, type TurnoSemanal } from "@/lib/horarios";
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
    aberto: "Num dia aberto, estas horas são acrescentadas às que já tens. Numa folga, abres a estas horas.",
  };

  // O Diogo trabalha nesse dia? (horário habitual + dias mudados + feriados + férias de dia inteiro)
  const deFerias = (d: string) => bloqueios.some((b) => diaInteiro(b) && diaEmLisboa(b.inicio) <= d && d < diaEmLisboa(b.fim));
  const trabalha = (d: string) => turnoDoDia(d, semanal, especiais).aberto && !deFerias(d);
  // ABRIR: qualquer dia (abre uma folga ou muda as horas de um dia aberto), menos dias de férias
  //        (para esses, apaga primeiro as férias na lista em baixo).
  // FECHAR: só dias em que está aberto.
  const desativar = (d: string) => (escolha === "aberto" ? deFerias(d) : !trabalha(d));

  function mudarEscolha(novoAberto: boolean, novoSoHoras: boolean) {
    setAberto(novoAberto);
    setSoHoras(novoSoHoras);
    setErro(null);
    // tira os dias que deixaram de fazer sentido (ex.: estava a fechar e passou a abrir)
    setDias((ds) => ds.filter((d) => (novoAberto ? !deFerias(d) : trabalha(d))));
  }

  // ABRIR / MUDAR: como fica cada dia escolhido
  const planos =
    escolha === "aberto"
      ? dias.map((d) => {
          const t = turnoDoDia(d, semanal, especiais);
          if (t.aberto && t.abre && t.fecha) {
            const j = acrescentarHoras(t, abre, fecha);
            return {
              dia: d,
              antes: `${curta(t.abre)} – ${curta(t.fecha)}`,
              depois: `${j.turno.abre} – ${j.turno.fecha}`,
              turno: j.turno,
              buraco: j.buraco,
            };
          }
          const turno = { aberto: true, abre, fecha: normalizar(fecha), pausa_inicio: null, pausa_fim: null };
          return { dia: d, antes: null, depois: `${turno.abre} – ${turno.fecha}`, turno, buraco: null };
        })
      : [];
  const todosAbertos = planos.length > 0 && planos.every((p) => p.antes);
  const buraco = planos.find((p) => p.buraco)?.buraco;

  function guardar() {
    setErro(null);
    iniciar(async () => {
      let r =
        escolha === "aberto"
          ? await guardarHorariosDosDias(planos.map((p) => ({ dia: p.dia, turno: p.turno })))
          : escolha === "horas"
            ? await fecharHorasVarios(dias, de, ate)
            : await adicionarFerias(dias, mensagem);
      // horas a mais com um intervalo pelo meio → esse intervalo fica fechado (como o Diogo espera)
      if (!r.erro && escolha === "aberto")
        for (const p of planos)
          if (p.buraco && minutos(p.buraco[1]) > minutos(p.buraco[0])) {
            r = await fecharHorasVarios([p.dia], p.buraco[0], p.buraco[1]);
            if (r.erro) break;
          }
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
        ? `Aberto · ${formatarHora(curta(d.abre) ?? "")} – ${formatarHora(curta(d.fecha) ?? "")}`
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
        <p className="text-sm text-texto-3">Fecha dias, abre folgas ou muda as horas só de alguns dias.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">1. O QUE QUERES FAZER?</span>
          <Alternador
            valor={aberto ? "aberto" : "fechado"}
            onMudar={(v) => mudarEscolha(v === "aberto", soHoras)}
            opcoes={[
              { valor: "fechado", rotulo: "FECHAR" },
              { valor: "aberto", rotulo: "ABRIR / MUDAR" },
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
          dica={escolha === "aberto" ? "Folgas ou dias para mudar as horas" : "Só dias em que estás aberto"}
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
          <div className="flex flex-col gap-1.5 motion-safe:animate-entrar">
            <span className="text-[10px] tracking-[0.22em] text-texto-3">
              {todosAbertos ? "3. HORAS A MAIS (DAS · ÚLTIMA MARCAÇÃO)" : "3. HORAS (ABRE · ÚLTIMA MARCAÇÃO)"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <SeletorHora rotulo="Abre" valor={abre} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => { setAbre(h); if (minutos(fecha) < minutos(h)) setFecha(h); }} />
              <span className="text-texto-3">–</span>
              <SeletorHora rotulo="Última marcação" valor={fecha} min={abre} max={paraHora(ULTIMA_MAX)} onMudar={setFecha} />
            </div>
          </div>
        )}

        {/* Como vai ficar cada dia */}
        {aberto && planos.length > 0 && (
          <ul className="flex flex-col divide-y divide-borda rounded border border-borda-forte bg-bg text-sm motion-safe:animate-entrar">
            {planos.slice(0, 4).map((p) => (
              <li key={p.dia} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="font-bold">{formatarDiaCurto(p.dia)}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="text-texto-3">{p.antes ?? "Fechado"}</span>
                  <span className="text-texto-3">→</span>
                  <span className="font-bold">{p.depois}</span>
                </span>
              </li>
            ))}
            {planos.length > 4 && <li className="px-4 py-2.5 text-texto-3">e mais {planos.length - 4} dias…</li>}
          </ul>
        )}
        {aberto && buraco && (
          <p className="text-sm text-texto-2 motion-safe:animate-entrar">
            Entre as {buraco[0]} e as {buraco[1]} fica fechado (ninguém marca nesse intervalo).
          </p>
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
