import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api"; // Sua instância configurada do Axios
import { Search, Phone, Scissors, ArrowUpDown, ChevronLeft, ChevronRight, CalendarDays, DollarSign } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  totalCortes: number;
  ultimoCorte: string;  // Nova info: Data em formato string (ISO ou BR)
  totalGasto: number;   // Nova info: Valor acumulado em reais
}

export default function ClientsList() {
  // Estados de controle local para filtros e paginação
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"nome" | "cortes" | "gasto">("nome");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8; // Aumentado um pouco para tabelas reais

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["clientes-recorrentes"],
    queryFn: async () => {
      // Aponta exatamente para a nova rota que acabamos de criar no Express
      const response = await api.get("/appointments/frequent-clients"); 
      return response.data;
    },
  });

  // 1. Filtrar por texto digitado (Nome ou Telefone)
  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca)
  );

  // 2. Ordenar dinamicamente no Frontend de acordo com o seletor
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (ordem === "nome") {
      return a.nome.localeCompare(b.nome);
    } else if (ordem === "cortes") {
      return b.totalCortes - a.totalCortes;
    } else {
      return b.totalGasto - a.totalGasto; // Maior faturamento primeiro
    }
  });

  // 3. Lógica de Paginação
  const totalItens = clientesOrdenados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const clientesPaginados = clientesOrdenados.slice(indiceInicio, indiceFim);

  // Helper para formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  // Helper para formatar a data relativa (ex: "Há 5 dias" ou apenas a data)
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "Nenhum";
    return new Date(dataStr).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-muted-foreground animate-pulse">
        Carregando base de clientes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes Recorrentes</h1>
        <p className="text-sm text-muted-foreground">
          Lista de clientes fiéis que movimentam o caixa da sua barbearia.
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
              setPaginaAtual(1);
            }}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Seletor de Ordenação Expandido */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <select 
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as "nome" | "cortes" | "gasto")}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="nome">Ordem Alfabética (A-Z)</option>
            <option value="cortes">Mais Frequentes (Qtd. de Cortes)</option>
            <option value="gasto">Maior Faturamento (Total Gasto)</option>
          </select>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Frequência</th>
                <th className="p-4">Última Visita</th>
                <th className="p-4">Total Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {clientesPaginados.length > 0 ? (
                clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-secondary/30 transition-colors">
                    
                    {/* Nome + Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {cliente.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-none block">
                          {cliente.nome}
                        </span>
                      </div>
                    </td>
                    
                    {/* Telefone */}
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {cliente.telefone}
                      </div>
                    </td>
                    
                    {/* Quantidade de Cortes */}
                    <td className="p-4 text-foreground font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-3.5 w-3.5 text-primary" />
                        {cliente.totalCortes} cortes
                      </div>
                    </td>

                    {/* Última Visita */}
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {formatarData(cliente.ultimoCorte)}
                      </div>
                    </td>

                    {/* Faturamento Acumulado */}
                    <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500/80" />
                        {formatarMoeda(cliente.totalGasto || 0)}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
              <button
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs text-foreground font-medium px-2">
                Página {paginaAtual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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