import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { Search, Calendar as CalendarIcon, Filter, Plus, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api"; 
import { toast } from "sonner";
import { AppointmentDialog } from "@/components/AppointmentDialog"; // ✅ Importando o modal



interface Agendamento {
  id: string | number;
  clienteNome: string;
  clienteTelefone: string; // ✅ Adicionado para o formulário do modal
  dataHora: string;
  totalPreco: number;
  barbeiro?: { id: number; nome: string }; // ✅ Adicionado o ID para o preenchimento do formulário
  servicos?: Array<{ id: number; nome: string }>; // ✅ Adicionado o ID para o preenchimento do formulário
  status: "confirmado" | "pendente" | "concluido";
}

export default function Appointments() {
  const queryClient = useQueryClient();

  // Estados de controle dos filtros
  const [dataFiltro, setDataFiltro] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  // ✅ NOVOS ESTADOS: Controle do Modal de Criar/Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Agendamento | null>(null);
 
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  // Busca dos dados na API
  const { data: agendamentos, isLoading, isError } = useQuery<Agendamento[]>({
    queryKey: ["appointmentsList", dataFiltro],
    queryFn: async () => {
      const response = await api.get("/appointments", {
        params: { date: dataFiltro }
      });
      return Array.isArray(response.data) ? response.data : [];
    },
    placeholderData: [],
  });

  // MUTATION: Excluir Agendamento
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentsList"] });
      toast.success("Agendamento removido com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir agendamento.")
  });

  // ✅ NOVA MUTATION: Criar Agendamento (Botão Novo)
  const createApptMutation = useMutation({
    mutationFn: async (newAppt: any) => {
      const response = await api.post("/appointments", newAppt);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentsList"] });
      toast.success("Agendamento criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao criar agendamento"),
  });

  const updateApptMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
    // Trocado de .put para .patch para casar perfeitamente com o seu backend
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["appointmentsList"] });
    toast.success("Agendamento atualizado com sucesso!");
    setDialogOpen(false);
    setEditingAppt(null);
  },
  onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao atualizar agendamento"),
});

  // ✅ PONTE DE SUBMISSÃO: Decide se vai disparar Criar ou Editar
  const handleFormSubmit = async (payload: any) => {
    if (editingAppt) {
      await updateApptMutation.mutateAsync({ id: editingAppt.id, data: payload });
    } else {
      await createApptMutation.mutateAsync(payload);
    }
  };

  const selecionarHoje = () => setDataFiltro(format(new Date(), "yyyy-MM-dd"));
  const selecionarOntem = () => setDataFiltro(format(subDays(new Date(), 1), "yyyy-MM-dd"));

  const formatarHorario = (dataHoraStr: string) => {
    try {
      if (!dataHoraStr) return "—";
      const dateObj = dataHoraStr.includes("T") ? parseISO(dataHoraStr) : new Date(dataHoraStr);
      if (isNaN(dateObj.getTime())) return "—";
      return format(dateObj, "HH:mm");
    } catch (e) {
      return "—";
    }
  };

  const agendamentosFiltrados = (agendamentos ?? []).filter((item) => {
    if (!item) return false;
    const nomeCliente = item.clienteNome?.toLowerCase() || "";
    const nomeServicos = item.servicos?.map(s => s?.nome).join(" ").toLowerCase() || "";
    const nomeBarbeiro = item.barbeiro?.nome?.toLowerCase() || "";

    const bateBusca = nomeCliente.includes(busca.toLowerCase()) || 
                      nomeServicos.includes(busca.toLowerCase()) || 
                      nomeBarbeiro.includes(busca.toLowerCase());
    
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
        
        {/* ✅ Botão Novo Conectado ao Modal */}
        <button 
          onClick={() => { setEditingAppt(null); setDialogOpen(true); }}
          className="flex items-center justify-center gap-2 bg-amber-500 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:opacity-90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
      </div>

      {/* BOTÕES DE ATALHO RÁPIDO DE DATA */}
      <div className="flex gap-2">
        <button 
          onClick={selecionarHoje}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            dataFiltro === format(new Date(), "yyyy-MM-dd") 
              ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          Hoje
        </button>
        <button 
          onClick={selecionarOntem}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            dataFiltro === format(subDays(new Date(), 1), "yyyy-MM-dd") 
              ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          Ontem
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-4 rounded-xl border border-border">
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

        <div className="relative">
          <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="date" 
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)} 
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
                <th className="p-4">Horário</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground animate-pulse">
                    Carregando agendamentos...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-400">
                    Erro ao carregar dados do servidor.
                  </td>
                </tr>
              ) : agendamentosFiltrados.length > 0 ? (
                agendamentosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{item.clienteNome || "—"}</td>
                    
                    <td className="p-4 text-muted-foreground">
                      {item.servicos?.map(s => s?.nome).filter(Boolean).join(", ") || "—"}
                    </td>
                    
                    <td className="p-4 text-muted-foreground">{item.barbeiro?.nome || "Não atribuído"}</td>
                    
                    <td className="p-4">
                      <span className="text-foreground font-medium">
                        {formatarHorario(item.dataHora)}
                      </span>
                    </td>
                    
                    <td className="p-4 font-semibold text-amber-500">
                      R$ {item.totalPreco ?? "0.00"}
                    </td>
                    
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === "confirmado" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        item.status === "pendente" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      }`}>
                        {item.status === "confirmado" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "pendente" && <Clock className="h-3 w-3" />}
                        {item.status === "concluido" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Pendente"}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ✅ BOTÃO EDITAR AGORA SETA O AGENDAMENTO E ABRE O MODAL */}
                        <button 
                          onClick={() => { setEditingAppt(item); setDialogOpen(true); }}
                          className="p-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Deseja realmente excluir este agendamento?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum agendamento encontrado para esta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ COMPONENTE INJETADO NO FINAL DO COMPONENTE */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => { 
          setDialogOpen(open); 
          if (!open) setEditingAppt(null); // Reseta se fechar
        }}
        appointment={editingAppt as any} // Envia o agendamento atual (se houver) para auto-preencher
        onSubmit={handleFormSubmit}
        isSubmitting={createApptMutation.isPending || updateApptMutation.isPending}
        selectedDate={new Date(dateStr)}
      />

    </div>
  );
}