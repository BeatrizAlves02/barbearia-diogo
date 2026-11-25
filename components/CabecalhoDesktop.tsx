import Link from "next/link";
import { BotaoPrimario } from "./BotaoPrimario";
import { Marca } from "./Marca";

type Props = { ativo: "inicio" | "marcar" };

export function CabecalhoDesktop({ ativo }: Props) {
  const estilo = (id: Props["ativo"]) =>
    `link-sublinhado text-[11px] tracking-[0.22em] ${
      ativo === id ? "font-bold text-texto" : "text-texto-3 hover:text-texto"
    }`;

  return (
    <header className="hidden items-center justify-between border-b border-divisor py-5 motion-safe:animate-descer lg:flex">
      <Link href="/" aria-label="Diogo Pimenta — início" className="transition-opacity hover:opacity-80">
        <Marca />
      </Link>
      <nav aria-label="Navegação principal" className="flex items-center gap-8">
        <Link href="/" aria-current={ativo === "inicio" ? "page" : undefined} className={estilo("inicio")}>
          INÍCIO
        </Link>
        <BotaoPrimario href="/marcar" tamanho="pequeno">
          MARCAR AGORA
        </BotaoPrimario>
      </nav>
    </header>
  );
}
