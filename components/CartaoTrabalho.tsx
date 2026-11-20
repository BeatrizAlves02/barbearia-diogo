"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  atraso?: number; // ms — no computador, para as três não mudarem exatamente ao mesmo tempo
  children: React.ReactNode;
};

/**
 * Cartão dos trabalhos recentes (só para ver, não é um link).
 * Fica "ativo" (a cores e ligeiramente aproximado) só enquanto está na zona
 * central do ecrã. Antes de lá chegar e depois de passar, volta a preto e branco.
 * Funciona nos dois sentidos do scroll.
 */
export function CartaoTrabalho({ atraso = 0, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setAtivo(e.isIntersecting), {
      // só conta a zona do meio do ecrã (tira 20% em cima e 25% em baixo, onde fica a barra do telemóvel)
      rootMargin: "-20% 0px -25% 0px",
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-ativo={ativo}
      style={{ "--atraso": `${atraso}ms` } as React.CSSProperties}
      className="ao-scroll group/cartao relative aspect-[4/5] overflow-hidden rounded bg-superficie-2"
    >
      {children}
    </div>
  );
}
