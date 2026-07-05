import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api } from "@/lib/api";
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, X, GripVertical, Layers } from "lucide-react";

interface Produto {
  id: string | number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
}

interface CategoriaProduto {
  id: string | number;
  nome: string;
  produtos: Produto[];
}

export default function ProductsList() {
  const queryClient = useQueryClient();
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [items, setItems] = useState<CategoriaProduto[]>([]);

  // Estados dos formulários
  const [editandoProdutoId, setEditandoProdutoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("45.00");
  const [estoque, setEstoque] = useState("10");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  const { data: serverData = [], isLoading } = useQuery<CategoriaProduto[]>({
    queryKey: ["products-list"],
    queryFn: async () => {
      const res = await api.get("/products/");
      return res.data;
    }
  });

  useEffect(() => {
    if (serverData && JSON.stringify(serverData) !== JSON.stringify(items)) {
      setItems(serverData);
    }
  }, [serverData]);

  const updateOrderMutation = useMutation({
    mutationFn: async (payload: { type: "categories" | "products"; orderedIds: string[] }) => {
      return api.post("/products/reorder", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products-list"] })
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (nome: string) => api.post("/products", { nome }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products-list"] })
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => api.put(`/products/${id}`, { nome }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products-list"] })
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products-list"] })
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => api.post("/products/items/", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products-list"] }); fecharModal(); }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.put(`/products/items/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products-list"] }); fecharModal(); }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products-list"] })
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newItems = Array.from(items);

    if (type === "CATEGORIES") {
      const [moved] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, moved);
      setItems(newItems);
      updateOrderMutation.mutate({ type: "categories", orderedIds: newItems.map(c => c.id.toString()) });
      return;
    }

    const catIndex = newItems.findIndex(c => c.id.toString() === source.droppableId);
    if (catIndex === -1) return;

    const category = newItems[catIndex];
    const newProducts = Array.from(category.produtos);
    const [movedProduct] = newProducts.splice(source.index, 1);
    newProducts.splice(destination.index, 0, movedProduct);

    newItems[catIndex] = { ...category, produtos: newProducts };
    setItems(newItems);
    updateOrderMutation.mutate({ type: "products", orderedIds: newProducts.map(p => p.id.toString()) });
  };

  const handleCriarCategoria = () => {
    const n = prompt("Nome da nova categoria de produtos:");
    if (n?.trim()) createCategoryMutation.mutate(n.trim());
  };

  const handleEditarCategoria = (id: string, nomeAtual: string) => {
    const n = prompt("Editar nome da categoria:", nomeAtual);
    if (n?.trim() && n !== nomeAtual) updateCategoryMutation.mutate({ id, nome: n.trim() });
  };

  // NOVA FUNÇÃO: Abre o modal injetando opcionalmente o ID da categoria
  const handleAbrirNovoProduto = (catId?: string) => {
    setCategoriaSelecionada(catId || "");
    setIsModalAberto(true);
  };

  const handleAbrirEditarProduto = (prod: Produto, catId: string) => {
    setEditandoProdutoId(prod.id.toString());
    setNome(prod.nome);
    setDescricao(prod.descricao || "");
    setPreco(prod.preco.toString());
    setEstoque(prod.estoque.toString());
    setCategoriaSelecionada(catId);
    setIsModalAberto(true);
  };

  const fecharModal = () => {
    setIsModalAberto(false);
    setEditandoProdutoId(null);
    setNome("");
    setDescricao("");
    setPreco("45.00");
    setEstoque("10");
    setCategoriaSelecionada("");
  };

  const handleSalvarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoriaSelecionada) return;

    const payload = { nome, descricao, preco, estoque, categoriaId: categoriaSelecionada };
    if (editandoProdutoId) {
      updateProductMutation.mutate({ id: editandoProdutoId, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando catálogo de produtos...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie a venda de pomadas, óleos e shampoos por categoria</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCriarCategoria} className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"><Layers className="h-4 w-4" /> Nova Categoria</button>
          <button onClick={() => handleAbrirNovoProduto()} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg cursor-pointer"><Plus className="h-4 w-4" /> Novo Produto</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-categories" type="CATEGORIES">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {items.map((categoria, catIndex) => {
                const catIdStr = categoria.id.toString();
                const isOpen = !!categoriasAbertas[catIdStr];
                
                return (
                  <Draggable key={catIdStr} draggableId={catIdStr} index={catIndex}>
                    {(providedCategory) => (
                      <div ref={providedCategory.innerRef} {...providedCategory.draggableProps} style={providedCategory.draggableProps.style as React.CSSProperties} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors select-none">
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setCategoriasAbertas(p => ({ ...p, [catIdStr]: !p[catIdStr] }))}>
                            <div {...providedCategory.dragHandleProps} className="text-muted-foreground/50 p-1 hover:text-foreground cursor-grab active:cursor-grabbing"><GripVertical className="h-5 w-5" /></div>
                            <div className="text-muted-foreground">{isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</div>
                            <div>
                              <h3 className="font-bold text-foreground text-base">{categoria.nome}</h3>
                              <p className="text-xs text-muted-foreground">{categoria.produtos?.length || 0} itens</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* NOVO BOTÃO: Adiciona produto diretamente nesta categoria */}
                            <button onClick={() => handleAbrirNovoProduto(catIdStr)} title="Adicionar produto nesta categoria" className="p-2 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"><Plus className="h-4 w-4" /></button>
                            <button onClick={() => handleEditarCategoria(catIdStr, categoria.nome)} className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => { if(confirm("Excluir categoria e todos os produtos dela?")) deleteCategoryMutation.mutate(catIdStr); }} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>

                        {isOpen && (
                          <Droppable droppableId={catIdStr} type="PRODUCTS">
                            {(providedProd) => (
                              <div {...providedProd.droppableProps} ref={providedProd.innerRef} className="border-t border-border bg-background/20 divide-y divide-border/60 min-h-[10px]">
                                {categoria.produtos && categoria.produtos.length > 0 ? (
                                  categoria.produtos.map((prod, pIndex) => {
                                    const prodIdStr = prod.id.toString();
                                    return (
                                      <Draggable key={prodIdStr} draggableId={prodIdStr} index={pIndex}>
                                        {(providedProdItem) => (
                                          <div ref={providedProdItem.innerRef} {...providedProdItem.draggableProps} style={providedProdItem.draggableProps.style as React.CSSProperties} className="p-4 flex items-center justify-between pl-6 hover:bg-secondary/10 bg-card/40">
                                            <div className="flex items-center gap-3">
                                              <div {...providedProdItem.dragHandleProps} className="text-muted-foreground/30 hover:text-foreground/70 p-1 cursor-grab active:cursor-grabbing"><GripVertical className="h-4 w-4" /></div>
                                              <div>
                                                <p className="font-medium text-foreground">{prod.nome}</p>
                                                {prod.descricao && <p className="text-xs text-muted-foreground max-w-md line-clamp-1">{prod.descricao}</p>}
                                                <p className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground inline-block mt-1">Estoque: {prod.estoque} un</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="font-bold text-primary">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                                              <div className="flex items-center gap-1">
                                                <button onClick={() => handleAbrirEditarProduto(prod, catIdStr)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => { if(confirm("Excluir este produto?")) deleteProductMutation.mutate(prodIdStr); }} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })
                                ) : (
                                  <div className="p-6 text-center text-xs text-muted-foreground">Nenhum produto cadastrado aqui.</div>
                                )}
                                {providedProd.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* MODAL PRODUTO */}
      {isModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={fecharModal} />
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl relative z-10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{editandoProdutoId ? "Editar Produto" : "Novo Produto"}</h3>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSalvarProduto} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Nome</label>
                <input type="text" required placeholder="Ex: Pomada Efeito Matte" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Descrição (Opcional)</label>
                <textarea placeholder="Breve resumo sobre o produto..." value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground resize-none h-16" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Preço (R$)</label>
                  <input type="number" step="0.01" required value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Estoque Inicial</label>
                  <input type="number" required value={estoque} onChange={(e) => setEstoque(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Categoria</label>
                <select required value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground cursor-pointer">
                  <option value="">Selecione...</option>
                  {items.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={fecharModal} className="px-4 py-2 text-sm border border-border hover:bg-secondary rounded-lg text-foreground cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-md cursor-pointer">{editandoProdutoId ? "Atualizar" : "Criar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}