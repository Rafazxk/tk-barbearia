import { useState } from "react";
import { DollarSign, Calendar, Download, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Dados mockados para o gráfico de evolução do lucro do mês
const dadosGraficoLucro = [
  { dia: "01/06", lucro: 420 },
  { dia: "05/06", lucro: 850 },
  { dia: "10/06", lucro: 1400 },
  { dia: "15/06", lucro: 2100 },
  { dia: "20/06", lucro: 1900 },
  { dia: "25/06", lucro: 2800 },
  { dia: "30/06", lucro: 3450 },
];

export default function Financial() {
  // Estados para controlar o filtro de período (X até Y)
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Função fictícia para disparar a geração do Excel no Backend futuramente
  const handleExportExcel = () => {
    console.log(`Solicitando exportação de relatório no período: ${dataInicio || "Início"} até ${dataFim || "Fim"}`);
    alert("Relatório Excel gerado com sucesso! (Simulação)");
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle o faturamento, lucros e gere relatórios de desempenho.</p>
        </div>
        
        {/* Botão Exportar Excel */}
        <button 
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm transition-all hover:bg-zinc-800 cursor-pointer"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          Exportar Excel
        </button>
      </div>

      {/* CARDS DE FATURAMENTO (Hoje, Mês, Ano) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Faturamento Hoje */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ganhos Hoje</span>
            <h3 className="text-2xl font-bold text-foreground">R$ 380,00</h3>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +12% que ontem
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Faturamento Mês */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento do Mês</span>
            <h3 className="text-2xl font-bold text-primary">R$ 8.450,00</h3>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +8% que o mês passado
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Faturamento Ano */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento Anual</span>
            <h3 className="text-2xl font-bold text-foreground">R$ 98.200,00</h3>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              Dentro da meta projetada
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-muted-foreground">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* FILTRO DE PERÍODO PERSONALIZADO */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
        <div className="w-full sm:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">De (Data Início)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Até (Data Fim)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => console.log("Filtrando período...")}
          className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-lg text-sm transition-all hover:opacity-90 shadow-md cursor-pointer h-[38px]"
        >
          Filtrar Período
        </button>
      </div>

      {/* ÁREA DO GRÁFICO */}
      <div className="bg-card border border-border p-5 rounded-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Evolução do Lucro</h3>
          <p className="text-xs text-muted-foreground">Visão detalhada do crescimento financeiro ao longo do mês ativo.</p>
        </div>

        {/* Gráfico Linear/Área Fluido */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosGraficoLucro} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradiente dourado suave para preencher abaixo da linha */}
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--color-foreground)", fontWeight: "bold" }}
                itemStyle={{ color: "var(--color-primary)" }}
              />
              <Area 
                type="monotone" 
                dataKey="lucro" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLucro)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}