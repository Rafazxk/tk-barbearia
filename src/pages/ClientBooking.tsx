import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format, isToday, parse } from "date-fns";
import { Clock, Scissors, ShoppingBag, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IClientAppointment } from "../../../tk-barbearia-backend/src/modules/appointments/repositories/IClienteRepository.js";
import { Produto } from "./ClientBooking/types.js";
import logoTk from "../assets/logo.jpeg";

import { useQueryClient } from "@tanstack/react-query";

interface Barbeiro { id: number; nome: string; foto?: string | null; }
interface Servico { id: number; nome: string; preco: number; duracaoMinutos: number; }
interface Categoria { id: string; nome: string; servicos: Servico[]; }
interface CategoriaProduto { id: number; nome: string; preco: number; estoque: number; }

// interface UpdateAppointmentVariables { 
//   appointmentId: number;
//   updatedData: {
//     clienteNome?: string;
//     clienteTelefone?: string;
//     dataHora?: string;
//     barbeiroId?: number;
//     servicosIds?: number[]; 
//   }
// }

export default function ClientBooking() {
  const [view, setView] = useState<"home" | "booking" | "my-appointments">("home");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<Barbeiro | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [cartProducts, setCartProducts] = useState<Array<{ produto: CategoriaProduto; qtd: number }>>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const hojeStr = format(new Date(), "yyyy-MM-dd");
  const [agora, setAgora] = useState(new Date());
  const queryClient = useQueryClient();

  interface CategoriaProduto {
    id: string | number;
    nome: string;
    produtos: Produto[];
    preco: number;
    estoque: number;

  }

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60000);

    if (bloqueiosDoDia.length > 0) {
    console.log("Dados dos bloqueios recebidos:", bloqueiosDoDia[0]);
  }

    return () => clearInterval(timer);
  }, []);


  // Busca de Barbeiros da API Real
  const { data: barbeiros = [] } = useQuery<Barbeiro[]>({
    queryKey: ["barbers-list"],
    queryFn: async () => {
      const res = await api.get("/auth/barbers");
      return res.data;
    }
  });

  // Busca de Categorias e Serviços da API Real
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categories-enriched-client"],
    queryFn: async () => {
      const res = await api.get("/categories/enriched");

      return res.data;
    }
  });

  // Busca de Produtos da API Real 
  // const { data: produtos = [], isLoading: loadingProdutos } = useQuery<CategoriaProduto[]>({
  //   queryKey: ["products-list"],
  //   queryFn: async () => {
  //     const res = await api.get("/products");
  //     return res.data;
  //   }
  // });


  const { data: slotsLivresDoBackend = [], isLoading: carregandoHorarios } = useQuery<string[]>({
  queryKey: ["client-appointments-lookup", selectedDate, selectedBarber?.id],
  queryFn: async () => {
    const res = await api.get("/appointments/available", {
      

      params: { date: selectedDate, barberId: selectedBarber?.id }
    });
    console.log("slotsLivresDoBackend", Array.isArray(slotsLivresDoBackend), slotsLivresDoBackend);

    return Array.isArray(res.data) ? res.data : [];
  },
  enabled: step === 2 && !!selectedDate && !!selectedBarber,
  staleTime: 0, 
  refetchOnWindowFocus: true,
});

  const { data: todosOsBloqueios = [] } = useQuery({
  queryKey: ["schedule-blocks-all"], // Cache global de bloqueios
  queryFn: async () => {
    const res = await api.get("/schedule-blocks");
    return res.data;
  },
  enabled: step === 2,
});

