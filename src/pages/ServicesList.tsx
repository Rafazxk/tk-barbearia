import { useState } from "react";
import { Tag, Plus, ChevronDown, ChevronRight, Trash2, Edit2, X, GripVertical } from "lucide-react";

interface Servico {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
}

interface Categoria {
  id: string;
  nome: string;
  servicos: Servico[];
}

export default function ServicesList() {
  // Mock de dados baseado na "Captura de tela 2026-06-19 010829d.png"
  const [categorias, setCategorias] = useState<Categoria[]>([
    {
      id: "cat-1",
      nome: "Cortes",
      servicos: [
        { id: "s-1", nome: "Corte Simples", duracao: 30, preco: 35.00 },
        { id: "s-2", nome: "corte louco", duracao: 30, preco: 10.00 },
        { id: "s-3", nome: "Corte Degradê", duracao: 45, preco: 45.00 },
      ],
    },
    {
      id: "cat-2",
      nome: "Combos",
      servicos: [],
    },
  ]);

  // Estados de controle da tela
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({ "cat-1": true });
  const [isModalServicoAberto, setIsModalServicoAberto] = useState(false);

  // Estados do formulário do modal
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("35.00");
  const [novaDuracao, setNovaDuracao] = useState("30");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  // Alternar abertura do Accordion
  const toggleCategoria = (id: string) => {
    setCategoriasAbertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Simulação de salvar o novo serviço na categoria certa
  const handleCriarServico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !categoriaSelecionada) return;

    setCategorias(prev => prev.map(cat => {
      if (cat.id === categoriaSelecionada) {
        return {
          ...cat,
          servicos: [
            ...cat.servicos,
            {
              id: `s-${Date.now()}`,
              nome: novoNome,
              duracao: Number(novaDuracao),
              preco: Number(novoPreco)
            }
          ]
        };
      }
      return cat;
    }));

    // Resetar campos e fechar
    setNovoNome("");
    setIsModalServicoAberto(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* CABEÇALHO DA TELA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Serviços</h1>
          <p className="text-sm text-muted-foreground">Gerencie serviços agrupados por categoria</p>
        </div>
        
        {/* Botões Superiores */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Criar Nova Categoria (Simulação)")}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Tag className="h-4 w-4 text-muted-foreground" />
            Nova Categoria
          </button>

          <button 
            onClick={() => setIsModalServicoAberto(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Serviço
          </button>
        </div>
      </div>

      {/* LISTA DE CATEGORIAS (ACCORDIONS) */}
      <div className="space-y-3">
        {categorias.map((categoria) => {
          const isOpen = !!categoriasAbertas[categoria.id];
          return (
            <div key={categoria.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
              
              {/* Barra da Categoria */}
              <div 
                onClick={() => toggleCategoria(categoria.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 select-none transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{categoria.nome}</h3>
                    <p className="text-xs text-muted-foreground">{categoria.servicos.length} serviços</p>
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); alert("Excluir categoria..."); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Lista Interna de Serviços da Categoria */}
              {isOpen && (
                <div className="border-t border-border bg-background/20 divide-y divide-border/60">
                  {categoria.servicos.length > 0 ? (
                    categoria.servicos.map((servico) => (
                      <div key={servico.id} className="p-4 flex items-center justify-between pl-12 hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          {/* Ícone de Arrastar sutil da imagem */}
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                          <div>
                            <p className="font-medium text-foreground">{servico.nome}</p>
                            <p className="text-xs text-muted-foreground">{servico.duracao} min</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Preço em Dourado */}
                          <span className="font-bold text-primary">
                            R$ {servico.preco.toFixed(2).replace(".", ",")}
                          </span>
                          
                          {/* Ações */}
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground pl-4">
                      Nenhum serviço cadastrado nesta categoria.
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* MODAL: NOVO SERVIÇO (Captura de tela 2026-06-19 010829d.png) */}
      {isModalServicoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Escuro */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalServicoAberto(false)} />
          
          {/* Caixa do Modal */}
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 pb-0 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Novo Serviço</h3>
              <button 
                onClick={() => setIsModalServicoAberto(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCriarServico} className="p-5 space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nome</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Corte Degradê" 
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Preço e Duração na mesma linha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Duração (min)</label>
                  <input 
                    type="number" 
                    required
                    value={novaDuracao}
                    onChange={(e) => setNovaDuracao(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Categoria Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Categoria</label>
                <select 
                  required
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              {/* Ações Inferiores */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalServicoAberto(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-transparent border border-border hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}