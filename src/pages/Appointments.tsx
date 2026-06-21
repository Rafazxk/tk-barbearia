import { useState } from "react";
import { Search, Calendar as CalendarIcon, Filter, Plus, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";

// Tipo do Agendamento (Interface baseada no que costuma vir do DB)
interface Agendamento {
  id: string;
  cliente: string;
  servico: string;
  barbeiro: string;
  data: string;
  horario: string;
  valor: string;
  status: "confirmado" | "pendente" | "concluido";
}

export default function Appointments() {
  // Mock de dados simulando o findAll do seu Backend
  const [agendamentos] = useState<Agendamento[]>([
    { id: "1", cliente: "Carlos Eduardo", servico: "Corte Degradê", barbeiro: "Rafael Silva", data: "19/06/2026", horario: "14:00", valor: "R$ 45,00", status: "confirmado" },
    { id: "2", cliente: "Adrielly", servico: "Progressiva + Hidratação", barbeiro: "Lucas Santos", data: "19/06/2026", horario: "15:30", valor: "R$ 120,00", status: "pendente" },
    { id: "3", cliente: "Mateus Oliveira", servico: "Barba Terapia", barbeiro: "Rafael Silva", data: "20/06/2026", horario: "09:00", valor: "R$ 35,00", status: "confirmado" },
    { id: "4", cliente: "Bruno Souza", servico: "Corte + Barba", barbeiro: "Lucas Santos", data: "18/06/2026", horario: "17:00", valor: "R$ 70,00", status: "concluido" },
  ]);

  // Estados para controlar os filtros na tela
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  // Lógica de filtragem em tempo real (Sem precisar recarregar a página)
  const agendamentosFiltrados = agendamentos.filter((item) => {
    const bateBusca = item.cliente.toLowerCase().includes(busca.toLowerCase()) || 
                      item.servico.toLowerCase().includes(busca.toLowerCase()) ||
                      item.barbeiro.toLowerCase().includes(busca.toLowerCase());
    
    const bateStatus = statusFiltro === "todos" || item.status === statusFiltro;
    
    return bateBusca && bateStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DA TELA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os horários marcados e o status dos atendimentos.</p>
        </div>
        
        {/* Botão Novo Agendamento */}
        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm transition-all hover:opacity-90 shadow-lg shadow-primary/10 cursor-pointer">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Input de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, serviço..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Select de Status */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <select 
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>

        {/* Input de Data */}
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="date" 
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* LISTA / TABELA DE AGENDAMENTOS */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <th className="p-4">Cliente</th>
                <th className="p-4">Serviço</th>
                <th className="p-4">Profissional</th>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {agendamentosFiltrados.length > 0 ? (
                agendamentosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    {/* Nome do Cliente */}
                    <td className="p-4 font-medium text-foreground">{item.cliente}</td>
                    
                    {/* Serviço */}
                    <td className="p-4 text-muted-foreground">{item.servico}</td>
                    
                    {/* Barbeiro */}
                    <td className="p-4 text-muted-foreground">{item.barbeiro}</td>
                    
                    {/* Data e Hora */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{item.data}</span>
                        <span className="text-xs text-muted-foreground">{item.horario}</span>
                      </div>
                    </td>
                    
                    {/* Valor */}
                    <td className="p-4 font-semibold text-foreground">{item.valor}</td>
                    
                    {/* Badge de Status estilizado */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === "confirmado" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        item.status === "pendente" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      }`}>
                        {item.status === "confirmado" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "pendente" && <Clock className="h-3 w-3" />}
                        {item.status === "concluido" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    
                    {/* Ações (Editar / Excluir) */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum agendamento encontrado para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}