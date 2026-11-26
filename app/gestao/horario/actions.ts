"use server";

import { revalidatePath } from "next/cache";
import { barbeiroComSessao } from "@/lib/gestao";
import { adicionarDias, dataValida, inicioDoDiaEmLisboa, momentoEmLisboa } from "@/lib/datas";
import { minutos } from "@/lib/horarios";
import { UUID } from "@/lib/validar";

export type Resultado = { erro?: string; ok?: boolean };

const HORA = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

type TurnoEnviado = {
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
  pausa_inicio: string | null;
  pausa_fim: string | null;
};

/** Confirma que as horas fazem sentido (abre antes de fechar, pausa dentro do horário) */
function validarTurno(t: TurnoEnviado): string | null {
  if (!t.aberto) return null;
  if (!t.abre || !t.fecha || !HORA.test(t.abre) || !HORA.test(t.fecha)) return "Escolhe a hora de abrir e a da última marcação.";
  if (minutos(t.fecha) >= 1440 || minutos(t.abre) >= 1440) return "Horas inválidas.";
  if (minutos(t.fecha) < minutos(t.abre)) return "A última marcação não pode ser antes da abertura.";
  if (t.pausa_inicio || t.pausa_fim) {
    if (!t.pausa_inicio || !t.pausa_fim || !HORA.test(t.pausa_inicio) || !HORA.test(t.pausa_fim)) return "Completa as horas da pausa.";
    const pi = minutos(t.pausa_inicio);
    const pf = minutos(t.pausa_fim);
    if (pf <= pi) return "A pausa tem de acabar depois de começar.";
    if (pi <= minutos(t.abre) || pf > minutos(t.fecha)) return "A pausa tem de ficar dentro do horário.";
  }
  return null;
}

function limpar(t: TurnoEnviado) {
  return t.aberto
    ? { aberto: true, abre: t.abre, fecha: t.fecha, pausa_inicio: t.pausa_inicio || null, pausa_fim: t.pausa_fim || null }
    : { aberto: false, abre: null, fecha: null, pausa_inicio: null, pausa_fim: null };
}

async function preparar() {
  const { supabase, barbeiro } = await barbeiroComSessao();
  if (!barbeiro) return { erro: "A tua sessão terminou. Entra outra vez." } as const;
  return { supabase, barbeiro } as const;
}

function atualizarPaginas() {
  revalidatePath("/gestao/horario");
  revalidatePath("/gestao");
  revalidatePath("/marcar", "layout"); // o site dos clientes mostra logo o horário novo
}

