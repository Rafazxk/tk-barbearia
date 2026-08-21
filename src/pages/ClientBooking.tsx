import React, { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { addDays, format } from "date-fns";
import { Clock, Scissors, ShoppingBag, User, MapPin, Calendar, Package, CheckCircle2, Loader2, ArrowLeft, Trash2, Pencil, CalendarX, Search, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IClientAppointment } from "../../../tk-barbearia-backend/src/modules/appointments/repositories/IClienteRepository.js";
import logoTk from "../assets/logo.jpeg";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Barbeiro { id: number; nome: string; foto?: string | null; }
interface Servico { id: number; nome: string; preco: number; duracaoMinutos: number; duracao?: number; }
interface Categoria { id: string; nome: string; servicos: Servico[]; }
interface CategoriaProduto { id: number; nome: string; preco: number; estoque: number; }
interface Produto {
  id: number | string;
  nome: string;
  preco?: number;
  valor?: number;
  precoVenda?: number;
  estoque?: number;
}
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
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const hojeStr = format(new Date(), "yyyy-MM-dd");
  const [agora, setAgora] = useState(new Date());
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<IClientAppointment | null>(null);
  const [editServices, setEditServices] = useState<Servico[]>([]);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editBarber, setEditBarber] = useState<Barbeiro | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const enviandoAgendamentoRef = useRef(false);

  interface Appointment {
    id: string | number;
    clienteNome: string;
    clienteTelefone?: string;
    dataHora: string;
    barbeiro?: {
      id: string | number;
      nome: string;
      foto?: string;
    };
    servicos?: Array<{
      id: string | number;
      nome: string;
      preco: number;
    }>;
  }

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: barbeiros = [] } = useQuery<Barbeiro[]>({
    queryKey: ["barbers-list"],
    queryFn: async () => {
      const res = await api.get("/auth/barbers");
      return res.data;
    }
  });

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categories-enriched-client"],
    queryFn: async () => {
      const res = await api.get("/categories/enriched");

      return res.data;
    }
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Produto[]>({
    queryKey: ["products-list-vitrine"],
    queryFn: async () => {
      const res = await api.get("/products");
      const data = res.data;

      // Se a API retornar categorias contendo produtos dentro
      if (Array.isArray(data)) {
        const produtosPlanos: Produto[] = [];
        data.forEach((item: any) => {
          if (Array.isArray(item.produtos)) {
            produtosPlanos.push(...item.produtos);
          } else if (item.nome && (item.preco !== undefined || item.valor !== undefined || item.precoVenda !== undefined)) {
            produtosPlanos.push(item);
          }
        });
        return produtosPlanos.length > 0 ? produtosPlanos : data;
      }
      return [];
    }
  });

  const duracaoTotalMinutos = useMemo(() => {
    return selectedServices.reduce(
      (acc, s) =>
        acc +
        (Number(s.duracao) ||
          Number(s.duracaoMinutos) ||
          30),
      0
    );
  }, [selectedServices]);

  const { data: slotsLivresDoBackend = [] } = useQuery<string[]>({
    queryKey: [
      "client-appointments-lookup",
      selectedDate,
      selectedBarber?.id,
      duracaoTotalMinutos,
      "cliente"
    ],

    queryFn: async () => {
      const res = await api.get("/appointments/available", {
        params: {
          date: selectedDate,
          barberId: selectedBarber?.id,
          duracaoMinutos: duracaoTotalMinutos,
          tipo: "cliente"
        },
      });

      return Array.isArray(res.data) ? res.data : [];
    },

    enabled:
      step === 3 &&
      !!selectedDate &&
      !!selectedBarber &&
      duracaoTotalMinutos > 0,

    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: todosOsBloqueios = [] } = useQuery({
    queryKey: ["schedule-blocks-all"],

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
      return res.data;
    },

    enabled: step === 2 && !!selectedDate,

    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const availableSlots = useMemo(() => {
    const agora = new Date();

    const hojeFormatado = format(
      new Date(),
      "yyyy-MM-dd"
    );

    const ehHoje =
      selectedDate === hojeFormatado;

    return slotsLivresDoBackend.filter((horario) => {
      if (!ehHoje) {
        return true;
      }
      const [h, m] = horario
        .split(":")
        .map(Number);

      if (
        h < agora.getHours() ||
        (
          h === agora.getHours() &&
          m <= agora.getMinutes()
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    slotsLivresDoBackend,
    selectedDate,
  ]);


  const { data: meusAgendamentos = [], isLoading: loadingMeusAgendamentos } = useQuery<IClientAppointment[]>({
    queryKey: ["my-appointments-list", searchedPhone],
    queryFn: async () => {
      const res = await api.get(`/appointments/client/${searchedPhone}`);

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

      setSearchedPhone("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao cancelar agendamento.");
    }
  });

  const upsertAppointment = useMutation({

    mutationFn: async ({ id, payload }: { id?: number, payload: any }) => {
      if (id) {

        return await api.patch(`/appointments/client/${id}`, payload);
      } else {

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
    },

    onSettled: () => {
    enviandoAgendamentoRef.current = false;
  }
  });

  const totalServicos = selectedServices.reduce((acc, s) => acc + s.preco, 0);
  const totalProdutos = cartProducts.reduce((acc, item) => acc + (item.produto.preco * item.qtd), 0);
  const valorTotalGeral = totalServicos + totalProdutos;

  const handleAddProduct = (prod: CategoriaProduto) => {
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

  const toggleService = (servico: any) => {
    setSelectedServices((prev) => {
      // Verifica se já está selecionado comparando via Number
      const exists = prev.some((item) => Number(item.id) === Number(servico.id));

      if (exists) {
        // Remove o serviço
        return prev.filter((item) => Number(item.id) !== Number(servico.id));
      } else {
        // Adiciona o serviço garantindo que id e preco sejam números
        return [
          ...prev,
          {
            ...servico,
            id: Number(servico.id),
            preco: Number(servico.preco),
          },
        ];
      }
    });
  };

  async function subscribeUser() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BPbilkXJB3LyxGuRpOCl96vtUoyxxuHS6ZZJWq3Kr0N5RDfWw6wW9ckHMq3DFDlcZLtevLNnkJe44DV5ZhAMwCI'
    });

    await api.post("/api/notifications/subscribe", { subscription });
  }

  const handleEdit = (appt: Appointment) => {
    // 1. Define o ID do agendamento que está sendo editado
    setEditingId(appt.id);

    // 2. Preenche o barbeiro selecionado
    if (appt.barbeiro) {
      setSelectedBarber({
        ...appt.barbeiro,
        id: Number(appt.barbeiro.id),
      });
    }

    // 3. Extrai data e hora sem contaminação de fuso horário (UTC)
    if (appt.dataHora) {
      const dataObj = new Date(appt.dataHora);
      setSelectedDate(format(dataObj, "yyyy-MM-dd"));
      setSelectedTime(format(dataObj, "HH:mm"));
    }

    // 4. Preenche os serviços selecionados
    if (Array.isArray(appt.servicos)) {
      setSelectedServices(
        appt.servicos.map((servico: any) => ({
          ...servico,
          id: Number(servico.id),
          preco: Number(servico.preco),
        }))
      );
    }

    // 5. Preenche os dados do cliente
    setClienteNome(appt.clienteNome || "");
    setClienteTelefone(appt.clienteTelefone || phoneLookup || "");

    // 6. NAVEGAÇÃO: Direciona para a tela de agendamento direto na etapa de revisão
    setView("booking");
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    if (enviandoAgendamentoRef.current) {
    return;
  }
  
    if (upsertAppointment.isPending) return;

    if (!clienteNome || !clienteTelefone) {
      return toast.error("Por favor, preencha seu nome e WhatsApp.");
    }

    try {
      const { data: bloqueios } = await api.get("/schedule-blocks");

      const horarioEscolhido = `${selectedTime}:00`;

      const estaBloqueado = bloqueios.some((b: any) => {

        if (b.dataInicio !== selectedDate) return false;

        const idBarbeiroBloqueio = b.barbeiroId ?? b.barber_id;
        if (idBarbeiroBloqueio && Number(idBarbeiroBloqueio) !== 10) {
          return false;
        }

        if (b.tipo === "data") return true;

        if (b.tipo === "horario" && b.horaInicio && b.horaFim) {
          const inicioBloqueio = b.horaInicio.substring(0, 5);
          const fimBloqueio = b.horaFim.substring(0, 5);
          const horarioAtual = selectedTime.substring(0, 5);

          return horarioAtual >= inicioBloqueio && horarioAtual <= fimBloqueio;
        }
        return false;
      });

      if (estaBloqueado) {
        toast.error("Ops! Esse horário foi bloqueado recentemente. Escolha outro.");
        return;
      }
      const todosOsServicosDisponiveis = categorias.flatMap((cat) => cat.servicos || []);

      const totalDuracao = selectedServices.reduce((acc, s) => {
        return acc + Number(s.duracao ?? s.duracaoMinutos ?? 0);
      }, 0);

      const totalServicos = selectedServices.reduce((acc, s) => acc + s.preco, 0);
      const totalProdutos = cartProducts.reduce((acc, item) => acc + (item.produto.preco * item.qtd), 0);
      const valorTotalGeral = totalServicos + totalProdutos;

      const payload = {
        clienteNome,
        clienteTelefone: clienteTelefone.replace(/\D/g, ""),
        barbeiroId: Number(selectedBarber?.id),
        dataHora: `${selectedDate}T${selectedTime}:00`,
        duracao: totalDuracao > 0 ? totalDuracao : 30,
        servicoIds: selectedServices.map((s) => Number(s.id)),
        produtosReservados: cartProducts.map((p) => ({
          id: Number(p.produto.id),
          quantidade: Number(p.qtd)
        }))
      };
      upsertAppointment.mutate({
        id: editingId ? Number(editingId) : undefined,
        payload
      });

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

  const meusAgendamentosPendentes = meusAgendamentos.filter((appt) => {
    return new Date(appt.dataHora).getTime() > Date.now();
  });

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 md:p-8">

      {/* VIEW: HOME */}
      {view === "home" && (
        <div className="w-full max-w-md md:max-w-2xl space-y-6">
          {/* Hero */}
          <div className="w-full text-center space-y-8 bg-zinc-900/40 p-6 md:p-12 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-2xl">
            <div className="flex justify-center">
              <img
                src={logoTk}
                alt="TK Barbearia"
                className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-full border-2 border-amber-500/20 p-1 animate-fade-in"
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-wider text-white">
              TK BARBEARIA
            </h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-sm mx-auto">
              Qualidade e estilo em um só lugar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Button
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-7 md:py-8 text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 w-full"

                onClick={() => {
                  resetForm();
                  setView("booking")
                }
                }
              >
                <Scissors className="w-5 h-5" /> Agendar Serviço
              </Button>
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white py-7 md:py-8 text-sm md:text-base font-medium rounded-xl flex items-center justify-center gap-2 transition-all w-full"
                onClick={() => setView("my-appointments")}
              >
                <Clock className="w-4 h-4" /> Ver Meus Agendamentos
              </Button>
            </div>
          </div>

          {/* Quem Somos */}
          <div className="w-full p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-2xl">
            <h2 className="text-base font-bold text-zinc-100 mb-3 text-center md:text-left">
              Quem Somos
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed text-center md:text-left">
              A TK Barbearia é um espaço dedicado ao cuidado masculino, oferecendo cortes,
              barba e serviços de qualidade com profissionalismo e atenção aos detalhes.
              Nosso objetivo é elevar a autoestima dos clientes, proporcionando uma
              experiência confortável e um visual sempre alinhado.
            </p>
          </div>

          <div className="space-y-4 bg-zinc-900/30 border border-zinc-800/60 p-4 md:p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <ShoppingBag className="w-4 h-4 text-amber-500" /> Nossos Produtos
              </h3>
              <span className="text-xs text-zinc-500">{produtos.length} itens</span>
            </div>

            {loadingProdutos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : produtos.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Nenhum produto cadastrado no momento.</p>
            ) : (
              /* max-h-60 com overflow-y-auto cria uma barra de rolagem se houver muitos produtos */
              <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {produtos.map((prod: any) => {
                  const precoReal = Number(prod.preco ?? prod.valor ?? prod.precoVenda ?? 0);
                  const imagemUrl = prod.imagemUrl || prod.foto || prod.img;

                  return (
                    <div
                      key={prod.id || Math.random()}
                      className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg flex flex-col items-center text-center space-y-1.5"
                    >
                      {/* Imagem do Produto Centralizada e Menor */}
                      <div className="w-full h-16 bg-zinc-950/60 rounded-md overflow-hidden flex items-center justify-center p-1">
                        {imagemUrl ? (
                          <img
                            src={imagemUrl}
                            alt={prod.nome}
                            className="max-w-full max-h-full object-contain mx-auto"
                          />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>

                      {/* Informações do Produto Compactas */}
                      <div className="w-full space-y-0.5">
                        <p className="text-[10px] font-semibold text-zinc-200 truncate w-full" title={prod.nome}>
                          {prod.nome || "Sem nome"}
                        </p>
                        <p className="text-[10px] text-amber-500 font-bold">
                          R$ {precoReal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Localização e Contatos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 flex flex-col justify-center text-center md:text-left">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="w-4 h-4" /> Localização & Contatos
              </h2>
              <div className="space-y-1">
                <p className="text-sm text-zinc-300">
                  Rua Rio Xingu, 299 - Ibura de baixo, Recife - PE, 51240-040
                </p>
                <p className="text-sm text-amber-500 font-bold hover:underline cursor-pointer transition-all">
                  WhatsApp: (81) 98895-3062
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-400 mb-2">Horário de Funcionamento</h3>
              <div className="text-xs text-zinc-300 space-y-1">
                <p className="flex justify-between"><span>Segunda a Sábado:</span> <span>09:00 - 20:00</span></p>
                <p className="flex justify-between"><span>Domingo:</span> <span>08:00 - 12:00</span></p>
              </div>
            </div>
          </div>

          {/* Rodapé / Créditos */}
          <div className="w-full text-center pb-8 border-t border-zinc-900 pt-4">
            <p className="text-[10px] md:text-xs text-zinc-500">
              © {new Date().getFullYear()} TK Barbearia | Todos os direitos reservados
            </p>
            <p className="text-[9px] md:text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-medium">
              Desenvolvido por Rafael Silva <br /> github.com/rafazxk
            </p>
          </div>
        </div>
      )}

      {view === "booking" && (
        <div className="w-full max-w-md md:max-w-2xl p-4 flex-1 flex flex-col justify-between bg-zinc-950">
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
              <span
                className={`cursor-pointer hover:underline ${step >= 1 ? "text-amber-500" : ""}`}
                onClick={() => setStep(1)}
              >
                1. Profissional
              </span>

              <span
                className={`cursor-pointer ${selectedBarber ? "hover:underline text-amber-500" : "opacity-40 cursor-not-allowed"}`}
                onClick={() => selectedBarber && setStep(2)}
              >
                2. Serviços
              </span>

              <span
                className={`cursor-pointer ${selectedBarber && selectedServices.length > 0 ? "hover:underline text-amber-500" : "opacity-40 cursor-not-allowed"}`}
                onClick={() => selectedBarber && selectedServices.length > 0 && setStep(3)}
              >
                3. Horário
              </span>

              <span
                className={`cursor-pointer ${selectedBarber && selectedServices.length > 0 && selectedDate && selectedTime ? "hover:underline text-amber-500" : "opacity-40 cursor-not-allowed"}`}
                onClick={() => selectedBarber && selectedServices.length > 0 && selectedDate && selectedTime && setStep(4)}
              >
                4. Confirmar
              </span>
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-fade-in w-full max-w-xl mx-auto">
                <h3 className="text-sm font-bold text-zinc-300 text-center sm:text-left">
                  Selecione o profissional
                </h3>

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
                          <div
                            className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-800 border-2 transition-all duration-200 ${isSelected
                                ? "border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]"
                                : "border-zinc-800 group-hover:border-zinc-700"
                              }`}
                          >
                            {b.foto ? (
                              <img
                                src={
                                  b.foto?.startsWith("http")
                                    ? b.foto
                                    : `${api.defaults.baseURL?.replace("/api", "")}${b.foto}`
                                }
                                alt={`Foto de ${b.nome}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <p
                            className={`text-[11px] font-medium text-center truncate w-full transition-colors px-0.5 ${isSelected ? "text-amber-500 font-bold" : "text-zinc-300 group-hover:text-zinc-100"
                              }`}
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
                <h3 className="text-sm font-bold text-zinc-300">Escolha um ou mais Serviços</h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto subtle-scrollbar pr-1">
                  {categorias.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">Nenhum serviço cadastrado.</p>
                  ) : (
                    categorias.map((cat) => (
                      <div key={cat.id} className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block border-b border-zinc-900 pb-1">
                          {cat.nome}
                        </span>
                        <div className="space-y-1.5">
                          {cat.servicos?.map((s) => {
                            const isChecked = selectedServices.some(
                              (item) => Number(item.id) === Number(s.id)
                            );

                            return (
                              <div
                                key={s.id}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-colors ${isChecked
                                    ? "bg-amber-500/10 border-amber-500 text-zinc-100"
                                    : "bg-zinc-900/20 border-zinc-900 text-zinc-400"
                                  }`}
                                onClick={() => toggleService(s)}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => { }}
                                    className="accent-amber-500 h-4 w-4 pointer-events-none"
                                  />
                                  <span className="text-sm font-medium text-zinc-200">{s.nome}</span>
                                </div>
                                <span className="text-xs font-semibold text-zinc-300">
                                  R$ {Number(s.preco).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  className="w-full bg-amber-500 text-zinc-950 font-bold mt-2"
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep(3)}
                >
                  Avançar (R$ {totalServicos.toFixed(2)})
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-300">Selecione Data e Horário</h3>

                {/* ESTRUTURA DO CALENDÁRIO ESTILIZADO */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                  {/* Cabeçalho do Calendário: Mês/Ano e Navegação */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-zinc-200 capitalize">
                        {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                        }
                        // Desabilita voltar para meses anteriores ao atual
                        disabled={
                          currentMonth.getFullYear() === new Date().getFullYear() &&
                          currentMonth.getMonth() <= new Date().getMonth()
                        }
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                        }
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dias da Semana (Dom, Seg, Ter...) */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  {/* Grid de Dias do Mês */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const ano = currentMonth.getFullYear();
                      const mes = currentMonth.getMonth();

                      const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
                      const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

                      const hoje = new Date();
                      hoje.setHours(0, 0, 0, 0);

                      const celulas = [];

                      // Preenche os espaços em branco antes do primeiro dia do mês
                      for (let i = 0; i < primeiroDiaSemana; i++) {
                        celulas.push(<div key={`vazio-${i}`} className="h-10" />);
                      }

                      // Renderiza os dias do mês
                      for (let dia = 1; dia <= totalDiasNoMes; dia++) {
                        const dataObjeto = new Date(ano, mes, dia);
                        dataObjeto.setHours(0, 0, 0, 0);

                        // Formato ISO local YYYY-MM-DD
                        const dateStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

                        const isPassado = dataObjeto < hoje;
                        const isSelected = selectedDate === dateStr;
                        const isHoje = dataObjeto.getTime() === hoje.getTime();

                        celulas.push(
                          <button
                            key={dateStr}
                            type="button"
                            disabled={isPassado}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedTime("");
                            }}
                            className={`h-10 w-full rounded-xl flex flex-col items-center justify-center text-xs transition-all relative ${isPassado
                                ? "text-zinc-600 cursor-not-allowed opacity-40"
                                : isSelected
                                  ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                                  : "text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                              }`}
                          >
                            <span>{dia}</span>

                            {/* Marcador discreto de "Hoje" */}
                            {isHoje && !isSelected && (
                              <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1" />
                            )}
                          </button>
                        );
                      }

                      return celulas;
                    })()}
                  </div>
                </div>

                {/* SELEÇÃO DE HORÁRIOS */}
                {availableSlots.length === 0 ? (
                  <div className="p-4 bg-red-500/10 text-red-400 text-xs text-center font-medium rounded-xl border border-red-500/20">
                    Horários esgotados ou duração excede o expediente para este dia. Escolha outra data.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((h) => {
                      const timeStr = h.substring(0, 5);
                      const isSelected = selectedTime === timeStr;

                      return (
                        <Button
                          key={h}
                          variant={isSelected ? "default" : "outline"}
                          className={`text-xs h-10 transition-colors ${isSelected
                              ? "bg-amber-500 text-zinc-950 font-bold border-amber-500 hover:bg-amber-400"
                              : "border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            }`}
                          onClick={() => {
                            setSelectedTime(timeStr);
                            setStep(4);
                          }}
                        >
                          {timeStr}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-300">Identificação & Revisão</h3>
                <div className="space-y-2 bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                  <input
                    type="text"
                    placeholder="Seu Nome Completo"
                    required
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500 text-zinc-200"
                  />
                  <input
                    type="tel"
                    placeholder="Seu WhatsApp (com DDD)"
                    required
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500 text-zinc-200"
                  />
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Resumo Final do Pedido
                  </h4>
                  <div className="text-xs space-y-1.5 text-zinc-300 border-b border-zinc-900 pb-2">
                    <p className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        Profissional:
                      </span>
                      <span className="font-medium text-zinc-100">{selectedBarber?.nome}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        Data/Hora:
                      </span>
                      <span className="font-medium text-zinc-100">
                        {selectedDate.split("-").reverse().join("/")} às {selectedTime}
                      </span>
                    </p>
                  </div>

                  <div className="text-xs space-y-2 max-h-32 overflow-y-auto subtle-scrollbar">
                    {selectedServices.map((s) => (
                      <div key={s.id} className="flex justify-between items-center text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                          {s.nome}
                        </span>
                        <span>R$ {Number(s.preco).toFixed(2)}</span>
                      </div>
                    ))}

                    {cartProducts.map((item) => (
                      <div key={item.produto.id} className="flex justify-between items-center text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-zinc-400" />
                          {item.produto.nome} <b className="text-amber-500">x{item.qtd}</b>
                        </span>
                        <span>R$ {(Number(item.produto.preco) * item.qtd).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-900 text-sm font-bold">
                    <span className="text-zinc-200">Total a Pagar na Barbearia:</span>
                    <span className="text-amber-500 text-base">R$ {valorTotalGeral.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-3 flex items-center justify-center gap-2"
                  onClick={handleFinalSubmit}
                  disabled={upsertAppointment.isPending}
                >
                  {upsertAppointment.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>


          <div className="flex justify-between gap-3 pt-5 mt-6 border-t border-zinc-900">
            <Button
              variant="outline"
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white h-11 px-5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  setView("home");
                  resetForm();
                }
              }}
            >
              ← Voltar
            </Button>

            <Button
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold h-11 px-5 text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
              onClick={() => {
                setView("home");
                resetForm();
              }}
            >
              Cancelar Tudo
            </Button>
          </div>



        </div>
      )}

      {/* VIEW: MY APPOINTMENTS */}
      {view === "my-appointments" && (
        <div className="w-full max-w-md md:max-w-2xl p-4 flex-1 space-y-4 bg-zinc-950">
          <h3 className="text-sm font-bold text-zinc-300">Meus Agendamentos</h3>

          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Digite seu numero completo"
              value={phoneLookup}
              onChange={(e) => setPhoneLookup(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            <Button
              size="sm"
              className="bg-amber-500 text-zinc-950 font-bold flex items-center gap-1.5"
              onClick={() => setSearchedPhone(phoneLookup)}
            >
              <Search className="w-4 h-4" />
              Buscar
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {loadingMeusAgendamentos ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Buscando na base...</span>
              </div>
            ) : searchedPhone && meusAgendamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-500">
                <CalendarX className="w-8 h-8 text-zinc-600" />
                <p className="text-xs">Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              meusAgendamentosPendentes.map((appt: any) => (
                <Card key={appt.id} className="bg-zinc-900/30 border-zinc-900 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {format(new Date(appt.dataHora), "dd/MM/yyyy - HH:mm")}
                    </span>
                    <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                      Confirmado
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg text-white">{appt.clienteNome}</h3>

                  <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-zinc-500" />
                    Profissional:
                    <span className="font-medium text-zinc-100">
                      {appt.barbeiro?.nome}
                    </span>
                  </p>

                  <div className="border-t border-zinc-800/40 pt-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                      Serviços
                    </span>
                    <ul className="space-y-1">
                      {Array.isArray(appt.servicos) &&
                        appt.servicos.map((service: any) => (
                          <li key={service.id} className="flex justify-between text-sm text-zinc-300">
                            <span>{service.nome}</span>
                            <span className="font-medium text-zinc-200">
                              R$ {Number(service.preco).toFixed(2)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      onClick={() => handleEdit(appt)}
                      className="flex-1 rounded-lg bg-amber-500 py-2 font-medium text-zinc-950 text-sm flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAppointment.mutate(appt.id)}
                      className="flex-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 py-2 font-medium text-red-400 text-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-zinc-400 mt-4 flex items-center justify-center gap-2 hover:text-white"
            onClick={() => setView("home")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Início
          </Button>
        </div>
      )}
    </div>
  );
}
