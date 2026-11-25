import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";
import { barbeiroComSessao } from "@/lib/gestao";
import { formatarPreco, hojeEmLisboa } from "@/lib/formatar";
import {
  adicionarDias,
  dataValida,
  diaDaSemanaCurto,
  diaEmLisboa,
  formatarDiaLongo,
  horaEmLisboa,
  inicioDoDiaEmLisboa,
  nomeDoMes,
  numeroDoDia,
  primeiroDoMes,
  segundaDaSemana,
} from "@/lib/datas";
import { CabecalhoGestao } from "@/components/gestao/CabecalhoGestao";
import { CartaoMarcacao, type MarcacaoAgenda } from "@/components/gestao/CartaoMarcacao";
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
  servicos: { nome: string; preco: number | null } | null;
};

/* "+351932506203" → texto "932 506 203" e link "+351932506203" (números antigos sem +351 também funcionam) */
function telefone(numero: string | null) {
  if (!numero) return { texto: null, link: null };
  const n = parsePhoneNumberFromString(numero, "PT");
  if (!n) return { texto: numero, link: numero };
  return { texto: n.country === "PT" ? n.formatNational() : n.formatInternational(), link: n.number };
}

function Seta({ para }: { para: "esq" | "dir" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={para === "esq" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-16 lg:max-w-7xl lg:px-10">{children}</main>;
}

function ACarregar() {
  return (
    <Moldura>
      <div className="h-18 border-b border-divisor" />
      <div className="mt-6 flex flex-col gap-4 lg:mt-8 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-10" aria-hidden="true">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-56 rounded bg-superficie motion-safe:animate-pulse" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-16 rounded bg-superficie motion-safe:animate-pulse" />
            ))}
          </div>
          <div className="h-18 rounded-lg bg-superficie motion-safe:animate-pulse" />
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

  // Conta criada mas ainda não ligada ao barbeiro (falta o passo do SQL)
  if (!barbeiro) {
    return (
      <Moldura>
        <div className="flex min-h-dvh flex-col items-start justify-center gap-4">
          <h1 className="text-2xl font-extrabold uppercase font-stretch-125%">Conta sem barbeiro</h1>
          <p className="text-sm text-texto-2">
            A conta <strong>{user.email}</strong> entrou bem, mas ainda não está ligada a nenhum barbeiro na base de dados.
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
  const segunda = segundaDaSemana(dia);
  const semana = Array.from({ length: 7 }, (_, i) => adicionarDias(segunda, i));

  // Calendário do mês (computador): da segunda antes do dia 1 até ao domingo depois do último dia
  const primeiro = primeiroDoMes(dia);
  const inicioGrelha = segundaDaSemana(primeiro);
  const fimGrelha = adicionarDias(segundaDaSemana(adicionarDias(primeiroDoMes(dia, 1), -1)), 7);
  const grelha: string[] = [];
  for (let d = inicioGrelha; d < fimGrelha; d = adicionarDias(d, 1)) grelha.push(d);

  // Marcações do mês inteiro (para os números no calendário e na faixa da semana)
  const { data, error } = await supabase
    .from("marcacoes")
    .select(
      "id, inicio, fim, cliente_nome, cliente_telefone, nota, estado, valor_cobrado, metodo_pagamento, motivo_cancelamento, servicos(nome, preco)"
    )
    .eq("barbeiro_id", barbeiro.id)
    .gte("inicio", inicioDoDiaEmLisboa(inicioGrelha))
    .lt("inicio", inicioDoDiaEmLisboa(fimGrelha))
    .order("inicio");

  const linhas = (data ?? []) as unknown as Linha[];
  const porDia = new Map<string, Linha[]>();
  for (const l of linhas) {
    const d = diaEmLisboa(l.inicio);
    porDia.set(d, [...(porDia.get(d) ?? []), l]);
  }

  const doDia = porDia.get(dia) ?? [];
  const ativas = doDia.filter((l) => l.estado !== "cancelada");
  const concluidas = doDia.filter((l) => l.estado === "concluida");
  const soma = (metodo?: string) =>
    concluidas.filter((l) => !metodo || l.metodo_pagamento === metodo).reduce((t, l) => t + Number(l.valor_cobrado ?? 0), 0);
  const faturado = soma();

  const agora = Date.now();
  const cartoes: MarcacaoAgenda[] = doDia.map((l) => {
    const tel = telefone(l.cliente_telefone);
    return {
      id: l.id,
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
      agora:
        l.estado !== "cancelada" && new Date(l.inicio).getTime() <= agora && agora < new Date(l.fim).getTime(),
      passou: new Date(l.fim).getTime() <= agora,
    };
  });

  const link = (d: string) => (d === hoje ? "/gestao" : `/gestao?dia=${d}`);

  return (
    <Moldura>
      <CabecalhoGestao nome={barbeiro.nome} />

      {/* Computador: dia, semana e resumo numa coluna fixa à esquerda; marcações à direita */}
      <div className="lg:mt-8 lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-12">
      <aside className="lg:sticky lg:top-8">
      {/* ---------- Dia e semana ---------- */}
      <section className="mt-6 flex flex-col gap-4 motion-safe:animate-entrar lg:mt-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.24em] text-texto-3">{dia === hoje ? "HOJE" : "AGENDA"}</span>
            <h1 className="text-2xl font-extrabold uppercase leading-none font-stretch-125% lg:text-4xl">
              {formatarDiaLongo(dia)}
            </h1>
          </div>
          {dia !== hoje && (
            <Link
              href="/gestao"
              className="shrink-0 rounded-full border border-borda-forte px-4 py-2 text-[11px] font-bold tracking-[0.16em] transition-colors hover:border-texto"
            >
              HOJE
            </Link>
          )}
        </div>

        {/* Telemóvel: faixa da semana */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <Link
            href={link(adicionarDias(dia, -7))}
            aria-label="Semana anterior"
            className="flex h-16 w-8 shrink-0 items-center justify-center rounded text-texto-3 transition-colors hover:bg-superficie hover:text-texto"
          >
            <Seta para="esq" />
          </Link>
          <ol className="grid flex-1 grid-cols-7 gap-1.5">
            {semana.map((d) => {
              const n = (porDia.get(d) ?? []).filter((l) => l.estado !== "cancelada").length;
              const sel = d === dia;
              return (
                <li key={d}>
                  <Link
                    href={link(d)}
                    aria-current={sel ? "date" : undefined}
                    className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded border transition-colors ${
                      sel ? "border-texto bg-texto text-tinta" : "border-borda hover:border-borda-forte"
                    }`}
                  >
                    <span className={`text-[9px] tracking-[0.14em] ${sel ? "" : d === hoje ? "font-bold text-texto" : "text-texto-3"}`}>
                      {diaDaSemanaCurto(d)}
                    </span>
                    <span className="text-lg font-extrabold leading-none font-stretch-125%">{numeroDoDia(d)}</span>
                    <span className={`h-3 text-[10px] font-bold tabular-nums ${sel ? "" : "text-texto-2"}`}>{n || ""}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link
            href={link(adicionarDias(dia, 7))}
            aria-label="Semana seguinte"
            className="flex h-16 w-8 shrink-0 items-center justify-center rounded text-texto-3 transition-colors hover:bg-superficie hover:text-texto"
          >
            <Seta para="dir" />
          </Link>
        </div>

        {/* Computador: calendário do mês */}
        <div className="hidden rounded-lg border border-borda bg-superficie p-5 lg:block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold tracking-[0.16em] font-stretch-125%">{nomeDoMes(dia).toUpperCase()}</span>
            <span className="flex gap-1">
              <Link
                href={link(primeiroDoMes(dia, -1))}
                aria-label="Mês anterior"
                className="flex size-9 items-center justify-center rounded-full text-texto-3 transition-colors hover:bg-superficie-2 hover:text-texto"
              >
                <Seta para="esq" />
              </Link>
              <Link
                href={link(primeiroDoMes(dia, 1))}
                aria-label="Mês seguinte"
                className="flex size-9 items-center justify-center rounded-full text-texto-3 transition-colors hover:bg-superficie-2 hover:text-texto"
              >
                <Seta para="dir" />
              </Link>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d) => (
              <span key={d} className="pb-2 text-[9px] tracking-[0.16em] text-texto-3">
                {d}
              </span>
            ))}
            {grelha.map((d) => {
              const n = (porDia.get(d) ?? []).filter((l) => l.estado !== "cancelada").length;
              const sel = d === dia;
              const foraDoMes = d.slice(0, 7) !== dia.slice(0, 7);
              const passado = d < hoje;
              return (
                <Link
                  key={d}
                  href={link(d)}
                  aria-current={sel ? "date" : undefined}
                  aria-label={`${formatarDiaLongo(d)}${n ? `, ${n} marcações` : ""}`}
                  className={`relative flex h-12 flex-col items-center justify-center rounded transition-colors ${
                    sel
                      ? "bg-texto text-tinta"
                      : d === hoje
                        ? "border border-texto hover:bg-superficie-2"
                        : "hover:bg-superficie-2"
                  } ${foraDoMes ? "opacity-30" : passado && !sel ? "text-texto-3" : ""}`}
                >
                  <span className="text-[15px] font-bold tabular-nums">{numeroDoDia(d)}</span>
                  <span className={`h-3 text-[10px] font-bold tabular-nums leading-3 ${sel ? "" : "text-texto-2"}`}>
                    {n ? `${n}` : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Resumo do dia ---------- */}
      <dl
        style={{ animationDelay: "80ms" }}
        className="mt-5 grid grid-cols-3 divide-x divide-borda rounded-lg border border-borda motion-safe:animate-entrar"
      >
        {[
          { rotulo: "MARCAÇÕES", valor: String(ativas.length) },
          { rotulo: "CONCLUÍDAS", valor: `${concluidas.length}/${ativas.length}` },
          { rotulo: "FATURADO", valor: formatarPreco(faturado) },
        ].map((s) => (
          <div key={s.rotulo} className="flex flex-col gap-1 px-4 py-3 lg:px-5 lg:py-4">
            <dt className="text-[9px] tracking-[0.2em] text-texto-3">{s.rotulo}</dt>
            <dd className="text-xl font-extrabold tabular-nums font-stretch-125% lg:text-2xl">{s.valor}</dd>
          </div>
        ))}
      </dl>
      <p style={{ animationDelay: "120ms" }} className="mt-3 flex justify-between px-1 text-xs text-texto-3 motion-safe:animate-entrar">
        <span>
          MB Way <strong className="text-texto-2">{formatarPreco(soma("mbway"))}</strong>
        </span>
        <span>
          Dinheiro <strong className="text-texto-2">{formatarPreco(soma("dinheiro"))}</strong>
        </span>
      </p>
      </aside>

      <div>
      <h2 className="hidden text-[10px] tracking-[0.24em] text-texto-3 lg:block">
        MARCAÇÕES DO DIA
      </h2>

      {/* ---------- Marcações ---------- */}
      {error ? (
        <p className="mt-6 text-sm text-red-400 lg:mt-4">Não foi possível carregar as marcações: {error.message}</p>
      ) : cartoes.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-borda px-5 py-10 text-center motion-safe:animate-entrar lg:mt-4 lg:py-20">
          <p className="font-mao text-3xl">dia livre!</p>
          <p className="mt-1 text-sm text-texto-3">Sem marcações neste dia.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3 lg:mt-4">
          {cartoes.map((m, i) => (
            <CartaoMarcacao key={m.id} m={m} atraso={120 + i * 60} />
          ))}
        </ul>
      )}
      </div>
      </div>
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
