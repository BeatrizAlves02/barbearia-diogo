import { Fragment, Suspense } from "react";
import Image from "next/image";
import { BotaoPrimario } from "@/components/BotaoPrimario";
import { CabecalhoDesktop } from "@/components/CabecalhoDesktop";
import { Marca } from "@/components/Marca";
import { NavInferior } from "@/components/NavInferior";
import { TrabalhosRecentes } from "@/components/TrabalhosRecentes";
import { IconeSeta } from "@/components/icones";
import { SegurancaCliente } from "@/components/SegurancaCliente";
import { LINK_MAPA, MORADA, TELEFONE, TELEFONE_TEXTO } from "@/lib/contactos";

const LINHAS_TITULO = ["O teu", "próximo", "corte."];
const FAIXA = ["CORTE", "BARBA", "CORTE + BARBA", "DIOGO PIMENTA", "EST. 2020"];

export default function Inicio() {
  return (
    <main className="mx-auto min-h-dvh max-w-md overflow-x-clip pb-28 lg:max-w-7xl lg:px-10 lg:pb-16 xl:max-w-[1440px] xl:px-14 2xl:max-w-[1680px]">
      <CabecalhoDesktop />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate px-5 pt-52 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-0 lg:pt-14 xl:gap-24 xl:pt-16">
        {/* Foto — telemóvel: fundo do topo · computador: coluna da direita */}
        <div className="absolute inset-x-0 top-0 -z-10 h-105 overflow-hidden bg-superficie-2 motion-safe:animate-revelar lg:relative lg:z-auto lg:order-2 lg:h-[calc(100dvh-9rem)] lg:min-h-[520px] lg:max-h-[960px] lg:rounded">
          <Image
            src="/destaque.jpg"
            alt="Diogo Pimenta a cortar o cabelo a um cliente, com o néon «Book Your Cut» ao fundo"
            fill
            priority
            sizes="(min-width: 1536px) 800px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
        <div className="absolute inset-x-0 top-47.5 -z-10 h-57.5 bg-linear-to-b from-transparent to-bg lg:hidden" />

        {/* Topo — só no telemóvel */}
        <header className="absolute inset-x-5 top-4 flex items-center justify-between motion-safe:animate-descer lg:hidden">
          <Marca />
        </header>

        {/* Texto */}
        <div className="flex flex-col lg:order-1">
          <p
            style={{ animationDelay: "500ms" }}
            className="origin-left rotate-[-4deg] font-mao text-[26px] motion-safe:animate-escrever lg:text-4xl xl:text-5xl"
          >
            corte novo, energia nova
          </p>

          {/* Cada linha do título sobe "de dentro" de uma máscara, uma a seguir à outra */}
          <h1 className="mt-1 text-[42px] font-extrabold uppercase leading-[0.95] font-stretch-125% lg:mt-3 lg:text-7xl xl:text-8xl 2xl:text-9xl">
            {LINHAS_TITULO.map((linha, i) => (
              <span key={linha} className="-mt-[0.12em] block overflow-hidden pt-[0.12em]">
                <span
                  style={{ animationDelay: `${100 + i * 110}ms` }}
                  className="block motion-safe:animate-subir"
                >
                  {linha}
                </span>
              </span>
            ))}
          </h1>

          <p
            style={{ animationDelay: "450ms" }}
            className="mt-2.5 text-[15px] leading-snug text-texto-2 motion-safe:animate-entrar lg:mt-6 lg:max-w-md lg:text-lg xl:max-w-xl xl:text-2xl"
          >
            Escolhe o serviço, apanha a hora que te dá jeito e está feito. Sem chamadas, sem esperas.
          </p>

          <div style={{ animationDelay: "550ms" }} className="motion-safe:animate-entrar">
            <BotaoPrimario href="/marcar" className="mt-6 justify-between lg:mt-10 lg:w-80 xl:h-16 xl:w-96 xl:text-base">
              MARCAR AGORA
              <IconeSeta className="size-5 transition-[transform,opacity] duration-300 group-hover:translate-x-1.5 group-has-data-pendente:opacity-0" />
            </BotaoPrimario>
          </div>

          <dl
            style={{ animationDelay: "650ms" }}
            className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 border-y border-divisor py-4 motion-safe:animate-entrar lg:mt-10 lg:max-w-lg xl:max-w-xl xl:gap-y-5 xl:py-5"
          >
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.22em] text-texto-3">HORÁRIO</dt>
              <dd className="text-sm font-semibold xl:text-base">Ter a Sáb · 09h–19h</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.22em] text-texto-3">TELEMÓVEL</dt>
              <dd className="text-sm font-semibold xl:text-base">
                <a href={`tel:${TELEFONE}`} className="link-sublinhado tabular-nums">
                  {TELEFONE_TEXTO}
                </a>
              </dd>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.22em] text-texto-3">MORADA</dt>
              <dd className="text-sm font-semibold xl:text-base">
                <a href={LINK_MAPA} target="_blank" rel="noopener noreferrer" className="link-sublinhado">
                  {MORADA}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---------- Faixa a correr ---------- */}
      <div
        aria-hidden="true"
        className="group mt-10 overflow-hidden border-y border-divisor py-3.5 lg:mt-16"
      >
        <div className="flex w-max motion-safe:animate-desliza group-hover:[animation-play-state:paused]">
          {[0, 1].map((metade) => (
            <div key={metade} className="flex shrink-0">
              {[...FAIXA, ...FAIXA].map((texto, i) => (
                <Fragment key={i}>
                  <span className="px-5 text-xs font-extrabold tracking-[0.3em] text-texto-3 font-stretch-125%">
                    {texto}
                  </span>
                  <span className="text-xs text-borda-forte">✦</span>
                </Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Trabalhos recentes ---------- */}
      <TrabalhosRecentes />

      <NavInferior ativo="inicio" />

      <Suspense>
        <SegurancaCliente />
      </Suspense>
    </main>
  );
}
