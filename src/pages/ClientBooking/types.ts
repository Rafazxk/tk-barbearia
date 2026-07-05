export interface Produto {
    id: number;
    nome: string;
    preco: number;
    estoque: number;
}

export interface Barbeiro {
    id: number;
    nome: string;
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