const { data: bloqueiosDoDia = [] } = useQuery({
  queryKey: ["schedule-blocks-lookup", selectedDate],
  queryFn: async () => {
    const res = await api.get("/schedule-blocks");
    console.log("bloqueiosDoDia", Array.isArray(bloqueiosDoDia), bloqueiosDoDia);

    return res.data;
  },
  enabled: step === 2 && !!selectedDate,
  staleTime: 0, 
  refetchOnWindowFocus: true,
});

  const availableSlots = useMemo(() => {
  const agora = new Date();
  const hojeFormatado = format(new Date(), "yyyy-MM-dd");
  const ehHoje = selectedDate === hojeFormatado;

  return slotsLivresDoBackend.filter((horario) => {
    // A. Filtro de horários passados
    if (ehHoje) {
      const [h, m] = horario.split(":").map(Number);
      if (h < agora.getHours() || (h === agora.getHours() && m <= agora.getMinutes())) return false;
    }

    // B. Filtro de Bloqueios Robusto
    const ehBloqueado = bloqueiosDoDia.some((b: any) => {
      // Normaliza as chaves (aceita dataInicio OU data_inicio)
      const dataB = b.dataInicio || b.data_inicio;
      const horaIni = b.horaInicio || b.hora_inicio;
      const horaFim = b.horaFim || b.hora_fim;
      const tipo = b.tipo;

      // Bloqueio de dia inteiro
      if (tipo === "data" && dataB === selectedDate) return true;
      
      // Bloqueio de horário específico
      if (tipo === "horario" && dataB === selectedDate && horaIni && horaFim) {
        return horario >= horaIni && horario <= horaFim;
      }
      return false;
    });

    return !ehBloqueado; 
  });
}, [slotsLivresDoBackend, selectedDate, bloqueiosDoDia]);


  const { data: meusAgendamentos = [], isLoading: loadingMeusAgendamentos } = useQuery<IClientAppointment[]>({
    queryKey: ["my-appointments-list", searchedPhone],
    queryFn: async () => {
      const res = await api.get(`/appointments/client/${searchedPhone}`);
      console.log("meusAgendamentos", Array.isArray(meusAgendamentos), meusAgendamentos);

      return res.data;
    },
    enabled: searchedPhone.length >= 8,
  });
  //DELETE
  const deleteAppointment = useMutation({
    mutationFn: async (appointmentId: number) => {
      return await api.delete(`/appointments/client/${appointmentId}`);
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso!");
      // Refetch the appointments after deletion
      setSearchedPhone(""); // Limpa o campo de busca para forçar o refetch
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao cancelar agendamento.");
    }
  });

  const upsertAppointment = useMutation({
    mutationFn: async ({ id, payload }: { id?: number, payload: any }) => {
      if (id) {
        // Se tiver ID, é edição (PATCH)
        return await api.patch(`/appointments/client/${id}`, payload);
      } else {
        // Se não tiver ID, é novo agendamento (POST)
        return await api.post("/appointments/client-booking", payload);
      }
    },
    onSuccess: () => {
      toast.success("Sucesso!");

      queryClient.invalidateQueries({ queryKey: ["client-appointments-lookup"] });

      resetForm();
      setView("home");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao processar.");
    }
  });

  const totalServicos = selectedServices.reduce((acc, s) => acc + s.preco, 0);
  const totalProdutos = cartProducts.reduce((acc, item) => acc + (item.produto.preco * item.qtd), 0);
  const valorTotalGeral = totalServicos + totalProdutos;

  const handleAddProduct = (prod: CategoriaProduto) => {
    // Validação real de estoque vindo do back
    if (prod.estoque <= 0) {
      return toast.error("Produto esgotado no estoque!");
    }

    setCartProducts((prev) => {
      const existente = prev.find((item) => item.produto.id === prod.id);
      if (existente) {
        if (existente.qtd >= prod.estoque) {
          toast.error("Quantidade máxima em estoque atingida!");
          return prev;
        }
        return prev.map((item) => item.produto.id === prod.id ? { ...item, qtd: item.qtd + 1 } : item);
      }
      return [...prev, { produto: prod, qtd: 1 }];
    });
    toast.success(`${prod.nome} adicionado ao carrinho!`);
  };

  const toggleService = (servico: Servico) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === servico.id) ? prev.filter((s) => s.id !== servico.id) : [...prev, servico]
    );
  };
  
  async function subscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'BPbilkXJB3LyxGuRpOCl96vtUoyxxuHS6ZZJWq3Kr0N5RDfWw6wW9ckHMq3DFDlcZLtevLNnkJe44DV5ZhAMwCI' 
  });

  await api.post("/api/notifications/subscribe", { subscription });
}

  const handleEdit = (appt: IClientAppointment) => {
    // 1. Preenche os estados com os dados existentes
    setSelectedBarber(appt.barbeiro);
    setSelectedDate(format(new Date(appt.dataHora), "yyyy-MM-dd"));
    setSelectedTime(format(new Date(appt.dataHora), "HH:mm"));
    setSelectedServices(appt.servicos); // Assume que appt.servicos é um array de Servico
    setClienteNome(appt.clienteNome);
    setClienteTelefone(appt.clienteTelefone);
    // Se houver produtos: setCartProducts(appt.produtosReservados);

    // 2. Abre a tela de agendamento e pula para o último step (revisão)
    setView("booking");
    setStep(4);
  };

  const handleFinalSubmit = async () => {
  if (!clienteNome || !clienteTelefone) {
    return toast.error("Por favor, preencha seu nome e WhatsApp.");
  }

  try {
    // 1. Busque os bloqueios atuais antes de finalizar
    const { data: bloqueios } = await api.get("/schedule-blocks");

    // 2. Verifique se o horário escolhido está bloqueado
    const horarioEscolhido = `${selectedTime}:00`;
    
    const estaBloqueado = bloqueios.some((b: any) => {
      // Garante comparação correta de datas
      if (b.dataInicio !== selectedDate) return false;
      
      // Bloqueio de dia inteiro
      if (b.tipo === "data") return true; 
      
      // Bloqueio de horário
      if (b.tipo === "horario" && b.horaInicio && b.horaFim) {
        return horarioEscolhido >= b.horaInicio && horarioEscolhido <= b.horaFim;
      }
      return false;
    });

    if (estaBloqueado) {
      toast.error("Ops! Esse horário foi bloqueado recentemente. Escolha outro.");
      return;
    }

    // 3. Se estiver livre, envia o payload
    const payload = {
      clienteNome,
      clienteTelefone,
      barbeiroId: selectedBarber?.id,
      dataHora: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
      servicoIds: selectedServices.map((s) => s.id),
      produtosReservados: cartProducts.map((p) => ({ 
        id: p.produto.id, 
        quantidade: p.qtd 
      }))
    };

    upsertAppointment.mutate({ id: editingId || undefined, payload });

  } catch (error) {
    console.error("Erro ao verificar bloqueios:", error);
    toast.error("Erro ao validar disponibilidade. Tente novamente.");
  }
};


