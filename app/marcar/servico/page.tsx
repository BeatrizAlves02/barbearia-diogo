import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EscolherServico } from "@/components/marcar/EscolherServico";
import { EsqueletoMarcacao } from "@/components/marcar/EsqueletoMarcacao";
import { PainelResumo } from "@/components/marcar/PainelResumo";
import { BotaoContinuar } from "@/components/marcar/BotaoContinuar";

type Props = { searchParams: Promise<{ barbeiro?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RESUMO_VAZIO = (
  <PainelResumo
    linhas={[
      { rotulo: "Barbeiro", valor: "Por escolher", vazio: true },
      { rotulo: "Serviço", valor: "Por escolher", vazio: true },
      { rotulo: "Data e hora", valor: "Por escolher", vazio: true },
    ]}
    acao={<BotaoContinuar href={null}>CONTINUAR</BotaoContinuar>}
  />
);

/* Enquanto os dados chegam: a mesma página com cartões a pulsar */
function ACarregar() {
  return (
    <EsqueletoMarcacao passo={2} voltar="/marcar" titulo="O que queres marcar?" subtitulo="Escolhe o serviço." lateral={RESUMO_VAZIO}>
      <div className="flex flex-col gap-2.5 lg:gap-3" aria-hidden="true">
        <div className="h-16 rounded bg-superficie motion-safe:animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-19 rounded bg-superficie motion-safe:animate-pulse lg:h-24" />
        ))}
      </div>
    </EsqueletoMarcacao>
  );
}

function EscolhaInvalida() {
  return (
    <EsqueletoMarcacao passo={2} voltar="/marcar" titulo="O que queres marcar?" subtitulo="Escolhe o serviço." lateral={RESUMO_VAZIO}>
      <div className="flex flex-col items-start gap-3 rounded border border-borda p-4">
        <p className="text-sm text-texto-2">Não encontrámos o barbeiro escolhido.</p>
        <Link href="/marcar" className="link-sublinhado text-sm font-bold">
          Escolher barbeiro
        </Link>
      </div>
    </EsqueletoMarcacao>
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

  if (error) return <p className="p-5 text-red-400">Erro: {error.message}</p>;

  return <EscolherServico barbeiro={barbeiro} nomeBarbeiro={nomeBarbeiro} servicos={servicos ?? []} />;
}

export default function EscolherServicoPagina({ searchParams }: Props) {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}
