import { redirect } from "next/navigation";

/* Endereço antigo: o passo do serviço passou a ser o primeiro, em /marcar */
export default function ServicoAntigo() {
  redirect("/marcar");
}