const resetForm = () => {
  setStep(1);
  setSelectedBarber(null);
  setEditingId(null);
  setSelectedDate("");
  setSelectedTime("");
  setSelectedServices([]);
  setCartProducts([]);
};

return (
  <div className="w-full min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 md:p-8">
    <header className="p-4 bg-zinc-900/50 border-b border-zinc-900 sticky top-0 backdrop-blur-md z-40 flex justify-between items-center">

      {valorTotalGeral > 0 && (
        <Badge className="bg-amber-500 text-zinc-950 flex gap-1 font-bold border-none">
          <ShoppingBag className="w-3 h-3" /> R$ {valorTotalGeral.toFixed(2)}
        </Badge>
      )}
    </header>

    {view === "home" && (
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 md:p-8">
        {/* Hero - Mantendo os botões principais */}
        <div className="w-full max-w-md md:max-w-2xl text-center space-y-8 bg-zinc-900/40 p-6 md:p-12 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-2xl">


          <div className="flex justify-center">

            <img
              src={logoTk}
              alt="TK Barbearia"
              className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-full border-2 border-amber-500/20 p-1 animate-fade-in"
            />
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-wider text-white">TK BARBEARIA</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-sm mx-auto">Qualidade e estilo em um só lugar.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-7 md:py-8 text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 w-full" onClick={() => setView("booking")}>
              <Scissors className="w-5 h-5" /> Agendar Serviço
            </Button>
            <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white py-7 md:py-8 text-sm md:text-base font-medium rounded-xl flex items-center justify-center gap-2 transition-all w-full" onClick={() => setView("my-appointments")}>
              <Clock className="w-4 h-4" /> Ver Meus Agendamentos
            </Button>
          </div>
        </div>


        {/* Quem Somos */}
        <div className="w-full max-w-md md:max-w-2xl mx-auto my-6 p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-2xl">
          <h2 className="text-base font-bold text-zinc-100 mb-3 text-center md:text-left">Quem Somos</h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed text-center md:text-left">
            A TK Barbearia é um espaço dedicado ao cuidado masculino, oferecendo cortes,
            barba e serviços de qualidade com profissionalismo e atenção aos detalhes.
            Nosso objetivo é elevar a autoestima dos clientes, proporcionando uma
            experiência confortável e um visual sempre alinhado.
          </p>
        </div>

        {/* Localização e Contatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Contatos */}
          <div className="space-y-3 flex flex-col justify-center text-center md:text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2 justify-center md:justify-start">
              <MapPin className="w-4 h-4" /> Localização & Contatos
            </h2>
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">Rua Rio Xingu, 299 - Ibura de baixo, Recife - PE, 51240-040</p>
              <p className="text-sm text-amber-500 font-bold hover:underline cursor-pointer transition-all">
                WhatsApp: (81) 98895-3062
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-400 mb-2">Horário de Funcionamento</h3>
            <div className="text-xs text-zinc-300 space-y-1">
              <p className="flex justify-between"><span>Segunda a Sexta:</span> <span>08:00 - 19:00</span></p>
              <p className="flex justify-between"><span>Sábado:</span> <span>08:00 - 15:00</span></p>
            </div>
          </div>
        </div>

        {/* Meus Créditos */}
        <div className="w-full max-w-md md:max-w-2xl mx-auto text-center pb-8 border-t border-zinc-900 pt-4">
          <p className="text-[10px] md:text-xs text-zinc-500">
            © {new Date().getFullYear()} TK Barbearia | Todos os direitos reservados
          </p>
          <p className="text-[9px] md:text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-medium">
            Desenvolvido por Rafazxk
          </p>
        </div>
      </div>
    )}

    {view === "booking" && (
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
            <span className={step >= 1 ? "text-amber-500" : ""}>1. Profissional</span>
            <span className={step >= 2 ? "text-amber-500" : ""}>2. Horário</span>
            <span className={step >= 3 ? "text-amber-500" : ""}>3. Serviços</span>
            <span className={step >= 4 ? "text-amber-500" : ""}>4. Confirmar</span>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in w-full max-w-xl mx-auto">
              <h3 className="text-sm font-bold text-zinc-300 text-center sm:text-left">Selecione o profissional</h3>

              <div className="grid grid-cols-3 gap-3 justify-center max-w-md mx-auto sm:max-w-full">
                {barbeiros.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center col-span-3 py-4">
                    Nenhum barbeiro disponível.
                  </p>
                ) : (
                  barbeiros.map((b) => {
                    const isSelected = selectedBarber?.id === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBarber(b);
                          setStep(2);
                        }}
                      
                        className="flex flex-col items-center gap-1.5 w-full max-w-[110px] sm:max-w-[130px] cursor-pointer group mx-auto"
                      >
                        {/* CONTAINER DA FOTO */}
                        <div
                          className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-800 border-2 transition-all duration-200 
                  ${isSelected
                              ? "border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]"
                              : "border-zinc-800 group-hover:border-zinc-700"
                            }`}
                        >
                          {b.foto ? (
                            <img
                              src={b.foto?.startsWith("http") ? b.foto : `${api.defaults.baseURL?.replace("/api", "")}${b.foto}`}
                              alt={`Foto de ${b.nome}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <User className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* 🏷️ TEXTO COM O NOME */}
                        <p
                          className={`text-[11px] font-medium text-center truncate w-full transition-colors px-0.5
                  ${isSelected ? "text-amber-500 font-bold" : "text-zinc-300 group-hover:text-zinc-100"}`}
                        >
                          {b.nome}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-300">Selecione Data e Horário</h3>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Data do atendimento</label>
                <input type="date" min={hojeStr} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 color-scheme-dark" />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Horários Livres</label>
                  {availableSlots.length === 0 ? (
                    <div className="p-4 bg-red-500/10 text-red-400 text-xs text-center font-medium rounded-xl border border-red-500/20">🚫 Horários esgotados para este dia. Escolha outra data.</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((h) => (
                        <Button key={h} variant={selectedTime === h ? "default" : "outline"} className={`text-xs h-10 ${selectedTime === h ? "bg-amber-500 text-zinc-950 font-bold" : ""}`} onClick={() => { setSelectedTime(h); setStep(3); }}>{h}</Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-300">Escolha um ou mais Serviços</h3>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto subtle-scrollbar pr-1">
                {categorias.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">Nenhum serviço cadastrado.</p>
                ) : (
                  categorias.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block border-b border-zinc-900 pb-1">{cat.nome}</span>
                      <div className="space-y-1.5">
                        {cat.servicos?.map((s) => {
                          const isChecked = selectedServices.some((item) => item.id === s.id);
                          return (
                            <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-colors ${isChecked ? "bg-amber-500/10 border-amber-500 text-zinc-100" : "bg-zinc-900/20 border-zinc-900 text-zinc-400"}`} onClick={() => toggleService(s)}>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={isChecked} readOnly className="accent-amber-500 h-4 w-4" />
                                <span className="text-sm font-medium text-zinc-200">{s.nome}</span>
                              </div>
                              <span className="text-xs font-semibold text-zinc-300">R$ {Number(s.preco).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button className="w-full bg-amber-500 text-zinc-950 font-bold mt-2" disabled={selectedServices.length === 0} onClick={() => setStep(4)}>Avançar (R$ {totalServicos.toFixed(2)})</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-300">Identificação & Revisão</h3>
              <div className="space-y-2 bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                <input type="text" placeholder="Seu Nome Completo" required value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500 text-zinc-200" />
                <input type="tel" placeholder="Seu WhatsApp (com DDD)" required value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500 text-zinc-200" />
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Resumo Final do Pedido</h4>
                <div className="text-xs space-y-1.5 text-zinc-300 border-b border-zinc-900 pb-2">
                  <p className="flex justify-between"><span>💈 Profissional:</span> <span className="font-medium text-zinc-100">{selectedBarber?.nome}</span></p>
                  <p className="flex justify-between"><span>📅 Data/Hora:</span> <span className="font-medium text-zinc-100">{selectedDate.split("-").reverse().join("/")} às {selectedTime}</span></p>
                </div>

                <div className="text-xs space-y-2 max-h-32 overflow-y-auto subtle-scrollbar">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between text-zinc-300"><span>✂️ {s.nome}</span> <span>R$ {Number(s.preco).toFixed(2)}</span></div>
                  ))}
                  {cartProducts.map(item => (
                    <div key={item.produto.id} className="flex justify-between text-zinc-400">
                      <span className="flex gap-1">📦 {item.produto.nome} <b className="text-amber-500">x{item.qtd}</b></span>
                      <span>R$ {(Number(item.produto.preco) * item.qtd).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-900 text-sm font-bold">
                  <span className="text-zinc-200">Total a Pagar na Barbearia:</span>
                  <span className="text-amber-500 text-base">R$ {valorTotalGeral.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-3" disabled={upsertAppointment.isPending} onClick={handleFinalSubmit}>
                {upsertAppointment.isPending ? "Confirmando..." : "Confirmar Agendamento 🚀"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-4 mt-6 border-t border-zinc-900">
          <Button variant="ghost" size="sm" className="text-zinc-400 text-xs" onClick={() => { if (step > 1) setStep(step - 1); else { setView("home"); resetForm(); } }}>Voltar</Button>
          <Button variant="ghost" size="sm" className="text-zinc-500 text-xs" onClick={() => { setView("home"); resetForm(); }}>Cancelar Tudo</Button>
        </div>
      </div>
    )}

    {view === "my-appointments" && (
  <div className="p-4 flex-1 space-y-4">
    <h3 className="text-sm font-bold text-zinc-300">Meus Agendamentos</h3>
    <div className="flex gap-2">
          <input type="tel" placeholder="Digite seu WhatsApp completo" value={phoneLookup} onChange={(e) => setPhoneLookup(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500" />
          <Button size="sm" className="bg-amber-500 text-zinc-950 font-bold" onClick={() => setSearchedPhone(phoneLookup)}>Buscar</Button>
        </div>

    <div className="space-y-2 pt-2">
      {loadingMeusAgendamentos ? (
        <p className="text-xs text-zinc-500 text-center py-4">Buscando na base...</p>
      ) : searchedPhone && meusAgendamentos.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">Nenhum agendamento encontrado.</p>
      ) : (
        meusAgendamentos.map((appt: any) => (
          <Card key={appt.id} className="bg-zinc-900/30 border-zinc-900 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-500">
                {format(new Date(appt.dataHora), "dd/MM/yyyy - HH:mm")}
              </span>
              <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                Confirmado
              </Badge>
            </div>

            <h3 className="font-semibold text-lg text-white">{appt.clienteNome}</h3>
            <p className="text-sm text-zinc-400">💈 {appt.barbeiro?.nome}</p>

            <div>
              <strong className="text-xs text-zinc-500 uppercase">Serviços</strong>
              <ul className="mt-2 space-y-1">
                {/* A verificação abaixo evita o erro de "map is not a function" */}
                {Array.isArray(appt.servicos) && appt.servicos.map((service: any) => (
                  <li key={service.id} className="flex justify-between text-sm text-zinc-300">
                    <span>{service.nome}</span>
                    <span>R$ {Number(service.preco).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-3">
              <button 
                onClick={() => { setEditingId(appt.id); handleEdit(appt); }} 
                className="flex-1 rounded-lg bg-amber-500 py-2 font-medium text-zinc-950 text-sm"
              >
                Editar
              </button>
              <button 
                onClick={() => deleteAppointment.mutate(appt.id)} 
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
    <Button variant="ghost" size="sm" className="w-full text-zinc-400 mt-4" onClick={() => setView("home")}>
      Voltar para o Início
    </Button>
  </div>
)}
  </div>
);
}