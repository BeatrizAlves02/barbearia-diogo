import Image from "next/image";
import Link from "next/link";
import { IconeVoltar } from "./icones";

const ETAPAS = ["Serviço", "Hora", "Dados"];

type Props = { passo: 1 | 2 | 3; voltar: string };

export function TopoPasso({ passo, voltar }: Props) {
  return (
    <header className="flex flex-col gap-4 px-5 pt-4 lg:gap-6 lg:px-0 lg:pt-8">
      <div className="flex items-center justify-between">
        <Link
          href={voltar}
          aria-label="Voltar"
          className="flex size-11 items-center justify-center rounded-full border border-borda transition-[border-color,transform] hover:border-texto active:scale-95"
        >
          <IconeVoltar />
        </Link>
        <span className="text-[11px] tracking-[0.24em] text-texto-3">PASSO {passo} DE {ETAPAS.length}</span>
        <a href="/" aria-label="Diogo Pimenta — início" className="flex size-11 items-center justify-center transition-opacity hover:opacity-70">
          <Image src="/logo.svg" alt="" width={26} height={30} />
        </a>
      </div>

      <ol className="grid grid-cols-3 gap-1.5" aria-label="Passos da marcação">
        {ETAPAS.map((nome, i) => {
          const n = i + 1;
          return (
            <li key={nome} aria-current={n === passo ? "step" : undefined} className="flex flex-col gap-2">
              <div
                className={`h-[3px] origin-left ${
                  n < passo ? "bg-texto" : n === passo ? "bg-texto motion-safe:animate-encher" : "bg-borda"
                }`}
              />
              <span
                className={`text-[10px] uppercase tracking-[0.14em] ${
                  n <= passo ? "font-bold text-texto" : "text-texto-3"
                }`}
              >
                {nome}
              </span>
            </li>
          );
        })}
      </ol>
    </header>
  );
}
