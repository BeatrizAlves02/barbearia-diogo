"use client";

import { useEffect, useRef, useState } from "react";
import {
  adicionarDias,
  formatarDiaCurto,
  nomeDoMes,
  numeroDoDia,
  primeiroDoMes,
  segundaDaSemana,
} from "@/lib/datas";
import { minutos, normalizar, paraHora } from "@/lib/horarios";

/**
 * Lê uma hora escrita à mão: "9" → 09:00 · "930" → 09:30 · "9:30" / "9h30" / "19h" → certo.
 * Devolve null se não fizer sentido.
 */
function lerHora(texto: string): string | null {
  const t = texto.trim().toLowerCase().replace("h", ":").replace(/[.,\s]/g, ":");
  let h: number;
  let m = 0;
  if (/^\d{1,2}$/.test(t)) h = Number(t);
  else if (/^\d{3,4}$/.test(t)) {
    h = Number(t.slice(0, -2));
    m = Number(t.slice(-2));
  } else if (/^\d{1,2}:\d{0,2}$/.test(t)) {
    const [a, b] = t.split(":");
    h = Number(a);
    m = Number(b || 0);
  } else return null;
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return paraHora(h * 60 + m);
}

/* Escolher uma hora: − / + (de meia em meia hora) ou escrevendo diretamente.
   Aceita horas "esticadas" (ex.: "25:00" = 01:00 do dia seguinte) → mostra "01:00". */
export function SeletorHora({
  valor,
  onMudar,
  min = "06:00",
  max = "23:30",
  rotulo,
}: {
  valor: string;
  onMudar: (hora: string) => void;
  min?: string;
  max?: string;
  rotulo: string;
}) {
  const [texto, setTexto] = useState<string | null>(null); // enquanto se escreve
  const [invalido, setInvalido] = useState(false);
  const v = minutos(valor);
  const limitar = (x: number) => paraHora(Math.min(minutos(max), Math.max(minutos(min), x)));
  const passo = (d: number) => onMudar(limitar(v + d));

  function confirmar() {
    if (texto === null) return;
    const lida = lerHora(texto);
    if (lida) {
      let m = minutos(lida);
      // mais cedo que o mínimo, mas cabe no dia seguinte (madrugada)? ex.: escreve "1" depois de abrir às 9
      if (m < minutos(min) && m + 1440 <= minutos(max)) m += 1440;
      onMudar(limitar(m));
    }
    else if (texto.trim()) {
      setInvalido(true);
      setTimeout(() => setInvalido(false), 600);
    }
    setTexto(null);
  }

  const botao =
    "flex size-7 shrink-0 items-center justify-center rounded text-lg leading-none text-texto-2 min-[380px]:size-8 sm:size-9 transition-[background-color,color,transform] duration-150 hover:bg-superficie-2 hover:text-texto active:scale-90 disabled:pointer-events-none disabled:opacity-25";
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={`flex items-center rounded border bg-bg transition-colors focus-within:border-texto ${invalido ? "border-red-400" : "border-borda-forte"}`}
    >
      <button type="button" aria-label={`${rotulo}: menos meia hora`} disabled={v <= minutos(min)} onClick={() => passo(-30)} className={botao}>
        −
      </button>
      <input
        aria-label={`${rotulo} (podes escrever, ex.: 9:30)`}
        inputMode="numeric"
        value={texto ?? normalizar(valor)}
        onFocus={(e) => {
          setTexto(normalizar(valor));
          const campo = e.target;
          campo.select();
          requestAnimationFrame(() => campo.select()); // o Safari tira a seleção no clique
        }}
        onChange={(e) => setTexto(e.target.value.slice(0, 5))}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setTexto(null);
            e.currentTarget.blur();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            passo(30);
            setTexto(null);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            passo(-30);
            setTexto(null);
          }
        }}
        className="w-11 bg-transparent text-center text-sm min-[380px]:w-12 sm:w-14 sm:text-[15px] font-bold tabular-nums outline-none selection:bg-texto selection:text-tinta"
      />
      <button type="button" aria-label={`${rotulo}: mais meia hora`} disabled={v >= minutos(max)} onClick={() => passo(30)} className={botao}>
        +
      </button>
    </div>
  );
}

