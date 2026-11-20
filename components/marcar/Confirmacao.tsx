import Image from "next/image";
import Link from "next/link";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";
import { diaEmLisboa, formatarDiaCurto, horaDeFim, horaEmLisboa } from "@/lib/datas";

const INSTAGRAM = "https://www.instagram.com/diogo.pimenta.barber/";

type Props = {
  nomeBarbeiro: string;
  servico: { nome: string; duracao_min: number; preco: number | null };
  inicio: string;
  linkCalendario: string;
};

export function Confirmacao({ nomeBarbeiro, servico, inicio, linkCalendario }: Props) {
  const linhas = [
    { rotulo: "Serviço", valor: `${servico.nome} · ${formatarDuracao(servico.duracao_min)}` },
    { rotulo: "Dia", valor: formatarDiaCurto(diaEmLisboa(inicio)) },
    { rotulo: "Hora", valor: `${horaEmLisboa(inicio)} – ${horaDeFim(inicio, servico.duracao_min)}` },
    { rotulo: "Barbeiro", valor: nomeBarbeiro },
    { rotulo: "Preço", valor: `${formatarPreco(servico.preco)} · na barbearia` },
    { rotulo: "Local", valor: "[MORADA]" },
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-12 lg:max-w-lg lg:pt-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <Link href="/" aria-label="Diogo Pimenta — início" className="motion-safe:animate-entrar">
          <Image src="/logo.svg" alt="" width={38} height={44} />
        </Link>

        {/* Círculo que aparece + visto que se desenha */}
        <div className="mt-4 flex size-22 items-center justify-center rounded-full border-[1.5px] border-texto motion-safe:animate-aparecer">
          <svg
            viewBox="0 0 24 24"
            className="size-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              pathLength={1}
              style={{ strokeDasharray: 1 }}
              className="motion-safe:animate-desenhar"
            />
          </svg>
        </div>

        <p
          style={{ animationDelay: "800ms" }}
          className="mt-2 rotate-[-4deg] font-mao text-3xl motion-safe:animate-escrever"
        >
          até já!
        </p>
        <h1
          style={{ animationDelay: "300ms" }}
          className="text-[34px] font-extrabold uppercase leading-none font-stretch-125% motion-safe:animate-entrar lg:text-5xl"
        >
          Está marcado.
        </h1>
        <p style={{ animationDelay: "400ms" }} className="max-w-xs text-[15px] leading-snug text-texto-2 motion-safe:animate-entrar">
          Guardámos a tua marcação. Se precisares de alterar ou cancelar, fala com a barbearia.
        </p>
      </div>

      <dl className="mt-8 flex flex-col border-t border-divisor">
        {linhas.map((l, i) => (
          <div
            key={l.rotulo}
            style={{ animationDelay: `${500 + i * 60}ms` }}
            className="flex items-center justify-between gap-4 border-b border-divisor py-3.5 motion-safe:animate-entrar"
          >
            <dt className="text-[10px] tracking-[0.22em] text-texto-3">{l.rotulo.toUpperCase()}</dt>
            <dd className="text-right text-[15px] font-bold">{l.valor}</dd>
          </div>
        ))}
      </dl>

      <div style={{ animationDelay: "900ms" }} className="mt-8 flex flex-col gap-3 motion-safe:animate-entrar">
        <a href={linkCalendario} download="marcacao-diogo-pimenta.ics" className={classesBotaoPrimario()}>
          ADICIONAR AO CALENDÁRIO
        </a>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center rounded border border-borda-forte text-sm font-bold tracking-[0.12em] font-stretch-125% transition-[border-color,transform] hover:border-texto active:scale-[0.97]"
        >
          FALAR COM A BARBEARIA
        </a>
        <Link href="/" className="link-sublinhado self-center py-3 text-sm text-texto-2 hover:text-texto">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
