import { useState } from "react";
import { Link, useLocation } from "wouter"; // Usando o wouter que mapeamos nas rotas
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Scissors, 
  Package, 
  CalendarX, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Store, 
  User, 
  Sliders, 
  ShieldCheck, 
  FileText 
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const [configAberto, setConfigAberto] = useState(location.startsWith("/configuracoes"));

  // Links principais do Menu Superior
  const linksPrincipais = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/financeiro", label: "Financeiro", icon: DollarSign },
    { href: "/servicos", label: "Serviços", icon: Scissors },
    { href: "/produtos", label: "Produtos", icon: Package },
    { href: "/bloqueios", label: "Bloquear Horários", icon: CalendarX },
  ];

  // Links do Submenu de Configurações
  const subLinksConfig = [
    { href: "/configuracoes/barbearia", label: "Barbearia", icon: Store },
    { href: "/configuracoes/perfil", label: "Meu Perfil", icon: User },
    { href: "/configuracoes/preferencias", label: "Preferências", icon: Sliders },
    { href: "/configuracoes/seguranca", label: "Segurança", icon: ShieldCheck },
    { href: "/configuracoes/politicas", label: "Políticas & LGPD", icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-card border-r border-border select-none">
      
      {/* TOPO: LOGO DA SUA STARTUP */}
      <div className="space-y-6">
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
            N
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">NovaTech <span className="text-primary text-xs font-semibold">Pro</span></span>
        </div>

        {/* LISTA DE LINKS PRINCIPAIS */}
        <nav className="space-y-1">
          {linksPrincipais.map((link) => {
            const Icone = link.icon;
            const isActive = location === link.href;

            return (
              <Link key={link.href} href={link.href}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-2.5" 
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}>
                  <Icone className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {link.label}
                </span>
              </Link>
            );
          })}

          {/* BOTÃO DO SUBMENU RETRÁTIL (CONFIGURAÇÕES) */}
          <button
            onClick={() => setConfigAberto(!configAberto)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              location.startsWith("/configuracoes")
                ? "text-foreground font-semibold bg-secondary/30"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </div>
            {configAberto ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>

          {/* CONTAINER DO SUBMENU */}
          {configAberto && (
            <div className="pl-4 mt-1 space-y-0.5 border-l border-border/60 ml-5 animate-in slide-in-from-top-2 duration-150">
              {subLinksConfig.map((subLink) => {
                const SubIcone = subLink.icon;
                const isSubActive = location === subLink.href;

                return (
                  <Link key={subLink.href} href={subLink.href}>
                    <span className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      isSubActive
                        ? "text-primary font-bold bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}>
                      <SubIcone className="h-3.5 w-3.5 shrink-0" />
                      {subLink.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* RODAPÉ: USUÁRIO LOGADO */}
      <div className="pt-4 border-t border-border/60 flex items-center gap-3 px-2">
        <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground">
          RS
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">Rafael Silva</p>
          <p className="text-[10px] text-muted-foreground truncate">Administrador</p>
        </div>
      </div>

    </div>
  );
}