"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo curto que se comporta como um GIF: sem som, em repetição.
 * Só toca quando está visível no ecrã (poupa bateria e dados) e
 * não toca sozinho para quem tem "reduzir movimento" ligado no telemóvel.
 */
export function VideoTrabalho({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observador.observe(video);
    return () => observador.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={className}
    >
      {/* #t=0.1 faz o iPhone mostrar a primeira imagem antes de tocar */}
      <source src={`${src}#t=0.1`} type="video/mp4" />
    </video>
  );
}
