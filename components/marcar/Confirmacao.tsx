import Image from "next/image";
import Link from "next/link";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { IconeCalendario } from "@/components/icones";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";
import { diaEmLisboa, horaDeFim, horaEmLisboa } from "@/lib/datas";

const INSTAGRAM = "https://www.instagram.com/diogo.pimenta.barber/";

type Props = {
  nomeBarbeiro?: string; // já não aparece (só há um barbeiro)
  servico: { nome: string; duracao_min: number; preco: number | null };
  inicio: string;
  linkCalendario: string;
};

/* "2026-11-21" → { semana: "SÁBADO", dia: "21", mes: "NOVEMBRO" } */
function partesDoDia(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-PT", { ...o, timeZone: "UTC" }).format(d).replace(".", "").toUpperCase();
  return { semana: f({ weekday: "long" }), dia: f({ day: "numeric" }), mes: f({ month: "long" }) };
}

/* Visto dentro de um círculo: o círculo aparece e o visto desenha-se */
function Visto({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-texto text-tinta motion-safe:animate-aparecer ${className}`}>
      <svg viewBox="0 0 24 24" className="size-1/2" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} style={{ strokeDasharray: 1 }} className="motion-safe:animate-desenhar" />
      </svg>
    </div>
  );
}

export function Confirmacao({ servico, inicio, linkCalendario }: Props) {
  const { semana, dia, mes } = partesDoDia(diaEmLisboa(inicio));
  const hora = `${horaEmLisboa(inicio)} – ${horaDeFim(inicio, servico.duracao_min)}`;

  const linhas = [
    { rotulo: "Serviço", valor: servico.nome, detalhe: formatarDuracao(servico.duracao_min) },
    { rotulo: "Local", valor: "[MORADA]" },
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-6 lg:max-w-6xl lg:px-10 lg:pt-8">
      {/* Topo: logo com o nome, como no resto do site */}
      <header className="flex justify-center motion-safe:animate-entrar lg:justify-start">
        <Link href="/" aria-label="Diogo Pimenta — início" className="flex items-center gap-3.5 transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="" width={42} height={48} priority />
          <span className="flex flex-col gap-1">
            <span className="text-base font-bold tracking-[0.3em] font-stretch-125%">DIOGO PIMENTA</span>
            <span className="text-[10px] tracking-[0.3em] text-texto-2">BARBERSHOP · EST. 2020</span>
          </span>
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-10 pt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-20 lg:pt-0">
        {/* ---------- Mensagem ---------- */}
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-3">
            <Visto className="size-11 lg:size-12" />
            <p style={{ animationDelay: "800ms" }} className="rotate-[-4deg] font-mao text-3xl motion-safe:animate-escrever lg:text-4xl">
              até já!
            </p>
          </div>

          <h1
            style={{ animationDelay: "250ms" }}
            className="mt-6 text-[40px] font-extrabold uppercase leading-[0.95] font-stretch-125% motion-safe:animate-entrar lg:text-7xl"
          >
            Está
            <br />
            marcado.
          </h1>
          <p style={{ animationDelay: "350ms" }} className="mt-5 max-w-sm text-[15px] leading-relaxed text-texto-2 motion-safe:animate-entrar lg:text-base">
            Guardámos a tua marcação. Se precisares de alterar ou cancelar, fala com a barbearia.
          </p>

          {/* Botões (no computador ficam aqui; no telemóvel vão para baixo do talão) */}
          <div style={{ animationDelay: "450ms" }} className="mt-9 hidden w-full max-w-md flex-col gap-3 motion-safe:animate-entrar lg:flex">
            <Botoes linkCalendario={linkCalendario} />
          </div>
        </section>

        {/* ---------- Talão da marcação ---------- */}
        <section
          style={{ animationDelay: "300ms" }}
          aria-label="Detalhes da marcação"
          className="overflow-hidden rounded-lg border border-borda bg-superficie motion-safe:animate-entrar"
        >
          {/* Dia em destaque */}
          <div className="flex items-center gap-5 p-6">
            <div className="flex w-20 shrink-0 flex-col items-center rounded border border-borda-forte py-2.5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-texto-3">{mes.slice(0, 3)}</span>
              <span className="text-4xl font-extrabold leading-none font-stretch-125%">{dia}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.22em] text-texto-3">{semana}</span>
              <span className="text-2xl font-extrabold tabular-nums font-stretch-125%">{hora}</span>
            </div>
          </div>

          {/* Linha picotada, como um talão */}
          <div className="relative mx-6 border-t border-dashed border-borda-forte">
            <span className="absolute -left-[33px] -top-3 size-6 rounded-full border border-borda bg-bg" />
            <span className="absolute -right-[33px] -top-3 size-6 rounded-full border border-borda bg-bg" />
          </div>

          <dl className="flex flex-col px-6 pt-2">
            {linhas.map((l, i) => (
              <div
                key={l.rotulo}
                style={{ animationDelay: `${450 + i * 60}ms` }}
                className="flex items-start justify-between gap-4 border-b border-divisor py-4 motion-safe:animate-entrar"
              >
                <dt className="pt-0.5 text-[10px] tracking-[0.22em] text-texto-3">{l.rotulo.toUpperCase()}</dt>
                <dd className="flex flex-col items-end text-right">
                  <span className="text-[15px] font-bold">{l.valor}</span>
                  {l.detalhe && <span className="text-sm text-texto-3">{l.detalhe}</span>}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between px-6 py-5">
            <span className="text-[15px] font-bold">Preço</span>
            <span className="text-2xl font-extrabold font-stretch-125%">{formatarPreco(servico.preco)}</span>
          </div>
        </section>

        {/* Botões no telemóvel */}
        <div style={{ animationDelay: "600ms" }} className="flex flex-col gap-3 motion-safe:animate-entrar lg:hidden">
          <Botoes linkCalendario={linkCalendario} />
        </div>
      </div>
    </main>
  );
}

function Botoes({ linkCalendario }: { linkCalendario: string }) {
  return (
    <>
      <a href={linkCalendario} download="marcacao-diogo-pimenta.ics" className={classesBotaoPrimario()}>
        <IconeCalendario className="size-4" />
        ADICIONAR AO CALENDÁRIO
      </a>
      <a
        href={INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 items-center justify-center rounded border border-borda-forte text-sm font-bold tracking-[0.12em] font-stretch-125% transition-[border-color,background-color,transform] hover:border-texto hover:bg-superficie active:scale-[0.97]"
      >
        FALAR COM A BARBEARIA
      </a>
      <Link href="/" className="link-sublinhado self-center py-3 text-sm text-texto-2 hover:text-texto lg:self-start">
        Voltar ao início
      </Link>
    </>
  );
}
