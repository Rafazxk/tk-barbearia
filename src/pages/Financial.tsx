import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Download, TrendingUp, X } from "lucide-react";
import { api } from "@/lib/api";
import { format, startOfMonth } from "date-fns";

export default function Financial() {
  const [dataInicio, setDataInicio] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [filtroAplicado, setFiltroAplicado] = useState({ inicio: dataInicio, fim: dataFim });

  // Estados para o Modal de Exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInicio, setExportInicio] = useState(dataInicio);
  const [exportFim, setExportFim] = useState(dataFim);
  const [valorMinimo, setValorMinimo] = useState("");

  // Resumo dos cards superiores
  const { data: resumo, isLoading: resumoLoading } = useQuery({
    queryKey: ["financialSummary"],
    queryFn: async () => (await api.get("/financial/summary", { params: { barberId: "" } })).data
  });

  // Query para buscar os recebimentos baseados no período selecionado
  const { data: recebimentosData, isLoading: recebimentosLoading } = useQuery({
    queryKey: ["financialRecebimentos", filtroAplicado],
    queryFn: async () => (await api.get("/financial/recebimentos", { 
      params: { startDate: filtroAplicado.inicio, endDate: filtroAplicado.fim } 
    })).data
  });

  const handleFiltrar = () => {
    setFiltroAplicado({ inicio: dataInicio, fim: dataFim });
  };

  // Abre o modal e sincroniza as datas atuais da tela como padrão
  const handleOpenExportModal = () => {
    setExportInicio(dataInicio);
    setExportFim(dataFim);
    setValorMinimo("");
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    try {
      const response = await api.get("/financial/export", {
        params: { 
          startDate: exportInicio, 
          endDate: exportFim,
          minValor: valorMinimo || undefined 
        },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio-${exportInicio}-a-${exportFim}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsExportModalOpen(false);
    } catch (error) {
      alert("Erro ao exportar relatório.");
    }
  };

  const formatarMoeda = (valor: number | undefined) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor ?? 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Consulte seus recebimentos.</p>
        </div>
        <button 
          onClick={handleOpenExportModal} 
          className="flex items-center justify-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors"
        >
          <Download className="h-4 w-4 text-emerald-400" /> Exportar XLS
        </button>
      </div>

      {/* CARDS DE FATURAMENTO (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Ganhos Hoje</span>
            <h3 className="text-xl font-bold">{resumoLoading ? "..." : formatarMoeda(resumo?.revenueToday ?? resumo?.faturamentoHoje)}</h3>
          </div>
          <DollarSign className="text-emerald-500 h-6 w-6" />
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Esta Semana</span>
            <h3 className="text-xl font-bold">{resumoLoading ? "..." : formatarMoeda(resumo?.revenueWeek ?? resumo?.faturamentoSemana)}</h3>
          </div>
          <TrendingUp className="text-amber-500 h-6 w-6" />
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Este Mês</span>
            <h3 className="text-xl font-bold text-amber-500">{resumoLoading ? "..." : formatarMoeda(resumo?.faturamentoMes ?? resumo?.revenueMonth)}</h3>
          </div>
          <TrendingUp className="text-amber-500 h-6 w-6" />
        </div>

        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Este Ano</span>
            <h3 className="text-xl font-bold">{resumoLoading ? "..." : formatarMoeda(resumo?.faturamentoAno ?? resumo?.revenueYear)}</h3>
          </div>
          <DollarSign className="text-zinc-500 h-6 w-6" />
        </div>
      </div>

      {/* FILTROS DE PERÍODO */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs text-muted-foreground">Período (Data Início)</label>
            <input 
              type="date" 
              value={dataInicio} 
              onChange={(e) => setDataInicio(e.target.value)} 
              className="w-full bg-background border border-border p-2 rounded-lg text-sm text-foreground" 
            />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs text-muted-foreground">até (Data Fim)</label>
            <input 
              type="date" 
              value={dataFim} 
              onChange={(e) => setDataFim(e.target.value)} 
              className="w-full bg-background border border-border p-2 rounded-lg text-sm text-foreground" 
            />
          </div>
        </div>
        <button 
          onClick={handleFiltrar}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Filtrar
        </button>
      </div>

      <hr className="border-border my-6" />

      {/* TABELA DE RECEBIMENTOS */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recebimentos</h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Serviço</th>
                  <th className="p-4 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {recebimentosLoading ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Carregando recebimentos...</td>
                  </tr>
                ) : recebimentosData?.items?.length > 0 ? (
                  recebimentosData.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-muted-foreground">{item.data}</td>
                      <td className="p-4 font-medium text-foreground">{item.cliente}</td>
                      <td className="p-4 text-muted-foreground">{item.servico}</td>
                      <td className="p-4 text-right font-medium text-foreground">{formatarMoeda(item.valor)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum recebimento encontrado no período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL DO PERÍODO */}
          <div className="bg-muted/20 border-t border-border p-4 flex items-center justify-between font-bold">
            <span className="text-sm uppercase text-muted-foreground">TOTAL DO PERÍODO</span>
            <span className="text-lg text-foreground">
              {formatarMoeda(recebimentosData?.totalPeriodo)}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DE EXPORTAÇÃO */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Exportar Relatório Excel</h3>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Por padrão, o sistema utiliza o período já filtrado na tela. Você também pode definir um valor mínimo opcional.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Data Início</label>
                <input 
                  type="date" 
                  value={exportInicio} 
                  onChange={(e) => setExportInicio(e.target.value)} 
                  className="w-full bg-background border border-border p-2 rounded-lg text-sm text-foreground" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Data Fim</label>
                <input 
                  type="date" 
                  value={exportFim} 
                  onChange={(e) => setExportFim(e.target.value)} 
                  className="w-full bg-background border border-border p-2 rounded-lg text-sm text-foreground" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">A partir de R$ (Opcional)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 50.00"
                  value={valorMinimo} 
                  onChange={(e) => setValorMinimo(e.target.value)} 
                  className="w-full bg-background border border-border p-2 rounded-lg text-sm text-foreground" 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmExport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Baixar Planilha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}