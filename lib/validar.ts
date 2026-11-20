// Validações partilhadas entre o servidor e o browser
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/mobile";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Pais = { codigo: string; nome: string; indicativo: string };

/** Países mais prováveis ficam no topo da lista */
const PRIMEIROS = ["PT", "ES", "FR", "BR", "GB", "CH", "LU", "DE"];

/** Lista de países com o nome em português e o indicativo (+351, +34…) */
export function listaDePaises(): Pais[] {
  const nomes = new Intl.DisplayNames(["pt-PT"], { type: "region" });
  const todos = getCountries().map((c) => ({
    codigo: c,
    nome: nomes.of(c) ?? c,
    indicativo: `+${getCountryCallingCode(c)}`,
  }));
  const topo = PRIMEIROS.map((c) => todos.find((p) => p.codigo === c)!).filter(Boolean);
  const resto = todos.filter((p) => !PRIMEIROS.includes(p.codigo)).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  return [...topo, ...resto];
}

export function paisValido(codigo: string): codigo is CountryCode {
  return (getCountries() as string[]).includes(codigo);
}

/**
 * Valida um número de TELEMÓVEL do país escolhido (usa as regras reais de cada país).
 * Ex.: ("912 345 678", "PT") → "+351912345678" · ("987453456", "PT") → null
 * Se a pessoa escrever o número já com +indicativo, esse indicativo é respeitado.
 */
export function validarTelemovel(numero: string, pais: string): string | null {
  if (!paisValido(pais)) return null;
  const n = parsePhoneNumberFromString(numero.trim(), pais);
  return n && n.isValid() ? n.number : null;
}

/** Mensagem de erro para um número inválido */
export function erroTelemovel(pais: string) {
  return pais === "PT"
    ? "Número inválido. Os telemóveis portugueses começam por 91, 92, 93 ou 96 e têm 9 dígitos."
    : "Este número de telemóvel não é válido para o país escolhido.";
}
