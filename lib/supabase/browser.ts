import { createBrowserClient } from "@supabase/ssr";

/** Cliente do Supabase para usar no browser (usa a mesma sessão da gestão, guardada em cookies) */
export function criarClienteBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
