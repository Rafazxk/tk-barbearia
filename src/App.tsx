import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BarberProvider } from "@/contexts/BarberContext";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
});

function AdminRouter() {
  return (
    <AppLayout>
      <Switch>
        {/* Deixamos apenas o Dashboard ativo por enquanto */}
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

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Define a base como string vazia caso import.meta.env.BASE_URL venha indefinido
  const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

  return (
    <QueryClientProvider client={queryClient}>
      <BarberProvider>
        <WouterRouter base={base}>
          <Switch>
            <Route path="/agendar" component={Dashboard} />
            <Route path="/landing" component={Dashboard} />
            <Route>
              <AdminRouter />
            </Route>
          </Switch>
        </WouterRouter>
      </BarberProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;