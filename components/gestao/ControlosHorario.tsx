"use client";

import { useEffect, useRef, useState } from "react";
import { formatarHora } from "@/lib/formatar";
import {
  adicionarDias,
  formatarDiaCurto,
  nomeDoMes,
  numeroDoDia,
  primeiroDoMes,
  segundaDaSemana,
} from "@/lib/datas";
import { minutos, paraHora } from "@/lib/horarios";

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

/* Escolher uma hora: − / + (de meia em meia hora) ou escrevendo diretamente */
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
    if (lida) onMudar(limitar(minutos(lida)));
    else if (texto.trim()) {
      setInvalido(true);
      setTimeout(() => setInvalido(false), 600);
    }
    setTexto(null);
  }

  const botao =
    "flex size-9 shrink-0 items-center justify-center rounded text-lg leading-none text-texto-2 transition-[background-color,color,transform] duration-150 hover:bg-superficie-2 hover:text-texto active:scale-90 disabled:pointer-events-none disabled:opacity-25";
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
        value={texto ?? formatarHora(valor)}
        onFocus={(e) => {
          setTexto(formatarHora(valor));
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
        className="w-14 bg-transparent text-center text-[15px] font-bold tabular-nums outline-none selection:bg-texto selection:text-tinta"
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
  | { modo: "dia"; valor: string; onMudar: (dia: string) => void; min: string; rotulo: string }
  | { modo: "intervalo"; de: string; ate: string; onMudar: (de: string, ate: string) => void; min: string; rotulo: string };

/**
 * Calendário com o estilo do site (em vez do calendário do sistema).
 *  - modo "dia": escolhe um dia
 *  - modo "intervalo": 1.º toque = primeiro dia, 2.º toque = último dia
 */
export function SeletorData(props: PropsData) {
  const { min, rotulo } = props;
  const [aberto, setAberto] = useState(false);
  const inicial = props.modo === "dia" ? props.valor : props.de;
  const [mes, setMes] = useState(primeiroDoMes(inicial || min));
  const [passar, setPassar] = useState<string | null>(null); // dia por baixo do rato (pré-visualizar intervalo)
  const [meio, setMeio] = useState(false); // intervalo: já escolheu o primeiro dia
  const raiz = useRef<HTMLDivElement>(null);

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
    setMeio(false);
    setAberto((a) => !a);
  }

  function escolher(d: string) {
    if (props.modo === "dia") {
      props.onMudar(d);
      setAberto(false);
      return;
    }
    if (!meio || d < props.de) {
      props.onMudar(d, d);
      setMeio(true);
    } else {
      props.onMudar(props.de, d);
      setMeio(false);
      setAberto(false);
    }
  }

  // Texto do botão
  let texto = "Escolher dia";
  if (props.modo === "dia" && props.valor) texto = formatarDiaCurto(props.valor);
  if (props.modo === "intervalo" && props.de)
    texto = props.de === props.ate || !props.ate ? formatarDiaCurto(props.de) : `${formatarDiaCurto(props.de)} → ${formatarDiaCurto(props.ate)}`;
  const vazio = props.modo === "dia" ? !props.valor : !props.de;

  // Dias do mês visível (semanas completas, a começar à segunda)
  const dias: string[] = [];
  const fimMes = adicionarDias(primeiroDoMes(mes, 1), -1);
  for (let d = segundaDaSemana(mes); d <= adicionarDias(segundaDaSemana(fimMes), 6); d = adicionarDias(d, 1)) dias.push(d);

  // Intervalo a desenhar (o escolhido, ou o que se está a escolher com o rato)
  let de = "";
  let ate = "";
  if (props.modo === "intervalo" && props.de) {
    de = props.de;
    ate = meio && passar && passar >= props.de ? passar : props.ate || props.de;
  }

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
          className="absolute top-full left-0 z-40 mt-2 w-full origin-top-left sm:w-[19.5rem] rounded-lg border border-borda-forte bg-superficie p-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)] motion-safe:animate-[descer_0.25s_cubic-bezier(0.22,1,0.36,1)_backwards]"
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

          <div className="mt-3 grid grid-cols-7 text-center" onMouseLeave={() => setPassar(null)}>
            {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
              <span key={i} className="pb-2 text-[10px] font-bold tracking-[0.1em] text-texto-3">
                {d}
              </span>
            ))}
            {dias.map((d) => {
              const desativado = d < min;
              const foraDoMes = d.slice(0, 7) !== mes.slice(0, 7);
              const escolhido = props.modo === "dia" ? d === props.valor : d === de || d === ate;
              const noIntervalo = props.modo === "intervalo" && de && d > de && d < ate;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={desativado}
                  onClick={() => escolher(d)}
                  onMouseEnter={() => setPassar(d)}
                  aria-pressed={escolhido}
                  aria-label={formatarDiaCurto(d)}
                  className={`relative my-0.5 flex h-9 items-center justify-center text-sm font-bold tabular-nums transition-[background-color,color,transform] duration-150 active:scale-90 disabled:pointer-events-none ${
                    escolhido
                      ? "rounded bg-texto text-tinta"
                      : noIntervalo
                        ? "bg-white/[0.12] text-texto"
                        : "rounded hover:bg-superficie-2"
                  } ${desativado ? "text-texto-3/30" : foraDoMes && !escolhido ? "text-texto-3" : ""} ${
                    d === min && !escolhido ? "ring-1 ring-texto-3 ring-inset" : ""
                  }`}
                >
                  {numeroDoDia(d)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-borda pt-3 text-xs">
            <span className="text-texto-3">
              {props.modo === "intervalo" ? (meio ? "Agora escolhe o último dia" : "Escolhe o primeiro dia") : "Escolhe um dia"}
            </span>
            <button
              type="button"
              onClick={() => {
                setMes(primeiroDoMes(min));
                escolher(min);
              }}
              className="font-bold tracking-[0.12em] text-texto-2 transition-colors hover:text-texto"
            >
              HOJE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
