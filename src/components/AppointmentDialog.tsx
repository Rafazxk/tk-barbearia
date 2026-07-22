import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useBarber } from "@/contexts/BarberContext";
import { Appointment } from "@/pages/Dashboard";
import { format, parseISO, isValid } from "date-fns";


interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  selectedDate: Date;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Categoria {
  id: string;
  nome: string;
  servicos: Servico[];
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  isSubmitting,
  selectedDate
}: AppointmentDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useBarber();

  const hojeStr = format(new Date(), "yyyy-MM-dd");

  const { data: bloqueios = [] } = useQuery({
    queryKey: ["schedule-blocks"],
    queryFn: async () => {
      const res = await api.get("/schedule-blocks");
      return res.data;
    },
    enabled: open, // Só busca quando o modal abrir
  });

  // Estados locais do formulário
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [horaInput, setHoraInput] = useState("");
  const [servicoIds, setServicoIds] = useState<number[]>([]);
const [duracao, setDuracao] = useState(30);
  // 📥 BUSCA DE SERVIÇOS
  const { data: categorias = [], isLoading: isLoadingServices } = useQuery<Categoria[]>({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await api.get("/categories/enriched");

    console.log("categorias", Array.isArray(categorias), categorias);

      return res.data;
    },
    enabled: open,
  });

  // 📥 BUSCA OS SLOTS CALCULADOS DO EXPEDIENTE DIRETO DO BACKEND
  const { data: slotsDoExpediente = [], isLoading: isLoadingSlots } = useQuery<string[]>({
    queryKey: ["available-slots-dinamicos", dataInput, user?.id],
    queryFn: async () => {
      const response = await api.get("/appointments/available", {
        params: {
          date: dataInput,
          barberId: user?.id

        }
      });
      return response.data; // Espera vir do service ex: ["10:00", "10:30", "11:00"]
    },
    // Só roda se o dialog estiver aberto, e tivermos uma data e o ID do barbeiro logado
    enabled: open && !!dataInput && !!user?.id,
  });



  // 🔄 Sincroniza o estado inicial (Criação ou Edição)
  useEffect(() => {
    if (appointment && appointment.dataHora) {
      setClienteNome(appointment.clienteNome || "");
      setClienteTelefone(appointment.clienteTelefone || "");

      let dataObjeto = parseISO(appointment.dataHora);
      if (!isValid(dataObjeto)) {
        dataObjeto = new Date(appointment.dataHora);
      }

      if (isValid(dataObjeto)) {
        const ano = dataObjeto.getFullYear();
        const mes = String(dataObjeto.getMonth() + 1).padStart(2, '0');
        const dia = String(dataObjeto.getDate()).padStart(2, '0');

        setDataInput(`${ano}-${mes}-${dia}`);
        setHoraInput(format(dataObjeto, "HH:mm"));
      } else {
        setDataInput(hojeStr);
        setHoraInput("");
      }

      setServicoIds(appointment.servicos?.map((s) => Number(s.id)) || []);
    } else {
      setClienteNome("");
      setClienteTelefone("");

      const safeSelectedDate = selectedDate instanceof Date && isValid(selectedDate) ? selectedDate : new Date();
      const currentSelectedStr = format(safeSelectedDate, "yyyy-MM-dd");

      const dataInicial = currentSelectedStr < hojeStr ? hojeStr : currentSelectedStr;

      setDataInput(dataInicial);
      setHoraInput("");
      setServicoIds([]);
    }
  }, [appointment, open, selectedDate]);


  const opcoesDeHorario = useMemo(() => {
    return slotsDoExpediente.filter((hora) => {
      // Verifica se a 'hora' atual está em algum bloqueio
      const ehBloqueado = bloqueios.some((b: any) => {
        // Bloqueio de dia inteiro
        if (b.tipo === "data" && b.dataInicio === dataInput) return true;

        // Bloqueio de horário específico
        if (b.tipo === "horario" && b.dataInicio === dataInput) {
          return hora >= b.horaInicio && hora <= b.horaFim;
        }
        return false;
      });

      return !ehBloqueado;
    });
  }, [slotsDoExpediente, bloqueios, dataInput]);

  // Caso seja uma edição, força a hora atual do agendamento a aparecer na lista se não estiver nela
  if (appointment && horaInput && !opcoesDeHorario.includes(horaInput)) {
    opcoesDeHorario.push(horaInput);
    opcoesDeHorario.sort();
  }

