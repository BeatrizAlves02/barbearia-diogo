import Image from "next/image";
import Link from "next/link";
import { IconeVoltar } from "./icones";

type Props = { passo: 1 | 2 | 3 | 4; voltar: string };

export function TopoPasso({ passo, voltar }: Props) {
  return (
    <header className="flex flex-col gap-4 px-5 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href={voltar}
          aria-label="Voltar"
          className="flex size-11 items-center justify-center rounded-full border border-borda transition-colors hover:border-texto"
        >
          <IconeVoltar />
        </Link>
        <span className="text-[11px] tracking-[0.24em] text-texto-3">PASSO {passo} DE 4</span>
        <div className="flex size-11 items-center justify-center">
          <Image src="/logo.svg" alt="Diogo Pimenta" width={26} height={30} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-[3px] origin-left ${
              n < passo ? "bg-texto" : n === passo ? "bg-texto motion-safe:animate-encher" : "bg-borda"
            }`}
          />
        ))}
      </div>
    </header>
  );
}
