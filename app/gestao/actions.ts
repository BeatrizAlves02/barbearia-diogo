"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { barbeiroComSessao } from "@/lib/gestao";
import { UUID } from "@/lib/validar";

export type Resultado = { erro?: string };

/** Todas as ações confirmam primeiro que há sessão. As regras da base de dados (RLS) confirmam o resto. */
async function preparar(id: string) {
  if (!UUID.test(id)) return { erro: "Marcação inválida." } as const;
  const { supabase, barbeiro } = await barbeiroComSessao();
  if (!barbeiro) return { erro: "A tua sessão terminou. Entra outra vez." } as const;
  return { supabase } as const;
}

async function atualizar(id: string, dados: Record<string, unknown>): Promise<Resultado> {
  const p = await preparar(id);
  if ("erro" in p) return { erro: p.erro };

  const { data, error } = await p.supabase.from("marcacoes").update(dados).eq("id", id).select("id");
  if (error) {
    // 23P01 = já há outra marcação nessa hora (ao reabrir uma cancelada)
    if (error.code === "23P01") return { erro: "Já existe outra marcação a essa hora." };
    console.error("Erro ao atualizar marcação:", error.message);
    return { erro: "Não foi possível guardar. Tenta outra vez." };
  }
  if (!data?.length) return { erro: "Não tens permissão para alterar esta marcação." };

  revalidatePath("/gestao");
  return {};
}

/** Corte feito: guarda quanto foi cobrado e como foi pago */
export async function concluirMarcacao(id: string, valor: string, metodo: string): Promise<Resultado> {
  const numero = Number(valor.replace(",", "."));
  if (!Number.isFinite(numero) || numero < 0 || numero > 999) return { erro: "Escreve um valor válido." };
  if (metodo !== "mbway" && metodo !== "dinheiro") return { erro: "Escolhe MB Way ou dinheiro." };

  return atualizar(id, {
    estado: "concluida",
    valor_cobrado: Math.round(numero * 100) / 100,
    metodo_pagamento: metodo,
    pago_em: new Date().toISOString(),
    motivo_cancelamento: null,
    cancelado_por: null,
  });
}

/** O cliente não apareceu */
export async function marcarFalta(id: string): Promise<Resultado> {
  return atualizar(id, { estado: "faltou", valor_cobrado: null, metodo_pagamento: null, pago_em: null, cancelado_por: null });
}

/**
 * Cancelar antes da hora. A hora fica livre para outro cliente.
 *  - "barbeiro": "Já não vou fazer esta marcação"
 *  - "cliente":  o cliente avisou que não vem
 */
export async function cancelarMarcacao(id: string, motivo: string, quem: "barbeiro" | "cliente"): Promise<Resultado> {
  if (quem !== "barbeiro" && quem !== "cliente") return { erro: "Opção inválida." };
  return atualizar(id, {
    estado: "cancelada",
    cancelado_por: quem,
    motivo_cancelamento: motivo.trim().slice(0, 200) || null,
    valor_cobrado: null,
    metodo_pagamento: null,
    pago_em: null,
  });
}

/** Desfazer: volta a ficar só marcada */
export async function reabrirMarcacao(id: string): Promise<Resultado> {
  return atualizar(id, {
    estado: "confirmada",
    motivo_cancelamento: null,
    cancelado_por: null,
    valor_cobrado: null,
    metodo_pagamento: null,
    pago_em: null,
  });
}

export async function sair() {
  const { supabase } = await barbeiroComSessao();
  await supabase.auth.signOut();
  redirect("/gestao/entrar");
}