/* Interruptor Aberto / Fechado */
export function Interruptor({ ligado, onMudar, rotulo }: { ligado: boolean; onMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => onMudar(!ligado)}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full border transition-[background-color,border-color] duration-300 active:scale-95 ${
        ligado ? "border-texto bg-texto" : "border-borda-forte bg-superficie-2"
      }`}
    >
      <span
        className={`absolute size-5 rounded-full shadow transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          ligado ? "translate-x-[22px] bg-tinta" : "translate-x-[3px] bg-texto-3"
        }`}
      />
    </button>
  );
}

/* Escolha entre duas opções (ex.: FECHADO / ABERTO) */
export function Alternador<T extends string>({
  opcoes,
  valor,
  onMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onMudar: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded border border-borda-forte p-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => onMudar(o.valor)}
          className={`flex h-9 items-center justify-center rounded-sm px-3 text-[11px] font-bold tracking-[0.14em] transition-[background-color,color,transform] duration-200 active:scale-95 ${
            valor === o.valor ? "bg-texto text-tinta" : "text-texto-2 hover:bg-superficie-2 hover:text-texto"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

function Seta({ para }: { para: "esq" | "dir" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={para === "esq" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

type PropsData =
  | { modo: "dia"; valor: string; onMudar: (dia: string) => void; min: string; rotulo: string; etiqueta?: (dia: string) => string | undefined }
  | {
      modo: "varios";
      dias: string[];
      onMudar: (dias: string[]) => void;
      min: string;
      rotulo: string;
      etiqueta?: (dia: string) => string | undefined;
      desativar?: (dia: string) => boolean; // dias que não se podem escolher
      dica?: string; // texto por baixo do calendário
      hoje?: string; // dia com contorno (por defeito, o mínimo)
    };

/** Junta dias seguidos: ["2026-12-22","2026-12-23","2026-12-27"] → [["2026-12-22","2026-12-23"],["2026-12-27","2026-12-27"]] */
export function juntarSeguidos(dias: string[]): [string, string][] {
  const ord = [...new Set(dias)].sort();
  const grupos: [string, string][] = [];
  for (const d of ord) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && adicionarDias(ultimo[1], 1) === d) ultimo[1] = d;
    else grupos.push([d, d]);
  }
  return grupos;
}

/**
 * Calendário com o estilo do site (em vez do calendário do sistema).
 *  - modo "dia": escolhe um dia
 *  - modo "varios": toca nos dias que quiseres (ou arrasta para apanhar vários seguidos)
 *  - etiqueta: marca alguns dias com um ponto (ex.: feriados) e mostra o nome ao passar o rato
 */
export function SeletorData(props: PropsData) {
  const { min, rotulo, etiqueta } = props;
  const desativar = props.modo === "varios" ? props.desativar : undefined;
  const pode = (d: string) => d >= min && !desativar?.(d);
  const diaDeHoje = (props.modo === "varios" && props.hoje) || min;
  const [aberto, setAberto] = useState(false);
  const inicial = props.modo === "dia" ? props.valor : [...props.dias].sort()[0];
  const [mes, setMes] = useState(primeiroDoMes(inicial || min));
  const raiz = useRef<HTMLDivElement>(null);
  // Arrastar (modo "varios"): de que dia começou, se está a por ou a tirar, e a escolha antes de começar
  const arrasto = useRef<{ desde: string; por: boolean; antes: string[] } | null>(null);

  // Fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function abrir() {
    setMes(primeiroDoMes(inicial || min));
    setAberto((a) => !a);
  }

  // ----- modo "varios" -----
  function aplicarArrasto(ate: string) {
    if (props.modo !== "varios" || !arrasto.current) return;
    const { desde, por, antes } = arrasto.current;
    const [a, b] = desde <= ate ? [desde, ate] : [ate, desde];
    const faixa: string[] = [];
    for (let d = a; d <= b; d = adicionarDias(d, 1)) if (pode(d)) faixa.push(d);
    const conj = new Set(antes);
    for (const d of faixa) {
      if (por) conj.add(d);
      else conj.delete(d);
    }
    props.onMudar([...conj].sort());
  }
  function comecar(d: string, e: React.PointerEvent) {
    if (props.modo !== "varios") return;
    e.preventDefault();
    arrasto.current = { desde: d, por: !props.dias.includes(d), antes: props.dias };
    aplicarArrasto(d);
  }
  function mover(e: React.PointerEvent) {
    if (!arrasto.current) return;
    const alvo = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-dia]");
    const d = alvo?.dataset.dia;
    if (d && !alvo.hasAttribute("disabled")) aplicarArrasto(d);
  }
  useEffect(() => {
    const parar = () => (arrasto.current = null);
    window.addEventListener("pointerup", parar);
    window.addEventListener("pointercancel", parar);
    return () => {
      window.removeEventListener("pointerup", parar);
      window.removeEventListener("pointercancel", parar);
    };
  }, []);

  // Texto do botão
  let texto = "Escolher dia";
  let vazio = true;
  if (props.modo === "dia" && props.valor) {
    texto = formatarDiaCurto(props.valor);
    vazio = false;
  }
  if (props.modo === "varios" && props.dias.length) {
    const grupos = juntarSeguidos(props.dias);
    const n = props.dias.length;
    texto =
      grupos.length === 1
        ? grupos[0][0] === grupos[0][1]
          ? formatarDiaCurto(grupos[0][0])
          : `${formatarDiaCurto(grupos[0][0])} → ${formatarDiaCurto(grupos[0][1])} · ${n} dias`
        : `${n} dias escolhidos`;
    vazio = false;
  }

  // Dias do mês visível (semanas completas, a começar à segunda)
  const dias: string[] = [];
  const fimMes = adicionarDias(primeiroDoMes(mes, 1), -1);
  for (let d = segundaDaSemana(mes); d <= adicionarDias(segundaDaSemana(fimMes), 6); d = adicionarDias(d, 1)) dias.push(d);

  const escolhidos = new Set(props.modo === "varios" ? props.dias : props.valor ? [props.valor] : []);
  const podeRecuar = primeiroDoMes(mes, -1) >= primeiroDoMes(min);

  return (
    <div ref={raiz} className="relative flex flex-1 flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.22em] text-texto-3">{rotulo}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={abrir}
        className={`flex h-11 items-center justify-between gap-3 rounded border bg-bg px-3 text-left text-[15px] transition-[border-color,background-color] hover:border-texto active:scale-[0.99] ${
          aberto ? "border-texto" : "border-borda-forte"
        } ${vazio ? "text-desativado" : "font-bold text-texto"}`}
      >
        <span className="truncate">{texto}</span>
        <IconeCalendario />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label={rotulo}
          className="absolute top-full left-0 z-40 mt-2 w-full origin-top-left rounded-lg border border-borda-forte bg-superficie p-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)] motion-safe:animate-[descer_0.25s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:w-[19.5rem]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-[0.16em] font-stretch-125%">{nomeDoMes(mes).toUpperCase()}</span>
            <span className="flex gap-1">
              <button
                type="button"
                aria-label="Mês anterior"
                disabled={!podeRecuar}
                onClick={() => setMes(primeiroDoMes(mes, -1))}
                className="flex size-8 items-center justify-center rounded-full text-texto-3 transition-[background-color,color,transform] hover:bg-superficie-2 hover:text-texto active:scale-90 disabled:pointer-events-none disabled:opacity-25"
              >
                <Seta para="esq" />
              </button>
              <button
                type="button"
                aria-label="Mês seguinte"
                onClick={() => setMes(primeiroDoMes(mes, 1))}
                className="flex size-8 items-center justify-center rounded-full text-texto-3 transition-[background-color,color,transform] hover:bg-superficie-2 hover:text-texto active:scale-90"
              >
                <Seta para="dir" />
              </button>
            </span>
          </div>

          <div className="mt-3 grid touch-none grid-cols-7 text-center select-none" onPointerMove={mover}>
            {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
              <span key={i} className="pb-2 text-[10px] font-bold tracking-[0.1em] text-texto-3">
                {d}
              </span>
            ))}
            {dias.map((d) => {
              const desativado = !pode(d);
              const foraDoMes = d.slice(0, 7) !== mes.slice(0, 7);
              const escolhido = escolhidos.has(d);
              // nos "varios", dias escolhidos seguidos ficam ligados (sem cantos arredondados no meio)
              const antes = escolhido && escolhidos.has(adicionarDias(d, -1)) && new Date(`${d}T12:00:00Z`).getUTCDay() !== 1;
              const depois = escolhido && escolhidos.has(adicionarDias(d, 1)) && new Date(`${d}T12:00:00Z`).getUTCDay() !== 0;
              const nota = etiqueta?.(d);
              return (
                <button
                  key={d}
                  type="button"
                  data-dia={d}
                  disabled={desativado}
                  title={nota}
                  onClick={props.modo === "dia" ? () => (props.onMudar(d), setAberto(false)) : undefined}
                  onPointerDown={props.modo === "varios" ? (e) => comecar(d, e) : undefined}
                  onKeyDown={
                    props.modo === "varios"
                      ? (e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          const p = props as Extract<PropsData, { modo: "varios" }>;
                          p.onMudar(p.dias.includes(d) ? p.dias.filter((x) => x !== d) : [...p.dias, d].sort());
                        }
                      : undefined
                  }
                  aria-pressed={escolhido}
                  aria-label={`${formatarDiaCurto(d)}${nota ? ` (${nota})` : ""}`}
                  className={`relative my-0.5 flex h-9 items-center justify-center text-sm font-bold tabular-nums transition-[background-color,color,transform] duration-150 active:scale-90 disabled:pointer-events-none ${
                    escolhido ? "bg-texto text-tinta" : "rounded hover:bg-superficie-2"
                  } ${escolhido && !antes ? "rounded-l" : ""} ${escolhido && !depois ? "rounded-r" : ""} ${
                    desativado ? "text-texto-3/30" : foraDoMes && !escolhido ? "text-texto-3" : ""
                  } ${d === diaDeHoje && !escolhido ? "ring-1 ring-texto-3 ring-inset" : ""}`}
                >
                  {numeroDoDia(d)}
                  {nota && !desativado && (
                    <span className={`absolute bottom-1 size-1 rounded-full ${escolhido ? "bg-tinta" : "bg-texto-2"}`} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-borda pt-3 text-xs">
            {props.modo === "varios" ? (
              <>
                <span className="text-texto-3">
                  {props.dias.length ? `${props.dias.length} ${props.dias.length === 1 ? "dia" : "dias"}` : props.dica ?? "Toca nos dias ou arrasta"}
                </span>
                <span className="flex items-center gap-3">
                  {props.dias.length > 0 && (
                    <button type="button" onClick={() => props.onMudar([])} className="font-bold tracking-[0.12em] text-texto-3 transition-colors hover:text-texto">
                      LIMPAR
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="rounded-full bg-texto px-3 py-1.5 font-bold tracking-[0.12em] text-tinta transition-transform active:scale-95"
                  >
                    OK
                  </button>
                </span>
              </>
            ) : (
              <>
                <span className="text-texto-3">{etiqueta ? "• = feriado" : "Escolhe um dia"}</span>
                <button
                  type="button"
                  onClick={() => {
                    props.onMudar(min);
                    setAberto(false);
                  }}
                  className="font-bold tracking-[0.12em] text-texto-2 transition-colors hover:text-texto"
                >
                  HOJE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
