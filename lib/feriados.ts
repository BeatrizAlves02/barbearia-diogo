import { adicionarDias } from "@/lib/datas";

/*
  Feriados em que a barbearia fecha por defeito (nacionais + feriado municipal de Barcelos).
  O Diogo pode abrir num feriado nos "Dias especiais" (ABERTO), e isso tem prioridade.
  ⚠ Esta lista tem de ser igual à tabela "feriados" da base de dados (SQL v15).
*/
export type Feriado = { dia: string; nome: string; mensagem: string };

const BOM = "Bom feriado!";

/** Domingo de Páscoa (calendário gregoriano) → "AAAA-MM-DD" */
function pascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function feriadosDoAno(ano: number): Feriado[] {
  const p = pascoa(ano);
  const f = (md: string, nome: string, mensagem = BOM): Feriado => ({ dia: `${ano}-${md}`, nome, mensagem });
  return [
    f("01-01", "Ano Novo", "Bom Ano Novo!"),
    { dia: adicionarDias(p, -2), nome: "Sexta-feira Santa", mensagem: "Boa Páscoa!" },
    { dia: p, nome: "Páscoa", mensagem: "Boa Páscoa!" },
    f("04-25", "Dia da Liberdade"),
    f("05-01", "Dia do Trabalhador"),
    f("05-03", "Dia de Barcelos (feriado municipal)"),
    { dia: adicionarDias(p, 60), nome: "Corpo de Deus", mensagem: BOM },
    f("06-10", "Dia de Portugal"),
    f("08-15", "Assunção de Nossa Senhora"),
    f("10-05", "Implantação da República"),
    f("11-01", "Todos os Santos"),
    f("12-01", "Restauração da Independência"),
    f("12-08", "Imaculada Conceição"),
    f("12-25", "Natal", "Bom Natal!"),
  ]
    // se dois calharem no mesmo dia (ex.: Páscoa a 25 de abril), fica o primeiro (o da Páscoa)
    .filter((x, i, todos) => todos.findIndex((y) => y.dia === x.dia) === i)
    .sort((x, y) => x.dia.localeCompare(y.dia));
}

const cache = new Map<number, Map<string, Feriado>>();

/** É feriado nesse dia? Devolve o feriado (nome + mensagem) ou undefined */
export function feriado(dia: string): Feriado | undefined {
  const ano = Number(dia.slice(0, 4));
  if (!cache.has(ano)) cache.set(ano, new Map(feriadosDoAno(ano).map((x) => [x.dia, x])));
  return cache.get(ano)!.get(dia);
}
