export interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
}

export interface Barbeiro {
    id: number | string;
    nome: string;
    foto?: string;
}

export interface Servico {
    id: number;
    nome: string;
    preco: number;
    duracaoMinutos: number;
}

export interface Categoria {
    id: number;
    nome: string;
    servicos: Servico[];
}