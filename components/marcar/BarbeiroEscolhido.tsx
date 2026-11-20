import Link from "next/link";

/* Cartão com o barbeiro escolhido no passo anterior + "Alterar" */
export function BarbeiroEscolhido({ nome }: { nome: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-borda px-4 py-3 motion-safe:animate-entrar">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-superficie-2 text-sm font-extrabold font-stretch-125%">
          {nome === "Primeiro disponível" ? "·" : nome.charAt(0)}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">BARBEIRO</span>
          <span className="text-sm font-bold">{nome}</span>
        </div>
      </div>
      <Link href="/marcar" className="link-sublinhado text-[13px] text-texto-2 hover:text-texto">
        Alterar
      </Link>
    </div>
  );
}
