import { Suspense } from "react";
import Link from "next/link";
import { SegurancaCliente } from "@/components/SegurancaCliente";
import { Marca } from "@/components/Marca";
import { TELEFONE_TEXTO } from "@/lib/contactos";

export const metadata = { title: "Política de privacidade — Diogo Pimenta Barbershop" };

/*
  ATENÇÃO: texto-base para rever com o Diogo antes de publicar.
  Preencher os campos entre [ ] com os dados reais.
*/
export default function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-8 lg:pt-14">
      <Link href="/" aria-label="Diogo Pimenta — início">
        <Marca />
      </Link>

      <h1 className="mt-10 text-[30px] font-extrabold uppercase leading-none font-stretch-125% lg:text-5xl">
        Política de privacidade
      </h1>
      <p className="mt-3 text-sm text-texto-3">Última atualização: [DATA]</p>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-texto-2 [&_h2]:mb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:tracking-[0.22em] [&_h2]:text-texto">
        <section>
          <h2>QUEM TRATA OS TEUS DADOS</h2>
          <p>
            [NOME DO RESPONSÁVEL / EMPRESA], NIF [NIF], com morada em Rua do Sobreiro, n.º 100 – Vila Frescainha de São Pedro, Barcelos (&quot;Diogo Pimenta Barbershop&quot;).
            Contacto: telemóvel {TELEFONE_TEXTO}.
          </p>
        </section>
        <section>
          <h2>QUE DADOS RECOLHEMOS</h2>
          <p>Quando fazes uma marcação: o teu nome, o número de telemóvel e, se quiseres, uma nota sobre o corte.</p>
        </section>
        <section>
          <h2>PARA QUE OS USAMOS</h2>
          <p>
            Só para gerir a tua marcação: confirmá-la, contactar-te se houver alguma alteração e, se escolheres,
            enviar-te um lembrete na véspera. Não usamos os teus dados para publicidade nem os vendemos.
          </p>
        </section>
        <section>
          <h2>DURANTE QUANTO TEMPO</h2>
          <p>Guardamos os dados da marcação durante [PRAZO, ex.: 12 meses] e depois apagamo-los.</p>
        </section>
        <section>
          <h2>QUEM TEM ACESSO</h2>
          <p>
            Apenas os barbeiros da barbearia. Os dados ficam guardados em servidores na União Europeia, através dos
            nossos fornecedores de alojamento (Supabase e Vercel).
          </p>
        </section>
        <section>
          <h2>OS TEUS DIREITOS</h2>
          <p>
            Podes pedir para ver, corrigir ou apagar os teus dados a qualquer momento, através do telemóvel {TELEFONE_TEXTO}. Se achares
            que os teus dados não foram bem tratados, podes apresentar queixa à CNPD (cnpd.pt).
          </p>
        </section>
      </div>


      <Suspense>
        <SegurancaCliente />
      </Suspense>
    </main>
  );
}
