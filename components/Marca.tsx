import Image from "next/image";

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/logo.svg" alt="" width={33} height={38} priority />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold tracking-[0.3em] font-stretch-125%">DIOGO PIMENTA</span>
        <span className="text-[9px] tracking-[0.3em] text-texto-2">BARBERSHOP · EST. 2020</span>
      </div>
    </div>
  );
}
