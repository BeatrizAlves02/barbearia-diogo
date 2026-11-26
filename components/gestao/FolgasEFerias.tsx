"use client";

import { useState, useTransition } from "react";
import { adicionarFerias, apagarDiaEspecial, apagarFerias, fecharHorasVarios, guardarHorariosDosDias } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { adicionarDias, diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { acrescentarHoras, curta, diaInteiro, esticar, minutos, normalizar, paraHora, turnoDoDia, ULTIMA_MAX, ABRE_MIN, type Bloqueio, type TurnoEspecial, type TurnoSemanal } from "@/lib/horarios";
import { feriado } from "@/lib/feriados";
import { Alternador, SeletorData, SeletorHora } from "./ControlosHorario";

/*
  Quatro escolhas, sempre com a mesma lógica:
   FECHAR · O DIA TODO     → dias em que trabalha  → ninguém marca (férias/folga, com mensagem opcional)
   FECHAR · SÓ UMAS HORAS  → dias em que trabalha  → fecha das X às Y
   ABRIR  · O DIA TODO     → dias em que NÃO trabalha (folgas, feriados) → abre das X às Y
   ABRIR  · SÓ UMAS HORAS  → dias em que trabalha  → horas a mais, juntam-se ao horário do dia
*/
type Escolha = "fecharDia" | "fecharHoras" | "abrirDia" | "abrirHoras";

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
  const [abrir, setAbrir] = useState(false);
  const [soHoras, setSoHoras] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [de, setDe] = useState("14:00"); // fechar umas horas
  const [ate, setAte] = useState("16:00");
  const [abre, setAbre] = useState("09:00"); // abrir (dia todo ou horas a mais)
  const [fecha, setFecha] = useState("19:00");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  // Horário "normal" (o mais comum na semana) → usado para abrir um dia todo sem ter de escolher horas
  const normal = (() => {
    const contagem = new Map<string, { n: number; t: TurnoSemanal }>();
    for (const t of semanal)
      if (t.aberto && t.abre && t.fecha) {
        const k = `${curta(t.abre)}|${curta(t.fecha)}|${curta(t.pausa_inicio)}|${curta(t.pausa_fim)}`;
        contagem.set(k, { n: (contagem.get(k)?.n ?? 0) + 1, t });
      }
    const t = [...contagem.values()].sort((a, b) => b.n - a.n)[0]?.t;
    return {
      aberto: true,
      abre: curta(t?.abre ?? null) ?? "09:00",
      fecha: curta(t?.fecha ?? null) ?? "19:00",
      pausa_inicio: curta(t?.pausa_inicio ?? null),
      pausa_fim: curta(t?.pausa_fim ?? null),
    };
  })();

  const escolha: Escolha = abrir ? (soHoras ? "abrirHoras" : "abrirDia") : soHoras ? "fecharHoras" : "fecharDia";
  const n = dias.length;
  const nesses = n > 1 ? "nestes dias" : "neste dia";
  const ajuda: Record<Escolha, string> = {
    fecharDia: `Ninguém pode marcar ${nesses}.`,
    fecharHoras: "Ninguém pode marcar entre estas horas. O resto do dia fica normal.",
    abrirDia: `Abres ${nesses} com o teu horário normal (${normal.abre} às ${normal.fecha}).`,
    abrirHoras: "Estas horas juntam-se ao horário que já tens nesse dia.",
  };

  // O Diogo trabalha nesse dia? (horário habitual + dias mudados + feriados + férias de dia inteiro)
  const deFerias = (d: string) => bloqueios.some((b) => diaInteiro(b) && diaEmLisboa(b.inicio) <= d && d < diaEmLisboa(b.fim));
  const trabalha = (d: string) => turnoDoDia(d, semanal, especiais).aberto && !deFerias(d);
  // Só se escolhem os dias que fazem sentido (os de férias, para abrir, apagam-se primeiro na lista)
  const serve = (e: Escolha, d: string) => (e === "abrirDia" ? !trabalha(d) && !deFerias(d) : trabalha(d));

  /** Horas a mais: começam logo a seguir à última marcação desse dia (ex.: 19:00 → das 20:00 às 21:00) */
  function horasAMaisDe(d: string) {
    const t = turnoDoDia(d, semanal, especiais);
    if (!t.abre || !t.fecha) return;
    const fim = esticar(curta(t.fecha)!, curta(t.abre)!);
    const inicio = Math.min(fim + 60, ULTIMA_MAX);
    setAbre(paraHora(inicio));
    setFecha(paraHora(Math.min(inicio + 60, ULTIMA_MAX)));
  }

  function mudarEscolha(novoAbrir: boolean, novoSoHoras: boolean) {
    const nova: Escolha = novoAbrir ? (novoSoHoras ? "abrirHoras" : "abrirDia") : novoSoHoras ? "fecharHoras" : "fecharDia";
    setAbrir(novoAbrir);
    setSoHoras(novoSoHoras);
    setErro(null);
    // tira os dias que deixaram de fazer sentido
    const ficam = dias.filter((d) => serve(nova, d));
    setDias(ficam);
    if (nova === "abrirHoras" && ficam.length) horasAMaisDe(ficam[0]);
  }

  // ABRIR: como fica cada dia escolhido
  const planos = abrir
    ? dias.map((d) => {
        const t = turnoDoDia(d, semanal, especiais);
        if (escolha === "abrirHoras" && t.aberto && t.abre && t.fecha) {
          const j = acrescentarHoras(t, abre, fecha);
          return {
            dia: d,
            // com intervalo pelo meio: "09:00 – 19:00 e 23:00 – 03:00"
            fica: j.buraco ? `${curta(t.abre)} – ${curta(t.fecha)} e ${abre} – ${normalizar(fecha)}` : `${j.turno.abre} – ${j.turno.fecha}`,
            turno: j.turno,
            buraco: j.buraco,
          };
        }
        // abrir o dia todo → horário normal; horas a mais num dia fechado → só essas horas
        const turno =
          escolha === "abrirDia" ? normal : { aberto: true, abre, fecha: normalizar(fecha), pausa_inicio: null, pausa_fim: null };
        return { dia: d, fica: `${turno.abre} – ${turno.fecha}`, turno, buraco: null as [string, string] | null };
      })
    : [];

  function guardar() {
    setErro(null);
    iniciar(async () => {
      let r = abrir
        ? await guardarHorariosDosDias(planos.map((p) => ({ dia: p.dia, turno: p.turno })))
        : soHoras
          ? await fecharHorasVarios(dias, de, ate)
          : await adicionarFerias(dias, mensagem);
      // horas a mais com um intervalo pelo meio → esse intervalo fica fechado
      if (!r.erro && abrir)
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

  const rotuloHora = "w-9 text-[11px] font-bold tracking-[0.14em] text-texto-3";

  return (
    <section style={{ animationDelay: "80ms" }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">FOLGAS E FÉRIAS</h2>
        <p className="text-sm text-texto-3">Fecha dias, abre folgas ou acrescenta horas.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">1. O QUE QUERES FAZER?</span>
          <Alternador
            valor={abrir ? "abrir" : "fechar"}
            onMudar={(v) => mudarEscolha(v === "abrir", soHoras)}
            opcoes={[
              { valor: "fechar", rotulo: "FECHAR" },
              { valor: "abrir", rotulo: "ABRIR" },
            ]}
          />
        </div>
        <Alternador
          valor={soHoras ? "horas" : "dia"}
          onMudar={(v) => mudarEscolha(abrir, v === "horas")}
          opcoes={[
            { valor: "dia", rotulo: "O DIA TODO" },
            { valor: "horas", rotulo: "SÓ UMAS HORAS" },
          ]}
        />

        <SeletorData
          key={escolha}
          modo="varios"
          rotulo="2. DIAS (TOCA OU ARRASTA)"
          dias={dias}
          min={hoje}
          onMudar={(ds) => {
            // horas a mais: ao escolher o 1.º dia, as horas começam a seguir à última marcação dele
            if (escolha === "abrirHoras" && !dias.length && ds.length) horasAMaisDe(ds[0]);
            setDias(ds);
            setErro(null);
          }}
          etiqueta={(d) => feriado(d)?.nome}
          desativar={(d) => !serve(escolha, d)}
          dica={escolha === "abrirDia" ? "Só dias em que estás fechado" : "Só dias em que estás aberto"}
        />

        {escolha === "fecharHoras" && (
          <div className="flex flex-wrap items-center gap-2 motion-safe:animate-entrar">
            <span className={rotuloHora}>DAS</span>
            <SeletorHora rotulo="Fechado das" valor={de} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => { setDe(h); if (minutos(ate) <= minutos(h)) setAte(paraHora(minutos(h) + 30)); }} />
            <span className={`${rotuloHora} w-auto px-1`}>ÀS</span>
            <SeletorHora rotulo="Fechado até às" valor={ate} min={paraHora(minutos(de) + 30)} max="24:00" onMudar={setAte} />
          </div>
        )}

        {escolha === "fecharDia" && (
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

        {escolha === "abrirHoras" && (
          <div className="flex flex-col gap-1.5 motion-safe:animate-entrar">
            <span className="text-[10px] tracking-[0.22em] text-texto-3">HORAS A MAIS</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={rotuloHora}>DAS</span>
              <SeletorHora rotulo="Abre às" valor={abre} min={paraHora(ABRE_MIN)} max="23:30" onMudar={(h) => { setAbre(h); if (minutos(fecha) < minutos(h)) setFecha(h); }} />
              <span className={`${rotuloHora} w-auto px-1`}>ÀS</span>
              <SeletorHora rotulo="Última marcação às" valor={fecha} min={abre} max={paraHora(ULTIMA_MAX)} onMudar={setFecha} />
            </div>
          </div>
        )}

        <p key={`${escolha}${n > 1}`} className="text-sm text-texto-2 motion-safe:animate-entrar">
          {ajuda[escolha]}
          {escolha === "abrirHoras" && " A segunda hora é a da última marcação."}
        </p>

        {/* Como vai ficar cada dia (texto simples) */}
        {escolha === "abrirHoras" && planos.length > 0 && (
          <div className="flex flex-col gap-0.5 text-sm text-texto-3 motion-safe:animate-entrar">
            {planos.slice(0, 4).map((p) => (
              <span key={p.dia} className="tabular-nums">
                {formatarDiaCurto(p.dia)}: fica aberto das <span className="text-texto-2">{p.fica.replaceAll(" – ", " às ")}</span>
              </span>
            ))}
            {planos.length > 4 && <span>e mais {planos.length - 4} dias…</span>}
          </div>
        )}

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
