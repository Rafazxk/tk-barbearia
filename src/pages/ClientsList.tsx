import { useState } from "react";
import { Users, Search, Phone, Scissors, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  totalCortes: number;
}

export default function ClientsList() {
  // Simulando o retorno do Banco de Dados (com o filtro de count > 1 já feito no backend)
  const [clientes] = useState<Cliente[]>([
    { id: "1", nome: "Carlos Eduardo Souza", telefone: "(81) 99888-7766", totalCortes: 5 },
    { id: "2", nome: "Mateus Oliveira Ramos", telefone: "(81) 99111-2233", totalCortes: 3 },
    { id: "3", nome: "Bruno Souza Melo", telefone: "(81) 98765-4321", totalCortes: 2 },
    { id: "4", nome: "Arthur Vinícius", telefone: "(81) 99555-4444", totalCortes: 8 },
    { id: "5", nome: "Diego Cavalcanti", telefone: "(81) 99222-8888", totalCortes: 4 },
    { id: "6", nome: "Eduardo Henrique", telefone: "(81) 98111-0000", totalCortes: 2 },
  ]);

  // Estados de controle
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"nome" | "cortes">("nome");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5; // Limite por página para testar a paginação

  // 1. Filtrar por texto digitado
  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca)
  );

  // 2. Ordenar de acordo com o filtro selecionado
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (ordem === "nome") {
      return a.nome.localeCompare(b.nome); // Ordem Alfabética (A-Z)
    } else {
      return b.totalCortes - a.totalCortes; // Maior quantidade de cortes primeiro
    }
  });

  // 3. Lógica de Paginação (Cálculo dos índices)
  const totalItens = clientesOrdenados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const clientesPaginados = clientesOrdenados.slice(indiceInicio, indiceFim);

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes Recorrentes</h1>
        <p className="text-sm text-muted-foreground">
          Lista de clientes que agendaram 2 ou mais vezes no sistema.
        </p>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Input de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1); // Reseta para a primeira página ao buscar
            }}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Seletor de Ordenação */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <select 
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as "nome" | "cortes")}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="nome">Ordem Alfabética (A-Z)</option>
            <option value="cortes">Mais Frequentes (Qtd. de Cortes)</option>
          </select>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Frequência</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {clientesPaginados.length > 0 ? (
                clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-secondary/30 transition-colors">
                    
                    {/* Nome */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold text-xs">
                          {cliente.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{cliente.nome}</span>
                      </div>
                    </td>
                    
                    {/* Telefone */}
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        {cliente.telefone}
                      </div>
                    </td>
                    
                    {/* Quantidade de Cortes */}
                    <td className="p-4 text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-3.5 w-3.5 text-primary" />
                        {cliente.totalCortes} cortes
                      </div>
                    </td>

                    {/* Badge Fidelidade */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Cliente VIP
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum cliente recorrente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPaginas > 1 && (
          <div className="p-4 border-t border-border bg-background/30 flex items-center justify-between select-none">
            <span className="text-xs text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{indiceInicio + 1}</span> a{" "}
              <span className="font-semibold text-foreground">{Math.min(indiceFim, totalItens)}</span> de{" "}
              <span className="font-semibold text-foreground">{totalItens}</span> clientes
            </span>

            <div className="flex items-center gap-2">
              {/* Botão Voltar */}
              <button
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Indicador de Páginas */}
              <span className="text-xs text-foreground font-medium px-2">
                Página {paginaAtual} de {totalPaginas}
              </span>

              {/* Botão Avançar */}
              <button
                onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}