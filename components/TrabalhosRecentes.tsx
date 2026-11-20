import Image from "next/image";
import { IconeExterno } from "@/components/icones";
import { CartaoTrabalho } from "@/components/CartaoTrabalho";
import { VideoTrabalho } from "@/components/VideoTrabalho";

const INSTAGRAM = "https://www.instagram.com/diogo.pimenta.barber/";

type Trabalho =
  | { tipo: "foto"; src: string; alt: string; link: string }
  | { tipo: "video"; src: string; link: string };

const TRABALHOS: Trabalho[] = [
  { tipo: "foto", src: "/trabalho-1.jpg", alt: "Diogo a fazer um degradê com risco", link: INSTAGRAM },
  { tipo: "video", src: "/trabalho-video.mp4", link: "https://www.instagram.com/p/DdUA3SssKKv/" },
  { tipo: "foto", src: "/trabalho-2.jpg", alt: "Diogo a acabar um corte em cabelo encaracolado", link: INSTAGRAM },
];

/*
  Fora do meio do ecrã: preto e branco e um pouco mais escuro.
  No meio do ecrã (data-ativo=true): ganha cor e aproxima-se suavemente.
  A transição demora ~1s e respeita o atraso de cada cartão.
*/
const MEDIA =
  "object-cover grayscale brightness-75 transition-[filter,scale] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] delay-(--atraso) group-data-[ativo=true]/cartao:grayscale-0 group-data-[ativo=true]/cartao:brightness-100 motion-safe:group-data-[ativo=true]/cartao:scale-105";

export function TrabalhosRecentes() {
  return (
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
        {TRABALHOS.map((t, i) => (
          <CartaoTrabalho
            key={t.src}
            href={t.link}
            atraso={i * 150}
            rotulo={t.tipo === "video" ? "Vídeo de um corte no Instagram" : `${t.alt} — ver no Instagram`}
          >
            {t.tipo === "foto" ? (
              <Image src={t.src} alt="" fill sizes="(min-width: 1024px) 300px, 33vw" className={MEDIA} />
            ) : (
              <VideoTrabalho src={t.src} className={`absolute inset-0 size-full ${MEDIA}`} />
            )}
          </CartaoTrabalho>
        ))}
      </div>
    </section>
  );
}
