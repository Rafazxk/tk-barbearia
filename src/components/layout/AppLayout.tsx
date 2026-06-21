import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, X, LayoutDashboard, Calendar, DollarSign, 
  MessageSquare, Users, Briefcase, ShoppingBag, CalendarOff, 
  Settings, LogOut, ChevronDown, ChevronUp, Store, User, 
  Sliders, ShieldCheck, FileText 
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado para controlar a abertura do submenu de configurações
  const [configAberto, setConfigAberto] = useState(location.startsWith("/configuracoes"));

  const usuarioLogado = {
    nome: "Tharsys",
    perfil: "Administrador",
    iniciais: "TS"
  };

  // Itens normais (Configurações saiu daqui para virar o dropdown no final)
  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Agendamentos", href: "/agendamentos", icon: Calendar },
    { name: "Financeiro", href: "/financeiro", icon: DollarSign },
    { name: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
    { name: "Contas", href: "/contas", icon: Users },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Serviços", href: "/servicos", icon: Briefcase },
    { name: "Produtos", href: "/produtos", icon: ShoppingBag },
    { name: "Bloquear Horários", href: "/bloqueios", icon: CalendarOff },
  ];

  // Subitens de configurações
  const subLinksConfig = [
    { name: "Barbearia", href: "/configuracoes/barbearia", icon: Store },
    { name: "Meu Perfil", href: "/configuracoes/perfil", icon: User },
    { name: "Preferências", href: "/configuracoes/preferencias", icon: Sliders },
    { name: "Segurança", href: "/configuracoes/seguranca", icon: ShieldCheck },
    { name: "Políticas & LGPD", href: "/configuracoes/politicas", icon: FileText },
  ];

  const handleLogout = () => {
    console.log("Executando logout do sistema...");
  };

  const NavigationLinks = () => (
    <nav className="space-y-1 p-3 overflow-y-auto flex-1 select-none custom-scrollbar">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <a 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </a>
          </Link>
        );
      })}

      {/* RECURSO DO DROPDOWN RECTÁTIL DE CONFIGURAÇÕES */}
      <button
        onClick={() => setConfigAberto(!configAberto)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
          location.startsWith("/configuracoes")
            ? "text-foreground font-semibold bg-secondary/40"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 shrink-0" />
          <span>Configurações</span>
        </div>
        {configAberto ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {/* RENDERIZA OS SUBMETENS SE ESTIVER ABERTO */}
      {configAberto && (
        <div className="pl-4 mt-1 space-y-1 border-l border-border/60 ml-6 animate-in slide-in-from-top-2 duration-150">
          {subLinksConfig.map((subItem) => {
            const SubIcon = subItem.icon;
            const isSubActive = location === subItem.href;

            return (
              <Link key={subItem.href} href={subItem.href}>
                <a
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isSubActive
                      ? "text-primary font-bold bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{subItem.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-4 border-t border-border bg-card/50 flex flex-col gap-3 shrink-0">
      <div className="flex items-center gap-3 px-2">
        <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary tracking-wider">
          {usuarioLogado.iniciais}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate">{usuarioLogado.nome}</span>
          <span className="text-xs text-muted-foreground truncate">{usuarioLogado.perfil}</span>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-150 cursor-pointer"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>Sair da conta</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      
      {/* HEADER MOBILE */}
      <header className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            BB
          </div>
          <span className="font-bold text-sm tracking-wider text-primary">BARBERBOOK</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-muted-foreground hover:text-foreground focus:outline-none p-1"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* GAVETA LATERAL MOBILE */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 flex items-center gap-2 border-b border-border shrink-0">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              BB
            </div>
            <span className="font-bold text-base tracking-wider text-primary">BARBERBOOK</span>
          </div>
          <NavigationLinks />
          <UserFooter />
        </aside>
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 flex items-center gap-2 border-b border-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            BB
          </div>
          <span className="font-bold text-base tracking-wider text-primary">BARBERBOOK</span>
        </div>
        <NavigationLinks />
        <UserFooter />
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>

    </div>
  );
}