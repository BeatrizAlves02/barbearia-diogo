import Image from "next/image";
import Link from "next/link";
import { sair } from "@/app/gestao/actions";
import { AtualizacaoAutomatica } from "./AtualizacaoAutomatica";

/* Topo da área de gestão: logo + "Gestão" + botão para sair */
export function CabecalhoGestao({ nome }: { nome: string }) {
  return (
    <header className="flex items-center justify-between border-b border-divisor py-4 motion-safe:animate-descer">
      <Link href="/gestao" className="flex items-center gap-3 transition-opacity hover:opacity-80">
        <Image src="/logo.svg" alt="" width={28} height={32} />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold tracking-[0.2em] font-stretch-125%">GESTÃO</span>
          <span className="whitespace-nowrap text-[10px] tracking-[0.2em] text-texto-3">{nome.toUpperCase()}</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
      <AtualizacaoAutomatica />
      <form action={sair}>
        <button
          type="submit"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-borda px-4 text-[11px] font-bold tracking-[0.16em] text-texto-2 transition-colors hover:border-texto hover:text-texto active:scale-95"
        >
          SAIR
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />
          </svg>
        </button>
      </form>
      </div>
    </header>
  );
}
