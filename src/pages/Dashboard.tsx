import React, { useState } from "react"; // 👈 Adicionado o import do React
import { useBarber } from "@/contexts/BarberContext"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, DollarSign, Scissors, TrendingUp, Trash2, Edit, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger, Calendar } from "@/components/ui/popover";
import { toast } from "sonner";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { api } from "@/lib/api"; 

export interface Appointment {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  dataHora: string;
  totalPreco?: string;
  totalDuracao?: number;
  barbeiro?: { id: number; nome: string };
  servicos?: Array<{ id: number; nome: string }>;
}

export interface DashboardSummary {
  appointmentsToday: number;
  pendingCount: number;
  revenueToday: string;
  appointmentsThisWeek: number;
  topService: string;
}

function buildWhatsAppLink(appt: Appointment): string {
  const phone = appt.clienteTelefone.replace(/\D/g, "");
  const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
  const dateStr = format(new Date(appt.dataHora), "dd/MM/yyyy 'às' HH:mm");
  const servNames = appt.servicos?.map((s) => s.nome).join(", ") ?? "Serviço";
  const msg = encodeURIComponent(
    `Olá ${appt.clienteNome}! ✂️\n\nLembrando do seu agendamento na *TK Barbearia*:\n\n📅 Data: ${dateStr}\n💈 Barbeiro: ${appt.barbeiro?.nome ?? ""}\n✨ Serviços: ${servNames}\n💰 Total: R$ ${appt.totalPreco ?? "—"}\n\nAté logo!`
  );
  return `https://wa.me/${fullPhone}?text=${msg}`;
}

function StatCard({ title, value, sub, icon: Icon, loading }: {
  title: string; value: string; sub?: string; icon: React.ElementType; loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{title}</p>
            {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold mt-1 text-zinc-100">{value}</p>}
            {sub && !loading && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useBarber(); 
  const activeBarberId = user?.id || null;
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");

  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboardSummary", activeBarberId],
    queryFn: async () => {
      const response = await api.get(`/appointments/summary?barberId=${activeBarberId}`);
      return response.data;
    },
    enabled: !!activeBarberId,
  });

const { data: appointments, isLoading: apptLoading } = useQuery<Appointment[]>({
  queryKey: ["appointments", dateStr, activeBarberId],
  queryFn: async () => {
    const response = await api.get("/appointments", {
      params: { 
        date: dateStr, 
        barberId: activeBarberId 
      } // ✅ Passagem limpa via params
    });
    return response.data;
  },
  enabled: !!activeBarberId,
});

  const deleteAppt = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      toast.success("Agendamento excluído");
    },
    onError: () => toast.error("Erro ao excluir agendamento"),
  });

  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Painel</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {isToday ? "Hoje, " : ""}{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Agendamentos Hoje" value={String(summary?.appointmentsToday ?? 0)} sub={`${summary?.pendingCount ?? 0} pendentes`} icon={Scissors} loading={summaryLoading} />
        <StatCard title="Faturamento Hoje" value={`R$ ${summary?.revenueToday ?? "0.00"}`} icon={DollarSign} loading={summaryLoading} />
        <StatCard title="Semana Atual" value={String(summary?.appointmentsThisWeek ?? 0)} sub="agendamentos" icon={TrendingUp} loading={summaryLoading} />
        <StatCard title="Serv. mais Pedido" value={summary?.topService ?? "—"} icon={Clock} loading={summaryLoading} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-200">Agendamentos do Dia</h2>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }} locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        {apptLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !appointments?.length ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center">
              <CalendarIcon className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-zinc-400 text-sm">Nenhum agendamento para esta data</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                Criar Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <Card key={appt.id} className="hover:border-amber-500/20 transition-colors">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500 font-bold text-sm">
                      {appt.clienteNome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-zinc-200">{appt.clienteNome}</p>
                        <span className="text-xs text-zinc-400">{format(new Date(appt.dataHora), "HH:mm")}</span>
                        {appt.barbeiro && <span className="text-xs text-zinc-500 hidden sm:inline">· {appt.barbeiro.nome}</span>}
                      </div>
                      {appt.servicos && appt.servicos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {appt.servicos.map((s) => (
                            <Badge key={s.id} className="text-xs py-0 h-4">{s.nome}</Badge>
                          ))}
                        </div>
                      )}
                      {appt.clienteTelefone && (
                        <a
                          href={buildWhatsAppLink(appt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-500 hover:text-green-400 mt-1 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {appt.clienteTelefone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {appt.totalPreco && (
                      <span className="text-sm font-semibold text-amber-500 mr-1">R$ {appt.totalPreco}</span>
                    )}
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                      onClick={() => { setEditingAppt(appt); setDialogOpen(true); }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400"
                      onClick={() => deleteAppt.mutate({ id: appt.id })}
                      disabled={deleteAppt.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingAppt(null); }}
        appointment={editingAppt}
      />
    </div>
  );
}