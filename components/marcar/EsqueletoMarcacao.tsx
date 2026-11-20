import { TopoPasso } from "@/components/TopoPasso";

type Props = {
  passo: 1 | 2 | 3 | 4;
  voltar: string;
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  /** Cartão de resumo que aparece à direita, só no computador */
  lateral: React.ReactNode;
  /** true quando o passo tem a barra de resumo fixa em baixo no telemóvel */
  comBarraMovel?: boolean;
};

/*
  Estrutura comum a todos os passos da marcação:
  - telemóvel: uma coluna
  - computador: passo à esquerda + resumo fixo à direita
*/
export function EsqueletoMarcacao({ passo, voltar, titulo, subtitulo, children, lateral, comBarraMovel }: Props) {
  return (
    <main
      className={`mx-auto min-h-dvh max-w-md lg:max-w-6xl lg:px-10 lg:pb-16 ${comBarraMovel ? "pb-52" : "pb-10"}`}
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <TopoPasso passo={passo} voltar={voltar} />

          <div className="flex flex-col gap-5 px-5 pt-6 lg:gap-8 lg:px-0 lg:pt-12">
            <div className="flex flex-col gap-1.5 motion-safe:animate-entrar lg:gap-3">
              <h1 className="text-[30px] font-extrabold uppercase leading-none font-stretch-125% lg:text-5xl">
                {titulo}
              </h1>
              <p className="text-sm text-texto-3 lg:text-base">{subtitulo}</p>
            </div>

            {children}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-8 lg:mt-8 lg:block">{lateral}</aside>
      </div>
    </main>
  );
}
