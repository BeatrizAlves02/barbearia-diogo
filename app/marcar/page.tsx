import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeEmLisboa } from "@/lib/formatar";
import { TopoPasso } from "@/components/TopoPasso";
import { IconeSeta } from "@/components/icones";

type CartaoProps = {
  href: string;
  inicial: string;
  titulo: string;
  subtitulo?: string;
  disponivel?: boolean;
  atraso: number; // em milissegundos — faz os cartões entrarem um a um
};

function CartaoBarbeiro({ href, inicial, titulo, subtitulo, disponivel = true, atraso }: CartaoProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${atraso}ms` }}
      className="group flex min-h-19 items-center gap-4 rounded border border-borda px-4 py-3 transition-[border-color,background-color,transform] duration-200 hover:border-texto hover:bg-superficie-2 active:scale-[0.98] motion-safe:animate-entrar"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-superficie-2 text-lg font-extrabold font-stretch-125% transition-colors duration-200 group-hover:bg-texto group-hover:text-tinta">
        {inicial}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-base font-bold uppercase tracking-wide">{titulo}</span>
        {subtitulo && (
          <span className="flex items-center gap-2 text-[13px] text-texto-3">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${disponivel ? "bg-texto" : "bg-desativado"}`}
            />
            {subtitulo}
          </span>
        )}
      </span>
      <IconeSeta className="size-5 text-texto-3 transition-[color,transform] duration-200 group-hover:translate-x-1 group-hover:text-texto" />
    </Link>
  );
}

async function ListaBarbeiros() {
  const supabase = await createClient();
  const { data: barbeiros, error } = await supabase
    .from("barbeiros")
    .select("id, nome, foto_url")
    .eq("ativo", true)
    .order("ordem");

  if (error) return <p className="text-red-400">Erro: {error.message}</p>;

  const lista = barbeiros ?? [];

  // Horário de hoje de cada barbeiro (habitual ou o que ele mudou para hoje)
  const hoje = hojeEmLisboa();
  const horarios = await Promise.all(
    lista.map((b) => supabase.rpc("horario_do_dia", { p_barbeiro: b.id, p_data: hoje }))
  );

  return (
    <ul className="flex flex-col gap-2.5">
      {lista.map((b, i) => {
        const h = horarios[i].data?.[0];
        const aberto = Boolean(h?.aberto && h.abre && h.fecha);
        return (
          <li key={b.id}>
            <CartaoBarbeiro
              href={`/marcar/servico?barbeiro=${b.id}`}
              inicial={b.nome.charAt(0)}
              titulo={b.nome}
              subtitulo={aberto ? `Hoje · ${h.abre.slice(0, 5)} – ${h.fecha.slice(0, 5)}` : "Hoje não está"}
              disponivel={aberto}
              atraso={100 + i * 70}
            />
          </li>
        );
      })}
      <li>
        <CartaoBarbeiro
          href="/marcar/servico?barbeiro=qualquer"
          inicial="·"
          titulo="Primeiro disponível"
          subtitulo="Mostra todos os horários livres"
          atraso={100 + lista.length * 70}
        />
      </li>
    </ul>
  );
}

// Cartões cinzentos a pulsar enquanto os dados chegam
function ListaACarregar() {
  return (
    <ul className="flex flex-col gap-2.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-19 rounded bg-superficie motion-safe:animate-pulse" />
      ))}
    </ul>
  );
}

export default function ComQuem() {
  return (
    <main className="mx-auto min-h-dvh max-w-md pb-10">
      <TopoPasso passo={1} voltar="/" />

      <div className="flex flex-col gap-6 px-5 pt-6">
        <div className="flex flex-col gap-1.5 motion-safe:animate-entrar">
          <h1 className="text-[30px] font-extrabold uppercase leading-none font-stretch-125%">Com quem?</h1>
          <p className="text-sm text-texto-3">Escolhe o teu barbeiro.</p>
        </div>

        <Suspense fallback={<ListaACarregar />}>
          <ListaBarbeiros />
        </Suspense>
      </div>
    </main>
  );
}
