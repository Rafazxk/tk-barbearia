import { useState } from "react";
import { FolderPlus, Plus, ChevronDown, ChevronRight, Trash2, Edit2, X, Package } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
}

interface CategoriaProduto {
  id: string;
  nome: string;
  produtos: Produto[];
}

export default function ProductsList() {
  // Mock de dados seguindo o padrão de categorias para o catálogo da landing page
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([
    {
      id: "cat-p1",
      nome: "Finalizadores e Pomadas",
      produtos: [
        { id: "p-1", nome: "Pomada Modeladora Efeito Matte", preco: 45.00, estoque: 12 },
        { id: "p-2", nome: "Gel Cola Extra Forte", preco: 20.00, estoque: 8 },
        { id: "p-3", nome: "Grooming Líquido Alta Fixação", preco: 55.00, estoque: 4 },
      ],
    },
    {
      id: "cat-p2",
      nome: "Cuidados com a Barba",
      produtos: [
        { id: "p-4", nome: "Óleo Hidratante de Alecrim", preco: 39.90, estoque: 15 },
        { id: "p-5", nome: "Shampoo de Barba Refrescante", preco: 35.00, estoque: 0 }, // Exemplo esgotado
      ],
    },
  ]);

  // Estados de controle da tela
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({ "cat-p1": true, "cat-p2": true });
  const [isModalProdutoAberto, setIsModalProdutoAberto] = useState(false);

  // Estados do formulário do modal
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("45.00");
  const [novoEstoque, setNovoEstoque] = useState("10");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  const toggleCategoria = (id: string) => {
    setCategoriasAbertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCriarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !categoriaSelecionada) return;

    setCategorias(prev => prev.map(cat => {
      if (cat.id === categoriaSelecionada) {
        return {
          ...cat,
          produtos: [
            ...cat.produtos,
            {
              id: `p-${Date.now()}`,
              nome: novoNome,
              preco: Number(novoPreco),
              estoque: Number(novoEstoque)
            }
          ]
        };
      }
      return cat;
    }));

    setNovoNome("");
    setIsModalProdutoAberto(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Catálogo de produtos disponível para venda e exibição na Landing Page.</p>
        </div>
        
        {/* Botões de Ação */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Criar Nova Categoria de Produto...")}
            className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
            Nova Categoria
          </button>

          <button 
            onClick={() => setIsModalProdutoAberto(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* LISTA DE CATEGORIAS DE PRODUTOS */}
      <div className="space-y-3">
        {categorias.map((categoria) => {
          const isOpen = !!categoriasAbertas[categoria.id];
          return (
            <div key={categoria.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
              
              {/* Topo da Categoria */}
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
                    <p className="text-xs text-muted-foreground">{categoria.produtos.length} itens cadastrados</p>
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); alert("Excluir categoria..."); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Itens Internos da Categoria */}
              {isOpen && (
                <div className="border-t border-border bg-background/20 divide-y divide-border/60">
                  {categoria.produtos.length > 0 ? (
                    categoria.produtos.map((produto) => (
                      <div key={produto.id} className="p-4 flex items-center justify-between pl-12 hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-zinc-500 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{produto.nome}</p>
                            <p className={`text-xs ${produto.estoque > 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                              {produto.estoque > 0 ? `${produto.estoque} unidades em estoque` : "Esgotado no estoque"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Preço */}
                          <span className="font-bold text-primary">
                            R$ {produto.preco.toFixed(2).replace(".", ",")}
                          </span>
                          
                          {/* Botões de Ação */}
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
                      Nenhum produto cadastrado nesta categoria.
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* MODAL: NOVO PRODUTO */}
      {isModalProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalProdutoAberto(false)} />
          
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 pb-0 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Novo Produto</h3>
              <button onClick={() => setIsModalProdutoAberto(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCriarProduto} className="p-5 space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nome do Produto</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Pomada Efeito Matte" 
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Preço e Estoque */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Preço de Venda (R$)</label>
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
                  <label className="text-xs font-semibold text-foreground">Qtd. Inicial Estoque</label>
                  <input 
                    type="number" 
                    required
                    value={novoEstoque}
                    onChange={(e) => setNovoEstoque(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Categoria Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Categoria do Produto</label>
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

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalProdutoAberto(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-transparent border border-border hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-all cursor-pointer shadow-md"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}