const handleServiceChange = (id: number) => {
  const novosIds = servicoIds.includes(id)
    ? servicoIds.filter(item => item !== id)
    : [...servicoIds, id];

  setServicoIds(novosIds);

  const novaDuracao = categorias
    .flatMap(c => c.servicos)
    .filter(s => novosIds.includes(Number(s.id)))
    .reduce((total, s) => total + s.duracao, 0);

  setDuracao(novaDuracao);
};

  const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!horaInput) return;

  const payload = {
    clienteNome,
    clienteTelefone,
    dataHora: `${dataInput}T${horaInput}:00`, 
    barbeiroId: user?.id, 
    servicoIds,
    duracao, 
  };
  console.log("Payload enviado:", payload);
  await onSubmit(payload);
};
  if (!open) return null;



  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            {appointment ? "✏️ Editar Agendamento" : "💈 Novo Agendamento"}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Escolha a data e selecione um dos horários calculados para o seu expediente.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Nome do Cliente */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Nome do Cliente</label>
            <input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Telefone do Cliente */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">WhatsApp / Telefone</label>
            <input
              type="tel"
              required
              placeholder="Ex: 81999999999"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Data</label>
              <input
                type="date"
                required
                min={hojeStr}
                value={dataInput}
                onChange={(e) => {
                  setDataInput(e.target.value);
                  setHoraInput("");
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors color-scheme-dark"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Horário Disponível</label>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center h-[38px] text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse">
                  Carregando...
                </div>
              ) : opcoesDeHorario.length === 0 ? (
                <div className="flex items-center justify-center h-[38px] text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 text-center leading-tight">
                  🚫 Fechado / Esgotado
                </div>
              ) : (
                <select
                  required
                  value={horaInput}
                  onChange={(e) => setHoraInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Selecione...</option>
                  {opcoesDeHorario.map((hora) => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>


          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Duração (minutos)</label>
            <input
              type="number"
              step="5"
              min="15"
              max="180"
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Seleção de Serviços */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Selecione os Serviços</label>
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 space-y-4 max-h-48 overflow-y-auto subtle-scrollbar">
              {isLoadingServices ? (
                <p className="text-xs text-zinc-500 animate-pulse text-center py-2">Carregando serviços...</p>
              ) : categorias.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-2">Nenhum serviço disponível.</p>
              ) : (
                categorias.map((categoria) => (
                  <div key={categoria.id} className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 block border-b border-zinc-800/40 pb-0.5">
                      {categoria.nome}
                    </span>

                    <div className="space-y-1.5 pl-1">
                      {categoria.servicos.map((servico) => {
                        const numericId = Number(servico.id);
                        return (
                          <label key={servico.id} className="flex items-center justify-between cursor-pointer text-sm text-zinc-300 select-none hover:text-zinc-100 py-0.5 group">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={servicoIds.includes(numericId)}
                                onChange={() => handleServiceChange(numericId)}
                                className="accent-amber-500 h-4 w-4 rounded bg-zinc-900 border-zinc-800 text-amber-500 focus:ring-0"
                              />
                              <span>{servico.nome}</span>
                            </div>
                            <span className="text-xs text-zinc-500 group-hover:text-amber-400/80 font-medium transition-colors">
                              R$ {servico.preco ? servico.preco.toFixed(2).replace(".", ",") : "0,00"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || servicoIds.length === 0 || isLoadingServices || opcoesDeHorario.length === 0 || !horaInput}
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium"
            >
              {isSubmitting ? "Salvando..." : appointment ? "Atualizar" : "Confirmar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}