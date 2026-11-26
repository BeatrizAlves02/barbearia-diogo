"use client";

import { useLinkStatus } from "next/link";

/*
  Vai dentro de um <Link>. Enquanto a página seguinte está a abrir, o botão
  enche-se de preto e mostra uma rodinha — assim, no telemóvel, nota-se logo que o toque funcionou.
*/
export function CarregarLink() {
  const { pending } = useLinkStatus();
  return (
    <>
      <span
        aria-hidden="true"
        data-pendente={pending || undefined}
        className="pointer-events-none absolute inset-0 -z-10 origin-left scale-x-0 bg-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-pendente:scale-x-100"
      />
      {pending && (
        <span
          aria-hidden="true"
          className="absolute right-4 size-4 animate-spin rounded-full border-2 border-texto border-t-transparent"
        />
      )}
    </>
  );
}
