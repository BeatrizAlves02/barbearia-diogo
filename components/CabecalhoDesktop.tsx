import Link from "next/link";
import { Marca } from "./Marca";

/* Topo no computador: só o logo (o botão de marcar já está na página) */
export function CabecalhoDesktop() {
  return (
    <header className="hidden items-center border-b border-divisor py-5 motion-safe:animate-descer lg:flex">
      <Link href="/" aria-label="Diogo Pimenta — início" className="transition-[opacity,transform] hover:opacity-80 active:scale-95">
        <Marca />
      </Link>
    </header>
  );
}
