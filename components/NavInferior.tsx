import Link from "next/link";
import { IconeCasa, IconeCalendario } from "./icones";

const itens = [
  { id: "inicio", label: "INÍCIO", href: "/", Icone: IconeCasa },
  { id: "marcar", label: "MARCAR", href: "/marcar", Icone: IconeCalendario },
] as const;

export function NavInferior({ ativo }: { ativo: (typeof itens)[number]["id"] }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 mx-auto grid h-18 max-w-md grid-cols-2 border-t border-divisor bg-bg lg:hidden"
    >
      {itens.map(({ id, label, href, Icone }) => {
        const atual = id === ativo;
        return (
          <Link
            key={id}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] tracking-[0.16em] ${
              atual ? "font-bold text-texto" : "text-texto-3"
            }`}
          >
            <Icone />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
