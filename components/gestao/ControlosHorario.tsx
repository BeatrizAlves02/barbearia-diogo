"use client";

import { formatarHora } from "@/lib/formatar";
import { minutos, paraHora } from "@/lib/horarios";

/* Escolher uma hora com − / + (de meia em meia hora). Sem listas: rápido no telemóvel. */
export function SeletorHora({
  valor,
  onMudar,
  min = "06:00",
  max = "24:00",
  rotulo,
}: {
  valor: string;
  onMudar: (hora: string) => void;
  min?: string;
  max?: string;
  rotulo: string;
}) {
  const v = minutos(valor);
  const passo = (d: number) => onMudar(paraHora(Math.min(minutos(max), Math.max(minutos(min), v + d))));
  const botao =
    "flex size-9 items-center justify-center rounded text-lg leading-none text-texto-2 transition-[background-color,color,transform] duration-150 hover:bg-superficie-2 hover:text-texto active:scale-90 disabled:pointer-events-none disabled:opacity-25";
  return (
    <div role="group" aria-label={rotulo} className="flex items-center rounded border border-borda-forte bg-bg">
      <button type="button" aria-label={`${rotulo}: menos meia hora`} disabled={v <= minutos(min)} onClick={() => passo(-30)} className={botao}>
        −
      </button>
      <span key={valor} className="w-13 text-center text-[15px] font-bold tabular-nums motion-safe:animate-aparecer">
        {formatarHora(valor)}
      </span>
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

/* Campo de data com o calendário do sistema, em modo escuro */
export function CampoData({
  valor,
  onMudar,
  min,
  rotulo,
}: {
  valor: string;
  onMudar: (v: string) => void;
  min?: string;
  rotulo: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.22em] text-texto-3">{rotulo}</span>
      <input
        type="date"
        value={valor}
        min={min}
        onChange={(e) => onMudar(e.target.value)}
        className="h-11 rounded border border-borda-forte bg-bg px-3 text-[15px] text-texto outline-none transition-colors [color-scheme:dark] focus:border-texto"
      />
    </label>
  );
}
