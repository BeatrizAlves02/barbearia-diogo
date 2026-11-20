// Validações partilhadas entre o servidor e o browser

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Aceita números portugueses com ou sem espaços e com ou sem +351.
 * "912 345 678" / "+351912345678" → "912345678" · inválido → null
 */
export function normalizarTelefone(valor: string) {
  let digitos = valor.replace(/[\s().-]/g, "");
  if (digitos.startsWith("+351")) digitos = digitos.slice(4);
  else if (digitos.startsWith("00351")) digitos = digitos.slice(5);
  return /^[29]\d{8}$/.test(digitos) ? digitos : null;
}

/** "912345678" → "912 345 678" */
export function formatarTelefone(digitos: string) {
  return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`;
}
