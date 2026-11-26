import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";
import { barbeiroComSessao } from "@/lib/gestao";
import { hojeEmLisboa } from "@/lib/formatar";
import {
  adicionarDias,
  dataValida,
  diaEmLisboa,
  horaEmLisboa,
  inicioDoDiaEmLisboa,
  primeiroDoMes,
  segundaDaSemana,
} from "@/lib/datas";
import { CabecalhoGestao } from "@/components/gestao/CabecalhoGestao";
import { Agenda } from "@/components/gestao/Agenda";
import { SessaoInativa } from "@/components/gestao/SessaoInativa";
import type { MarcacaoAgenda } from "@/components/gestao/CartaoMarcacao";
import { sair } from "./actions";

type Props = { searchParams: Promise<{ dia?: string }> };

type Linha = {
  id: string;
  inicio: string;
  fim: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  nota: string | null;
  estado: MarcacaoAgenda["estado"];
  valor_cobrado: number | null;
  metodo_pagamento: MarcacaoAgenda["metodo"];
  motivo_cancelamento: string | null;
  cancelado_por: MarcacaoAgenda["canceladoPor"];
  servicos: { nome: string; preco: number | null } | null;
};

/* "+351932506203" → texto "932 506 203" e link "+351932506203" (números antigos sem +351 também funcionam) */
function telefone(numero: string | null) {
  if (!numero) return { texto: null, link: null };
  const n = parsePhoneNumberFromString(numero, "PT");
  if (!n) return { texto: numero, link: numero };
  return { texto: n.country === "PT" ? n.formatNational() : n.formatInternational(), link: n.number };
}

function Moldura({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-16 lg:max-w-7xl lg:px-10 xl:max-w-[1440px] xl:px-14 2xl:max-w-[1680px]">{children}</main>;
}

function ACarregar() {
  return (
    <Moldura>
      <div className="h-18 border-b border-divisor" />
      <div className="mt-6 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-[27.5rem_minmax(0,1fr)] lg:items-start lg:gap-12" aria-hidden="true">
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 rounded bg-superficie motion-safe:animate-pulse" />
          <div className="h-16 rounded-lg bg-superficie motion-safe:animate-pulse lg:h-96" />
          <div className="h-24 rounded-lg bg-superficie motion-safe:animate-pulse" />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-lg bg-superficie motion-safe:animate-pulse lg:h-32" />
          ))}
        </div>
      </div>
    </Moldura>
  );
}

