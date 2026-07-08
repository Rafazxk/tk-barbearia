import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarX, Clock, Calendar, Plus, Trash2, AlertCircle, MapPin, X } from "lucide-react";
import { useBarber } from "@/contexts/BarberContext";
import { toast } from "sonner";

interface Bloqueio {
  id: number;
  tipo: "horario" | "data";
  descricao: string;
  dataInicio: string;
  horaInicio?: string;
  horaFim?: string;
  barbeiroId?: number | null;
  barbeiroNome?: string; // Caso faça o join futuramente
}

export default function ScheduleBlocks() {
  const queryClient = useQueryClient();

  const { user } = useBarber();

  const [tipoModal, setTipoModal] = useState<"horario" | "data" | null>(null);

  // Estados dos formulários
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");

  const [escopoBloqueio, setEscopoBloqueio] = useState<"todos" | "individual">("todos");

  // 📥 Buscar bloqueios do Banco de Dados
  const { data: bloqueios = [], isLoading } = useQuery<Bloqueio[]>({
    queryKey: ["schedule-blocks"],
    queryFn: async () => {
      const res = await api.get("/schedule-blocks");
      return res.data;
    }
  });

  // 📤 Mutation para criar um novo bloqueio
  const createBlockMutation = useMutation({
  mutationFn: async (payload: any) => api.post("/schedule-blocks", payload),
  onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["schedule-blocks"] });
  queryClient.invalidateQueries({ queryKey: ["schedule-blocks-lookup"] }); // <--- Adicione isso!
  queryClient.invalidateQueries({ queryKey: ["client-appointments-lookup"] });
  fecharModal();
  } 
});

  // ❌ Mutation para deletar um bloqueio
  const deleteBlockMutation = useMutation({
  mutationFn: async (id: number) => api.delete(`/schedule-blocks/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks"] });
    
    // 2. 🔥 TAMBÉM AQUI: Se desbloquear, o cliente precisa ver o horário livre
    queryClient.invalidateQueries({ queryKey: ["client-appointments-lookup"] });
  }
});


  const handleSalvarBloqueio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !dataInicio) return;

    // Definição dinâmica do barbeiroId com base na escolha do escopo
    const finalBarbeiroId = escopoBloqueio === "individual" && user?.id
      ? Number(user.id)
      : null;

    createBlockMutation.mutate({
      tipo: tipoModal,
      descricao,
      dataInicio,
      horaInicio: tipoModal === "horario" ? horaInicio : undefined,
      horaFim: tipoModal === "horario" ? horaFim : undefined,
      barbeiroId: finalBarbeiroId
    });
  };

  const fecharModal = () => {
    setTipoModal(null);
    setDescricao("");
    setDataInicio("");
    setHoraInicio("");
    setHoraFim("");
    setEscopoBloqueio("todos"); // Reseta para o padrão
  };

  // Formata datas do padrão ISO (aaaa-mm-dd) vindo do banco para o padrão pt-BR (dd/mm/aaaa)
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const partes = dataStr.split("T")[0].split("-");
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando bloqueios da agenda...</div>;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bloquear Horários & Datas</h1>
          <p className="text-sm text-muted-foreground">Gerencie exceções na agenda para impedir agendamentos indesejados de clientes.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 🕒 BOTÃO DE BLOQUEAR HORÁRIO (Corrigido para abrir o modal de horário) */}
          <button
            onClick={() => setTipoModal("horario")}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Clock className="h-4 w-4 text-primary" />
            Bloquear Horário
          </button>

          {/* 📅 BOTÃO DE BLOQUEAR DATA INTEIRA */}
          <button
            onClick={() => setTipoModal("data")}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg shadow-primary/10 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Bloquear Data Inteira
          </button>
        </div>
      </div>


      {/* LISTAGEM DE REGRAS DE BLOQUEIO ATIVAS */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 bg-background/30 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Bloqueios Ativos</h3>
        </div>

        <div className="divide-y divide-border">
          {bloqueios.length > 0 ? (
            bloqueios.map((bloqueio) => (
              <div key={bloqueio.id} className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${bloqueio.tipo === "horario"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                    {bloqueio.tipo === "horario" ? <Clock className="h-4 w-4" /> : <CalendarX className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{bloqueio.descricao}</span>
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border">
                        {bloqueio.barbeiroNome}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground pt-0.5">
                      {bloqueio.tipo === "horario" ? (
                        <>Data: <span className="text-foreground">{formatarData(bloqueio.dataInicio)}</span> das <span className="text-primary font-medium">{bloqueio.horaInicio?.slice(0, 5)} às {bloqueio.horaFim?.slice(0, 5)}</span></>
                      ) : (
                        <>Dia Inteiro: <span className="text-foreground">{formatarData(bloqueio.dataInicio)}</span></>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { if (confirm("Remover esta regra de bloqueio?")) deleteBlockMutation.mutate(bloqueio.id); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum horário ou data bloqueada no momento. A agenda está 100% aberta.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO REAL */}
      {tipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={fecharModal} />
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-5 relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Bloquear {tipoModal === "horario" ? "Horário Específico" : "Data Inteira"}
              </h3>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4 w-4" />
              </button>

              
            </div>

            <form onSubmit={handleSalvarBloqueio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Motivo / Descrição</label>
                <input type="text" required placeholder="Ex: Almoço, Curso, Feriado..." value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Data</label>
                <input type="date" required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground cursor-pointer" />
              </div>

              {tipoModal === "horario" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Hora Início</label>
                    <input type="time" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Hora Fim</label>
                    <input type="time" required value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Barbeiro Afetado</label>
                <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground cursor-pointer">
                  <option value="">Todos os Barbeiros (Barberia Inteira)</option>


                  {user && (
                    <option value={user.id}>
                      Apenas Comigo ({user.nome})
                    </option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={fecharModal} className="px-4 py-2 text-sm bg-secondary rounded-lg border border-border cursor-pointer text-foreground">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-lg cursor-pointer">Confirmar Bloqueio</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}