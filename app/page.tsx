import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { BotaoPrimario } from "@/components/BotaoPrimario";
import { CabecalhoDesktop } from "@/components/CabecalhoDesktop";
import { Marca } from "@/components/Marca";
import { NavInferior } from "@/components/NavInferior";
import { IconeExterno, IconeSeta, IconeUtilizador } from "@/components/icones";

const INSTAGRAM = "https://www.instagram.com/diogo.pimenta.barber/";
const LINHAS_TITULO = ["O teu", "próximo", "corte."];
const FAIXA = ["CORTE", "BARBA", "CORTE + BARBA", "DIOGO PIMENTA", "EST. 2020"];

export default function Inicio() {
  return (
    <main className="mx-auto min-h-dvh max-w-md overflow-x-clip pb-28 lg:max-w-6xl lg:px-10 lg:pb-16">
      <CabecalhoDesktop ativo="inicio" />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate px-5 pt-52 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-0 lg:pt-14">
        {/* Foto — telemóvel: fundo do topo · computador: coluna da direita */}
        <div className="absolute inset-x-0 top-0 -z-10 h-105 overflow-hidden bg-superficie-2 motion-safe:animate-revelar lg:relative lg:z-auto lg:order-2 lg:aspect-3/4 lg:h-auto lg:rounded">
          <Image
            src="/destaque.jpg"
            alt="Diogo Pimenta a cortar o cabelo a um cliente, com o néon «Book Your Cut» ao fundo"
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
        <div className="absolute inset-x-0 top-47.5 -z-10 h-57.5 bg-linear-to-b from-transparent to-bg lg:hidden" />

        {/* Topo — só no telemóvel */}
        <header className="absolute inset-x-5 top-4 flex items-center justify-between motion-safe:animate-descer lg:hidden">
          <Marca />
          <Link
            href="/conta"
            aria-label="A minha conta"
            className="flex size-11 items-center justify-center rounded-full border border-borda-forte bg-bg/50 transition-colors duration-300 hover:bg-texto hover:text-tinta active:scale-95"
          >
            <IconeUtilizador />
          </Link>
        </header>

        {/* Texto */}
        <div className="flex flex-col lg:order-1">
          <p
            style={{ animationDelay: "500ms" }}
            className="origin-left rotate-[-4deg] font-mao text-[26px] motion-safe:animate-escrever lg:text-4xl"
          >
            corte novo, energia nova
          </p>

          {/* Cada linha do título sobe "de dentro" de uma máscara, uma a seguir à outra */}
          <h1 className="mt-1 text-[42px] font-extrabold uppercase leading-[0.95] font-stretch-125% lg:mt-3 lg:text-7xl">
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
            className="mt-2.5 text-[15px] leading-snug text-texto-2 motion-safe:animate-entrar lg:mt-6 lg:max-w-md lg:text-lg"
          >
            Escolhe o barbeiro, o serviço e a hora. Fica marcado em menos de um minuto.
          </p>

          <div style={{ animationDelay: "550ms" }} className="motion-safe:animate-entrar">
            <BotaoPrimario href="/marcar" className="mt-6 justify-between lg:mt-10 lg:w-80">
              MARCAR AGORA
              <IconeSeta className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </BotaoPrimario>
          </div>

          <dl
            style={{ animationDelay: "650ms" }}
            className="mt-6 grid grid-cols-2 gap-3 border-y border-divisor py-3.5 motion-safe:animate-entrar lg:mt-10 lg:max-w-md"
          >
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.22em] text-texto-3">HORÁRIO</dt>
              <dd className="text-sm font-semibold">Ter a Sáb</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] tracking-[0.22em] text-texto-3">MORADA</dt>
              <dd className="text-sm font-semibold">[MORADA]</dd>
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
      <section className="flex flex-col gap-2.5 px-5 pt-8 lg:gap-5 lg:px-0 lg:pt-16">
        <div className="ao-scroll flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-[0.24em]">TRABALHOS RECENTES</h2>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="group link-sublinhado flex items-center gap-1 text-[13px] text-texto-2 hover:text-texto"
          >
            Ver Instagram
            <IconeExterno className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
        <div className="grid grid-cols-3 gap-1.5 lg:gap-4">
          {[1, 2, 3].map((n) => (
            <a
              key={n}
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Trabalho recente ${n} no Instagram`}
              className="ao-scroll group block overflow-hidden lg:rounded"
            >
              <div className="aspect-square bg-superficie-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
            </a>
          ))}
        </div>
      </section>

      <NavInferior ativo="inicio" />
    </main>
  );
}
