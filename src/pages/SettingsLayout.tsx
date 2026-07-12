import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Camera } from "lucide-react";
import { useBarber } from "@/contexts/BarberContext";
import { Save, CalendarDays, CheckCircle2, Edit2, X, Bell } from "lucide-react";

interface SettingsLayoutProps {
  abaInicial: "barbearia" | "perfil" | "preferencias" | "seguranca" | "politicas";
}

interface DiaConfig {
  id?: number; // Mudado para opcional, pois na primeira vez a memória não tem ID do banco
  diaSemana: number;
  diaNome: string;
  trabalha: boolean;
  horaAbertura: string;
  horaFechamento: string;
  intervaloMinutos: number;
}

export default function SettingsLayout({ abaInicial }: SettingsLayoutProps) {
  const { user } = useBarber();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<DiaConfig[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [isEditandoGrade, setIsEditandoGrade] = useState(false);
  // Define o alvo: null para configuração global/admin, ou o ID do barbeiro logado
  const barbeiroIdDestino = user?.role === "admin" ? null : user?.id;

const [nomeBarbeiro, setNomeBarbeiro] = useState<string>(() => {
  const usuarioSalvo = localStorage.getItem("@TKBarber:user");
  if (usuarioSalvo) {
    const usuarioObj = JSON.parse(usuarioSalvo);
    return usuarioObj.nome || "";
  }
  return "";
});

// Seu estado da foto (caso precise carregar a foto antiga também ao abrir a página)


useEffect(() => {
  const usuarioSalvo = localStorage.getItem("@TKBarber:user");
  if (usuarioSalvo) {
    const usuarioObj = JSON.parse(usuarioSalvo);
    // Se você salvar o caminho da foto no localStorage também:
    if (usuarioObj.foto) setFotoUrl(usuarioObj.foto);
  }
}, []);

const [fotoUrl, setFotoUrl] = useState<string>(() => {
  const usuarioSalvo = localStorage.getItem("@TKBarber:user");
  if (usuarioSalvo) {
    const usuarioObj = JSON.parse(usuarioSalvo);
    return usuarioObj.foto || ""; // Pega a foto salva na sessão
  }
  return "";
});

// 2. Garante que se o localStorage atualizar por fora, o estado acompanhe
useEffect(() => {
  const usuarioSalvo = localStorage.getItem("@TKBarber:user");
  if (usuarioSalvo) {
    const usuarioObj = JSON.parse(usuarioSalvo);
    if (usuarioObj.foto) {
      setFotoUrl(usuarioObj.foto);
    }
  }
}, []);

  // 📥 Buscar configurações sincronizadas por Barbeiro
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

  // Sincroniza dados do servidor ou gera a grade padrão inicial caso esteja vazio no banco
  useEffect(() => {
    if (serverData && serverData.length > 0) {
      setConfigs(serverData);
    } else if (serverData && serverData.length === 0) {
     

      const diasIniciais: DiaConfig[] = [
        { diaSemana: 1, diaNome: "Segunda-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", intervaloMinutos: 30 },
  { diaSemana: 2, diaNome: "Terça-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", intervaloMinutos: 30 },
  { diaSemana: 3, diaNome: "Quarta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", intervaloMinutos: 30 },
  { diaSemana: 4, diaNome: "Quinta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", intervaloMinutos: 30 },
  { diaSemana: 5, diaNome: "Sexta-feira", trabalha: true, horaAbertura: "08:00", horaFechamento: "20:00", intervaloMinutos: 30 },
  { diaSemana: 6, diaNome: "Sábado", trabalha: true, horaAbertura: "08:00", horaFechamento: "18:00", intervaloMinutos: 30 },
  { diaSemana: 0, diaNome: "Domingo", trabalha: false, horaAbertura: "08:00", horaFechamento: "12:00", intervaloMinutos: 30 },
      ];
      setConfigs(diasIniciais);
    }
  }, [serverData]);

const handleMudancaArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;

  const formData = new FormData();
  formData.append("avatar", arquivo); 

  try {
    const res = await api.post("/auth/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true 
    });

    const novaFotoUrl = res.data.fotoUrl;
    const urlComTempo = `${novaFotoUrl}?t=${new Date().getTime()}`;
    
    // 1. Atualiza o estado para mudar na tela na hora
    setFotoUrl(urlComTempo);

    // 🔑 2. ATUALIZA O LOCALSTORAGE: Garante que a foto persista após o F5!
    const usuarioSalvo = localStorage.getItem("@TKBarber:user");
    if (usuarioSalvo) {
      const usuarioObj = JSON.parse(usuarioSalvo);
      usuarioObj.foto = novaFotoUrl; // Salva o caminho limpo da foto no perfil do usuário
      localStorage.setItem("@TKBarber:user", JSON.stringify(usuarioObj));
    }

    alert("Foto de perfil atualizada!");
  } catch (error) {
    console.error("Erro ao subir imagem:", error);
  }
};

  // 📤 Mutation para salvar os horários
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

  const handleHorarioChange = (index: number, campo: keyof DiaConfig, valor: any) => {
    const novosDados = [...configs];
    novosDados[index] = { ...novosDados[index], [campo]: valor };
    setConfigs(novosDados);
  };

  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (abaInicial === "barbearia") {
      updateHoursMutation.mutate(configs);
    } else {
      alert("Configurações salvas com sucesso!");
    }
  };

  // Garante o corte dos segundos (HH:MM:SS -> HH:MM) para o input do HTML funcionar
  const formatarHoraInput = (horaStr: string | undefined | null, padrao: string = "09:00") => {
    if (!horaStr) return padrao;
    return horaStr.slice(0, 5);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
          Configurações de {abaInicial === "politicas" ? "Políticas" : abaInicial}
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie os parâmetros específicos deste módulo do sistema.</p>
      </div>

      {mostrarSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4" /> Configurações salvas no banco de dados!
        </div>
      )}

      {/* FORMULÁRIO */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
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
                    <input type="text" defaultValue="5581983084006" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* HORÁRIOS DE FUNCIONAMENTO */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> Horários de Funcionamento
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {barbeiroIdDestino ? "Defina a sua grade pessoal de trabalho." : "Grade padrão de expediente da barbearia."}
                    </p>
                  </div>
                  
                  {/* Botão de Alternância de Edição */}
                  {!carregandoHorarios && configs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        // Se cancelar, restaura o que estava salvo originalmente (ou deixa a padrão se o banco for vazio)
                        if (isEditandoGrade && serverData) {
                          if (serverData.length > 0) setConfigs(serverData);
                        }
                        setIsEditandoGrade(!isEditandoGrade);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                        isEditandoGrade
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
                      <div key={config.diaSemana} className={`p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center transition-all ${!config.trabalha ? "bg-zinc-950/20 opacity-40" : ""}`}>
                        
                        {/* Nome do dia + Checkbox */}
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            disabled={!isEditandoGrade}
                            checked={config.trabalha} 
                            onChange={(e) => handleHorarioChange(index, "trabalha", e.target.checked)}
                            className="h-4 w-4 rounded border-border bg-background text-primary cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="font-semibold text-sm text-foreground">{config.diaNome}</span>
                        </div>

                        {/* Abertura */}
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
                            <span className="text-sm text-muted-foreground">
                              Abertura: <strong className="text-foreground">{config.trabalha ? formatarHoraInput(config.horaAbertura) : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        {/* Fechamento */}
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
                            <span className="text-sm text-muted-foreground">
                              Fechamento: <strong className="text-foreground">{config.trabalha ? formatarHoraInput(config.horaFechamento) : "--:--"}</strong>
                            </span>
                          )}
                        </div>

                        {/* Intervalo */}
                        <div className="flex flex-col">
                          {isEditandoGrade ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Intervalo dos Slots</label>
                              <select
                                disabled={!config.trabalha}
                                value={config.intervaloMinutos}
                                onChange={(e) => handleHorarioChange(index, "intervaloMinutos", Number(e.target.value))}
                                className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground cursor-pointer disabled:opacity-40"
                              >
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
  <div className="space-y-6 max-w-md animate-fade-in">
    <div>
      <h3 className="text-base font-bold text-foreground">Meu Perfil de Acesso</h3>
      <p className="text-xs text-muted-foreground">Gerencie suas credenciais e foto de exibição.</p>
    </div>
    <hr className="border-border/60" />

    {/* SEÇÃO DO AVATAR COM UPLOAD EM TEMPO REAL */}
    <div className="flex items-center gap-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
      
      {/* Container da foto clicável */}
      <div 
    className="relative group cursor-pointer w-16 h-16 flex-shrink-0" 
    onClick={() => fileInputRef.current?.click()}
    title="Clique para alterar sua foto de perfil"
  >
    <img 
  src={
    fotoUrl 
      ? fotoUrl
      : "https://github.com/github.png"
  } 
  alt="Sua foto de perfil" 
  className="w-full h-full rounded-full object-cover border-2 border-amber-500/30 p-0.5 group-hover:opacity-75 transition-all"
/>
        {/* Efeito de hover escurecendo e mostrando o ícone de câmera */}
       <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[10px] text-white font-medium">Trocar</span>
      {/* <Camera className="w-4 h-4 text-white" /> */}
    </div>
  </div>

     <div className="space-y-1 flex-1">
    <p className="text-sm font-bold text-foreground">Sua Foto de Perfil</p>
    <p className="text-[11px] text-muted-foreground">Clique no círculo para carregar uma imagem do seu dispositivo.</p>
    
    {/* Input de arquivo escondido */}
    <input 
      type="file" 
      ref={fileInputRef} 
      onChange={handleMudancaArquivo} 
      accept="image/*" 
      className="hidden" 
    />
  </div>
</div>

    {/* SEÇÃO DO NOME (AGORA DINÂMICO) */}
    
    <div className="space-y-1.5">
    <label className="text-xs font-semibold text-foreground">Seu Nome</label>
    <input 
      type="text" 
      value={nomeBarbeiro} 
      onChange={(e) => setNomeBarbeiro(e.target.value)}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" 
    />
  </div>

    {/* BOTÃO PARA SALVAR AS ALTERAÇÕES */}
    <div className="pt-2">
    <button 
      onClick={async () => {
        try {
          // 1. Envia o novo nome para o backend atualizar no banco de dados (Drizzle)
          // Ajuste a rota para a rota correspondente no seu backend (ex: /auth/update-profile ou /barbers/profile)
          const res = await api.put("/auth/update-profile", { 
            nome: nomeBarbeiro 
          }, { 
            withCredentials: true 
          });

          // 2. Atualiza o LocalStorage para sincronizar o nome novo no Front-end inteiro
          const usuarioSalvo = localStorage.getItem("@TKBarber:user");
          if (usuarioSalvo) {
            const usuarioObj = JSON.parse(usuarioSalvo);
            usuarioObj.nome = nomeBarbeiro; // Substitui pelo nome novo
            localStorage.setItem("@TKBarber:user", JSON.stringify(usuarioObj));
          }

          alert("Alterações salvas com sucesso!");
        } catch (error) {
          console.error("Erro ao salvar perfil:", error);
          alert("Erro ao salvar alterações.");
        }
      }}
      className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 text-xs rounded-lg hover:bg-amber-400 transition-all cursor-pointer"
    >
      Salvar Alterações
    </button>
  </div>
</div>
)}

          {/* 🎛️ PREFERÊNCIAS */}
          {abaInicial === "preferencias" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Preferências do Sistema</h3>
                <p className="text-xs text-muted-foreground">Personalize as notificações.</p>
              </div>
              <hr className="border-border/60" />
              <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 accent-primary" />
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-primary" /> Enviar lembretes via WhatsApp
                </span>
              </label>
            </div>
          )}

          {/* 🔒 SEGURANÇA */}
          {abaInicial === "seguranca" && (
            <div className="space-y-4">
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
              disabled={(abaInicial === "barbearia" && !isEditandoGrade) || updateHoursMutation.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
            >
              <Save className="h-4 w-4" />
              {abaInicial === "barbearia" && updateHoursMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}