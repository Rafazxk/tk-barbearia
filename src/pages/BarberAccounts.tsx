import { useState } from "react";
import { UserCheck, Plus, Calendar, Shield, Scissors, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface Barbeiro {
  id: string;
  nome: string;
  perfil: "Administrador" | "Barbeiro";
  especialidade: string;
  email: string;
  iniciais: string;
}

export default function BarberAccounts() {
  const [, setLocation] = useLocation();

  // Mock dos 3 perfis iniciais da família + espaço para novos
  const [barbeiros] = useState<Barbeiro[]>([
    { id: "1", nome: "Tharsys", perfil: "Administrador", especialidade: "Corte & Barba Terapia", email: "tharsys@tkbarbearia.com", iniciais: "TA" },
    { id: "2", nome: "Gustavo", perfil: "Barbeiro", especialidade: "Degradê & Visagismo", email: "gustavo@tkbarbearia.com", iniciais: "GU" },
    { id: "3", nome: "Kleyton", perfil: "Barbeiro", especialidade: "Químicas & Sobrancelha", email: "kleyton@tkbarbearia.com", iniciais: "KL" },
  ]);

  // Função para simular a troca de contexto ou filtro de agenda
  const handleVerAgenda = (nomeBarbeiro: string) => {
    console.log(`Filtrando sistema para a visão de: ${nomeBarbeiro}`);
    // No futuro, podemos passar o ID via estado global ou query param para a tela de Agendamentos
    setLocation("/agendamentos");
  };

  const handleAdicionarBarbeiro = () => {
    alert("Abrir modal ou formulário para adicionar um novo barbeiro à família! (Simulação)");
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas & Profissionais</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os perfis de acesso da equipe. Alterne para visualizar as agendas separadamente.
        </p>
      </div>

      {/* GRID DE PERFIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Renderiza os 3 barbeiros já cadastrados */}
        {barbeiros.map((barbeiro) => (
          <div 
            key={barbeiro.id} 
            className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group"
          >
            <div className="space-y-4">
              {/* Topo do Card: Avatar e Badge de Nível */}
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-sm text-primary tracking-wider group-hover:bg-primary/10 transition-colors">
                  {barbeiro.iniciais}
                </div>
                
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  barbeiro.perfil === "Administrador" 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                }`}>
                  <Shield className="h-3 w-3" />
                  {barbeiro.perfil}
                </span>
              </div>

              {/* Informações do Barbeiro */}
              <div className="space-y-1">
                <h3 className="font-bold text-foreground truncate">{barbeiro.nome}</h3>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Scissors className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{barbeiro.especialidade}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{barbeiro.email}</span>
                </div>
              </div>
            </div>

            {/* Ação: Ver Agenda Separada */}
            <div className="pt-5">
              <button 
                onClick={() => handleVerAgenda(barbeiro.nome)}
                className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-zinc-800 text-foreground text-xs font-semibold py-2 rounded-lg border border-border transition-colors cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Ver Agenda Separada
              </button>
            </div>
          </div>
        ))}

        {/* CARD ADICIONAR NOVO BARBEIRO */}
        <button 
          onClick={handleAdicionarBarbeiro}
          className="bg-card/40 border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-card transition-all duration-200 cursor-pointer min-h-[220px]"
        >
          <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Plus className="h-6 w-6 text-muted-foreground hover:text-primary" />
          </div>
          <div className="text-center">
            <span className="font-bold text-sm block text-foreground">Adicionar Novo</span>
            <span className="text-xs text-muted-foreground">Cadastrar membro na equipe</span>
          </div>
        </button>

      </div>

    </div>
  );
}