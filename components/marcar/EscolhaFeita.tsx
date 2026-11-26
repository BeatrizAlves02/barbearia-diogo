import Link from "next/link";

type Props = {
  rotulo: string;
  valor: string;
  detalhe?: string;
  inicial: string;
  alterar: string; // link para voltar a escolher
};

/* Cartão de uma escolha já feita (ex.: Barbeiro · Diogo Pimenta · Alterar) */
export function EscolhaFeita({ rotulo, valor, detalhe, inicial, alterar }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-superficie-2 text-sm font-extrabold font-stretch-125%">
          {inicial}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">{rotulo.toUpperCase()}</span>
          <span className="truncate text-sm font-bold">
            {valor}
            {detalhe && <span className="font-normal text-texto-3"> · {detalhe}</span>}
          </span>
        </div>
      </div>
      <Link href={alterar} className="link-sublinhado shrink-0 text-[13px] text-texto-2 transition-opacity hover:text-texto active:text-texto active:opacity-60">
        Alterar
      </Link>
    </div>
  );
}
