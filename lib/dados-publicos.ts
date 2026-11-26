import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/*
  Dados que mudam raramente (serviços, preços, nomes dos barbeiros).
  Ficam guardados em cache durante cerca de 1 minuto, para os passos da marcação abrirem logo
  sem ir sempre à base de dados. As horas livres e as marcações NUNCA vêm daqui (são sempre ao vivo).
*/

export type ServicoPublico = { id: string; nome: string; duracao_min: number; preco: number | null; ativo: boolean };
export type BarbeiroPublico = { id: string; nome: string };

function cliente() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Serviços ativos, pela ordem definida */
export async function servicosAtivos(): Promise<ServicoPublico[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("servicos");
  const { data } = await cliente()
    .from("servicos")
    .select("id, nome, duracao_min, preco, ativo")
    .eq("ativo", true)
    .order("ordem");
  return (data ?? []) as ServicoPublico[];
}

/** Um serviço (ativo ou não), ou null */
export async function servicoPorId(id: string): Promise<ServicoPublico | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("servicos");
  const { data } = await cliente().from("servicos").select("id, nome, duracao_min, preco, ativo").eq("id", id).maybeSingle();
  return (data as ServicoPublico | null) ?? null;
}

/** Barbeiros ativos, pela ordem definida */
export async function barbeirosAtivos(): Promise<BarbeiroPublico[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("barbeiros");
  const { data } = await cliente().from("barbeiros").select("id, nome").eq("ativo", true).order("ordem");
  return (data ?? []) as BarbeiroPublico[];
}

/** Um barbeiro (ativo ou não), ou null */
export async function barbeiroPorId(id: string): Promise<BarbeiroPublico | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("barbeiros");
  const { data } = await cliente().from("barbeiros").select("id, nome").eq("id", id).maybeSingle();
  return (data as BarbeiroPublico | null) ?? null;
}
