"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteBrowser } from "@/lib/supabase/browser";
import { diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";

type Aviso = { id: number; titulo: string; texto: string; dia: string };

/**
 * Mantém a agenda atualizada sozinha:
 *  - recebe em tempo real as marcações novas/alteradas (Supabase Realtime) e atualiza a página;
 *  - mostra um aviso quando entra uma marcação nova;
 *  - volta a atualizar quando o Diogo regressa à app (ex.: desbloqueia o telemóvel).
 */
export function AtualizacaoAutomatica() {
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Junta várias alterações seguidas numa só atualização
    const atualizar = () => {
      if (espera.current) clearTimeout(espera.current);
      espera.current = setTimeout(() => router.refresh(), 400);
    };

    const supabase = criarClienteBrowser();
    const canal = supabase
      .channel("agenda-marcacoes")
      .on("postgres_changes", { event: "*", schema: "public", table: "marcacoes" }, (alteracao) => {
        atualizar();
        if (alteracao.eventType === "INSERT") {
          const nova = alteracao.new as { cliente_nome?: string; inicio?: string };
          if (nova.inicio) {
            const dia = diaEmLisboa(nova.inicio);
            const aviso = {
              id: Date.now(),
              titulo: "Nova marcação",
              texto: `${nova.cliente_nome ?? "Cliente"} · ${formatarDiaCurto(dia)}, ${horaEmLisboa(nova.inicio)}`,
              dia,
            };
            setAvisos((a) => [...a, aviso]);
            setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== aviso.id)), 8000);
          }
        }
      })
      .subscribe();

    // Ao voltar à app depois de estar noutra aba / com o ecrã bloqueado
    const aoVoltar = () => {
      if (document.visibilityState === "visible") atualizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    // Rede de segurança: atualiza também a cada 2 minutos
    const intervalo = setInterval(atualizar, 120_000);

    return () => {
      supabase.removeChannel(canal);
      document.removeEventListener("visibilitychange", aoVoltar);
      clearInterval(intervalo);
      if (espera.current) clearTimeout(espera.current);
    };
  }, [router]);

  if (!avisos.length) return null;

  return (
    <div aria-live="polite" className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-sm flex-col gap-2 px-4 lg:right-6 lg:left-auto lg:mx-0">
      {avisos.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => {
            setAvisos((lista) => lista.filter((x) => x.id !== a.id));
            router.push(`/gestao?dia=${a.dia}`);
          }}
          className="flex items-center gap-3 rounded-lg border border-texto bg-texto p-4 text-left text-tinta shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] motion-safe:animate-descer"
        >
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-tinta motion-safe:animate-ping" />
            <span className="relative size-2.5 rounded-full bg-tinta" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold tracking-[0.2em]">{a.titulo.toUpperCase()}</span>
            <span className="truncate text-sm font-bold">{a.texto}</span>
          </span>
          <span className="ml-auto text-[10px] font-bold tracking-[0.14em] opacity-60">VER</span>
        </button>
      ))}
    </div>
  );
}
