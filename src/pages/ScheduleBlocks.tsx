import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarX, Clock, Calendar, Trash2, X, Pencil } from "lucide-react";
import { useBarber } from "@/contexts/BarberContext";

interface Bloqueio {
  id: number;
  tipo: "horario" | "data";
  descricao: string;
  dataInicio: string;
  horaInicio?: string;
  horaFim?: string;
  barbeiroId?: number | null;
  nomeBarbeiro?: string; // Corrigido de barbeiroNome para nomeBarbeiro
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
  
  // Por padrão, se o usuário logado for barbeiro, preenche com o ID dele
  const [barbeiroId, setBarbeiroId] = useState<string>("");
  const [editingBlock, setEditingBlock] = useState<Bloqueio | null>(null);

  // 📥 Buscar bloqueios do Banco de Dados
  const { data: bloqueios = [], isLoading } = useQuery<Bloqueio[]>({
    queryKey: ["schedule-blocks", user?.id, user?.role],
    queryFn: async () => {
      // Se o usuário logado for um barbeiro comum, passamos o id dele na query string.
      // Se for admin/gerente, não enviamos nada e o backend retorna todos.
      const params = user?.role === "barber" && user?.id ? { barberId: user.id } : {};
      
      const res = await api.get("/schedule-blocks", { params });
      return res.data;
    },
    enabled: !!user, // Só executa a query quando o usuário estiver carregado no contexto
  });

  // Auxiliar para invalidar todos os caches de agenda
  const invalidarCachesAgenda = () => {
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-blocks-lookup"] });
    queryClient.invalidateQueries({ queryKey: ["client-appointments-lookup"] });
    queryClient.invalidateQueries({ queryKey: ["available-slots"] });
  };

  // 📤 Mutation para criar um novo bloqueio
  const createBlockMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/schedule-blocks", payload),
    onSuccess: () => {
      invalidarCachesAgenda();
      fecharModal();
    }
  });

  // ✏️ Mutation para editar um bloqueio existente
  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) =>
      api.patch(`/schedule-blocks/${id}`, payload),
    onSuccess: () => {
      invalidarCachesAgenda();
      fecharModal();
    }
  });

  // ❌ Mutation para deletar um bloqueio
  const deleteBlockMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/schedule-blocks/${id}`),
    onSuccess: () => {
      invalidarCachesAgenda();
    }
  });

  // Helper para abrir novo modal ja configurando o barbeiroId inicial
  const abrirNovoModal = (tipo: "horario" | "data") => {
    setEditingBlock(null);
    setTipoModal(tipo);
    setDescricao("");
    setDataInicio("");
    setHoraInicio("");
    setHoraFim("");
    
    // Se o usuário logado for um barbeiro comum, inicia o select preenchido com o ID dele
    // Se for admin/gerente, pode iniciar como "" (Todos) ou com o ID do usuário
    if (user?.id) {
      setBarbeiroId(String(user.id));
    } else {
      setBarbeiroId("");
    }
  };

  const handleSalvarBloqueio = (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao || !dataInicio) return;

    // Tratamento estrito do barbeiroId:
    // Se for "" -> envia null (Afeta Toda a Barbearia)
    // Se for valor numerico -> envia Number (Afeta Apenas este Barbeiro)
    const finalBarbeiroId = barbeiroId && barbeiroId.trim() !== "" 
      ? Number(barbeiroId) 
      : null;

    const payload = {
      tipo: tipoModal,
      descricao,
      dataInicio,
      horaInicio: tipoModal === "horario" ? (horaInicio || null) : null,
      horaFim: tipoModal === "horario" ? (horaFim || null) : null,
      barbeiroId: finalBarbeiroId,
    };
    
    if (editingBlock) {
      updateBlockMutation.mutate({
        id: editingBlock.id,
        payload,
      });
    } else {
      createBlockMutation.mutate(payload);
    }
  };

  const fecharModal = () => {
    setTipoModal(null);
    setEditingBlock(null);
    setDescricao("");
    setDataInicio("");
    setHoraInicio("");
    setHoraFim("");
    setBarbeiroId("");
  };

  const abrirEdicao = (bloqueio: Bloqueio) => {
    setEditingBlock(bloqueio);
    setTipoModal(bloqueio.tipo);
    setDescricao(bloqueio.descricao);
    setDataInicio(bloqueio.dataInicio ? bloqueio.dataInicio.split("T")[0] : "");
    setHoraInicio(bloqueio.horaInicio?.slice(0, 5) ?? "");
    setHoraFim(bloqueio.horaFim?.slice(0, 5) ?? "");
    setBarbeiroId(bloqueio.barbeiroId !== null && bloqueio.barbeiroId !== undefined ? String(bloqueio.barbeiroId) : "");
  };
  



  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const partes = dataStr.split("T")[0].split("-");
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const isSaving = createBlockMutation.isPending || updateBlockMutation.isPending;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando bloqueios da agenda...</div>;
  }
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
            onClick={() => abrirNovoModal("horario")}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Clock className="h-4 w-4 text-primary" />
            Bloquear Horário
          </button>

          <button
            onClick={() => abrirNovoModal("data")}
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
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        bloqueio.barbeiroId
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}>
                        {bloqueio.nomeBarbeiro || (bloqueio.barbeiroId ? "Barbeiro Específico" : "Toda a Barbearia")}
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirEdicao(bloqueio)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Remover esta regra de bloqueio?")) {
                        deleteBlockMutation.mutate(bloqueio.id);
                      }
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum horário ou data bloqueada no momento. A agenda está 100% aberta.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {tipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={fecharModal} />
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-5 relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingBlock ? "Editar Bloqueio" : `Bloquear ${tipoModal === "horario" ? "Horário Específico" : "Data Inteira"}`}
              </h3>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarBloqueio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Motivo / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoço, Curso, Feriado..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Data</label>
                <input
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground cursor-pointer"
                />
              </div>

              {tipoModal === "horario" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Hora Início</label>
                    <input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Hora Fim</label>
                    <input
                      type="time"
                      required
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>
              )}

            <div className="space-y-1.5">
  <label className="text-xs font-semibold">Alcance do Bloqueio</label>
  <select
    value={barbeiroId}
    onChange={(e) => setBarbeiroId(e.target.value)}
    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground cursor-pointer"
  >
    {/* Opção para Todos -> valor "" (vazio) */}
    <option value="">Toda a Barbearia (Todos os Barbeiros)</option>
    
    {/* Opção Individual -> valor do id em string */}
    {user && user.id && (
      <option value={String(user.id)}>
        Apenas Comigo ({user.nome})
      </option>
    )}
  </select>
</div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 text-sm bg-secondary rounded-lg border border-border cursor-pointer text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBlockMutation.isPending || updateBlockMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {editingBlock ? "Salvar Alterações" : "Confirmar Bloqueio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}