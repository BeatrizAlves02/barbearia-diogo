"use client";

import { useState, useTransition } from "react";
import { adicionarFerias, apagarFerias } from "@/app/gestao/horario/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { adicionarDias, diaEmLisboa, formatarDiaCurto } from "@/lib/datas";
import type { Bloqueio } from "@/lib/horarios";
import { SeletorData } from "./ControlosHorario";

/** Férias e outros períodos em que a barbearia está fechada (dias inteiros) */
export function Ferias({ lista, hoje }: { lista: Bloqueio[]; hoje: string }) {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  function guardar() {
    setErro(null);
    iniciar(async () => {
      const r = await adicionarFerias(de, ate || de, motivo);
      if (r.erro) setErro(r.erro);
      else {
        setDe("");
        setAte("");
        setMotivo("");
      }
    });
  }

  return (
    <section style={{ animationDelay: "160ms" }} className="rounded-lg border border-borda bg-superficie motion-safe:animate-entrar">
      <div className="flex flex-col gap-1 border-b border-borda p-5 lg:p-6">
        <h2 className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">FÉRIAS</h2>
        <p className="text-sm text-texto-3">Nesses dias ninguém consegue marcar.</p>
      </div>

      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <SeletorData
          modo="intervalo"
          rotulo="DIAS"
          de={de}
          ate={ate}
          min={hoje}
          onMudar={(d, a) => {
            setDe(d);
            setAte(a);
          }}
        />
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={100}
          placeholder="Motivo (opcional) — ex.: férias de verão"
          className="h-11 rounded border border-borda-forte bg-bg px-3 text-sm outline-none transition-colors placeholder:text-desativado focus:border-texto"
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="button"
          disabled={!de || aGuardar}
          onClick={guardar}
          className={`${classesBotaoPrimario("pequeno")} disabled:pointer-events-none disabled:opacity-40`}
        >
          {aGuardar ? "A GUARDAR…" : "MARCAR FÉRIAS"}
        </button>
      </div>

      {lista.length > 0 && (
        <ul className="divide-y divide-borda border-t border-borda">
          {lista.map((b) => (
            <ItemFerias key={b.id} b={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemFerias({ b }: { b: Bloqueio }) {
  const [aApagar, iniciar] = useTransition();
  const primeiro = diaEmLisboa(b.inicio);
  const ultimo = adicionarDias(diaEmLisboa(b.fim), -1);
  const texto = primeiro === ultimo ? formatarDiaCurto(primeiro) : `${formatarDiaCurto(primeiro)} → ${formatarDiaCurto(ultimo)}`;
  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-3.5 motion-safe:animate-entrar lg:px-6 ${aApagar ? "opacity-50" : ""}`}>
      <span className="flex flex-col">
        <span className="text-[15px] font-bold">{texto}</span>
        {b.motivo && <span className="text-sm text-texto-3">{b.motivo}</span>}
      </span>
      <button
        type="button"
        aria-label={`Apagar férias ${texto}`}
        disabled={aApagar}
        onClick={() => iniciar(async () => void (await apagarFerias(b.id)))}
        className="flex h-9 items-center rounded-full border border-borda-forte px-3 text-[11px] font-bold tracking-[0.12em] text-texto-2 transition-[background-color,color,border-color,transform] hover:border-red-400 hover:bg-red-400 hover:text-tinta active:scale-95"
      >
        APAGAR
      </button>
    </li>
  );
}
