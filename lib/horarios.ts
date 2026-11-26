import { horaEmLisboa } from "@/lib/datas";

/*
  Horário de um dia (habitual ou especial) — horas no formato "09:00" ou "09:00:00".
  IMPORTANTE: "fecha" é a hora da ÚLTIMA marcação (pode acabar depois, ex.: 19:00 → 20:00).
*/
export type Turno = {
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
  pausa_inicio: string | null;
  pausa_fim: string | null;
};
export type TurnoSemanal = Turno & { dia_semana: number };
export type TurnoEspecial = Turno & { data: string; nota?: string | null };
export type Bloqueio = { id: string; inicio: string; fim: string; motivo: string | null };

/** "09:30" → 570 minutos ("24:00" → 1440) */
export function minutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** 570 → "09:30" */
export function paraHora(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** "09:00:00" → "09:00" */
export const curta = (hora: string | null) => (hora ? hora.slice(0, 5) : null);

/** O bloqueio tapa dias inteiros (férias)? Senão, é só umas horas de um dia. */
export const diaInteiro = (b: Bloqueio) => horaEmLisboa(b.inicio) === "00:00" && horaEmLisboa(b.fim) === "00:00";

const FECHADO: Turno = { aberto: false, abre: null, fecha: null, pausa_inicio: null, pausa_fim: null };

/** Horário que vale num dia: o especial (se houver) ou o habitual desse dia da semana */
export function turnoDoDia(dia: string, semanal: TurnoSemanal[], especiais: TurnoEspecial[]): Turno {
  const especial = especiais.find((e) => e.data === dia);
  if (especial) return especial;
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  return semanal.find((s) => s.dia_semana === dow) ?? FECHADO;
}

/**
 * Esta marcação cabe no horário do dia? Devolve o motivo se NÃO couber, ou null se estiver tudo bem.
 * (Usado para avisar o Diogo quando muda o horário e há marcações já feitas que ficam de fora.)
 */
export function foraDoHorario(m: { inicio: string; fim: string }, turno: Turno, bloqueios: Bloqueio[]): string | null {
  const ini = new Date(m.inicio).getTime();
  const fim = new Date(m.fim).getTime();
  const bloqueio = bloqueios.find((b) => new Date(b.inicio).getTime() < fim && new Date(b.fim).getTime() > ini);
  if (bloqueio) return diaInteiro(bloqueio) ? "Férias" : "Horas fechadas";
  if (!turno.aberto || !turno.abre || !turno.fecha) return "Dia fechado";

  const i = minutos(horaEmLisboa(m.inicio));
  let f = minutos(horaEmLisboa(m.fim));
  if (f <= i) f += 1440; // acaba à meia-noite
  // tem de começar entre a abertura e a hora da última marcação (inclusive)
  if (i < minutos(turno.abre) || i > minutos(turno.fecha)) return "Fora do horário";
  if (turno.pausa_inicio && turno.pausa_fim && i < minutos(turno.pausa_fim) && f > minutos(turno.pausa_inicio)) return "Na pausa";
  return null;
}
