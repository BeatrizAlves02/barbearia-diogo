"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { entrar, type EstadoEntrar } from "@/app/gestao/entrar/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";

const campo =
  "h-13 w-full rounded border border-borda bg-superficie px-4 text-base text-texto outline-none transition-colors placeholder:text-desativado focus:border-texto autofill:shadow-[inset_0_0_0_100px_var(--color-superficie)] autofill:[-webkit-text-fill-color:var(--color-texto)]";

export function FormularioEntrar() {
  const [estado, acao, aEnviar] = useActionState<EstadoEntrar, FormData>(entrar, {});
  const [ver, setVer] = useState(false);
  const porInatividade = useSearchParams().get("motivo") === "inatividade" && !estado.erro;

  return (
    <form action={acao} style={{ animationDelay: "120ms" }} className="mt-10 flex flex-col gap-4 motion-safe:animate-entrar">
      {porInatividade && (
        <p className="rounded border border-borda-forte bg-superficie px-4 py-3 text-sm text-texto-2 motion-safe:animate-entrar">
          Por segurança, saíste automaticamente depois de algum tempo sem usar a app. Entra outra vez.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[10px] tracking-[0.22em] text-texto-3">
          EMAIL
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={estado.email} className={campo} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[10px] tracking-[0.22em] text-texto-3">
          PALAVRA-PASSE
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${campo} pr-20`}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute inset-y-0 right-0 px-4 text-xs font-bold tracking-[0.12em] text-texto-3 hover:text-texto"
          >
            {ver ? "ESCONDER" : "VER"}
          </button>
        </div>
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-400 motion-safe:animate-entrar">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={aEnviar}
        className={`${classesBotaoPrimario()} mt-2 w-full disabled:pointer-events-none disabled:opacity-60`}
      >
        {aEnviar && (
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {aEnviar ? "A ENTRAR…" : "ENTRAR"}
      </button>
    </form>
  );
}
