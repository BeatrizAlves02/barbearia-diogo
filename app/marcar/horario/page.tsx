import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { barbeirosAtivos, servicoPorId } from "@/lib/dados-publicos";
import { hojeEmLisboa } from "@/lib/formatar";
import { adicionarDias } from "@/lib/datas";
import { buscarVagas } from "./actions";
import { EscolherHorario } from "@/components/marcar/EscolherHorario";
import { EsqueletoMarcacao } from "@/components/marcar/EsqueletoMarcacao";
import { PainelResumo } from "@/components/marcar/PainelResumo";
import { BotaoContinuar } from "@/components/marcar/BotaoContinuar";

type Props = { searchParams: Promise<{ barbeiro?: string; servico?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RESUMO_VAZIO = (
  <PainelResumo
    linhas={[
      { rotulo: "Serviço", valor: "…", vazio: true },
      { rotulo: "Data e hora", valor: "Por escolher", vazio: true },
    ]}
    acao={<BotaoContinuar href={null}>CONTINUAR</BotaoContinuar>}
  />
);

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <EsqueletoMarcacao passo={2} voltar="/marcar" titulo="Dia e hora" subtitulo="Escolhe quando queres vir." lateral={RESUMO_VAZIO}>
      {children}
    </EsqueletoMarcacao>
  );
}

/* Enquanto os dados chegam */
function ACarregar() {
  return (
    <Moldura>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <div className="h-30 rounded bg-superficie motion-safe:animate-pulse" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-17 rounded bg-superficie motion-safe:animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-12 rounded bg-superficie motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    </Moldura>
  );
}

function EscolhaInvalida() {
  return (
    <Moldura>
      <div className="flex flex-col items-start gap-3 rounded border border-borda p-4">
        <p className="text-sm text-texto-2">Faltam dados da marcação. Começa outra vez, é rápido.</p>
        <Link href="/marcar" className="link-sublinhado text-sm font-bold">
          Começar a marcação
        </Link>
      </div>
    </Moldura>
  );
}

async function Conteudo({ searchParams }: Props) {
  const { barbeiro = "", servico = "" } = await searchParams;
  if (!(barbeiro === "qualquer" || UUID.test(barbeiro)) || !UUID.test(servico)) return <EscolhaInvalida />;

  const supabase = await createClient();
  const [servicoEscolhido, barbeiros] = await Promise.all([servicoPorId(servico), barbeirosAtivos()]);
  const s = servicoEscolhido?.ativo ? servicoEscolhido : null;

  if (!s) return <EscolhaInvalida />;
  const nomes: Record<string, string> = Object.fromEntries((barbeiros ?? []).map((b) => [b.id, b.nome]));
  if (barbeiro !== "qualquer" && !nomes[barbeiro]) return <EscolhaInvalida />;

  // Vagas da primeira semana (a partir de hoje)
  const hoje = hojeEmLisboa();
  const semana = await buscarVagas(barbeiro, s.id, hoje, adicionarDias(hoje, 6));

  return (
    <EscolherHorario
      key={`${barbeiro}-${s.id}`} // ao trocar de serviço, começa do zero (horas de 30 em 30 ou de 60 em 60)
      barbeiro={barbeiro}
      nomeBarbeiro={barbeiro === "qualquer" ? "Primeiro disponível" : nomes[barbeiro]}
      servico={s}
      hoje={hoje}
      semanaInicial={semana}
      nomes={nomes}
    />
  );
}

export default function EscolherHorarioPagina({ searchParams }: Props) {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}
