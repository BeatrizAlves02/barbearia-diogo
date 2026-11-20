import Image from "next/image";
import { IconeExterno } from "@/components/icones";
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

/* Cada fotografia entra um pouco depois da anterior ao fazer scroll */
const ENTRADAS = ["entry 0% cover 30%", "entry 10% cover 40%", "entry 20% cover 50%"];

/* A imagem aproxima-se ao passar o rato. No computador está a preto e branco e ganha cor no hover */
const MEDIA =
  "object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-focus-visible:scale-105 lg:grayscale lg:group-hover:grayscale-0 lg:group-focus-visible:grayscale-0";

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
          <a
            key={t.src}
            href={t.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.tipo === "video" ? "Vídeo de um corte no Instagram" : `${t.alt} — ver no Instagram`}
            style={{ animationRange: ENTRADAS[i] }}
            className="ao-scroll group relative block aspect-[4/5] overflow-hidden rounded-sm bg-superficie-2 outline-none lg:rounded"
          >
            {t.tipo === "foto" ? (
              <Image src={t.src} alt="" fill sizes="(min-width: 1024px) 300px, 33vw" className={MEDIA} />
            ) : (
              <VideoTrabalho src={t.src} className={`absolute inset-0 size-full ${MEDIA}`} />
            )}

            {/* Escurecido em baixo, para o texto se ler */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/0 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Selo de vídeo, com um ponto a "piscar" como gravação */}
            {t.tipo === "video" && (
              <span className="absolute left-1.5 top-1.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[8px] font-bold tracking-[0.2em] backdrop-blur-sm lg:left-3 lg:top-3 lg:px-2.5 lg:text-[10px]">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 rounded-full bg-texto motion-safe:animate-ping" />
                  <span className="relative size-1.5 rounded-full bg-texto" />
                </span>
                VÍDEO
              </span>
            )}

            {/* Número + "Ver no Instagram" que sobe ao passar o rato (só no computador) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-between p-4 lg:flex">
              <span className="text-xs font-bold tracking-[0.2em] font-stretch-125%">0{i + 1}</span>
              <span className="flex translate-y-3 items-center gap-1.5 text-xs font-bold tracking-[0.14em] opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                VER NO INSTAGRAM
                <IconeExterno className="size-3.5" />
              </span>
            </div>

            {/* Contorno ao navegar com o teclado */}
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-texto ring-inset group-focus-visible:ring-2" />
          </a>
        ))}
      </div>
    </section>
  );
}
