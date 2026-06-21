import { Store, User, Sliders, ShieldCheck, FileText, Save, KeyRound, Bell } from "lucide-react";

interface SettingsLayoutProps {
  abaInicial: "barbearia" | "perfil" | "preferencias" | "seguranca" | "politicas";
}

export default function SettingsLayout({ abaInicial }: SettingsLayoutProps) {
  
  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* CABEÇALHO DINÂMICO */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
          Configurações de {abaInicial === "politicas" ? "Políticas" : abaInicial}
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie os parâmetros específicos deste módulo do sistema.</p>
      </div>

      {/* CONTEÚDO DA CONFIGURAÇÃO */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSalvarConfig} className="space-y-6">
          
          {/* 🏢 ABA: BARBEARIA */}
          {abaInicial === "barbearia" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Dados da Barbearia</h3>
                <p className="text-xs text-muted-foreground">Informações públicas que aparecerão na página de agendamento do cliente.</p>
              </div>
              <hr className="border-border/60" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nome da Barbearia</label>
                  <input type="text" defaultValue="TK Barbearia" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Telefone Comercial</label>
                  <input type="text" defaultValue="(81) 99999-8888" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* 👤 ABA: PERFIL */}
          {abaInicial === "perfil" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Meu Perfil de Acesso</h3>
                <p className="text-xs text-muted-foreground">Gerencie suas credenciais de login e dados de exibição pessoal.</p>
              </div>
              <hr className="border-border/60" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Seu Nome</label>
                  <input type="text" defaultValue="Rafael Silva" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* 🎛️ ABA: PREFERÊNCIAS */}
          {abaInicial === "preferencias" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Preferências do Sistema</h3>
                <p className="text-xs text-muted-foreground">Personalize as notificações e comportamentos do painel administrativo.</p>
              </div>
              <hr className="border-border/60" />
              <label className="flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 accent-primary" />
                <div>
                  <span className="text-sm font-semibold text-foreground block flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-primary" /> Enviar lembretes via WhatsApp
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* 🔒 ABA: SEGURANÇA */}
          {abaInicial === "seguranca" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Segurança da Conta</h3>
                <p className="text-xs text-muted-foreground">Altere seus parâmetros de segurança e senhas de acesso.</p>
              </div>
              <hr className="border-border/60" />
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* 📄 ABA: POLÍTICAS (Corrigida aqui 👇) */}
          {abaInicial === "politicas" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Políticas & LGPD</h3>
                <p className="text-xs text-muted-foreground">Configuração dos termos de consentimento exigidos dos clientes finais.</p>
              </div>
              <hr className="border-border/60" />
              <textarea rows={4} defaultValue="O cliente pode desmarcar o agendamento sem custo..." className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
          )}

          {/* BOTÃO SALVAR GLOBAL */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer shadow-md">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}