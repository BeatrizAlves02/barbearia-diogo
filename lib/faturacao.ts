import { adicionarDias, diaEmLisboa, horaEmLisboa, primeiroDoMes, segundaDaSemana } from "@/lib/datas";

/* Contas da página de Faturação (sem nada de React → fácil de testar) */

export type Vista = "dia" | "semana" | "mes" | "ano";
export const VISTAS: Vista[] = ["dia", "semana", "mes", "ano"];

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Período [de, ate) em dias (AAAA-MM-DD), a começar no dia/segunda/dia 1/1 de janeiro */
export function periodo(vista: Vista, data: string): { de: string; ate: string } {
  if (vista === "dia") return { de: data, ate: adicionarDias(data, 1) };
  if (vista === "semana") {
    const s = segundaDaSemana(data);
    return { de: s, ate: adicionarDias(s, 7) };
  }
  if (vista === "mes") return { de: primeiroDoMes(data), ate: primeiroDoMes(data, 1) };
  const ano = data.slice(0, 4);
  return { de: `${ano}-01-01`, ate: `${Number(ano) + 1}-01-01` };
}

/** Andar para trás/para a frente um período */
export function deslocar(vista: Vista, data: string, n: number) {
  const { de } = periodo(vista, data);
  if (vista === "dia") return adicionarDias(de, n);
  if (vista === "semana") return adicionarDias(de, 7 * n);
  if (vista === "mes") return primeiroDoMes(de, n);
  return `${Number(de.slice(0, 4)) + n}-01-01`;
}

export type MarcacaoFaturada = {
  inicio: string;
  estado: "confirmada" | "chegou" | "concluida" | "faltou" | "cancelada";
  valor: number;
  metodo: "mbway" | "dinheiro" | null;
  servico: string;
  cliente: string;
};

export type Barra = { chave: string; rotulo: string; dica: string; total: number; mbway: number; dinheiro: number; n: number };

export type Resumo = {
  total: number;
  mbway: number;
  dinheiro: number;
  concluidas: number;
  faltas: number;
  canceladas: number;
  media: number;
  anterior: number; // faturado no período anterior (para comparar)
  barras: Barra[];
  servicos: { nome: string; n: number; total: number }[];
  lista: { hora: string; cliente: string; servico: string; valor: number; metodo: MarcacaoFaturada["metodo"] }[];
};

/** Junta tudo: totais, barras do gráfico, serviços */
export function resumir(vista: Vista, data: string, atuais: MarcacaoFaturada[], anteriores: MarcacaoFaturada[]): Resumo {
  const { de, ate } = periodo(vista, data);
  const feitas = atuais.filter((m) => m.estado === "concluida");
  const soma = (ms: MarcacaoFaturada[], metodo?: string) =>
    ms.filter((m) => !metodo || m.metodo === metodo).reduce((t, m) => t + m.valor, 0);

  // Barras: dia → por hora · semana/mês → por dia · ano → por mês
  const barras: Barra[] = [];
  const chaveDe = (m: MarcacaoFaturada) =>
    vista === "dia" ? horaEmLisboa(m.inicio).slice(0, 2) : vista === "ano" ? diaEmLisboa(m.inicio).slice(0, 7) : diaEmLisboa(m.inicio);
  if (vista === "dia") {
    const horas = feitas.map((m) => Number(horaEmLisboa(m.inicio).slice(0, 2)));
    const h0 = Math.min(9, ...horas);
    const h1 = Math.max(19, ...horas);
    for (let h = h0; h <= h1; h++) {
      const c = String(h).padStart(2, "0");
      barras.push({ chave: c, rotulo: `${c}h`, dica: `${c}:00 – ${c}:59`, total: 0, mbway: 0, dinheiro: 0, n: 0 });
    }
  } else if (vista === "ano") {
    for (let i = 0; i < 12; i++) {
      const c = `${de.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`;
      barras.push({ chave: c, rotulo: MESES_CURTOS[i], dica: `${MESES_CURTOS[i]} ${de.slice(0, 4)}`, total: 0, mbway: 0, dinheiro: 0, n: 0 });
    }
  } else {
    for (let d = de; d < ate; d = adicionarDias(d, 1)) {
      const dt = new Date(`${d}T12:00:00Z`);
      barras.push({
        chave: d,
        rotulo: vista === "semana" ? DIAS_CURTOS[dt.getUTCDay()] : String(dt.getUTCDate()),
        dica: `${DIAS_CURTOS[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MESES_CURTOS[dt.getUTCMonth()]}`,
        total: 0,
        mbway: 0,
        dinheiro: 0,
        n: 0,
      });
    }
  }
  const porChave = new Map(barras.map((b) => [b.chave, b]));
  for (const m of feitas) {
    const b = porChave.get(chaveDe(m));
    if (!b) continue;
    b.total += m.valor;
    b.n += 1;
    if (m.metodo === "mbway") b.mbway += m.valor;
    if (m.metodo === "dinheiro") b.dinheiro += m.valor;
  }

  const servicos = new Map<string, { nome: string; n: number; total: number }>();
  for (const m of feitas) {
    const s = servicos.get(m.servico) ?? { nome: m.servico, n: 0, total: 0 };
    s.n += 1;
    s.total += m.valor;
    servicos.set(m.servico, s);
  }

  const total = soma(feitas);
  return {
    total,
    mbway: soma(feitas, "mbway"),
    dinheiro: soma(feitas, "dinheiro"),
    concluidas: feitas.length,
    faltas: atuais.filter((m) => m.estado === "faltou").length,
    canceladas: atuais.filter((m) => m.estado === "cancelada").length,
    media: feitas.length ? total / feitas.length : 0,
    anterior: soma(anteriores.filter((m) => m.estado === "concluida")),
    barras,
    servicos: [...servicos.values()].sort((a, b) => b.total - a.total),
    lista: feitas.map((m) => ({ hora: horaEmLisboa(m.inicio), cliente: m.cliente, servico: m.servico, valor: m.valor, metodo: m.metodo })),
  };
}
