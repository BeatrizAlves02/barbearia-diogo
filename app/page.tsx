import Image from "next/image";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-10">
      <Image src="/logo.svg" alt="Diogo Pimenta" width={38} height={44} />
      <p className="mt-10 font-mao text-2xl -rotate-3">corte novo, energia nova</p>
      <h1 className="text-[42px] font-extrabold uppercase leading-[0.95] [font-stretch:125%]">
        O teu<br />próximo<br />corte.
      </h1>
      <p className="mt-3 text-texto-2">Escolhe o serviço, o dia e a hora.</p>
      <a
        href="#"
        className="mt-6 flex h-14 items-center justify-center rounded bg-texto text-sm font-extrabold tracking-[0.14em] text-tinta [font-stretch:125%]"
      >
        MARCAR AGORA
      </a>
    </main>
  );
}