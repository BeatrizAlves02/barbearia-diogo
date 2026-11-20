"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { criarMarcacao, type EstadoDados } from "@/app/marcar/dados/actions";
import { classesBotaoPrimario } from "@/components/BotaoPrimario";
import { IconeVisto } from "@/components/icones";
import { erroTelemovel, validarTelemovel, type Pais } from "@/lib/validar";
import { formatarDuracao, formatarPreco } from "@/lib/formatar";
import { diaEmLisboa, formatarDiaCurto, horaDeFim, horaEmLisboa } from "@/lib/datas";
import type { Servico } from "./tipos";
import { EsqueletoMarcacao } from "./EsqueletoMarcacao";
import { PainelResumo } from "./PainelResumo";
import { EscolhaFeita } from "./EscolhaFeita";
import { SeletorPais } from "./SeletorPais";

type Props = {
  barbeiro: string; // id do barbeiro (já atribuído)
  nomeBarbeiro: string;
  servico: Servico;
  inicio: string; // instante em ISO
  paises: Pais[];
};

const ID_FORM = "form-dados";

function Roda() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="text-[13px] text-red-400 motion-safe:animate-entrar">
      {texto}
    </p>
  );
}

/* Caixa de seleção com o nosso desenho (o input verdadeiro continua lá) */
function Caixa({ name, defaultChecked, invalido, descricao, children }: {
  name: string;
  defaultChecked?: boolean;
  invalido?: boolean;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-texto-2">
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={invalido || undefined}
          aria-describedby={descricao}
          className={`peer size-5 cursor-pointer appearance-none rounded-[3px] border-[1.5px] transition-colors checked:border-texto checked:bg-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-texto ${
            invalido ? "border-red-400" : "border-desativado"
          }`}
        />
        <IconeVisto className="pointer-events-none absolute inset-0 m-auto size-3.5 scale-0 text-tinta transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100" />
      </span>
      <span>{children}</span>
    </label>
  );
}

