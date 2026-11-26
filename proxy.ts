import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ATIVIDADE, LIMITE_INATIVIDADE_GESTAO_MIN } from "@/lib/sessao";

/*
  Corre antes de cada página da área do barbeiro (/gestao).
  - Renova a sessão do Supabase (guardada em cookies).
  - Sem sessão → manda para /gestao/entrar.
  - Com sessão e na página de entrar → manda para a agenda.
  - Com sessão mas sem mexer na app há demasiado tempo → termina a sessão (segurança).
  As páginas de clientes não passam por aqui (ver "matcher" em baixo).
*/
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          cookiesParaGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesParaGuardar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const naEntrada = request.nextUrl.pathname.startsWith("/gestao/entrar");

  // Sessão parada há demasiado tempo → sair e pedir para entrar outra vez
  if (user && !naEntrada) {
    const ultima = Number(request.cookies.get(COOKIE_ATIVIDADE)?.value) || 0;
    if (ultima && Date.now() - ultima > LIMITE_INATIVIDADE_GESTAO_MIN * 60_000) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/gestao/entrar";
      url.search = "?motivo=inatividade";
      const redirecionar = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => redirecionar.cookies.set(c));
      redirecionar.cookies.delete(COOKIE_ATIVIDADE);
      return redirecionar;
    }
    if (!ultima) {
      response.cookies.set(COOKIE_ATIVIDADE, String(Date.now()), { path: "/", sameSite: "lax", maxAge: 2592000 });
    }
  }

  if (!user && !naEntrada) {
    const url = request.nextUrl.clone();
    url.pathname = "/gestao/entrar";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && naEntrada) {
    const url = request.nextUrl.clone();
    url.pathname = "/gestao";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/gestao", "/gestao/:path*"],
};