async function Conteudo({ searchParams }: Props) {
  await connection(); // a agenda é sempre gerada no momento (usa a hora atual)
  const { dia: pedido = "" } = await searchParams;
  const { supabase, user, barbeiro } = await barbeiroComSessao();
  if (!user) redirect("/gestao/entrar");

  // Conta criada mas sem acesso a nenhum barbeiro
  if (!barbeiro) {
    return (
      <Moldura>
        <div className="flex min-h-dvh flex-col items-start justify-center gap-4">
          <h1 className="text-2xl font-extrabold uppercase font-stretch-125%">Conta sem acesso</h1>
          <p className="text-sm text-texto-2">
            A conta <strong>{user.email}</strong> entrou bem, mas ainda não tem acesso à agenda.
          </p>
          <form action={sair}>
            <button type="submit" className="link-sublinhado text-sm font-bold">
              Sair
            </button>
          </form>
        </div>
      </Moldura>
    );
  }

  const hoje = hojeEmLisboa();
  const dia = dataValida(pedido) ? pedido : hoje;

  // Carrega o mês inteiro de uma vez (da segunda antes do dia 1 até ao domingo depois do último dia).
  // Assim, mudar de dia dentro do mês é instantâneo, sem voltar ao servidor.
  const inicioGrelha = segundaDaSemana(primeiroDoMes(dia));
  const fimGrelha = adicionarDias(segundaDaSemana(adicionarDias(primeiroDoMes(dia, 1), -1)), 7);
  const grelha: string[] = [];
  for (let d = inicioGrelha; d < fimGrelha; d = adicionarDias(d, 1)) grelha.push(d);

  const de = inicioDoDiaEmLisboa(inicioGrelha);
  const ate = inicioDoDiaEmLisboa(fimGrelha);

  const [{ data, error }, { data: semanal }, { data: excecoes }, { data: bloqueios }] = await Promise.all([
    supabase
    .from("marcacoes")
    .select(
      "id, inicio, fim, cliente_nome, cliente_telefone, nota, estado, valor_cobrado, metodo_pagamento, motivo_cancelamento, cancelado_por, servicos(nome, preco)"
    )
    .eq("barbeiro_id", barbeiro.id)
    .gte("inicio", de)
    .lt("inicio", ate)
    .order("inicio"),
    // Horário habitual, dias com horário especial e férias/bloqueios → para saber os dias de folga
    supabase.from("horario_semanal").select("dia_semana, aberto").eq("barbeiro_id", barbeiro.id),
    supabase.from("horario_dia").select("data, aberto").eq("barbeiro_id", barbeiro.id).gte("data", inicioGrelha).lt("data", fimGrelha),
    supabase
      .from("bloqueios")
      .select("inicio, fim")
      .or(`barbeiro_id.eq.${barbeiro.id},barbeiro_id.is.null`)
      .lt("inicio", ate)
      .gt("fim", de),
  ]);

  // Dia de folga = fechado nesse dia (horário especial, ou habitual) ou bloqueado o dia inteiro (férias)
  const abertoNaSemana = new Map((semanal ?? []).map((h) => [h.dia_semana as number, h.aberto as boolean]));
  const abertoNoDia = new Map((excecoes ?? []).map((h) => [h.data as string, h.aberto as boolean]));
  const folgas = grelha.filter((d) => {
    const aberto = abertoNoDia.get(d) ?? abertoNaSemana.get(new Date(`${d}T12:00:00Z`).getUTCDay()) ?? false;
    if (!aberto) return true;
    const ini = inicioDoDiaEmLisboa(d);
    const fim = inicioDoDiaEmLisboa(adicionarDias(d, 1));
    return (bloqueios ?? []).some((b) => new Date(b.inicio) <= new Date(ini) && new Date(b.fim) >= new Date(fim));
  });

  const agora = Date.now();
  const marcacoes: MarcacaoAgenda[] = ((data ?? []) as unknown as Linha[]).map((l) => {
    const tel = telefone(l.cliente_telefone);
    const inicio = new Date(l.inicio).getTime();
    const fim = new Date(l.fim).getTime();
    return {
      id: l.id,
      dia: diaEmLisboa(l.inicio),
      horaInicio: horaEmLisboa(l.inicio),
      horaFim: horaEmLisboa(l.fim),
      cliente: l.cliente_nome,
      telefoneTexto: tel.texto,
      telefoneLink: tel.link,
      nota: l.nota,
      estado: l.estado,
      servico: l.servicos?.nome ?? "Serviço",
      preco: l.servicos?.preco == null ? null : Number(l.servicos.preco),
      valorCobrado: l.valor_cobrado == null ? null : Number(l.valor_cobrado),
      metodo: l.metodo_pagamento,
      motivo: l.motivo_cancelamento,
      canceladoPor: l.cancelado_por,
      agora: l.estado !== "cancelada" && inicio <= agora && agora < fim,
      comecou: inicio <= agora,
      passou: fim <= agora,
    };
  });

  return (
    <Moldura>
      <CabecalhoGestao nome={barbeiro.nome} />
      <SessaoInativa />
      <Agenda hoje={hoje} dia={dia} grelha={grelha} folgas={folgas} marcacoes={marcacoes} erro={error?.message ?? null} />
    </Moldura>
  );
}

export default function AgendaPagina({ searchParams }: Props) {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}
