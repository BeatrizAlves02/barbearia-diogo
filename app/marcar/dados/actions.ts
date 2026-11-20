"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { diaEmLisboa } from "@/lib/datas";
import { UUID, erroTelemovel, validarTelemovel } from "@/lib/validar";

export type EstadoDados = {
  erros?: { nome?: string; telefone?: string; consentimento?: string; geral?: string };
  valores?: { nome: string; pais: string; telefone: string; nota: string; lembrete: boolean };
};

const HORA_OCUPADA = "Esta hora acabou de ser ocupada. Volta atrás e escolhe outra.";

/**
 * Grava a marcação. Corre no servidor quando o cliente carrega em "Confirmar".
 * Valida tudo outra vez aqui — nunca confiamos só no que vem do browser.
 */
export async function criarMarcacao(_anterior: EstadoDados, fd: FormData): Promise<EstadoDados> {
  const barbeiro = String(fd.get("barbeiro") ?? "");
  const servicoId = String(fd.get("servico") ?? "");
  const inicio = String(fd.get("inicio") ?? "");
  const nome = String(fd.get("nome") ?? "").trim().slice(0, 80);
  const pais = String(fd.get("pais") ?? "PT");
  const telefoneEscrito = String(fd.get("telefone") ?? "");
  const nota = String(fd.get("nota") ?? "").trim().slice(0, 300);
  const lembrete = fd.get("lembrete") === "on";
  const consentimento = fd.get("consentimento") === "on";

  // Para o formulário voltar a mostrar o que a pessoa escreveu, se houver erro
  const valores = { nome, pais, telefone: telefoneEscrito, nota, lembrete };

  // 1. Campos do formulário
  const erros: NonNullable<EstadoDados["erros"]> = {};
  if (nome.length < 2) erros.nome = "Escreve o teu nome.";
  // Guardado no formato internacional, ex.: +351912345678
  const telefone = validarTelemovel(telefoneEscrito, pais);
  if (!telefone) erros.telefone = telefoneEscrito.trim() ? erroTelemovel(pais) : "Escreve o teu número de telemóvel.";
  if (!consentimento) erros.consentimento = "Para marcar, tens de aceitar a política de privacidade.";
  if (Object.keys(erros).length) return { erros, valores };

  // 2. Dados da marcação (vêm escondidos no formulário)
  const dataInicio = new Date(inicio);
  if (!UUID.test(barbeiro) || !UUID.test(servicoId) || Number.isNaN(dataInicio.getTime())) {
    return { erros: { geral: "Faltam dados da marcação. Volta atrás e escolhe outra vez." }, valores };
  }

  const supabase = await createClient();

  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_min")
    .eq("id", servicoId)
    .eq("ativo", true)
    .maybeSingle();
  if (!servico) return { erros: { geral: "Este serviço já não está disponível." }, valores };

  // 3. A hora ainda está livre e dentro do horário?
  const dia = diaEmLisboa(dataInicio.toISOString());
  const { data: vagas } = await supabase.rpc("vagas", {
    p_barbeiro: barbeiro,
    p_de: dia,
    p_ate: dia,
    p_duracao: servico.duracao_min,
  });
  const livre = ((vagas ?? []) as { inicio: string }[]).some(
    (v) => new Date(v.inicio).getTime() === dataInicio.getTime()
  );
  if (!livre) return { erros: { geral: HORA_OCUPADA }, valores };

  // 4. Gravar
  const fim = new Date(dataInicio.getTime() + servico.duracao_min * 60_000);
  const { error } = await supabase.from("marcacoes").insert({
    barbeiro_id: barbeiro,
    servico_id: servicoId,
    inicio: dataInicio.toISOString(),
    fim: fim.toISOString(),
    cliente_nome: nome,
    cliente_telefone: telefone,
    nota: nota || null,
    lembrete,
    consentimento_rgpd: true,
  });

  if (error) {
    // 23P01 = a base de dados impediu duas marcações à mesma hora
    if (error.code === "23P01") return { erros: { geral: HORA_OCUPADA }, valores };
    console.error("Erro ao gravar marcação:", error.message);
    return { erros: { geral: "Não foi possível marcar. Tenta outra vez daqui a pouco." }, valores };
  }

  redirect(
    `/marcar/confirmado?barbeiro=${barbeiro}&servico=${servicoId}&inicio=${encodeURIComponent(dataInicio.toISOString())}`
  );
}
