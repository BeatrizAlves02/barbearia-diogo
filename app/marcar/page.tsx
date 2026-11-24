import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EscolherServico } from "@/components/marcar/EscolherServico";
import { EsqueletoMarcacao } from "@/components/marcar/EsqueletoMarcacao";
import { PainelResumo } from "@/components/marcar/PainelResumo";
import { BotaoContinuar } from "@/components/marcar/BotaoContinuar";

/*
  Passo 1 — Serviço.
  Como agora só há um barbeiro (o Diogo), ele é escolhido automaticamente:
  é o primeiro barbeiro ativo na base de dados.
*/

const RESUMO_VAZIO = (
  <PainelResumo
    linhas={[
      { rotulo: "Serviço", valor: "Por escolher", vazio: true },
      { rotulo: "Data e hora", valor: "Por escolher", vazio: true },
    ]}
    acao={<BotaoContinuar href={null}>CONTINUAR</BotaoContinuar>}
  />
);

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <EsqueletoMarcacao passo={1} voltar="/" titulo="O que queres marcar?" subtitulo="Escolhe o serviço." lateral={RESUMO_VAZIO}>
      {children}
    </EsqueletoMarcacao>
  );
}

/* Enquanto os dados chegam: a mesma página com cartões a pulsar */
function ACarregar() {
  return (
    <Moldura>
      <div className="flex flex-col gap-2.5 lg:gap-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-19 rounded bg-superficie motion-safe:animate-pulse lg:h-24" />
        ))}
      </div>
    </Moldura>
  );
}

async function Conteudo() {
  const supabase = await createClient();
  const [{ data: barbeiro }, { data: servicos, error }] = await Promise.all([
    supabase.from("barbeiros").select("id").eq("ativo", true).order("ordem").limit(1).maybeSingle(),
    supabase.from("servicos").select("id, nome, duracao_min, preco").eq("ativo", true).order("ordem"),
  ]);

  if (error) return <Moldura><p className="text-red-400">Erro: {error.message}</p></Moldura>;
  if (!barbeiro) {
    return (
      <Moldura>
        <p className="rounded border border-borda p-4 text-sm text-texto-2">De momento não é possível marcar online.</p>
      </Moldura>
    );
  }

  return <EscolherServico barbeiro={barbeiro.id} servicos={servicos ?? []} />;
}

export default function MarcarPagina() {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo />
    </Suspense>
  );
}
