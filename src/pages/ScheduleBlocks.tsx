import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarX, Clock, Calendar, Plus, Trash2, AlertCircle, MapPin, X } from "lucide-react";

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
  const [tipoModal, setTipoModal] = useState<"horario" | "data" | null>(null);

  // Estados dos formulários
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");

  // Feriados estáticos de Recife fornecidos
  const feriadosRecife = [
    { data: "2026-06-24", nome: "São João (Feriado Municipal)" },
    { data: "2026-07-16", nome: "Nossa Senhora do Carmo (Padroeira de Recife)" },
    { data: "2026-12-08", nome: "Nossa Senhora da Conceição (Feriado Municipal)" },
  ];

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
      fecharModal();
    }
  });

  // ❌ Mutation para deletar um bloqueio
  const deleteBlockMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/schedule-blocks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-blocks"] })
  });

  const fecharModal = () => {
    setTipoModal(null);
    setDescricao("");
    setDataInicio("");
    setHoraInicio("");
    setHoraFim("");
    setBarbeiroId("");
  };

  const handleSalvarBloqueio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !dataInicio) return;

    createBlockMutation.mutate({
      tipo: tipoModal,
      descricao,
      dataInicio,
      horaInicio,
      horaFim,
      barbeiroId: barbeiroId ? Number(barbeiroId) : null
    });
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
          <button 
            onClick={() => setTipoModal("horario")}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Clock className="h-4 w-4 text-primary" />
            Bloquear Horário
          </button>

          <button 
            onClick={() => setTipoModal("data")}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg shadow-primary/10 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Bloquear Data Inteira
          </button>
        </div>
      </div>

      {/* PAINEL DE AVISO DE FERIADOS LOCAIS */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400">
            <MapPin className="h-3.5 w-3.5" />
            Próximos Feriados em Recife (Fique Atento):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {feriadosRecife.map((f, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-background/40 px-2 py-1 rounded border border-border/40">
                <span className="font-medium text-foreground">{f.data.split('-').reverse().slice(0,2).join('/')}</span> - {f.nome}
              </div>
            ))}
          </div>
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
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${
                    bloqueio.tipo === "horario" 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}>
                    {bloqueio.tipo === "horario" ? <Clock className="h-4 w-4" /> : <CalendarX className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{bloqueio.descricao}</span>
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded border border-border">
                        {bloqueio.barbeiroNome || "Todos os Barbeiros"}
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
                  onClick={() => { if(confirm("Remover esta regra de bloqueio?")) deleteBlockMutation.mutate(bloqueio.id); }}
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
                  {/* Se tiver lista de barbeiros mapeados dinamicamente adicione aqui */}
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