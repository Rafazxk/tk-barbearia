import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Calendar, Download, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { format, startOfMonth } from "date-fns";

const MOCK_DATA = [
  { dia: "01/06", lucro: 450 },
  { dia: "05/06", lucro: 600 },
  { dia: "10/06", lucro: 300 },
  { dia: "15/06", lucro: 800 },
  { dia: "20/06", lucro: 550 },
  { dia: "25/06", lucro: 950 },
  { dia: "29/06", lucro: 700 },
];

export default function Financial() {
  const [dataInicio, setDataInicio] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  const { data: resumo, isLoading: resumoLoading } = useQuery({
    queryKey: ["financialSummary"],
    queryFn: async () => (await api.get("/appointments/summary", { params: { barberId: "" } })).data
  });

  const handleExportExcel = async () => {
    try {
      const response = await api.get("/financial/export", {
        params: { startDate: dataInicio, endDate: dataFim },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio-${dataInicio}-a-${dataFim}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Erro ao exportar relatório.");
    }
  };

  const formatarMoeda = (valor: number | undefined) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle o faturamento, lucros e gere relatórios.</p>
        </div>
        <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800">
          <Download className="h-4 w-4 text-emerald-400" /> Exportar Excel
        </button>
      </div>

      {/* CARDS DE FATURAMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Ganhos Hoje</span>
            <h3 className="text-2xl font-bold">{resumoLoading ? "..." : formatarMoeda(Number(resumo?.revenueToday))}</h3>
          </div>
          <DollarSign className="text-emerald-500" />
        </div>
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Faturamento Mês</span>
            <h3 className="text-2xl font-bold text-amber-500">{resumoLoading ? "..." : formatarMoeda(resumo?.faturamentoMes)}</h3>
          </div>
          <TrendingUp className="text-amber-500" />
        </div>
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Faturamento Ano</span>
            <h3 className="text-2xl font-bold">{resumoLoading ? "..." : formatarMoeda(resumo?.faturamentoAno)}</h3>
          </div>
          <DollarSign className="text-zinc-500" />
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-background border p-2 rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-background border p-2 rounded-lg" />
          </div>
        </div>
        <button className="bg-amber-500 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm">Filtrar</button>
      </div>

      {/* GRÁFICO MOCKADO */}
      <div className="bg-card border border-border p-5 rounded-xl">
        <h3 className="font-bold mb-4">Evolução do Lucro</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dia" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
              <Area type="monotone" dataKey="lucro" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}