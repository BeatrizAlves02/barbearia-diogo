import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { barbeiroComSessao } from "@/lib/gestao";
import { hojeEmLisboa } from "@/lib/formatar";
import { diaEmLisboa, formatarDiaCurto, horaEmLisboa } from "@/lib/datas";
import { foraDoHorario, turnoDoDia, type Bloqueio, type TurnoEspecial, type TurnoSemanal } from "@/lib/horarios";
import { CabecalhoGestao } from "@/components/gestao/CabecalhoGestao";
import { HorarioHabitual } from "@/components/gestao/HorarioHabitual";
import { FolgasEFerias } from "@/components/gestao/FolgasEFerias";

export const metadata = { title: "Horário · Gestão" };

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
      <div className="mt-8 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10" aria-hidden="true">
        <div className="h-[34rem] rounded-lg bg-superficie motion-safe:animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-64 rounded-lg bg-superficie motion-safe:animate-pulse" />
          <div className="h-64 rounded-lg bg-superficie motion-safe:animate-pulse" />
        </div>
      </div>
    </Moldura>
  );
}

async function Conteudo() {
  await connection();
  const { supabase, user, barbeiro } = await barbeiroComSessao();
  if (!user) redirect("/gestao/entrar");
  if (!barbeiro) redirect("/gestao");

  const hoje = hojeEmLisboa();
  const agora = new Date().toISOString();

  const [{ data: semanal }, { data: especiais }, { data: bloqueios }, { data: marcacoes }] = await Promise.all([
    supabase.from("horario_semanal").select("dia_semana, aberto, abre, fecha, pausa_inicio, pausa_fim").eq("barbeiro_id", barbeiro.id),
    supabase
      .from("horario_dia")
      .select("data, aberto, abre, fecha, pausa_inicio, pausa_fim, nota")
      .eq("barbeiro_id", barbeiro.id)
      .gte("data", hoje)
      .order("data"),
    supabase
      .from("bloqueios")
      .select("id, inicio, fim, motivo")
      .or(`barbeiro_id.eq.${barbeiro.id},barbeiro_id.is.null`)
      .gt("fim", agora)
      .order("inicio"),
    supabase
      .from("marcacoes")
      .select("id, inicio, fim, cliente_nome")
      .eq("barbeiro_id", barbeiro.id)
      .in("estado", ["confirmada", "chegou"])
      .gte("inicio", agora)
      .order("inicio")
      .limit(500),
  ]);

  const s = (semanal ?? []) as TurnoSemanal[];
  const e = (especiais ?? []) as TurnoEspecial[];
  const b = (bloqueios ?? []) as Bloqueio[];

  // Marcações já feitas que ficam fora do horário atual → aviso (o Diogo decide se mantém ou cancela)
  const conflitos = ((marcacoes ?? []) as { id: string; inicio: string; fim: string; cliente_nome: string }[])
    .map((m) => ({ ...m, dia: diaEmLisboa(m.inicio), motivo: foraDoHorario(m, (d) => turnoDoDia(d, s, e), b) }))
    .filter((m) => m.motivo);

  return (
    <Moldura>
      <CabecalhoGestao nome={barbeiro.nome} />

      <div className="mt-6 flex flex-col gap-1 motion-safe:animate-entrar lg:mt-8">
        <span className="text-[10px] tracking-[0.24em] text-texto-3">GESTÃO</span>
        <h1 className="text-3xl font-extrabold uppercase leading-none font-stretch-125% lg:text-5xl">Horário</h1>
      </div>

      {conflitos.length > 0 && (
        <section
          aria-live="polite"
          className="mt-6 rounded-lg border border-red-400/50 bg-red-400/10 p-5 motion-safe:animate-entrar lg:p-6"
        >
          <h2 className="text-sm font-bold text-red-200">
            {conflitos.length === 1 ? "1 marcação para rever" : `${conflitos.length} marcações para rever`}
          </h2>
          <p className="mt-1 text-sm text-texto-2">Já não batem com o horário, mas continuam marcadas.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {conflitos.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/gestao?dia=${m.dia}`}
                  className="group flex items-center justify-between gap-3 rounded border border-red-400/30 bg-bg/50 px-4 py-3 transition-[border-color,background-color,transform] hover:border-red-300 hover:bg-bg active:scale-[0.99]"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15px] font-bold">
                      {formatarDiaCurto(m.dia)} · {horaEmLisboa(m.inicio)}
                    </span>
                    <span className="truncate text-sm text-texto-3">{m.cliente_nome}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-red-200">{m.motivo}</span>
                    <span className="text-[11px] font-bold tracking-[0.14em] text-texto-2 transition-transform group-hover:translate-x-1">VER →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <HorarioHabitual key={JSON.stringify(s)} inicial={s} />
        <div className="flex flex-col gap-5">
          <FolgasEFerias tipo="fechar" semanal={s} especiais={e} bloqueios={b} hoje={hoje} />
          <FolgasEFerias tipo="abrir" semanal={s} especiais={e} bloqueios={b} hoje={hoje} />
        </div>
      </div>
    </Moldura>
  );
}

export default function HorarioPagina() {
  return (
    <Suspense fallback={<ACarregar />}>
      <Conteudo />
    </Suspense>
  );
}
