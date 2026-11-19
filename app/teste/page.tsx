import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function ListaServicos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .select("nome, duracao_min")
    .order("ordem");

  if (error) return <p className="text-red-400">Erro: {error.message}</p>;

  return (
    <ul className="space-y-2">
      {data?.map((s) => (
        <li key={s.nome}>
          {s.nome} — {s.duracao_min} min
        </li>
      ))}
    </ul>
  );
}

export default function Teste() {
  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="mb-4 text-2xl font-extrabold">Teste Supabase</h1>
      <Suspense fallback={<p>A carregar…</p>}>
        <ListaServicos />
      </Suspense>
    </main>
  );
}