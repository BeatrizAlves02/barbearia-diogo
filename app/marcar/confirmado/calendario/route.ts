import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/validar";

/* "2026-11-24T10:00:00.000Z" → "20261124T100000Z" (formato dos calendários) */
function paraIcs(data: Date) {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Gera um ficheiro .ics para adicionar a marcação ao calendário do telemóvel */
export async function GET(pedido: Request) {
  const url = new URL(pedido.url);
  const barbeiro = url.searchParams.get("barbeiro") ?? "";
  const servico = url.searchParams.get("servico") ?? "";
  const inicio = new Date(url.searchParams.get("inicio") ?? "");

  if (!UUID.test(barbeiro) || !UUID.test(servico) || Number.isNaN(inicio.getTime())) {
    return new Response("Pedido inválido", { status: 400 });
  }

  const supabase = await createClient();
  const [{ data: s }, { data: b }] = await Promise.all([
    supabase.from("servicos").select("nome, duracao_min").eq("id", servico).maybeSingle(),
    supabase.from("barbeiros").select("nome").eq("id", barbeiro).maybeSingle(),
  ]);
  if (!s || !b) return new Response("Não encontrado", { status: 404 });

  const fim = new Date(inicio.getTime() + s.duracao_min * 60_000);
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Diogo Pimenta Barbershop//Marcacoes//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${paraIcs(inicio)}-${barbeiro}@diogopimentabarber`,
    `DTSTAMP:${paraIcs(new Date())}`,
    `DTSTART:${paraIcs(inicio)}`,
    `DTEND:${paraIcs(fim)}`,
    `SUMMARY:${s.nome} — Diogo Pimenta Barbershop`,
    `DESCRIPTION:Com ${b.nome}`,
    "LOCATION:[MORADA]",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Corte daqui a 1 hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="marcacao-diogo-pimenta.ics"',
    },
  });
}
