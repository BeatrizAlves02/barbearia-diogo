import Link from "next/link";
import { CarregarLink } from "./CarregarLink";

type Tamanho = "normal" | "pequeno";

const tamanhos: Record<Tamanho, string> = {
  normal: "h-14 px-5 text-sm",
  pequeno: "h-11 px-5 text-xs",
};

/*
  Classes do botão branco: ao passar o rato, é "varrido" por uma camada preta
  da esquerda para a direita (o ::before) e o texto passa a branco.
  Ao carregar, encolhe ligeiramente como um botão físico.
  Exportadas para se poderem usar também em <button> e <a>.
*/
export function classesBotaoPrimario(tamanho: Tamanho = "normal") {
  return `group relative isolate flex items-center justify-center gap-2.5 overflow-hidden rounded border border-texto bg-texto font-extrabold tracking-[0.14em] text-tinta font-stretch-125% transition-[color,transform,opacity] duration-300 active:scale-[0.97] before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-bg before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-texto hover:before:scale-x-100 active:text-texto active:before:scale-x-100 active:before:duration-200 has-data-pendente:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto ${tamanhos[tamanho]}`;
}

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  tamanho?: Tamanho;
};

export function BotaoPrimario({ href, children, className = "", tamanho = "normal" }: Props) {
  return (
    <Link href={href} className={`${classesBotaoPrimario(tamanho)} ${className}`}>
      <CarregarLink />
      {children}
    </Link>
  );
}
