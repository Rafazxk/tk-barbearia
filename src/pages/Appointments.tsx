import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { Search, Calendar as CalendarIcon, Filter, Plus, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AppointmentDialog } from "@/components/AppointmentDialog"; // ✅ Importando o modal
import { ArrowUpDown } from "lucide-react";
import { useEffect } from "react";

interface Agendamento {
  id: string | number;
  clienteNome: string;
  clienteTelefone: string;
  dataHora: string;
  totalPreco: number;
  barbeiro?: { id: number; nome: string };
  totalDuracao: number;
  servicos?: Array<{
     id: number;
     nome: string;
     duracaoMinutos: number;
    }>;
  status: "confirmado" | "pendente" | "concluido";
}

export default function Appointments() {
  const queryClient = useQueryClient();


  const [dataFiltro, setDataFiltro] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("pendente");
  const [modoVisualizacao, setModoVisualizacao] = useState<"dia" | "todos">("dia");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Agendamento | null>(null);
  const [ordem, setOrdem] = useState<"asc" | "desc">("asc");  
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
    const [tick, setTick] = useState(0);

  // Busca dos dados na API

  const { data: agendamentos, isLoading, isError } = useQuery<Agendamento[]>({
    queryKey: ["appointmentsList", modoVisualizacao, dataFiltro, ordem],

  queryFn: async () => {
  const params: Record<string, string> = {
    order: ordem,
  };

  // Se modoVisualizacao for 'dia', envia a data. Se for 'todos', não envia.
  if (modoVisualizacao === "dia" && dataFiltro) {
    params.date = dataFiltro;
  }

  const response = await api.get("/appointments", {
    params,
  });

  // Garante que o retorno seja tratado
  const rawData = Array.isArray(response.data) ? response.data : [];

  return rawData.map((appt) => ({
    ...appt,
    // Garante que as datas sejam instâncias da sua classe ou apenas formatadas na exibição
    dataHora: appt.dataHora, 
    servicos: Array.isArray(appt.servicos) ? appt.servicos : [],
  }));
},

    placeholderData: [],
  });

  
function StatusBadge({ appt }: { appt: Agendamento }) {
  // A lógica de calcularStatus deve estar disponível aqui
  // (Você pode mover calcularStatus para fora do componente pai ou declará-la aqui)
 

  const [status, setStatus] = useState(() => calcularStatus(appt));

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(calcularStatus(appt));
    }, 60000); // Atualiza apenas o status a cada minuto
    return () => clearInterval(interval);
  }, [appt]);

  const styles: Record<string, string> = {
  "em andamento": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "concluido": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "pendente": "bg-amber-500/10 text-amber-400 border-amber-500/20"
};

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status === "em andamento" && <Clock className="h-3 w-3 animate-pulse" />}
      {status === "concluido" && <CheckCircle2 className="h-3 w-3" />}
      {status === "pendente" && <Clock className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
   const calcularStatus = (item: Agendamento) => {
    const agora = new Date().getTime();
    const inicio = new Date(item.dataHora).getTime();
    const fim = inicio + (item.totalDuracao * 60 * 1000);
    if (agora >= inicio && agora < fim) return "em andamento";
    if (agora >= fim) return "concluido";
    return "pendente";
  };
  
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

  //  NOVA MUTATION: Criar Agendamento (Botão Novo)
  const createApptMutation = useMutation({
    mutationFn: async (newAppt: any) => {
      const payload = {
        ...newAppt,
        dataHora: new Date(newAppt.dataHora).toISOString()
      };

      const response = await api.post("/appointments", payload);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentsList"] });
      toast.success("Agendamento criado com sucesso!");
      setDialogOpen(false);
    },

    onError: (error: any) => {
      console.error("Erro completo:", error); // Isso vai aparecer no Eruda que você instalou

      if (error.response) {
        // Erro do servidor (ex: 400, 500)
        toast.error(error.response.data.error || "Erro no servidor");
      } else if (error.request) {
        // Erro de rede (não chegou no servidor - AQUI É O CORS OU FALHA DE CONEXÃO)
        toast.error("Erro de conexão: O servidor não respondeu. Verifique sua rede ou CORS.");
      } else {
        toast.error("Erro ao configurar a requisição.");
      }
    },
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

  //  PONTE DE SUBMISSÃO: Decide se vai disparar Criar ou Editar
  const handleFormSubmit = async (payload: any) => {
    if (editingAppt) {
      await updateApptMutation.mutateAsync({ id: editingAppt.id, data: payload });
    } else {
      await createApptMutation.mutateAsync(payload);
    }
  };

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

  const formatarData = (dataHoraStr: string) => {
    try {
      if (!dataHoraStr) return "—";

      const dateObj = dataHoraStr.includes("T")
        ? parseISO(dataHoraStr)
        : new Date(dataHoraStr);

      if (isNaN(dateObj.getTime())) return "—";

      return format(dateObj, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

 


const agendamentosFiltrados = (agendamentos ?? []).filter((item) => {
  if (!item) return false;

  // 1. Calcular o status dinâmico de cada agendamento
  const statusAtual = calcularStatus(item); // A função que criamos anteriormente

  // 2. Lógica de Busca (mantida)
  const nomeCliente = item.clienteNome?.toLowerCase() || "";
  const nomeServicos = item.servicos?.map(s => s?.nome).join(" ").toLowerCase() || "";
  const nomeBarbeiro = item.barbeiro?.nome?.toLowerCase() || "";

  const bateBusca = nomeCliente.includes(busca.toLowerCase()) ||
    nomeServicos.includes(busca.toLowerCase()) ||
    nomeBarbeiro.includes(busca.toLowerCase());

  // 3. Novo Filtro de Status
  // Se o usuário escolher "todos", mostra tudo. 
  // Se escolher "pendente", "em andamento" ou "concluido", filtra pelo cálculo dinâmico.
  const bateStatus = statusFiltro === "todos" || statusAtual === statusFiltro;

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
    value={modoVisualizacao}
    onChange={(e) =>
      setModoVisualizacao(e.target.value as "dia" | "todos")
    }
    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm appearance-none cursor-pointer"
  >
    <option value="dia">Agendamentos do dia</option>
    <option value="todos">Todos os agendamentos</option>
  </select>
</div>
 <select
  value={statusFiltro}
  onChange={(e) => setStatusFiltro(e.target.value)}
  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm appearance-none cursor-pointer"
>
  <option value="todos">Todos os status</option>
  <option value="pendente">Pendentes</option>
  <option value="em andamento">Em andamento</option>
  <option value="concluido">Concluídos</option>
</select>
<div className="relative">
  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
  <input
    type="date"
    value={dataFiltro}
    disabled={modoVisualizacao === "todos"}
    onChange={(e) => setDataFiltro(e.target.value)}
    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  />
</div>

      <div className="relative">
  <ArrowUpDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

  <select
    value={ordem}
    onChange={(e) => setOrdem(e.target.value as "asc" | "desc")}
    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm appearance-none cursor-pointer"
  >
    <option value="asc">Mais próximos</option>
    <option value="desc">Mais distantes</option>
  </select>

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
                <th className="p-4">
                  {modoVisualizacao === "todos" ? "Data" : "Profissional"}
                </th>
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

                    <td className="p-4 text-muted-foreground">
                      {modoVisualizacao === "todos"
                        ? formatarData(item.dataHora)
                        : item.barbeiro?.nome || "Não atribuído"}
                    </td>

                    <td className="p-4">
                      <span className="text-foreground font-medium">
                        {formatarHorario(item.dataHora)}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-amber-500">
                      R$ {item.totalPreco ?? "0.00"}
                    </td>

                   <td className="p-4">
  {(() => {
    // 1. Calculamos o status dinâmico aqui
    const status = calcularStatus(item);

    // 2. Definimos as classes baseadas no status calculado
    const styles = {
      "em andamento": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "concluido": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "pendente": "bg-amber-500/10 text-amber-400 border-amber-500/20"
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status === "em andamento" && <Clock className="h-3 w-3 animate-pulse" />}
        {status === "concluido" && <CheckCircle2 className="h-3 w-3" />}
        {status === "pendente" && <Clock className="h-3 w-3" />}
        
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  })()}
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
                            if (confirm("Deseja realmente excluir este agendamento?")) {
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
