"use client";

import { useEffect, useState, useTransition } from "react";
import { adicionarFerias, apagarDiaEspecial, apagarFerias, fecharHorasVarios, guardarHorariosDosDias } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarHora } from "@/lib/formatar";
import { adicionarDias, diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { acrescentarHoras, curta, diaInteiro, esticar, minutos, normalizar, paraHora, turnoDoDia, ULTIMA_MAX, ABRE_MIN, type Bloqueio, type TurnoEspecial, type TurnoSemanal } from "@/lib/horarios";
import { feriado } from "@/lib/feriados";
import { Alternador, SeletorData, SeletorHora } from "./ControlosHorario";
import { Dobravel } from "./Dobravel";

/*
  Quatro escolhas, sempre com a mesma lógica:
   FECHAR · O DIA TODO     → dias em que trabalha  → ninguém marca (férias/folga, com mensagem opcional)
   FECHAR · SÓ UMAS HORAS  → dias em que trabalha  → fecha das X às Y
   ABRIR  · O DIA TODO     → dias em que NÃO trabalha (folgas, feriados) → abre das X às Y
   ABRIR  · SÓ UMAS HORAS  → dias em que trabalha  → horas a mais, juntam-se ao horário do dia
*/
type Escolha = "fecharDia" | "fecharHoras" | "abrirDia" | "abrirHoras";

export function FolgasEFerias({
  tipo,
  semanal,
  especiais,
  bloqueios,
  hoje,
  marcacoes = [],
}: {
  tipo: "fechar" | "abrir"; // cada um tem a sua caixa
  semanal: TurnoSemanal[];
  especiais: TurnoEspecial[];
  bloqueios: Bloqueio[];
  hoje: string;
  marcacoes?: { id: string; inicio: string; fim: string; cliente_nome: string }[]; // marcações futuras (para avisar antes de fechar)
}) {
  const [dias, setDias] = useState<string[]>([]);
  const [confirmar, setConfirmar] = useState(false); // já viu o aviso das marcações e quer fechar na mesma
  const abrir = tipo === "abrir";
  const [soHoras, setSoHoras] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [deSel, setDe] = useState("14:00"); // fechar umas horas
  const [ateSel, setAte] = useState("16:00");
  const [abreSel, setAbre] = useState("09:00"); // horas a mais
  const [fechaSel, setFecha] = useState("19:00");

  // Hora atual em Lisboa (em minutos), atualizada a cada minuto → hoje não se escolhem horas que já passaram
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const ver = () => setAgora(minutos(horaEmLisboa(new Date().toISOString())));
    const primeiro = setTimeout(ver, 0);
    const id = setInterval(ver, 60_000);
    return () => {
      clearTimeout(primeiro);
      clearInterval(id);
    };
  }, []);
  // próxima meia hora a partir de agora (ex.: 23:53 → 00:00 = 24:00)
  const proximaHoje = agora === null ? 0 : Math.ceil((agora + 1) / 30) * 30;
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

  const ontem = adicionarDias(hoje, -1);
  const temHoje = dias.includes(hoje);
  const temOntem = dias.includes(ontem);
  // ontem só se escolhe para horas a mais pela madrugada dentro (antes das 03:00) → começa a seguir a agora (+24 h)
  const minFechar = temHoje ? Math.max(ABRE_MIN, proximaHoje) : ABRE_MIN;
  const minAbrir = temOntem ? proximaHoje + 1440 : temHoje ? Math.max(ABRE_MIN, proximaHoje) : ABRE_MIN;
  const madrugada = agora !== null && agora < ULTIMA_MAX - 1440 - 30; // ainda dá para acrescentar horas à noite de ontem
  // ontem ainda não vai até às 03:00? (se já vai, não há nada a acrescentar)
  const turnoOntem = turnoDoDia(ontem, semanal, especiais);
  const podeEsticarOntem =
    !!turnoOntem.abre && !!turnoOntem.fecha && esticar(curta(turnoOntem.fecha)!, curta(turnoOntem.abre)!) < ULTIMA_MAX;
  // valores usados (nunca antes do mínimo)
  const de = paraHora(Math.max(minutos(deSel), minFechar));
  const ate = paraHora(Math.max(minutos(ateSel), minutos(de) + 30));
  const abre = paraHora(Math.max(minutos(abreSel), minAbrir));
  const fecha = paraHora(Math.max(minutos(fechaSel), minutos(abre)));
  const avisoHoje =
    agora === null
      ? null
      : temOntem
        ? `Ontem (pela madrugada dentro) só a partir das ${normalizar(paraHora(proximaHoje))}.`
        : temHoje && proximaHoje > ABRE_MIN
          ? `Hoje só a partir das ${normalizar(paraHora(proximaHoje))}.`
          : null;

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
  const serve = (e: Escolha, d: string) =>
    e === "abrirDia"
      ? !trabalha(d) && !deFerias(d)
      : d === ontem
        ? e === "abrirHoras" && madrugada && trabalha(d) && podeEsticarOntem
        : trabalha(d) && !(e === "fecharHoras" && d === hoje && proximaHoje > 23 * 60 + 30);

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
    setSoHoras(novoSoHoras);
    setErro(null);
    setConfirmar(false);
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
            fica: j.buraco ? `${curta(t.abre)} – ${curta(t.fecha)} e ${normalizar(abre)} – ${normalizar(fecha)}` : `${j.turno.abre} – ${j.turno.fecha}`,
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

  // Marcações que ficam apanhadas por este fecho (dia inteiro ou só as horas escolhidas)
  const apanhadas = abrir
    ? []
    : marcacoes.filter((m) => {
        if (!dias.includes(diaEmLisboa(m.inicio))) return false;
        if (!soHoras) return true;
        const i = minutos(horaEmLisboa(m.inicio));
        let f = minutos(horaEmLisboa(m.fim));
        if (f <= i) f += 1440;
        return i < minutos(ate) && f > minutos(de);
      });

  function guardar(naMesma = false) {
    if (apanhadas.length && !naMesma) {
      setConfirmar(true); // primeiro mostra o aviso
      return;
    }
    setConfirmar(false);
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
    ...especiais
      .filter((d) => d.aberto === abrir)
      // de ontem, só se a noite ainda está a decorrer (ex.: aberto até às 03:00 de hoje)
      .filter(
        (d) =>
          d.data >= hoje ||
          (d.data === ontem && d.aberto && !!d.abre && !!d.fecha && curta(d.fecha)! < curta(d.abre)! && (agora === null || agora < minutos(curta(d.fecha)!)))
      )
      .map((d) => ({
      chave: `d${d.data}`,
      data: d.data,
      titulo: formatarDiaCurto(d.data),
      texto: d.aberto
        ? `Aberto · ${formatarHora(curta(d.abre) ?? "")} – ${formatarHora(curta(d.fecha) ?? "")}`
        : "Fechado o dia todo",
      apagar: () => apagarDiaEspecial(d.data),
    })),
    ...(abrir ? [] : bloqueios).map((b) => {
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

  // no telemóvel: sem "DAS"/"ÀS" (só um traço entre as horas) para caber tudo na mesma linha
  const rotuloHora = "hidden shrink-0 text-[11px] font-bold tracking-[0.14em] text-texto-3 sm:inline sm:w-9";

  return (
    <Dobravel
      atraso={abrir ? 140 : 80}
      titulo={abrir ? "ABRIR DIAS" : "FECHAR DIAS"}
      descricao={abrir ? "Trabalhar numa folga ou fazer horas a mais." : "Folgas, férias ou umas horas em que não trabalhas."}
    >

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">1. {abrir ? "ABRIR…" : "FECHAR…"}</span>
          <Alternador
            valor={soHoras ? "horas" : "dia"}
            onMudar={(v) => mudarEscolha(abrir, v === "horas")}
            opcoes={[
              { valor: "dia", rotulo: "O DIA TODO" },
              { valor: "horas", rotulo: abrir ? "HORAS A MAIS" : "SÓ UMAS HORAS" },
            ]}
          />
        </div>

        <SeletorData
          key={escolha}
          modo="varios"
          rotulo="2. DIAS (TOCA OU ARRASTA)"
          dias={dias}
          min={escolha === "abrirHoras" && madrugada ? ontem : hoje}
          hoje={hoje}
          onMudar={(ds) => {
            setConfirmar(false);
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
          <div className="flex items-center gap-1.5 motion-safe:animate-entrar sm:gap-2">
            <span className={rotuloHora}>DAS</span>
            <SeletorHora rotulo="Fechado das" valor={de} min={paraHora(minFechar)} max="23:30" onMudar={(h) => { setDe(h); if (minutos(ate) <= minutos(h)) setAte(paraHora(minutos(h) + 30)); }} />
            <span className={`${rotuloHora} sm:w-auto sm:px-1`}>ÀS</span>
            <span className="text-texto-3 sm:hidden" aria-hidden="true">–</span>
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={rotuloHora}>DAS</span>
              <SeletorHora rotulo="Abre às" valor={abre} min={paraHora(minAbrir)} max={paraHora(ULTIMA_MAX)} onMudar={(h) => { setAbre(h); if (minutos(fecha) < minutos(h)) setFecha(h); }} />
              <span className={`${rotuloHora} sm:w-auto sm:px-1`}>ÀS</span>
            <span className="text-texto-3 sm:hidden" aria-hidden="true">–</span>
              <SeletorHora rotulo="Última marcação às" valor={fecha} min={abre} max={paraHora(ULTIMA_MAX)} onMudar={setFecha} />
            </div>
          </div>
        )}

        {avisoHoje && (escolha === "fecharHoras" || escolha === "abrirHoras") && (
          <p className="-mt-2 text-xs text-texto-3 motion-safe:animate-entrar">{avisoHoje}</p>
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

        {/* Aviso antes de fechar: já há clientes marcados */}
        {confirmar && apanhadas.length > 0 && (
          <div role="alert" className="flex flex-col gap-3 rounded-lg border border-red-400/50 bg-red-400/10 p-4 motion-safe:animate-entrar">
            <p className="text-sm font-bold text-red-200">
              {apanhadas.length === 1 ? "Já tens 1 marcação" : `Já tens ${apanhadas.length} marcações`} {soHoras ? "nessas horas" : n > 1 ? "nesses dias" : "nesse dia"}:
            </p>
            <ul className="flex flex-col gap-1 text-sm text-texto-2">
              {apanhadas.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <span className="font-bold text-texto">
                    {formatarDiaCurto(diaEmLisboa(m.inicio))} · {horaEmLisboa(m.inicio)}
                  </span>{" "}
                  · {m.cliente_nome}
                </li>
              ))}
              {apanhadas.length > 5 && <li className="text-texto-3">e mais {apanhadas.length - 5}…</li>}
            </ul>
            <p className="text-xs text-texto-3">Se fechares na mesma, continuam marcadas e aparecem no aviso lá em cima para decidires o que fazer.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="h-10 rounded-full border border-borda-forte text-[11px] font-bold tracking-[0.14em] text-texto-2 transition-[border-color,color,transform] hover:border-texto hover:text-texto active:scale-95"
              >
                NÃO FECHAR
              </button>
              <button
                type="button"
                onClick={() => guardar(true)}
                className="h-10 rounded-full bg-red-400 text-[11px] font-bold tracking-[0.14em] text-tinta transition-[background-color,transform] hover:bg-red-300 active:scale-95"
              >
                FECHAR NA MESMA
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!n || aGuardar}
          hidden={confirmar && apanhadas.length > 0}
          onClick={() => guardar()}
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
    </Dobravel>
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
