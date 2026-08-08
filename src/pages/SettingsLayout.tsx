import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBarber } from "@/contexts/BarberContext";
import { Save, CalendarDays, CalendarCheck, MessageSquare, Volume2, CheckCircle2, Edit2, X, Bell, Loader2 } from "lucide-react";

interface SettingsLayoutProps {
  abaInicial: "barbearia" | "perfil" | "preferencias" | "seguranca" | "politicas";
}

interface Preferencias {
  whatsappLembretes: boolean;
  notificacoesNovoAgendamento: boolean;
  somNotificacao: boolean;
  aprovacaoAutomatica: boolean;
}

interface DiaConfig {
  id?: number;
  diaSemana: number;
  diaNome: string;
  trabalha: boolean;
  horaAbertura: string;
  horaFechamento: string;
  horaInicioAlmoco?: string;
  horaFimAlmoco?: string;
  intervaloMinutos: number;
}

export default function SettingsLayout({ abaInicial }: SettingsLayoutProps) {
  const { user } = useBarber();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<DiaConfig[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [isEditandoGrade, setIsEditandoGrade] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const barbeiroIdDestino = user?.role === "admin" ? null : user?.id;

  // 1️⃣ ESTADO DE PREFERÊNCIAS (Inicia lendo do localStorage se existir)
  const [preferencias, setPreferencias] = useState<Preferencias>(() => {
    const salvas = localStorage.getItem("@TKBarber:preferences");
    if (salvas) {
      try {
        return JSON.parse(salvas);
      } catch (e) {
        console.error("Erro ao carregar preferências:", e);
      }
    }
    return {
      whatsappLembretes: true,
      notificacoesNovoAgendamento: true,
      somNotificacao: true,
      aprovacaoAutomatica: false,
    };
  });

  // Função para alternar o checkbox e salvar imediatamente no localStorage
  const handleTogglePreferencias = (chave: keyof Preferencias) => {
    setPreferencias((prev) => {
      const novas = { ...prev, [chave]: !prev[chave] };
      localStorage.setItem("@TKBarber:preferences", JSON.stringify(novas));
      return novas;
    });
  };

  const [nomeBarbeiro, setNomeBarbeiro] = useState<string>(() => {
    const usuarioSalvo = localStorage.getItem("@TKBarber:user");
    if (usuarioSalvo) {
      const usuarioObj = JSON.parse(usuarioSalvo);
      return usuarioObj.nome || "";
    }
    return "";
  });

  const [fotoUrl, setFotoUrl] = useState<string>(() => {
    const usuarioSalvo = localStorage.getItem("@TKBarber:user");
    if (usuarioSalvo) {
      const usuarioObj = JSON.parse(usuarioSalvo);
      return usuarioObj.foto || "";
    }
    return "";
  });

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("@TKBarber:user");
    if (usuarioSalvo) {
      const usuarioObj = JSON.parse(usuarioSalvo);
      if (usuarioObj.foto) setFotoUrl(usuarioObj.foto);
    }
  }, []);

  const { data: serverData, isLoading: carregandoHorarios } = useQuery<DiaConfig[]>({
    queryKey: ["business-hours", barbeiroIdDestino],
    queryFn: async () => {
      const res = await api.get("/business-hours", {
        params: { barbeiroId: barbeiroIdDestino }
      });
      return res.data;
    },
    enabled: abaInicial === "barbearia"
  });

  useEffect(() => {
    if (serverData && serverData.length > 0) {
      setConfigs(serverData);
    } else if (serverData && serverData.length === 0) {
      const diasIniciais: DiaConfig[] = [
        { diaSemana: 1, diaNome: "Segunda-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 2, diaNome: "Terça-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 3, diaNome: "Quarta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 4, diaNome: "Quinta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 5, diaNome: "Sexta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 6, diaNome: "Sábado", trabalha: true, horaAbertura: "08:00", horaFechamento: "18:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
        { diaSemana: 0, diaNome: "Domingo", trabalha: false, horaAbertura: "08:00", horaFechamento: "12:00", horaInicioAlmoco: "12:00", horaFimAlmoco: "13:00", intervaloMinutos: 30 },
      ];
      setConfigs(diasIniciais);
    }
  }, [serverData]);

  // UPLOAD DA FOTO
  const handleMudancaArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const formData = new FormData();
    formData.append("avatar", arquivo);

    try {
      setIsUploadingFoto(true);
      const res = await api.post("/auth/upload-avatar", formData, {
        withCredentials: true
      });

      const novaFotoUrl = res.data.fotoUrl;
      const urlComTempo = `${novaFotoUrl}?t=${new Date().getTime()}`;
      setFotoUrl(urlComTempo);

      const usuarioSalvo = localStorage.getItem("@TKBarber:user");
      if (usuarioSalvo) {
        const usuarioObj = JSON.parse(usuarioSalvo);
        usuarioObj.foto = novaFotoUrl;
        localStorage.setItem("@TKBarber:user", JSON.stringify(usuarioObj));
      }

      setMostrarSucesso(true);
      setTimeout(() => setMostrarSucesso(false), 3000);
    } catch (error) {
      console.error("Erro ao subir imagem:", error);
      alert("Erro ao salvar a foto de perfil em produção. Verifique o servidor.");
    } finally {
      setIsUploadingFoto(false);
    }
  };

  // MUTATION HORÁRIOS
  const updateHoursMutation = useMutation({
    mutationFn: async (dadosSemanais: DiaConfig[]) => {
      return api.put("/business-hours", {
        configs: dadosSemanais,
        barbeiroId: barbeiroIdDestino
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      setMostrarSucesso(true);
      setIsEditandoGrade(false);
      setTimeout(() => setMostrarSucesso(false), 3000);
    }
  });

  // MUTATION PERFIL
  const updateProfileMutation = useMutation({
    mutationFn: async (nome: string) => {
      return api.put("/auth/update-profile", { nome }, { withCredentials: true });
    },
    onSuccess: () => {
      const usuarioSalvo = localStorage.getItem("@TKBarber:user");
      if (usuarioSalvo) {
        const usuarioObj = JSON.parse(usuarioSalvo);
        usuarioObj.nome = nomeBarbeiro;
        localStorage.setItem("@TKBarber:user", JSON.stringify(usuarioObj));
      }
      setMostrarSucesso(true);
      setTimeout(() => setMostrarSucesso(false), 3000);
    },
    onError: (error) => {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar alterações do perfil.");
    }
  });

  const handleHorarioChange = (index: number, campo: keyof DiaConfig, valor: any) => {
    const novosDados = [...configs];
    novosDados[index] = { ...novosDados[index], [campo]: valor };
    setConfigs(novosDados);
  };

  // SUBMIT UNIFICADO VIA BOTÃO PRINCIPAL
  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (abaInicial === "barbearia") {
      updateHoursMutation.mutate(configs);
    } else if (abaInicial === "perfil") {
      updateProfileMutation.mutate(nomeBarbeiro);
    } else {
      // Para preferências, salvar no localStorage já acontece a cada clique,
      // mas mantemos o feedback de sucesso ao clicar no botão "Salvar Alterações"
      localStorage.setItem("@TKBarber:preferences", JSON.stringify(preferencias));
      setMostrarSucesso(true);
      setTimeout(() => setMostrarSucesso(false), 3000);
    }
  };

  const formatarHoraInput = (horaStr: string | undefined | null, padrao: string = "09:00") => {
    if (!horaStr) return padrao;
    return horaStr.slice(0, 5);
  };

  const isSaving = updateHoursMutation.isPending || updateProfileMutation.isPending;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground capitalize">
          Configurações de {abaInicial === "politicas" ? "Políticas" : abaInicial}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Gerencie os parâmetros específicos deste módulo do sistema.</p>
      </div>

      {mostrarSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Configurações salvas com sucesso!
        </div>
      )}

      {/* FORMULÁRIO */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleSalvarConfig} className="space-y-6">

          {/* 🏢 BARBEARIA */}
          {abaInicial === "barbearia" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Dados da Barbearia</h3>
                  <p className="text-xs text-muted-foreground">Informações públicas da página de agendamento.</p>
                </div>
                <hr className="border-border/60" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nome da Barbearia</label>
                    <input type="text" defaultValue="TK Barbearia" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Telefone Comercial</label>
                    <input type="text" defaultValue="" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* HORÁRIOS DE FUNCIONAMENTO */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary shrink-0" /> Horários de Funcionamento
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {barbeiroIdDestino ? "Defina a sua grade pessoal de trabalho." : "Grade padrão de expediente da barbearia."}
                    </p>
                  </div>

                  {!carregandoHorarios && configs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditandoGrade && serverData && serverData.length > 0) {
                          setConfigs(serverData);
                        }
                        setIsEditandoGrade(!isEditandoGrade);
                      }}
                      className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${isEditandoGrade
                        ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                        : "bg-zinc-900 border-border text-foreground hover:bg-zinc-800"
                        }`}
                    >
                      {isEditandoGrade ? (
                        <><X className="h-3.5 w-3.5" /> Cancelar Edição</>
                      ) : (
                        <><Edit2 className="h-3.5 w-3.5 text-primary" /> Editar Grade</>
                      )}
                    </button>
                  )}
                </div>
                <hr className="border-border/60" />

                {carregandoHorarios ? (
                  <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Carregando horários...</div>
                ) : (
                  <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border bg-background/20 shadow-inner">
                    {configs.map((config, index) => (
                      <div key={config.diaSemana} className={`p-3.5 grid grid-cols-1 md:grid-cols-6 gap-3 items-center transition-all ${!config.trabalha ? "bg-zinc-950/20 opacity-50" : ""}`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={!isEditandoGrade}
                            checked={config.trabalha}
                            onChange={(e) => handleHorarioChange(index, "trabalha", e.target.checked)}
                            className="h-4 w-4 rounded border-border bg-background text-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                          />
                          <span className="font-semibold text-sm text-foreground">{config.diaNome}</span>
                        </div>

                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Abertura</label>
                              <input
                                type="time"
                                disabled={!config.trabalha}
                                value={formatarHoraInput(config.horaAbertura, "09:00")}
                                onChange={(e) => handleHorarioChange(index, "horaAbertura", e.target.value)}
                                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground w-full focus:outline-none focus:border-primary disabled:opacity-40"
                              />
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-muted-foreground">
                              Abertura: <strong className="text-foreground">{config.trabalha ? formatarHoraInput(config.horaAbertura) : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Início Almoço</label>
                              <input
                                type="time"
                                disabled={!config.trabalha}
                                value={formatarHoraInput(config.horaInicioAlmoco, "12:00")}
                                onChange={(e) => handleHorarioChange(index, "horaInicioAlmoco", e.target.value)}
                                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground w-full focus:outline-none focus:border-primary disabled:opacity-40"
                              />
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-muted-foreground">
                              Almoço: <strong className="text-primary">{config.trabalha ? formatarHoraInput(config.horaInicioAlmoco, "--:--") : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fim Almoço</label>
                              <input
                                type="time"
                                disabled={!config.trabalha}
                                value={formatarHoraInput(config.horaFimAlmoco, "13:00")}
                                onChange={(e) => handleHorarioChange(index, "horaFimAlmoco", e.target.value)}
                                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground w-full focus:outline-none focus:border-primary disabled:opacity-40"
                              />
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-muted-foreground">
                              Retorno: <strong className="text-primary">{config.trabalha ? formatarHoraInput(config.horaFimAlmoco, "--:--") : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fechamento</label>
                              <input
                                type="time"
                                disabled={!config.trabalha}
                                value={formatarHoraInput(config.horaFechamento, "19:00")}
                                onChange={(e) => handleHorarioChange(index, "horaFechamento", e.target.value)}
                                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground w-full focus:outline-none focus:border-primary disabled:opacity-40"
                              />
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-muted-foreground">
                              Fechamento: <strong className="text-foreground">{config.trabalha ? formatarHoraInput(config.horaFechamento) : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Intervalo dos Slots</label>
                              <select
                                disabled={!config.trabalha}
                                value={config.intervaloMinutos}
                                onChange={(e) => handleHorarioChange(index, "intervaloMinutos", Number(e.target.value))}
                                className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground w-full cursor-pointer disabled:opacity-40"
                              >
                                <option value={10}>A cada 10 min</option>
                                <option value={15}>A cada 15 min</option>
                                <option value={30}>A cada 30 min</option>
                                <option value={45}>A cada 45 min</option>
                                <option value={60}>A cada 1 hora</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-zinc-900 border border-border/40 px-2.5 py-1 rounded-md max-w-max">
                              Intervalo: <strong className="text-primary">{config.trabalha ? `${config.intervaloMinutos} min` : "Inativo"}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 👤 PERFIL */}
          {abaInicial === "perfil" && (
            <div className="space-y-6 max-w-md animate-fade-in mx-auto sm:mx-0">
              <div>
                <h3 className="text-base font-bold text-foreground">Meu Perfil de Acesso</h3>
                <p className="text-xs text-muted-foreground">Gerencie suas credenciais e foto de exibição.</p>
              </div>
              <hr className="border-border/60" />

              <div className="flex items-center gap-4 sm:gap-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                <div
                  className="relative group cursor-pointer w-16 h-16 flex-shrink-0"
                  onClick={() => !isUploadingFoto && fileInputRef.current?.click()}
                  title="Clique para alterar sua foto de perfil"
                >
                  <img
                    src={fotoUrl ? fotoUrl : "https://github.com/github.png"}
                    alt="Sua foto de perfil"
                    className="w-full h-full rounded-full object-cover border-2 border-amber-500/30 p-0.5 group-hover:opacity-75 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingFoto ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    ) : (
                      <span className="text-[10px] text-white font-medium">Trocar</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-foreground">Sua Foto de Perfil</p>
                  <p className="text-[11px] text-muted-foreground">Clique no círculo para carregar uma imagem do seu dispositivo.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMudancaArquivo}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Seu Nome</label>
                <input
                  type="text"
                  value={nomeBarbeiro}
                  onChange={(e) => setNomeBarbeiro(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* 🎛️ PREFERÊNCIAS (AGORA CONECTADO AO ESTADO E LOCALSTORAGE) */}
          {abaInicial === "preferencias" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Preferências do Sistema</h3>
                <p className="text-xs text-muted-foreground">
                  Personalize como você recebe alertas e como o sistema se comporta.
                </p>
              </div>

              <hr className="border-border/60" />

              {/* SEÇÃO 1: NOTIFICAÇÕES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notificações & Lembretes
                </h4>

                {/* Lembretes WhatsApp */}
                <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferencias.whatsappLembretes}
                    onChange={() => handleTogglePreferencias("whatsappLembretes")}
                    className="mt-1 accent-primary shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" /> Lembretes via WhatsApp
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enviar mensagem automática para o cliente 2 horas antes do agendamento.
                    </p>
                  </div>
                </label>

                {/* Alerta de Novo Agendamento */}
                <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferencias.notificacoesNovoAgendamento}
                    onChange={() => handleTogglePreferencias("notificacoesNovoAgendamento")}
                    className="mt-1 accent-primary shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-primary shrink-0" /> Notificações de novos agendamentos
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Receber aviso no painel e no navegador sempre que um cliente marcar um horário.
                    </p>
                  </div>
                </label>

                {/* Alerta Sonoro */}
                <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferencias.somNotificacao}
                    onChange={() => handleTogglePreferencias("somNotificacao")}
                    className="mt-1 accent-primary shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Volume2 className="h-4 w-4 text-primary shrink-0" /> Som de notificação
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Tocar um sinal sonoro ao receber um novo agendamento na tela.
                    </p>
                  </div>
                </label>
              </div>

              {/* SEÇÃO 2: REGRAS DA AGENDA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Regras de Agendamento
                </h4>

                {/* Confirmação Automática */}
                <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferencias.aprovacaoAutomatica}
                    onChange={() => handleTogglePreferencias("aprovacaoAutomatica")}
                    className="mt-1 accent-primary shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <CalendarCheck className="h-4 w-4 text-primary shrink-0" /> Aprovação automática
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Confirmar novos agendamentos automaticamente sem necessidade de aprovação manual.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 🔒 SEGURANÇA */}
          {abaInicial === "seguranca" && (
            <div className="space-y-4 max-w-md">
              <div>
                <h3 className="text-base font-bold text-foreground">Segurança da Conta</h3>
                <p className="text-xs text-muted-foreground">Altere suas senhas.</p>
              </div>
              <hr className="border-border/60" />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Senha Atual</label>
                <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {/* 📄 POLÍTICAS */}
          {abaInicial === "politicas" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Políticas & LGPD</h3>
                <p className="text-xs text-muted-foreground">Termos de consentimento.</p>
              </div>
              <hr className="border-border/60" />
              <textarea rows={4} defaultValue="O cliente pode desmarcar o agendamento sem custo..." className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
          )}

          {/* BOTÃO GLOBAL DE SALVAR */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={(abaInicial === "barbearia" && !isEditandoGrade) || isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}