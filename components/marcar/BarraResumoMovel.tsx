import Link from "next/link";
import { IconeSeta } from "@/components/icones";

type Props = {
  titulo: string;
  subtitulo: string;
  /** link do botão Continuar; null = ainda não se pode continuar */
  href: string | null;
};

/* Barra de resumo fixa em baixo — só no telemóvel */
export function BarraResumoMovel({ titulo, subtitulo, href }: Props) {
  const ativo = Boolean(href);
  return (
    <div
      style={{ animationDelay: "350ms" }}
      className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-5 pb-5 motion-safe:animate-entrar lg:hidden"
    >
      <div
        aria-live="polite"
        className={`flex flex-col gap-3.5 rounded-lg border p-4 shadow-[0_-16px_40px_rgba(0,0,0,0.7)] transition-colors duration-300 ${
          ativo ? "border-texto bg-texto text-tinta" : "border-borda bg-superficie text-texto"
        }`}
      >
        {/* a "key" faz o texto animar de novo sempre que muda */}
        <div key={titulo + subtitulo} className="flex flex-col gap-0.5 motion-safe:animate-entrar">
          <span className="text-base font-bold">{titulo}</span>
          <span className={`text-sm ${ativo ? "text-borda-forte" : "text-texto-3"}`}>{subtitulo}</span>
        </div>

        {href ? (
          <Link
            href={href}
            className="group flex h-13 items-center justify-center gap-2.5 rounded bg-bg text-sm font-extrabold tracking-[0.14em] text-texto font-stretch-125% transition-transform active:scale-[0.97]"
          >
            CONTINUAR
            <IconeSeta className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="flex h-13 cursor-not-allowed items-center justify-center gap-2.5 rounded bg-borda text-sm font-extrabold tracking-[0.14em] text-desativado font-stretch-125%"
          >
            CONTINUAR
            <IconeSeta className="size-5" />
          </span>
        )}
      </div>
    </div>
  );
}
