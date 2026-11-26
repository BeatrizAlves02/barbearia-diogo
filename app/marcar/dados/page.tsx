import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { barbeiroPorId, servicoPorId } from "@/lib/dados-publicos";
import { diaEmLisboa } from "@/lib/datas";
import { UUID, listaDePaises } from "@/lib/validar";
import { FormularioDados } from "@/components/marcar/FormularioDados";
import { EsqueletoMarcacao } from "@/components/marcar/EsqueletoMarcacao";
import { PainelResumo } from "@/components/marcar/PainelResumo";
import { BotaoContinuar } from "@/components/marcar/BotaoContinuar";

type Props = { searchParams: Promise<{ barbeiro?: string; servico?: string; inicio?: string }> };

const RESUMO_VAZIO = (
  <PainelResumo
    linhas={[
      { rotulo: "Serviço", valor: "…", vazio: true },
      { rotulo: "Data e hora", valor: "…", vazio: true },
    ]}
    acao={<BotaoContinuar href={null}>CONFIRMAR MARCAÇÃO</BotaoContinuar>}
  />
);

function Moldura({ voltar = "/marcar", children }: { voltar?: string; children: React.ReactNode }) {
  return (
    <EsqueletoMarcacao
      passo={3}
      voltar={voltar}
      titulo="Os teus dados"
      subtitulo="Só precisamos disto para guardar a tua marcação."
      lateral={RESUMO_VAZIO}
    >
      {children}
    </EsqueletoMarcacao>
  );
}

function ACarregar() {
  return (
    <Moldura>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <div className="h-44 rounded bg-superficie motion-safe:animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-13 rounded bg-superficie motion-safe:animate-pulse" />
        ))}
      </div>
    </Moldura>
  );
}

function Aviso({ texto, link, rotulo, voltar }: { texto: string; link: string; rotulo: string; voltar?: string }) {
  return (
    <Moldura voltar={voltar}>
      <div className="flex flex-col items-start gap-3 rounded border border-borda p-5">
        <p className="text-sm text-texto-2">{texto}</p>
        <Link href={link} className="link-sublinhado text-sm font-bold">
          {rotulo}
        </Link>
      </div>
    </Moldura>
  );
}

async function Conteudo({ searchParams }: Props) {
  const { barbeiro = "", servico = "", inicio = "" } = await searchParams;
  const dataInicio = new Date(inicio);
  if (!UUID.test(barbeiro) || !UUID.test(servico) || Number.isNaN(dataInicio.getTime())) {
    return <Aviso texto="Faltam dados da marcação. Começa outra vez, é rápido." link="/marcar" rotulo="Começar a marcação" />;
  }

  const supabase = await createClient();
  const [servicoEscolhido, b] = await Promise.all([servicoPorId(servico), barbeiroPorId(barbeiro)]);
  const s = servicoEscolhido?.ativo ? servicoEscolhido : null;
  if (!s || !b) {
    return <Aviso texto="Não encontrámos o barbeiro ou o serviço escolhido." link="/marcar" rotulo="Começar a marcação" />;
  }

  // A hora escolhida ainda está livre?
  const voltarHorario = `/marcar/horario?barbeiro=${barbeiro}&servico=${servico}`;
  const dia = diaEmLisboa(dataInicio.toISOString());
  const { data: vagas } = await supabase.rpc("vagas", {
    p_barbeiro: barbeiro,
    p_de: dia,
    p_ate: dia,
    p_duracao: s.duracao_min,
  });
  const livre = ((vagas ?? []) as { inicio: string }[]).some(
    (v) => new Date(v.inicio).getTime() === dataInicio.getTime()
  );
  if (!livre) {
    return (
      <Aviso
        texto="Esta hora já não está disponível."
        link={voltarHorario}
        rotulo="Escolher outra hora"
        voltar={voltarHorario}
      />
    );
  }

  return (
    <FormularioDados
      barbeiro={barbeiro}
      nomeBarbeiro={b.nome}
      servico={s}
      inicio={dataInicio.toISOString()}
      paises={listaDePaises()}
    />
  );
}

export default function DadosPagina({ searchParams }: Props) {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}
