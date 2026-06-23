import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BarberProvider, useBarber } from "@/contexts/BarberContext"; 
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Financial from "@/pages/Financial";
import BarberAccounts from "@/pages/BarberAccounts";

import ClientsList from "@/pages/ClientsList";
import ServicesList from "@/pages/ServicesList";
import ProductsList from "@/pages/ProductsList";
import ScheduleBlocks from "@/pages/ScheduleBlocks";
import SettingsLayout from "@/pages/SettingsLayout";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
});

function AdminRouter() {
  return (
    <AppLayout>
      <Switch>
        {/* O Dashboard responde na raiz do Admin */}
        <Route path="/" component={Dashboard} />
        
        {/* Rotas administrativas */}
        <Route path="/agendamentos" component={Appointments} />
        <Route path="/financeiro" component={Financial} />
        <Route path="/clientes" component={ClientsList} />
        <Route path="/produtos" component={ProductsList} />
        <Route path="/bloqueios" component={ScheduleBlocks} />
        <Route path="/servicos" component={ServicesList} />
        <Route path="/contas" component={BarberAccounts} />

        <Route path="/configuracoes/barbearia">
          {() => <SettingsLayout abaInicial="barbearia" />}
        </Route>

        <Route path="/configuracoes/perfil">
          {() => <SettingsLayout abaInicial="perfil" />}
        </Route>

        <Route path="/configuracoes/preferencias">
          {() => <SettingsLayout abaInicial="preferencias" />}
        </Route>

        <Route path="/configuracoes/seguranca">
          {() => <SettingsLayout abaInicial="seguranca" />}
        </Route>

        <Route path="/configuracoes/politicas">
          {() => <SettingsLayout abaInicial="politicas" />}
        </Route>
      </Switch>
    </AppLayout>
  );
}

// 📦 Sub-componente criado para podermos usar o hook useBarber() dentro do escopo do BarberProvider
function AppContent() {
  const { isAuthenticated, loading, user } = useBarber(); 
  const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
console.log("Roteador ->", { isAuthenticated, loading, user });
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-medium">
        Carregando TK Barbearia...
      </div>
    );
  }

  return (
    <WouterRouter base={base}>
      <Switch>
        {/* Rotas abertas independentes de login */}
        <Route path="/agendar" component={Dashboard} />
        <Route path="/landing" component={Dashboard} />

        {/* Fluxo Condicional Limpo */}
        {isAuthenticated ? (
          <Switch>
            {/* Se tentar forçar a barra indo no /login já logado, joga para a raiz */}
            <Route path="/login">
              <Redirect to="/" />
            </Route>
            
            {/* Captura a raiz e todas as sub-rotas administrativas (/agendamentos, /clientes, etc.) */}
            <Route path="/">
              <AdminRouter />
            </Route>
            <Route path="/:nested*">
              <AdminRouter />
            </Route>
          </Switch>
        ) : (
          <Switch>
            {/* Usuário desautenticado só tem permissão de ver o Login */}
            <Route path="/login" component={Login} />
            
            {/* Qualquer tentativa de acessar outra rota sem autenticação cai aqui */}
            <Route>
              <Redirect to="/login" />
            </Route>
          </Switch>
        )}
      </Switch>
    </WouterRouter>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BarberProvider>
        <AppContent /> {/* 👈 Renderiza o roteador inteligente protegido */}
        <Toaster position="top-right" />
      </BarberProvider>
    </QueryClientProvider>
  );
}

export default App;