export function FormularioDados({ barbeiro, nomeBarbeiro, servico, inicio, paises }: Props) {
  const [estado, acao, aEnviar] = useActionState<EstadoDados, FormData>(criarMarcacao, {});
  const valores = estado.valores;
  const erros = estado.erros ?? {};

  // País do telemóvel e validação ao sair do campo (sem esperar pelo envio)
  const [pais, setPais] = useState(valores?.pais ?? "PT");
  const [telefone, setTelefone] = useState(valores?.telefone ?? "");
  const [erroLocal, setErroLocal] = useState<string | null | undefined>(undefined);
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    // depois de cada envio, volta a mostrar o erro que vem do servidor
    setEstadoVisto(estado);
    setErroLocal(undefined);
  }
  const verificar = (numero: string, codigo: string) =>
    numero.trim() ? (validarTelemovel(numero, codigo) ? null : erroTelemovel(codigo)) : undefined;
  const erroTelefone = erroLocal !== undefined ? erroLocal : erros.telefone;
  
  const diaTexto = formatarDiaCurto(diaEmLisboa(inicio));
  const horaTexto = `${horaEmLisboa(inicio)} – ${horaDeFim(inicio, servico.duracao_min)}`;
  const voltarHorario = `/marcar/horario?barbeiro=${barbeiro}&servico=${servico.id}`;
  const textoBotao = aEnviar ? "A MARCAR…" : "CONFIRMAR MARCAÇÃO";

  const estiloInput = (invalido?: boolean) =>
    `h-13 w-full rounded border bg-superficie px-4 text-base text-texto outline-none transition-colors placeholder:text-desativado focus:border-texto autofill:shadow-[inset_0_0_0_100px_var(--color-superficie)] autofill:[-webkit-text-fill-color:var(--color-texto)] autofill:[caret-color:var(--color-texto)] ${
      invalido ? "border-red-400" : "border-borda"
    }`;

  return (
    <EsqueletoMarcacao
      passo={4}
      voltar={voltarHorario}
      titulo="Os teus dados"
      subtitulo="Só precisamos disto para guardar a tua marcação."
      comBarraMovel
      lateral={
        <PainelResumo
          linhas={[
            { rotulo: "Barbeiro", valor: nomeBarbeiro },
            { rotulo: "Serviço", valor: servico.nome, detalhe: formatarDuracao(servico.duracao_min) },
            { rotulo: "Data e hora", valor: diaTexto, detalhe: horaTexto },
          ]}
          total={formatarPreco(servico.preco)}
          acao={
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                form={ID_FORM}
                disabled={aEnviar}
                className={`${classesBotaoPrimario()} w-full disabled:pointer-events-none disabled:opacity-60`}
              >
                {aEnviar && <Roda />}
                {textoBotao}
              </button>
              <p className="text-center text-[13px] text-texto-3">Pagas na barbearia, em dinheiro ou MB Way.</p>
            </div>
          }
        />
      }
    >
      {/* ---------- Resumo das escolhas ---------- */}
      <div className="divide-y divide-borda rounded border border-borda motion-safe:animate-entrar">
        <EscolhaFeita rotulo="Barbeiro" valor={nomeBarbeiro} inicial={nomeBarbeiro.charAt(0)} alterar="/marcar" />
        <EscolhaFeita
          rotulo="Serviço"
          valor={servico.nome}
          detalhe={`${formatarDuracao(servico.duracao_min)} · ${formatarPreco(servico.preco)}`}
          inicial={servico.nome.charAt(0)}
          alterar={`/marcar/servico?barbeiro=${barbeiro}`}
        />
        <EscolhaFeita rotulo="Data e hora" valor={diaTexto} detalhe={horaTexto} inicial="◷" alterar={voltarHorario} />
      </div>

      {/* ---------- Formulário ---------- */}
      <form
        id={ID_FORM}
        action={acao}
        noValidate
        style={{ animationDelay: "120ms" }}
        className="flex flex-col gap-5 motion-safe:animate-entrar"
      >
        <input type="hidden" name="barbeiro" value={barbeiro} />
        <input type="hidden" name="servico" value={servico.id} />
        <input type="hidden" name="inicio" value={inicio} />

        {erros.geral && (
          <div role="alert" className="flex flex-col gap-2 rounded border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
            {erros.geral}
            <Link href={voltarHorario} className="link-sublinhado self-start font-bold text-texto">
              Escolher outra hora
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className="text-[10px] tracking-[0.22em] text-texto-3">
            NOME
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="O teu nome"
            defaultValue={valores?.nome}
            aria-invalid={Boolean(erros.nome) || undefined}
            aria-describedby={erros.nome ? "erro-nome" : undefined}
            className={estiloInput(Boolean(erros.nome))}
          />
          <Erro id="erro-nome" texto={erros.nome} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="telefone" className="text-[10px] tracking-[0.22em] text-texto-3">
            TELEMÓVEL
          </label>
          <div
            className={`relative flex h-13 items-center rounded border bg-superficie transition-colors focus-within:border-texto ${
              erroTelefone ? "border-red-400" : "border-borda"
            }`}
          >
            <SeletorPais
              paises={paises}
              valor={pais}
              onMudar={(codigo) => {
                setPais(codigo);
                if (erroLocal !== undefined || erros.telefone) setErroLocal(verificar(telefone, codigo) ?? null);
              }}
            />
            <input
              id="telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={pais === "PT" ? "912 345 678" : "Número de telemóvel"}
              value={telefone}
              onChange={(e) => {
                setTelefone(e.target.value);
                // se havia erro e o número já ficou certo, o erro desaparece logo
                if (erroTelefone && validarTelemovel(e.target.value, pais)) setErroLocal(null);
              }}
              onBlur={() => setErroLocal(verificar(telefone, pais) ?? (erros.telefone ? null : undefined))}
              aria-invalid={Boolean(erroTelefone) || undefined}
              aria-describedby={erroTelefone ? "erro-telefone" : undefined}
              className="h-full min-w-0 flex-1 rounded-r bg-transparent px-4 text-base text-texto outline-none placeholder:text-desativado autofill:shadow-[inset_0_0_0_100px_var(--color-superficie)] autofill:[-webkit-text-fill-color:var(--color-texto)] autofill:[caret-color:var(--color-texto)]"
            />
          </div>
          <Erro id="erro-telefone" texto={erroTelefone ?? undefined} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nota" className="text-[10px] tracking-[0.22em] text-texto-3">
            NOTA <span className="tracking-normal">(opcional)</span>
          </label>
          <textarea
            id="nota"
            name="nota"
            rows={3}
            maxLength={300}
            placeholder="Ex.: quero manter o comprimento em cima"
            defaultValue={valores?.nota}
            className="w-full resize-none rounded border border-borda bg-superficie px-4 py-3 text-base text-texto outline-none transition-colors placeholder:text-desativado focus:border-texto"
          />
        </div>

        <div className="flex flex-col gap-3.5 pt-1">
          <Caixa name="lembrete" defaultChecked={valores?.lembrete ?? true}>
            Quero receber um lembrete na véspera.
          </Caixa>
          <Caixa
            name="consentimento"
            invalido={Boolean(erros.consentimento)}
            descricao={erros.consentimento ? "erro-consentimento" : undefined}
          >
            Li e aceito a{" "}
            <Link href="/privacidade" target="_blank" className="font-bold text-texto underline underline-offset-4">
              política de privacidade
            </Link>
            .
          </Caixa>
          <Erro id="erro-consentimento" texto={erros.consentimento} />
        </div>
      </form>

      {/* ---------- Barra fixa em baixo (só telemóvel) ---------- */}
      <div
        style={{ animationDelay: "350ms" }}
        className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-5 pb-5 motion-safe:animate-entrar lg:hidden"
      >
        <div className="flex flex-col gap-3.5 rounded-lg border border-texto bg-texto p-4 text-tinta shadow-[0_-16px_40px_rgba(0,0,0,0.7)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold">{diaTexto}</span>
              <span className="text-sm text-borda-forte">
                {horaTexto} · {servico.nome}
              </span>
            </div>
            <span className="text-lg font-extrabold font-stretch-125%">{formatarPreco(servico.preco)}</span>
          </div>
          <button
            type="submit"
            form={ID_FORM}
            disabled={aEnviar}
            className="flex h-13 items-center justify-center gap-2.5 rounded bg-bg text-sm font-extrabold tracking-[0.14em] text-texto font-stretch-125% transition-[transform,opacity] active:scale-[0.97] disabled:opacity-60"
          >
            {aEnviar && <Roda />}
            {textoBotao}
          </button>
        </div>
      </div>
    </EsqueletoMarcacao>
  );
}
