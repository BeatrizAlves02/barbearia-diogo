// Pequenas funções para mostrar valores de forma bonita (em português de Portugal)

const euros = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 12 → "12 €" · 12.5 → "12,50 €" */
export function formatarPreco(valor: number | string | null) {
  return valor == null ? "—" : euros.format(Number(valor));
}

/** 60 → "1 h" · 90 → "1 h 30 min" · 45 → "45 min" */
export function formatarDuracao(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Data de hoje em Lisboa, no formato da base de dados: "2026-11-20" */
export function hojeEmLisboa() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}
