import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopoPasso } from "@/components/TopoPasso";
import { EscolherServico } from "@/components/marcar/EscolherServico";

type Props = { searchParams: Promise<{ barbeiro?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Cartão com o barbeiro escolhido no passo anterior + "Alterar" */
function BarbeiroEscolhido({ nome }: { nome: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-borda px-4 py-3 motion-safe:animate-entrar">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-superficie-2 text-sm font-extrabold font-stretch-125%">
          {nome === "Primeiro disponível" ? "·" : nome.charAt(0)}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.22em] text-texto-3">BARBEIRO</span>
          <span className="text-sm font-bold">{nome}</span>
        </div>
      </div>
      <Link href="/marcar" className="link-sublinhado text-[13px] text-texto-2 hover:text-texto">
        Alterar
      </Link>
    </div>
  );
}

function EscolhaInvalida() {
  return (
    <div className="flex flex-col items-start gap-3 rounded border border-borda p-4">
      <p className="text-sm text-texto-2">Não encontrámos o barbeiro escolhido.</p>
      <Link href="/marcar" className="link-sublinhado text-sm font-bold">
        Escolher barbeiro
      </Link>
    </div>
  );
}

async function Conteudo({ searchParams }: Props) {
  const { barbeiro = "" } = await searchParams;
  const supabase = await createClient();

  // Quem foi escolhido no passo 1?
  let nomeBarbeiro = "Primeiro disponível";
  if (barbeiro !== "qualquer") {
    if (!UUID.test(barbeiro)) return <EscolhaInvalida />;
    const { data } = await supabase
      .from("barbeiros")
      .select("nome")
      .eq("id", barbeiro)
      .eq("ativo", true)
      .maybeSingle();
    if (!data) return <EscolhaInvalida />;
    nomeBarbeiro = data.nome;
  }

  const { data: servicos, error } = await supabase
    .from("servicos")
    .select("id, nome, duracao_min, preco")
    .eq("ativo", true)
    .order("ordem");

  if (error) return <p className="text-red-400">Erro: {error.message}</p>;

  return (
    <>
      <BarbeiroEscolhido nome={nomeBarbeiro} />
      <EscolherServico barbeiro={barbeiro} servicos={servicos ?? []} />
    </>
  );
}

function ACarregar() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      <div className="h-16 rounded bg-superficie motion-safe:animate-pulse" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-19 rounded bg-superficie motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export default function EscolherServicoPagina({ searchParams }: Props) {
  return (
    <main className="mx-auto min-h-dvh max-w-md pb-52">
      <TopoPasso passo={2} voltar="/marcar" />

      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="flex flex-col gap-1.5 motion-safe:animate-entrar">
          <h1 className="text-[30px] font-extrabold uppercase leading-none font-stretch-125%">
            O que queres marcar?
          </h1>
          <p className="text-sm text-texto-3">Escolhe o serviço.</p>
        </div>

        <Suspense fallback={<ACarregar />}>
          <Conteudo searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
