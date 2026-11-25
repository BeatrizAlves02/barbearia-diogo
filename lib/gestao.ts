import { createClient } from "@/lib/supabase/server";

export type Barbeiro = { id: string; nome: string; papel: "dono" | "barbeiro" };

/**
 * Quem está com sessão iniciada na área de gestão?
 * Devolve o barbeiro a que a conta tem acesso — a conta do próprio barbeiro
 * ou uma conta de apoio (tabela contas_gestao) — ou null se não tiver acesso.
 */
export async function barbeiroComSessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, barbeiro: null };

  // A base de dados responde "esta conta pertence a que barbeiro?" (função meu_barbeiro_id, ver SQL v10)
  const { data: barbeiroId } = await supabase.rpc("meu_barbeiro_id");
  if (!barbeiroId) return { supabase, user, barbeiro: null };

  const { data } = await supabase.from("barbeiros").select("id, nome, papel").eq("id", barbeiroId).maybeSingle();
  return { supabase, user, barbeiro: (data as Barbeiro | null) ?? null };
}
