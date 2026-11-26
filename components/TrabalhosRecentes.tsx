import Image from "next/image";
import { IconeExterno } from "@/components/icones";
import { CartaoTrabalho } from "@/components/CartaoTrabalho";
import { VideoTrabalho } from "@/components/VideoTrabalho";

const INSTAGRAM = "https://www.instagram.com/diogo.pimenta.barber/";

type Trabalho = { tipo: "foto"; src: string; alt: string } | { tipo: "video"; src: string };

const TRABALHOS: Trabalho[] = [
  { tipo: "foto", src: "/trabalho-1.jpg", alt: "Diogo a fazer um degradê com risco" },
  { tipo: "video", src: "/trabalho-video.mp4" },
  { tipo: "foto", src: "/trabalho-2.jpg", alt: "Diogo a acabar um corte em cabelo encaracolado" },
];

/*
  Fora do meio do ecrã: preto e branco e um pouco mais escuro.
  No meio do ecrã (data-ativo=true): ganha cor e aproxima-se suavemente.
  A transição demora ~1s. No computador, as três mudam uma a seguir à outra.
*/
const MEDIA =
  "object-cover grayscale brightness-75 transition-[filter,scale] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] lg:delay-(--atraso) group-data-[ativo=true]/cartao:grayscale-0 group-data-[ativo=true]/cartao:brightness-100 motion-safe:group-data-[ativo=true]/cartao:scale-105";

export function TrabalhosRecentes() {
  return (
    <section className="flex flex-col gap-2.5 px-5 pt-8 lg:gap-5 lg:px-0 lg:pt-16">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.24em]">TRABALHOS RECENTES</h2>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="group link-sublinhado flex items-center gap-1 text-[13px] text-texto-2 transition-opacity hover:text-texto active:text-texto active:opacity-60"
        >
          Ver Instagram
          <IconeExterno className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Telemóvel: uma por baixo da outra · Computador: três lado a lado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        {TRABALHOS.map((t, i) => (
          <CartaoTrabalho key={t.src} atraso={i * 150}>
            {t.tipo === "foto" ? (
              <Image src={t.src} alt={t.alt} fill sizes="(min-width: 640px) 33vw, 100vw" className={MEDIA} />
            ) : (
              <VideoTrabalho src={t.src} className={`absolute inset-0 size-full ${MEDIA}`} />
            )}
          </CartaoTrabalho>
        ))}
      </div>
    </section>
  );
}
