import { Marca } from "@/components/Marca";

export type LinhaResumo = {
  rotulo: string;
  valor: string;
  detalhe?: string;
  /** true = ainda não foi escolhido (texto mais apagado) */
  vazio?: boolean;
};

type Props = {
  linhas: LinhaResumo[];
  total?: string;
  acao: React.ReactNode;
};

/* Cartão de resumo da marcação (coluna da direita no computador) */
export function PainelResumo({ linhas, total, acao }: Props) {
  return (
    <div
      style={{ animationDelay: "150ms" }}
      className="flex flex-col gap-6 rounded-lg border border-borda bg-superficie p-6 motion-safe:animate-entrar"
    >
      {/* Marca centrada, igual à do topo do site */}
      <div className="flex justify-center py-2">
        <Marca />
      </div>

      <dl className="flex flex-col divide-y divide-divisor border-y border-divisor">
        {linhas.map((l) => (
          <div key={l.rotulo} className="flex items-start justify-between gap-4 py-3.5">
            <dt className="pt-1 text-[10px] tracking-[0.22em] text-texto-3">{l.rotulo.toUpperCase()}</dt>
            <dd className="flex flex-col items-end text-right">
              <span
                key={l.valor}
                className={`text-sm motion-safe:animate-entrar ${l.vazio ? "text-texto-3" : "font-bold"}`}
              >
                {l.valor}
              </span>
              {l.detalhe && <span className="text-[13px] text-texto-3">{l.detalhe}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold">Total</span>
        <span key={total} className="text-2xl font-extrabold font-stretch-125% motion-safe:animate-entrar">
          {total ?? "—"}
        </span>
      </div>

      {acao}
    </div>
  );
}
