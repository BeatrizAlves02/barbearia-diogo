import { EscolhaFeita } from "./EscolhaFeita";

/* Cartão com o barbeiro escolhido no passo anterior + "Alterar" */
export function BarbeiroEscolhido({ nome }: { nome: string }) {
  return (
    <div className="rounded border border-borda motion-safe:animate-entrar">
      <EscolhaFeita
        rotulo="Barbeiro"
        valor={nome}
        inicial={nome === "Primeiro disponível" ? "·" : nome.charAt(0)}
        alterar="/marcar"
      />
    </div>
  );
}
