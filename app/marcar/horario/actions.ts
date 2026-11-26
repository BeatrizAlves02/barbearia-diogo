"use server";

import { createClient } from "@/lib/supabase/server";
import { servicoPorId } from "@/lib/dados-publicos";
import type { DiaFechado, Semana, Vaga } from "@/components/marcar/tipos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Vai buscar as horas livres entre dois dias (inclusive) e os dias fechados (folgas/férias).
 * Corre no servidor: o browser chama-a como se fosse uma função normal.
 * Lê sempre a base de dados na hora → mostra logo as mudanças que o Diogo faz no horário.
 */
export async function buscarVagas(barbeiro: string, servicoId: string, de: string, ate: string): Promise<Semana> {
  const vazio: Semana = { vagas: [], fechados: [] };
  // Validar tudo o que vem do browser
  if (!(barbeiro === "qualquer" || UUID.test(barbeiro))) return vazio;
  if (!UUID.test(servicoId) || !DATA.test(de) || !DATA.test(ate)) return vazio;
  const dias = (Date.parse(ate) - Date.parse(de)) / 86_400_000;
  if (dias < 0 || dias > 31) return vazio;

  const supabase = await createClient();

  // A duração vem da base de dados (não confiamos no browser)
  const servico = await servicoPorId(servicoId);
  if (!servico?.ativo) return vazio;

  const [vagas, fechados] = await Promise.all([
    supabase.rpc("vagas", {
      p_barbeiro: barbeiro === "qualquer" ? null : barbeiro,
      p_de: de,
      p_ate: ate,
      p_duracao: servico.duracao_min,
    }),
    supabase.rpc("dias_fechados", { p_de: de, p_ate: ate }),
  ]);

  if (vagas.error) console.error("Erro ao buscar vagas:", vagas.error.message);
  if (fechados.error) console.error("Erro ao buscar dias fechados:", fechados.error.message);
  return {
    vagas: (vagas.data ?? []) as Vaga[],
    fechados: (fechados.data ?? []) as DiaFechado[],
  };
}
