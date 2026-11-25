// Funções para trabalhar com datas "AAAA-MM-DD" e horas em Lisboa

const DIAS_CURTOS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function paraData(ymd: string) {
  const [a, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** "2026-11-20" + 3 → "2026-11-23" */
export function adicionarDias(ymd: string, n: number) {
  const data = paraData(ymd);
  data.setUTCDate(data.getUTCDate() + n);
  return data.toISOString().slice(0, 10);
}

/** "2026-11-24" → "TER" */
export function diaDaSemanaCurto(ymd: string) {
  return DIAS_CURTOS[paraData(ymd).getUTCDay()];
}

/** "2026-11-24" → "24" */
export function numeroDoDia(ymd: string) {
  return String(paraData(ymd).getUTCDate());
}

/** "2026-11-24" → "Ter, 24 nov" */
export function formatarDiaCurto(ymd: string) {
  const d = paraData(ymd);
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

/** Rótulo da semana: "Novembro 2026" ou "Novembro – Dezembro 2026" */
export function rotuloDaSemana(primeiro: string, ultimo: string) {
  const a = paraData(primeiro);
  const b = paraData(ultimo);
  if (a.getUTCMonth() === b.getUTCMonth()) return `${MESES_LONGOS[a.getUTCMonth()]} ${a.getUTCFullYear()}`;
  return `${MESES_LONGOS[a.getUTCMonth()]} – ${MESES_LONGOS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

const fmtHora = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Lisbon",
});
const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" });

/** Instante (ISO) → "10:30" em Lisboa */
export function horaEmLisboa(iso: string) {
  return fmtHora.format(new Date(iso));
}

/** Instante (ISO) → "2026-11-24" em Lisboa */
export function diaEmLisboa(iso: string) {
  return fmtDia.format(new Date(iso));
}

/** Instante (ISO) + minutos → hora de fim em Lisboa ("11:30") */
export function horaDeFim(iso: string, minutos: number) {
  return horaEmLisboa(new Date(new Date(iso).getTime() + minutos * 60_000).toISOString());
}

const DIAS_LONGOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "2026-11-24" → "Terça, 24 de novembro" */
export function formatarDiaLongo(ymd: string) {
  const d = paraData(ymd);
  return `${DIAS_LONGOS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES_LONGOS[d.getUTCMonth()].toLowerCase()}`;
}

/** Segunda-feira da semana desse dia: "2026-11-27" (sex) → "2026-11-23" */
export function segundaDaSemana(ymd: string) {
  const dia = paraData(ymd).getUTCDay(); // 0 = domingo
  return adicionarDias(ymd, -((dia + 6) % 7));
}

/** Instante (ISO, UTC) em que começa esse dia em Lisboa (tem em conta a hora de verão) */
export function inicioDoDiaEmLisboa(ymd: string) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Lisbon", timeZoneName: "longOffset" }).formatToParts(
    new Date(`${ymd}T12:00:00Z`)
  );
  const desvio = partes.find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "Z";
  return new Date(`${ymd}T00:00:00${desvio}`).toISOString();
}

/** É uma data válida no formato "AAAA-MM-DD"? */
export function dataValida(ymd: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) && !Number.isNaN(paraData(ymd).getTime()) && paraData(ymd).toISOString().startsWith(ymd);
}
