// Regras de segurança da sessão (partilhadas entre o servidor e o browser)

/** Área de gestão: sem mexer na app durante este tempo, a sessão termina sozinha */
export const LIMITE_INATIVIDADE_GESTAO_MIN = 60;

/** Site dos clientes: uma marcação a meio, parada durante este tempo, recomeça do início */
export const LIMITE_INATIVIDADE_MARCACAO_MIN = 20;

/** Cookie com a hora da última vez que o barbeiro mexeu na app */
export const COOKIE_ATIVIDADE = "gestao_atividade";

/** Grava "mexeu agora" (só no browser) */
export function registarAtividade() {
  document.cookie = `${COOKIE_ATIVIDADE}=${Date.now()}; path=/; max-age=2592000; samesite=lax`;
}

/** Hora (ms) da última atividade guardada no cookie, ou 0 */
export function ultimaAtividade() {
  const valor = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_ATIVIDADE}=`));
  return valor ? Number(valor.split("=")[1]) || 0 : 0;
}
