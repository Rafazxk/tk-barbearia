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
import WhatsappConfig from "./pages/WhatsappConfig";
import ClientBooking from "@/pages/ClientBooking";

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
        
        {/* Rotas administrativas simples */}
        <Route path="/agendamentos" component={Appointments} />
        <Route path="/financeiro" component={Financial} />
        <Route path="/clientes" component={ClientsList} />
        <Route path="/produtos" component={ProductsList} />
        <Route path="/bloqueios" component={ScheduleBlocks} />
        <Route path="/servicos" component={ServicesList} />
        <Route path="/contas" component={BarberAccounts} />
        <Route path="/whatsapp" component={WhatsappConfig} />
  

        <Route path="/configuracoes/barbearia">
          <SettingsLayout abaInicial="barbearia" />
        </Route>

        <Route path="/configuracoes/perfil">
          <SettingsLayout abaInicial="perfil" />
        </Route>

        <Route path="/configuracoes/preferencias">
          <SettingsLayout abaInicial="preferencias" />
        </Route>

        <Route path="/configuracoes/seguranca">
          <SettingsLayout abaInicial="seguranca" />
        </Route>

        <Route path="/configuracoes/politicas">
          <SettingsLayout abaInicial="politicas" />
        </Route>
        
        {/* Rota de fallback caso digitem algo errado no admin */}
        <Route>
          <div className="p-8 text-center text-muted-foreground">Página não encontrada dentro do painel.</div>
        </Route>
      </Switch>
    </AppLayout>
  );
}

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

        <Route path="/agendar" component={ClientBooking} />
        <Route path="/landing" component={Dashboard} />

        {/* Fluxo Condicional Limpo */}
        {isAuthenticated ? (
          <Switch>
            <Route path="/login">
              <Redirect to="/" />
            </Route>
            
            {/* Usar o operador coringa do wouter (path="/*") */}
            <Route path="/*">
              <AdminRouter />
            </Route>
          </Switch>
        ) : (
          <Switch>
            <Route path="/login" component={Login} />
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
        <AppContent />
        <Toaster position="top-right" />
      </BarberProvider>
    </QueryClientProvider>
  );
}

export default App;