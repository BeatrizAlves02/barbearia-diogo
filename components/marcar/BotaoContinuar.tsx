import { BotaoPrimario } from "@/components/BotaoPrimario";
import { IconeSeta } from "@/components/icones";

type Props = { href: string | null; children: React.ReactNode };

/* Botão "Continuar": branco e ativo quando há href, cinzento e desativado quando não há */
export function BotaoContinuar({ href, children }: Props) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className="flex h-14 cursor-not-allowed items-center justify-center gap-2.5 rounded bg-borda text-sm font-extrabold tracking-[0.14em] text-desativado font-stretch-125%"
      >
        {children}
      </span>
    );
  }
  return (
    <BotaoPrimario href={href}>
      {children}
      <IconeSeta className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
    </BotaoPrimario>
  );
}
