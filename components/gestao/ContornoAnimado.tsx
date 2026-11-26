/* Linha branca que percorre o contorno do botão ao passar o rato (e volta para trás ao sair).
   O botão pai tem de ter as classes "group relative". */
export function ContornoAnimado({ raio }: { raio: number }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <rect
        x="0.75"
        y="0.75"
        rx={raio}
        pathLength={1}
        style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" }}
        className="fill-none stroke-texto [stroke-dasharray:1] [stroke-dashoffset:1] [stroke-width:1.5] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
      />
    </svg>
  );
}
