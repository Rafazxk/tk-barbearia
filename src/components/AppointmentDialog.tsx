import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useBarber } from "@/contexts/BarberContext";
import { Appointment } from "@/pages/Dashboard";
import { format, isValid } from "date-fns";
import { Time } from "@/lib/Time.js";

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

interface Bloqueio {
  tipo: string;
  dataInicio: string;
  horaInicio: string;
  horaFim: string;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  isSubmitting,
  selectedDate,
}: AppointmentDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useBarber();

  const hojeStr = format(new Date(), "yyyy-MM-dd");

  const { data: bloqueios = [] } = useQuery<Bloqueio[]>({
    queryKey: ["schedule-blocks"],
    queryFn: async () => {
      const res = await api.get("/schedule-blocks");
      return res.data;
    },
    enabled: open,
  });

  // Estados do formulário
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [horaInput, setHoraInput] = useState("");
  const [servicoIds, setServicoIds] = useState<number[]>([]);
  const [duracao, setDuracao] = useState(30);
  const [duracaoManual, setDuracaoManual] = useState(false);
  const [preco, setPreco] = useState(0);
  const [precoManual, setPrecoManual] = useState(false);

  const {
    data: categorias = [],
    isLoading: isLoadingServices,
  } = useQuery<Categoria[]>({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await api.get("/categories/enriched");
      return res.data;
    },
    enabled: open,
  });

  const {
    data: slotsDoExpediente = [],
    isLoading: isLoadingSlots,
  } = useQuery<string[]>({
    queryKey: [
      "available-slots-dinamicos",
      dataInput,
      user?.id,
      duracao,
      "barbeiro",
    ],
    queryFn: async () => {
      const response = await api.get("/appointments/available", {
        params: {
          date: dataInput,
          barberId: user?.id,
          duracaoMinutos: duracao,
          tipo: "barbeiro",
        },
      });

      return response.data;
    },
    enabled: open && !!dataInput && !!user?.id,
  });

  // Recalcula a duração e o preço conforme os serviços selecionados.
  // Os parâmetros permitem forçar o recálculo ao clicar em Resetar.
  const recalcularTotais = (
    novosServicosIds: number[],
    forcarDuracao = false,
    forcarPreco = false
  ) => {
    const todosServicos = categorias.flatMap(
      (categoria) => categoria.servicos
    );

    const selecionados = todosServicos.filter((servico) =>
      novosServicosIds.includes(Number(servico.id))
    );

    if (!duracaoManual || forcarDuracao) {
      const totalDuracao = selecionados.reduce(
        (total, servico) => total + (Number(servico.duracao) || 0),
        0
      );

      setDuracao(totalDuracao > 0 ? totalDuracao : 30);
    }

    if (!precoManual || forcarPreco) {
      const totalPreco = selecionados.reduce(
        (total, servico) => total + (Number(servico.preco) || 0),
        0
      );

      setPreco(totalPreco);
    }
  };

  const handleServiceChange = (id: number) => {
    const novosIds = servicoIds.includes(id)
      ? servicoIds.filter((item) => item !== id)
      : [...servicoIds, id];

    setServicoIds(novosIds);
    recalcularTotais(novosIds);
  };

  // Preenche os dados na edição ou limpa o formulário na criação.
  useEffect(() => {
    if (!open) return;

    if (appointment && appointment.dataHora) {
      setClienteNome(appointment.clienteNome ?? "");
      setClienteTelefone(appointment.clienteTelefone ?? "");

      const [dataPart, timePart] = appointment.dataHora.split("T");

      if (dataPart) setDataInput(dataPart);
      if (timePart) setHoraInput(timePart.substring(0, 5));

      setServicoIds(
        appointment.servicos?.map((servico) => Number(servico.id)) ?? []
      );

      setDuracao(appointment.totalDuracao ?? 30);
      setPreco(
        Number(appointment.totalPreco ?? appointment.preco ?? 0)
      );

      // Preserva os valores existentes durante a edição.
      setDuracaoManual(true);
      setPrecoManual(true);
    } else {
      setClienteNome("");
      setClienteTelefone("");

      const safeSelectedDate =
        selectedDate instanceof Date && isValid(selectedDate)
          ? selectedDate
          : new Date();

      const dataSelecionada = format(
        safeSelectedDate,
        "yyyy-MM-dd"
      );

      const dataInicial =
        dataSelecionada < hojeStr ? hojeStr : dataSelecionada;

      setDataInput(dataInicial);
      setHoraInput("");
      setServicoIds([]);
      setDuracao(30);
      setPreco(0);
      setDuracaoManual(false);
      setPrecoManual(false);
    }
  }, [appointment, open, selectedDate]);

  // Filtra os horários bloqueados e preserva o horário atual na edição.
  const opcoesDeHorario = useMemo(() => {
    const horarios = slotsDoExpediente.filter((hora) => {
      const ehBloqueado = bloqueios.some((bloqueio) => {
        if (
          bloqueio.tipo === "data" &&
          bloqueio.dataInicio === dataInput
        ) {
          return true;
        }

        if (
          bloqueio.tipo === "horario" &&
          bloqueio.dataInicio === dataInput
        ) {
          return (
            hora >= bloqueio.horaInicio &&
            hora <= bloqueio.horaFim
          );
        }

        return false;
      });

      return !ehBloqueado;
    });

    if (
      appointment &&
      horaInput &&
      !horarios.includes(horaInput)
    ) {
      horarios.push(horaInput);
    }

    return horarios.sort();
  }, [
    slotsDoExpediente,
    bloqueios,
    dataInput,
    appointment,
    horaInput,
  ]);

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!clienteNome.trim() || !dataInput || !horaInput || !user?.id) {
      return;
    }

    if (servicoIds.length === 0) {
      window.alert("Selecione pelo menos um serviço.");
      return;
    }

    const agendamentosDoDia =
      queryClient.getQueryData<Appointment[]>([
        "appointments",
        dataInput,
        user.id,
      ]) ?? [];

    const inicioNovoMinutos = new Time(horaInput).toMinutes();
    const fimNovoMinutos = inicioNovoMinutos + duracao;

    const conflitoDuracao = agendamentosDoDia.some((agendamento) => {
      if (appointment && agendamento.id === appointment.id) {
        return false;
      }

      const horaExistente = agendamento.dataHora
        .split("T")[1]
        ?.substring(0, 5);

      if (!horaExistente) return false;

      const inicioExistenteMinutos =
        new Time(horaExistente).toMinutes();

      const fimExistenteMinutos =
        inicioExistenteMinutos + agendamento.totalDuracao;

      return (
        inicioNovoMinutos < fimExistenteMinutos &&
        fimNovoMinutos > inicioExistenteMinutos
      );
    });

    if (conflitoDuracao) {
      const confirmar = window.confirm(
        "O serviço selecionado ultrapassa o horário de outro agendamento.\n\nDeseja realmente realizar este agendamento?"
      );

      if (!confirmar) return;
    }

    const payload = {
      clienteNome: clienteNome.trim(),
      // O telefone é opcional para agendamentos feitos pelo barbeiro.
      clienteTelefone: clienteTelefone.trim() || "",
      dataHora: `${dataInput}T${horaInput}:00`,
      barbeiroId: user.id,
      servicoIds,
      duracao,
      preco,
    };

    await onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            {appointment
              ? "✏️ Editar Agendamento"
              : "💈 Novo Agendamento"}
          </h2>

          <p className="text-xs text-zinc-400 mt-0.5">
            Escolha a data e selecione um dos horários calculados para o seu expediente.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Nome do cliente */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">
              Nome do Cliente
            </label>

            <input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Telefone opcional para o barbeiro */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">
              WhatsApp / Telefone (opcional)
            </label>

            <input
              type="tel"
              placeholder="Ex: 81999999999"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Data e horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                Data
              </label>

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
              <label className="text-xs font-medium text-zinc-300">
                Horário Disponível
              </label>

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
                  <option value="" disabled>
                    Selecione...
                  </option>

                  {opcoesDeHorario.map((hora) => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Duração e preço total */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-300">
                  Duração (min)
                </label>

                {duracaoManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setDuracaoManual(false);
                      recalcularTotais(servicoIds, true, false);
                    }}
                    className="text-[10px] text-amber-500 hover:underline"
                  >
                    Resetar
                  </button>
                )}
              </div>

              <input
                type="number"
                step="5"
                min="5"
                max="180"
                required
                value={duracao}
                onChange={(e) => {
                  setDuracao(Number(e.target.value));
                  setDuracaoManual(true);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-300">
                  Preço Total (R$)
                </label>

                {precoManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrecoManual(false);
                      recalcularTotais(servicoIds, false, true);
                    }}
                    className="text-[10px] text-amber-500 hover:underline"
                  >
                    Resetar
                  </button>
                )}
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={preco}
                onChange={(e) => {
                  setPreco(Number(e.target.value));
                  setPrecoManual(true);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Seleção de serviços */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Selecione os Serviços
            </label>

            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 space-y-4 max-h-48 overflow-y-auto subtle-scrollbar">
              {isLoadingServices ? (
                <p className="text-xs text-zinc-500 animate-pulse text-center py-2">
                  Carregando serviços...
                </p>
              ) : categorias.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-2">
                  Nenhum serviço disponível.
                </p>
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
                          <label
                            key={servico.id}
                            className="flex items-center justify-between cursor-pointer text-sm text-zinc-300 select-none hover:text-zinc-100 py-0.5 group"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={servicoIds.includes(numericId)}
                                onChange={() =>
                                  handleServiceChange(numericId)
                                }
                                className="accent-amber-500 h-4 w-4 rounded bg-zinc-900 border-zinc-800 text-amber-500 focus:ring-0"
                              />

                              <span>{servico.nome}</span>
                            </div>

                            <span className="text-xs text-zinc-500 group-hover:text-amber-400/80 font-medium transition-colors">
                              R${" "}
                              {Number(servico.preco || 0)
                                .toFixed(2)
                                .replace(".", ",")}
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

          {/* Botões de ação */}
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
              disabled={
                isSubmitting ||
                servicoIds.length === 0 ||
                isLoadingServices ||
                isLoadingSlots ||
                opcoesDeHorario.length === 0 ||
                !horaInput
              }
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium"
            >
              {isSubmitting
                ? "Salvando..."
                : appointment
                  ? "Atualizar"
                  : "Confirmar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
