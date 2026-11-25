import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
  Corre antes de cada página da área do barbeiro (/gestao).
  - Renova a sessão do Supabase (guardada em cookies).
  - Sem sessão → manda para /gestao/entrar.
  - Com sessão e na página de entrar → manda para a agenda.
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
