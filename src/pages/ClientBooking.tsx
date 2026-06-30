import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Clock, Scissors, ShoppingBag, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Barbeiro { id: number; nome: string; }
interface Servico { id: number; nome: string; preco: number; duracaoMinutos: number; }
interface Categoria { id: string; nome: string; servicos: Servico[]; }
interface Produto { id: number; nome: string; preco: number; estoque: number; }

export default function ClientBooking() {
  const [view, setView] = useState<"home" | "booking" | "my-appointments">("home");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [step, setStep] = useState(1); 
  const [selectedBarber, setSelectedBarber] = useState<Barbeiro | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [cartProducts, setCartProducts] = useState<Array<{ produto: Produto; qtd: number }>>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const hojeStr = format(new Date(), "yyyy-MM-dd");

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
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Produto[]>({
    queryKey: ["products-list"],
    queryFn: async () => {
      const res = await api.get("/products");
      return res.data;
    }
  });

  const { data: agendamentosOcupados = [] } = useQuery({
    queryKey: ["client-appointments-lookup", selectedDate, selectedBarber?.id],
    queryFn: async () => {
      const res = await api.get("/appointments", {
        params: { date: selectedDate, barberId: selectedBarber?.id }
      });
      return res.data;
    },
    enabled: step === 2 && !!selectedDate && !!selectedBarber,
  });

  const { data: meusAgendamentos = [], isLoading: loadingMeus } = useQuery({
    queryKey: ["my-appointments-list", searchedPhone],
    queryFn: async () => {
      const res = await api.get(`/appointments/client/${searchedPhone}`);
      return res.data;
    },
    enabled: view === "my-appointments" && !!searchedPhone
  });

  const sendBooking = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/appointments/client-booking", payload); 
    },
    onSuccess: () => {
      toast.success("Agendamento e reserva concluídos com sucesso!");
      resetForm();
      setView("home");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao processar agendamento.");
    }
  });

  const gradeHorarios = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];
  const availableSlots = gradeHorarios.filter((h) => {
    return !agendamentosOcupados.some((appt: any) => format(new Date(appt.dataHora), "HH:mm") === h);
  });

  const totalServicos = selectedServices.reduce((acc, s) => acc + s.preco, 0);
  const totalProdutos = cartProducts.reduce((acc, item) => acc + (item.produto.preco * item.qtd), 0);
  const valorTotalGeral = totalServicos + totalProdutos;

  const handleAddProduct = (prod: Produto) => {
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

  const resetForm = () => {
    setStep(1);
    setSelectedBarber(null);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedServices([]);
    setCartProducts([]);
  };

  const handleFinalSubmit = () => {
    if (!clienteNome || !clienteTelefone) {
      return toast.error("Por favor, preencha seu nome e WhatsApp.");
    }
    const payload = {
      clienteNome,
      clienteTelefone,
      barbeiroId: selectedBarber?.id,
      dataHora: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
      servicoIds: selectedServices.map((s) => s.id),
      produtosReservados: cartProducts.map((p) => ({ id: p.produto.id, quantidade: p.qtd }))
    };
    sendBooking.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 max-w-md mx-auto border-x border-zinc-900 shadow-2xl flex flex-col pb-20">
      <header className="p-4 bg-zinc-900/50 border-b border-zinc-900 sticky top-0 backdrop-blur-md z-40 flex justify-between items-center">
        
        {valorTotalGeral > 0 && (
          <Badge className="bg-amber-500 text-zinc-950 flex gap-1 font-bold border-none">
            <ShoppingBag className="w-3 h-3" /> R$ {valorTotalGeral.toFixed(2)}
          </Badge>
        )}
      </header>

      {view === "home" && (
  <div className="flex-1 flex flex-col">
    {/* Hero - Mantendo os botões principais */}
    <div className="p-6 text-center space-y-4 border-b border-zinc-900 bg-zinc-900/20">
      <h2 className="text-3xl font-black text-white">TK BARBEARIA</h2>
      <p className="text-sm text-zinc-400">Qualidade e estilo em um só lugar.</p>
      <div className="grid grid-cols-1 gap-3 pt-2">
        <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-6 text-base rounded-xl flex items-center justify-center gap-2" onClick={() => setView("booking")}>
          <Scissors className="w-5 h-5" /> Agendar Serviço
        </Button>
        <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 py-6 text-sm font-medium rounded-xl flex items-center justify-center gap-2" onClick={() => setView("my-appointments")}>
          <Clock className="w-4 h-4" /> Ver Meus Agendamentos
        </Button>
      </div>
    </div>

    {/* Seção de Produtos */}
    <div className="p-4 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4" /> Produtos em Estoque
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {loadingProdutos ? (
          <p className="text-xs text-zinc-500 col-span-2 py-4 text-center">Carregando...</p>
        ) : (
          produtos.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between">
              <p className="text-xs font-bold text-zinc-200">{p.nome}</p>
              <div className="mt-2 flex justify-between items-end">
                <span className="text-amber-500 font-bold text-xs">R$ {Number(p.preco).toFixed(2)}</span>
                <span className="text-[10px] text-zinc-500">Qtd: {p.estoque}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Quem Somos */}
    <div className="p-6 bg-zinc-900/30 border-y border-zinc-900 my-4">
      <h2 className="text-sm font-bold text-zinc-100 mb-2">Quem Somos</h2>
      <p className="text-xs text-zinc-400 leading-relaxed">
        A TK Barbearia é um espaço dedicado ao cuidado masculino, oferecendo cortes, 
        barba e serviços de qualidade com profissionalismo e atenção aos detalhes. 
        Nosso objetivo é elevar a autoestima dos clientes, proporcionando uma 
        experiência confortável e um visual sempre alinhado.
      </p>
    </div>

    {/* Localização e Contatos */}
    <div className="p-4 space-y-4 mb-8">
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Localização & Contatos
        </h2>
        <p className="text-sm text-zinc-300">Rua Exemplo, 123 - Centro, Cidade/UF</p>
        <p className="text-sm text-amber-500 font-medium">WhatsApp: (81) 99999-9999</p>
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
    <div className="text-center pb-6">
      <p className="text-[10px] text-zinc-600">© 2026 TK Barbearia | Todos os direitos reservados</p>
      <p className="text-[9px] text-zinc-700 mt-1 uppercase tracking-widest">Desenvolvido por Você</p>
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
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300">Escolha o Profissional</h3>
                <div className="space-y-2">
                  {barbeiros.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">Nenhum barbeiro disponível.</p>
                  ) : (
                    barbeiros.map((b) => (
                      <Card key={b.id} className={`p-4 border border-zinc-800 cursor-pointer transition-colors flex items-center justify-between ${selectedBarber?.id === b.id ? "bg-amber-500/10 border-amber-500" : "bg-zinc-900/30"}`} onClick={() => { setSelectedBarber(b); setStep(2); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-amber-500"><User className="w-4 h-4"/></div>
                          <p className="text-sm font-medium text-zinc-200">{b.nome}</p>
                        </div>
                      </Card>
                    ))
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

                <Button className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-3" disabled={sendBooking.isPending} onClick={handleFinalSubmit}>
                  {sendBooking.isPending ? "Confirmando..." : "Confirmar Agendamento 🚀"}
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
            {loadingMeus ? (
              <p className="text-xs text-zinc-500 text-center py-4">Buscando na base...</p>
            ) : searchedPhone && meusAgendamentos.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhum agendamento ativo encontrado para este telefone.</p>
            ) : (
              meusAgendamentos.map((appt: any) => (
                <Card key={appt.id} className="bg-zinc-900/30 border-zinc-900 p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500">{format(new Date(appt.dataHora), "dd/MM/yyyy - HH:mm")}</span>
                    <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/5">
                      Confirmado
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-300">💈 Profissional: <b>{appt.barbeiro?.nome}</b></p>
                  <p className="text-xs text-zinc-400">✂️ {appt.servicos?.map((s: any) => s.nome).join(", ")}</p>
                </Card>
              ))
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full text-zinc-400 mt-4" onClick={() => setView("home")}>Voltar para o Início</Button>
        </div>
      )}
    </div>
  );
}