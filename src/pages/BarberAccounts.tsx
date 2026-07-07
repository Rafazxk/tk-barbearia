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
  <div className="space-y-6 relative min-h-[400px]">
    
    {/* CABEÇALHO (Fica visível e nítido) */}
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas & Profissionais</h1>
      <p className="text-sm text-muted-foreground">
        Gerencie os perfis de acesso da equipe e gerencie permissões compartilhadas de agenda.
      </p>
    </div>

    {/* CONTAINER COM O OVERLAY E O BLUR */}
    <div className="relative border border-border/40 rounded-2xl p-2">
      
      {/* 🔒 TEXTO E DESTAQUE DE "EM BREVE" - CENTRALIZADO POR CIMA */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[3px] rounded-2xl p-4 text-center animate-fade-in">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-xs font-bold tracking-wider uppercase shadow-sm mb-3 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Múltiplos Painéis (Em Breve)
        </div>
        <h3 className="text-lg font-bold text-zinc-100 max-w-sm">
          Cada barbeiro com o seu próprio ecossistema isolado.
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs mt-1">
          Em breve você poderá alternar de conta com segurança ou dar permissões temporárias em caso de imprevistos.
        </p>
      </div>

      {/* 🌫️ O GRID DA EQUIPE TOTALMENTE DESFOCADO (pointer-events-none impede cliques) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 blur-[5px] pointer-events-none select-none opacity-60">
        
        {/* Mock dos barbeiros apenas para fazer volume no fundo desfocado */}
        {[
          { id: 1, nome: "Tharsys", iniciais: "TA", esp: "Corte & Barba" },
          { id: 2, nome: "Gustavo", iniciais: "GU", esp: "Degradê" },
          { id: 3, nome: "Kleyton", iniciais: "KL", esp: "Químicas" }
        ].map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between min-h-[200px]">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-sm text-primary">{b.iniciais}</div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-zinc-400 border-zinc-500/20"><Shield className="h-3 w-3" />Barbeiro</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground">{b.nome}</h3>
                <div className="text-xs text-muted-foreground">{b.esp}</div>
              </div>
            </div>
            <div className="pt-5">
              <div className="w-full h-8 bg-secondary rounded-lg border border-border" />
            </div>
          </div>
        ))}

        {/* Botão de adicionar simulado no fundo */}
        <div className="bg-card/40 border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]">
          <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center"><Plus className="h-5 w-5 text-muted-foreground" /></div>
          <span className="font-bold text-xs text-foreground">Adicionar Novo</span>
        </div>

      </div>
    </div>

  </div>
);
}