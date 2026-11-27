import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { barbeiroComSessao } from "@/lib/gestao";
import { hojeEmLisboa } from "@/lib/formatar";
import { dataValida, inicioDoDiaEmLisboa } from "@/lib/datas";
import { deslocar, periodo, resumir, VISTAS, type MarcacaoFaturada, type Vista } from "@/lib/faturacao";
import { CabecalhoGestao } from "@/components/gestao/CabecalhoGestao";
import { Faturacao } from "@/components/gestao/Faturacao";

export const metadata = { title: "Faturação · Gestão" };

type Props = { searchParams: Promise<{ vista?: string; data?: string }> };

type Linha = {
  inicio: string;
  estado: MarcacaoFaturada["estado"];
  valor_cobrado: number | null;
  metodo_pagamento: MarcacaoFaturada["metodo"];
  cliente_nome: string;
  servicos: { nome: string; preco: number | null } | null;
};

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-16 lg:max-w-7xl lg:px-10 xl:max-w-[1440px] xl:px-14 2xl:max-w-[1680px]">
      {children}
    </main>
  );
}

function ACarregar() {
  return (
    <Moldura>
      <div className="h-18 border-b border-divisor" />
      <div className="mt-8 flex flex-col gap-4" aria-hidden="true">
        <div className="h-12 w-full max-w-md rounded-full bg-superficie motion-safe:animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="h-72 rounded-lg bg-superficie motion-safe:animate-pulse" />
          <div className="h-72 rounded-lg bg-superficie motion-safe:animate-pulse" />
        </div>
      </div>
    </Moldura>
  );
}

async function Conteudo({ searchParams }: Props) {
  await connection();
  const { vista: v = "", data: d = "" } = await searchParams;
  const { supabase, user, barbeiro } = await barbeiroComSessao();
  if (!user) redirect("/gestao/entrar");
  if (!barbeiro) redirect("/gestao");

  const hoje = hojeEmLisboa();
  const vista: Vista = (VISTAS as string[]).includes(v) ? (v as Vista) : "dia"; // abre sempre no dia de hoje
  const data = dataValida(d) ? d : hoje;
  const atual = periodo(vista, data);
  const anterior = periodo(vista, deslocar(vista, data, -1));

  // Marcações do período anterior + do atual, numa só ida à base de dados
  const { data: linhas, error } = await supabase
    .from("marcacoes")
    .select("inicio, estado, valor_cobrado, metodo_pagamento, cliente_nome, servicos(nome, preco)")
    .eq("barbeiro_id", barbeiro.id)
    .gte("inicio", inicioDoDiaEmLisboa(anterior.de))
    .lt("inicio", inicioDoDiaEmLisboa(atual.ate))
    .order("inicio");

  const corte = new Date(inicioDoDiaEmLisboa(atual.de)).getTime();
  const todas: MarcacaoFaturada[] = ((linhas ?? []) as unknown as Linha[]).map((l) => ({
    inicio: l.inicio,
    estado: l.estado,
    valor: Number(l.valor_cobrado ?? 0), // igual à agenda: conta o que foi cobrado
    metodo: l.metodo_pagamento,
    servico: l.servicos?.nome ?? "Serviço",
    cliente: l.cliente_nome,
  }));
  const resumo = resumir(
    vista,
    data,
    todas.filter((m) => new Date(m.inicio).getTime() >= corte),
    todas.filter((m) => new Date(m.inicio).getTime() < corte)
  );

  return (
    <Moldura>
      <CabecalhoGestao nome={barbeiro.nome} />
      <Faturacao
        vista={vista}
        de={atual.de}
        ate={atual.ate}
        hoje={hoje}
        anteriorData={deslocar(vista, data, -1)}
        seguinteData={deslocar(vista, data, 1)}
        resumo={resumo}
        erro={error?.message ?? null}
      />
    </Moldura>
  );
}

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
