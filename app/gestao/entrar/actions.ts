"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoEntrar = { erro?: string; email?: string };

export async function entrar(_anterior: EstadoEntrar, fd: FormData): Promise<EstadoEntrar> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (!email || !password) return { erro: "Escreve o email e a palavra-passe.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { erro: "Email ou palavra-passe errados.", email };

  redirect("/gestao");
}
