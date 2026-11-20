export type Servico = {
  id: string;
  nome: string;
  duracao_min: number;
  preco: number | null;
};

/** Uma hora livre: quando começa e com que barbeiro */
export type Vaga = {
  barbeiro_id: string;
  inicio: string; // instante em ISO, ex.: "2026-11-24T10:30:00+00:00"
};
