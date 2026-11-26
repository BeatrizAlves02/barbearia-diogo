import { adicionarDias, diaEmLisboa, horaEmLisboa } from "@/lib/datas";
import { feriado } from "@/lib/feriados";

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

/** Abre no mínimo às 06:00 */
export const ABRE_MIN = 6 * 60;

/** Última marcação no máximo às 03:00 do dia seguinte (em minutos desde a meia-noite do dia: 27 h) */
export const ULTIMA_MAX = 27 * 60;

/**
 * Horas "esticadas" para lidar com a madrugada: se uma hora é mais cedo que a abertura,
 * é do dia seguinte → soma 24 h. Ex.: abre "09:00", hora "01:00" → 1500 (25:00).
 */
export function esticar(hora: string, abre: string, inclusivo = false) {
  const h = minutos(hora);
  const a = minutos(abre);
  return h < a || (inclusivo && h === a) ? h + 1440 : h;
}

/** Volta a pôr uma hora "esticada" no formato normal: "25:00" → "01:00" */
export const normalizar = (hora: string) => paraHora(minutos(hora) % 1440);

/** "09:00:00" → "09:00" */
export const curta = (hora: string | null) => (hora ? hora.slice(0, 5) : null);

/** O bloqueio tapa dias inteiros (férias)? Senão, é só umas horas de um dia. */
export const diaInteiro = (b: Bloqueio) => horaEmLisboa(b.inicio) === "00:00" && horaEmLisboa(b.fim) === "00:00";

const FECHADO: Turno = { aberto: false, abre: null, fecha: null, pausa_inicio: null, pausa_fim: null };

/** Horário que vale num dia: o especial (se houver), fechado se for feriado, ou o habitual desse dia da semana */
export function turnoDoDia(dia: string, semanal: TurnoSemanal[], especiais: TurnoEspecial[]): Turno {
  const especial = especiais.find((e) => e.data === dia);
  if (especial) return especial;
  if (feriado(dia)) return FECHADO;
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  return semanal.find((s) => s.dia_semana === dow) ?? FECHADO;
}

/**
 * Esta marcação cabe no horário do dia? Devolve o motivo se NÃO couber, ou null se estiver tudo bem.
 * (Usado para avisar o Diogo quando muda o horário e há marcações já feitas que ficam de fora.)
 */
export function foraDoHorario(
  m: { inicio: string; fim: string },
  turnoDe: (dia: string) => Turno, // horário que vale em cada dia
  bloqueios: Bloqueio[]
): string | null {
  const ini = new Date(m.inicio).getTime();
  const fim = new Date(m.fim).getTime();
  const bloqueio = bloqueios.find((b) => new Date(b.inicio).getTime() < fim && new Date(b.fim).getTime() > ini);
  if (bloqueio) return diaInteiro(bloqueio) ? "Férias" : "Horas fechadas";

  const dia = diaEmLisboa(m.inicio);
  const i = minutos(horaEmLisboa(m.inicio));
  const dur = Math.round((fim - ini) / 60_000);

  // cabe no horário desse dia? (deslocamento = 1440 quando é a madrugada do turno do dia anterior)
  function cabe(turno: Turno, deslocamento: number): string | null {
    if (!turno.aberto || !turno.abre || !turno.fecha) return "Dia fechado";
    const a = minutos(turno.abre);
    const u = esticar(turno.fecha, turno.abre);
    const c = i + deslocamento;
    if (c < a || c > u) return "Fora do horário";
    if (turno.pausa_inicio && turno.pausa_fim) {
      const pi = esticar(turno.pausa_inicio, turno.abre);
      const pf = esticar(turno.pausa_fim, turno.abre, true);
      if (c < pf && c + dur > pi) return "Na pausa";
    }
    return null;
  }
  const hoje = cabe(turnoDe(dia), 0);
  if (!hoje) return null;
  const vespera = cabe(turnoDe(adicionarDias(dia, -1)), 1440); // ex.: 00:30 de sábado no turno de sexta
  return vespera ? hoje : null;
}

/**
 * Acrescentar horas a um dia que já está aberto (não substitui o horário, estica-o).
 * Ex.: dia 09:00–19:00 + horas a mais 20:00–03:00 → 09:00–03:00.
 * Devolve o horário novo e, se ficar um "buraco" grande entre os dois, esse intervalo
 * (que passa a estar aberto também — o Diogo pode fechá-lo se quiser).
 */
export function acrescentarHoras(turno: Turno, abre: string, ultima: string) {
  const a1 = minutos(curta(turno.abre)!);
  const u1 = esticar(curta(turno.fecha)!, curta(turno.abre)!);
  const a2 = minutos(abre);
  const u2 = minutos(ultima); // já vem "esticada" (ex.: 27:00 = 03:00)
  const a = Math.min(a1, a2);
  const u = Math.max(u1, u2);
  const abreNovo = paraHora(a);
  // buraco: entre o fim do horário que já tinha e o início das horas a mais (ou vice-versa), se passar de 1 h
  let buraco: [string, string] | null = null;
  if (a2 - u1 > 60) buraco = [paraHora((u1 + 60) % 1440), paraHora(a2 % 1440)];
  else if (a1 - u2 > 60) buraco = [paraHora((u2 + 60) % 1440), paraHora(a1 % 1440)];
  // a pausa que já tinha mantém-se (se continuar dentro do horário)
  const pausa =
    turno.pausa_inicio && turno.pausa_fim
      ? { pausa_inicio: curta(turno.pausa_inicio), pausa_fim: curta(turno.pausa_fim) }
      : { pausa_inicio: null, pausa_fim: null };
  return {
    turno: { aberto: true, abre: abreNovo, fecha: paraHora(u % 1440), ...pausa },
    ultimaEsticada: paraHora(u),
    buraco,
  };
}
