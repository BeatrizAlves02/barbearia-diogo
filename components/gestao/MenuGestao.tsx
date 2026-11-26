"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ContornoAnimado } from "./ContornoAnimado";

const SECCOES = [
  { href: "/gestao", rotulo: "AGENDA" },
  { href: "/gestao/horario", rotulo: "HORÁRIO" },
] as const;

/* Separadores da gestão. No computador ficam no topo; no telemóvel por baixo do logo. */
export function MenuGestao({ className = "" }: { className?: string }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Secções da gestão" className={`flex gap-1 rounded-full border border-borda p-1 ${className}`}>
      {SECCOES.map((s) => {
        const ativo = s.href === "/gestao" ? caminho === "/gestao" : caminho.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={ativo ? "page" : undefined}
            className={`group relative flex h-9 flex-1 items-center justify-center rounded-full px-5 text-[11px] font-bold tracking-[0.16em] transition-[background-color,color,transform] duration-200 active:scale-95 ${
              ativo ? "bg-texto text-tinta" : "text-texto-2 hover:text-texto"
            }`}
          >
            {s.rotulo}
            {!ativo && <ContornoAnimado raio={17.25} />}
          </Link>
        );
      })}
    </nav>
  );
}
