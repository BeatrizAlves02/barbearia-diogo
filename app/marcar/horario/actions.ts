"use server";

import { createClient } from "@/lib/supabase/server";
import type { Vaga } from "@/components/marcar/tipos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Vai buscar as horas livres entre dois dias (inclusive).
 * Corre no servidor: o browser chama-a como se fosse uma função normal.
 */
export async function buscarVagas(barbeiro: string, servicoId: string, de: string, ate: string): Promise<Vaga[]> {
  // Validar tudo o que vem do browser
  if (!(barbeiro === "qualquer" || UUID.test(barbeiro))) return [];
  if (!UUID.test(servicoId) || !DATA.test(de) || !DATA.test(ate)) return [];
  const dias = (Date.parse(ate) - Date.parse(de)) / 86_400_000;
  if (dias < 0 || dias > 31) return [];

  const supabase = await createClient();

  // A duração vem da base de dados (não confiamos no browser)
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_min")
    .eq("id", servicoId)
    .eq("ativo", true)
    .maybeSingle();
  if (!servico) return [];

  const { data, error } = await supabase.rpc("vagas", {
    p_barbeiro: barbeiro === "qualquer" ? null : barbeiro,
    p_de: de,
    p_ate: ate,
    p_duracao: servico.duracao_min,
  });

  if (error) {
    console.error("Erro ao buscar vagas:", error.message);
    return [];
  }
  return (data ?? []) as Vaga[];
}
