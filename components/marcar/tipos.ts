export type Servico = {
  id: string;
  nome: string;
  duracao_min: number;
  preco: number | null;
};

/** Uma hora livre: quando começa e com que barbeiro */
/** Dia em que não se trabalha (folga ou férias), com a mensagem do Diogo, se escreveu alguma */
export type DiaFechado = { dia: string; motivo: string | null };

/** Horas livres de uma semana + dias fechados */
export type Semana = { vagas: Vaga[]; fechados: DiaFechado[] };

export type Vaga = {
  barbeiro_id: string;
  inicio: string; // instante em ISO, ex.: "2026-11-24T10:30:00+00:00"
};
