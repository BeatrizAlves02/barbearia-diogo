import { Suspense } from "react";
import Link from "next/link";
import { barbeiroPorId, servicoPorId } from "@/lib/dados-publicos";
import { UUID } from "@/lib/validar";
import { Confirmacao } from "@/components/marcar/Confirmacao";

type Props = { searchParams: Promise<{ barbeiro?: string; servico?: string; inicio?: string }> };

function Invalido() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-3 px-5">
      <p className="text-texto-2">Não encontrámos esta marcação.</p>
      <Link href="/" className="link-sublinhado font-bold">
        Voltar ao início
      </Link>
    </main>
  );
}

async function Conteudo({ searchParams }: Props) {
  const { barbeiro = "", servico = "", inicio = "" } = await searchParams;
  const dataInicio = new Date(inicio);
  if (!UUID.test(barbeiro) || !UUID.test(servico) || Number.isNaN(dataInicio.getTime())) return <Invalido />;

  const [s, b] = await Promise.all([servicoPorId(servico), barbeiroPorId(barbeiro)]);
  if (!s || !b) return <Invalido />;

  const iso = dataInicio.toISOString();
  return (
    <Confirmacao
      nomeBarbeiro={b.nome}
      servico={s}
      inicio={iso}
      linkCalendario={`/marcar/confirmado/calendario?barbeiro=${barbeiro}&servico=${servico}&inicio=${encodeURIComponent(iso)}`}
    />
  );
}

export default function ConfirmadoPagina({ searchParams }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}