/** Horário habitual: os 7 dias da semana de uma vez */
export async function guardarHorarioHabitual(dias: (TurnoEnviado & { dia_semana: number })[]): Promise<Resultado> {
  if (!Array.isArray(dias) || dias.length !== 7) return { erro: "Horário incompleto." };
  for (const d of dias) {
    if (!Number.isInteger(d.dia_semana) || d.dia_semana < 0 || d.dia_semana > 6) return { erro: "Dia inválido." };
    const erro = validarTurno(d);
    if (erro) return { erro: `${["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.dia_semana]}: ${erro}` };
  }
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  const linhas = dias.map((d) => ({ barbeiro_id: p.barbeiro.id, dia_semana: d.dia_semana, ...limpar(d) }));
  const { error } = await p.supabase.from("horario_semanal").upsert(linhas, { onConflict: "barbeiro_id,dia_semana" });
  if (error) {
    console.error("Horário habitual:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}

/** Dia especial: abrir num dia de folga, fechar um dia, ou mudar o horário só desse dia */
export async function guardarDiaEspecial(dia: string, turno: TurnoEnviado): Promise<Resultado> {
  if (!dataValida(dia)) return { erro: "Escolhe um dia." };
  const erro = validarTurno(turno);
  if (erro) return { erro };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  const { error } = await p.supabase
    .from("horario_dia")
    .upsert({ barbeiro_id: p.barbeiro.id, data: dia, ...limpar(turno) }, { onConflict: "barbeiro_id,data" });
  if (error) {
    console.error("Dia especial:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}

export async function apagarDiaEspecial(dia: string): Promise<Resultado> {
  if (!dataValida(dia)) return { erro: "Dia inválido." };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };
  const { error } = await p.supabase.from("horario_dia").delete().eq("barbeiro_id", p.barbeiro.id).eq("data", dia);
  if (error) return { erro: "Não foi possível apagar." };
  atualizarPaginas();
  return { ok: true };
}

/** Fechar só umas horas de um dia (ex.: das 14:00 às 16:00) */
export async function fecharHoras(dia: string, de: string, ate: string): Promise<Resultado> {
  if (!dataValida(dia)) return { erro: "Escolhe um dia." };
  if (!HORA.test(de) || !HORA.test(ate)) return { erro: "Horas inválidas." };
  if (minutos(ate) <= minutos(de)) return { erro: "A hora do fim tem de ser depois da do início." };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  const { error } = await p.supabase.from("bloqueios").insert({
    barbeiro_id: p.barbeiro.id,
    inicio: momentoEmLisboa(dia, de),
    fim: minutos(ate) >= 1440 ? inicioDoDiaEmLisboa(adicionarDias(dia, 1)) : momentoEmLisboa(dia, ate),
    motivo: null,
  });
  if (error) {
    console.error("Fechar horas:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}

/** Férias: fecha os dias escolhidos (dias inteiros). Dias seguidos ficam juntos num só período. */
export async function adicionarFerias(dias: string[], motivo: string): Promise<Resultado> {
  const lista = [...new Set(dias)].sort();
  if (!lista.length) return { erro: "Escolhe os dias." };
  if (lista.length > 366 || !lista.every(dataValida)) return { erro: "Dias inválidos." };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  // junta os dias seguidos: 22, 23, 24 → um período de 22 a 24
  const periodos: [string, string][] = [];
  for (const d of lista) {
    const ultimo = periodos[periodos.length - 1];
    if (ultimo && adicionarDias(ultimo[1], 1) === d) ultimo[1] = d;
    else periodos.push([d, d]);
  }
  const texto = motivo.trim().slice(0, 60) || null;
  const { error } = await p.supabase.from("bloqueios").insert(
    periodos.map(([de, ate]) => ({
      barbeiro_id: p.barbeiro.id,
      inicio: inicioDoDiaEmLisboa(de),
      fim: inicioDoDiaEmLisboa(adicionarDias(ate, 1)),
      motivo: texto,
    }))
  );
  if (error) {
    console.error("Férias:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}

export async function apagarFerias(id: string): Promise<Resultado> {
  if (!UUID.test(id)) return { erro: "Inválido." };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };
  const { error } = await p.supabase.from("bloqueios").delete().eq("id", id);
  if (error) return { erro: "Não foi possível apagar." };
  atualizarPaginas();
  return { ok: true };
}

/* ---------- Folgas e férias (vários dias de uma vez) ---------- */

function diasValidos(dias: string[]) {
  const lista = [...new Set(dias)].sort();
  return lista.length && lista.length <= 366 && lista.every(dataValida) ? lista : null;
}

/** Abrir nesses dias com outro horário (ex.: trabalhar num feriado ou numa segunda) */
export async function abrirDias(dias: string[], turno: TurnoEnviado): Promise<Resultado> {
  const lista = diasValidos(dias);
  if (!lista) return { erro: "Escolhe os dias." };
  const erro = validarTurno({ ...turno, aberto: true });
  if (erro) return { erro };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  const { error } = await p.supabase
    .from("horario_dia")
    .upsert(lista.map((data) => ({ barbeiro_id: p.barbeiro.id, data, ...limpar({ ...turno, aberto: true }) })), { onConflict: "barbeiro_id,data" });
  if (error) {
    console.error("Abrir dias:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}

/** Fechar só umas horas nesses dias (ex.: das 14:00 às 16:00) */
export async function fecharHorasVarios(dias: string[], de: string, ate: string): Promise<Resultado> {
  const lista = diasValidos(dias);
  if (!lista) return { erro: "Escolhe os dias." };
  if (!HORA.test(de) || !HORA.test(ate)) return { erro: "Horas inválidas." };
  if (minutos(ate) <= minutos(de)) return { erro: "A hora do fim tem de ser depois da do início." };
  const p = await preparar();
  if ("erro" in p) return { erro: p.erro };

  const { error } = await p.supabase.from("bloqueios").insert(
    lista.map((dia) => ({
      barbeiro_id: p.barbeiro.id,
      inicio: momentoEmLisboa(dia, de),
      fim: minutos(ate) >= 1440 ? inicioDoDiaEmLisboa(adicionarDias(dia, 1)) : momentoEmLisboa(dia, ate),
      motivo: null,
    }))
  );
  if (error) {
    console.error("Fechar horas:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  atualizarPaginas();
  return { ok: true };
}
