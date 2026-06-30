import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api } from "@/lib/api";
import { Tag, Plus, ChevronDown, ChevronRight, Trash2, Edit2, X, GripVertical } from "lucide-react";

interface Servico {
  id: string | number;
  nome: string;
  duracao: number;
  preco: number;
}

interface Categoria {
  id: string | number;
  nome: string;
  servicos: Servico[];
}

export default function ServicesList() {
  const queryClient = useQueryClient();
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});
  const [isModalServicoAberto, setIsModalServicoAberto] = useState(false);
  
  // Estado local para manter a ordenação fluida na tela enquanto o servidor salva
  const [items, setItems] = useState<Categoria[]>([]);

  // Estados dos formulários de Criação/Edição
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null);
  const [editandoServicoId, setEditandoServicoId] = useState<string | null>(null);
  
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("35.00");
  const [novaDuracao, setNovaDuracao] = useState("30");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  // 📥 Buscar dados reais do backend
  const { data: serverData = [], isLoading } = useQuery<Categoria[]>({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await api.get("/categories/enriched");
      return res.data;
    }
  });

  // Sincroniza dados do servidor com o estado do Drag and Drop
  useEffect(() => {
    if (serverData) setItems(serverData);
  }, [serverData]);

  // 🔄 Mutation para salvar a reordenação no backend
  const updateOrderMutation = useMutation({
    mutationFn: async (payload: { type: "categories" | "services"; orderedIds: string[] }) => {
      return api.post("/categories/reorder", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories-list"] })
  });

  // ✂️ MUTATIONS DE CATEGORIAS
  const createCategoryMutation = useMutation({
    mutationFn: async (nome: string) => api.post("/categories", { nome }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories-list"] })
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => api.put(`/categories/${id}`, { nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setEditandoCategoriaId(null);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories-list"] })
  });

  // 💈 MUTATIONS DE SERVIÇOS
  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => api.post("/categories/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      fecharModalServico();
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.put(`/categories/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      fecharModalServico();
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories-list"] })
  });

  // Controladores de drag-and-drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newItems = Array.from(items);

    if (type === "CATEGORIES") {
      const [movedCategory] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedCategory);
      setItems(newItems);
      
      updateOrderMutation.mutate({
        type: "categories",
        orderedIds: newItems.map(c => c.id.toString())
      });
      return;
    }

    const sourceCategoryIndex = newItems.findIndex(c => c.id.toString() === source.droppableId);
    if (sourceCategoryIndex === -1) return;

    const category = newItems[sourceCategoryIndex];
    const newServices = Array.from(category.servicos);
    const [movedService] = newServices.splice(source.index, 1);
    newServices.splice(destination.index, 0, movedService);

    newItems[sourceCategoryIndex] = { ...category, servicos: newServices };
    setItems(newItems);

    updateOrderMutation.mutate({
      type: "services",
      orderedIds: newServices.map(s => s.id.toString())
    });
  };

  const toggleCategoria = (id: string) => {
    setCategoriasAbertas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCriarCategory = () => {
    const nome = prompt("Digite o nome da nova categoria:");
    if (nome?.trim()) createCategoryMutation.mutate(nome.trim());
  };

  const handleEditarCategory = (id: string, nomeAtual: string) => {
    const novoNomePrompt = prompt("Editar nome da categoria:", nomeAtual);
    if (novoNomePrompt?.trim() && novoNomePrompt !== nomeAtual) {
      updateCategoryMutation.mutate({ id, nome: novoNomePrompt.trim() });
    }
  };

  const handleAbrirEditarServico = (servico: Servico, categoriaId: string) => {
    setEditandoServicoId(servico.id.toString());
    setNovoNome(servico.nome);
    setNovoPreco(servico.preco.toString());
    setNovaDuracao(servico.duracao.toString());
    setCategoriaSelecionada(categoriaId);
    setIsModalServicoAberto(true);
  };

  const fecharModalServico = () => {
    setIsModalServicoAberto(false);
    setEditandoServicoId(null);
    setNovoNome("");
    setNovoPreco("35.00");
    setNovaDuracao("30");
    setCategoriaSelecionada("");
  };

  const handleSalvarServico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !categoriaSelecionada) return;

    const payload = {
      nome: novoNome,
      preco: novoPreco,
      duracao: novaDuracao,
      categoriaId: categoriaSelecionada
    };

    if (editandoServicoId) {
      updateServiceMutation.mutate({ id: editandoServicoId, data: payload });
    } else {
      createServiceMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando catálogo...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Serviços</h1>
          <p className="text-sm text-muted-foreground">Arraste os blocos e itens para reordenar o que o cliente vê</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCriarCategory} className="flex items-center gap-2 bg-secondary border border-border text-foreground font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors cursor-pointer"><Tag className="h-4 w-4" /> Nova Categoria</button>
          <button onClick={() => setIsModalServicoAberto(true)} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 shadow-lg cursor-pointer"><Plus className="h-4 w-4" /> Novo Serviço</button>
        </div>
      </div>

      {/* ÁREA DRAG AND DROP */}
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
                      <div 
                        ref={providedCategory.innerRef} 
                        {...providedCategory.draggableProps}
                        style={providedCategory.draggableProps.style as React.CSSProperties} // 👈 Adicione este typecast aqui
                        className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                      >
                        {/* Header da Categoria */}
                        <div className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors select-none">
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleCategoria(catIdStr)}>
                            <div {...providedCategory.dragHandleProps} className="text-muted-foreground/50 p-1 hover:text-foreground transition-colors cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <div className="text-muted-foreground">
                              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-base">{categoria.nome}</h3>
                              <p className="text-xs text-muted-foreground">{categoria.servicos?.length || 0} serviços</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditarCategory(catIdStr, categoria.nome)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => { if(confirm("Excluir esta categoria inteira?")) deleteCategoryMutation.mutate(catIdStr); }} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>

                        {/* Listagem de Serviços (Filho do Drag) */}
                        {isOpen && (
                          <Droppable droppableId={catIdStr} type="SERVICES">
                            {(providedService) => (
                              <div 
                                {...providedService.droppableProps} 
                                ref={providedService.innerRef} 
                                className="border-t border-border bg-background/20 divide-y divide-border/60 min-h-[10px]"
                              >
                                {categoria.servicos && categoria.servicos.length > 0 ? (
                                  categoria.servicos.map((servico, serviceIndex) => {
                                    const servIdStr = servico.id.toString();
                                    return (
                                      <Draggable key={servIdStr} draggableId={servIdStr} index={serviceIndex}>
                                        {(providedServItem) => (
                                          <div 
                                            ref={providedServItem.innerRef} 
                                            {...providedServItem.draggableProps} 
                                            style={providedServItem.draggableProps.style as React.CSSProperties} 
                                            className="p-4 flex items-center justify-between pl-6 hover:bg-secondary/10 bg-card/40"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div {...providedServItem.dragHandleProps} className="text-muted-foreground/30 hover:text-foreground/70 p-1 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="h-4 w-4" />
                                              </div>
                                              <div>
                                                <p className="font-medium text-foreground">{servico.nome}</p>
                                                <p className="text-xs text-muted-foreground">{servico.duracao} min</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="font-bold text-primary">R$ {Number(servico.preco).toFixed(2).replace(".", ",")}</span>
                                              <div className="flex items-center gap-1">
                                                <button onClick={() => handleAbrirEditarServico(servico, catIdStr)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => { if(confirm("Excluir este serviço?")) deleteServiceMutation.mutate(servIdStr); }} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })
                                ) : (
                                  <div className="p-6 text-center text-xs text-muted-foreground">Nenhum serviço cadastrado nesta categoria.</div>
                                )}
                                {providedService.placeholder}
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

      {/* MODAL: NOVO / EDITAR SERVIÇO */}
      {isModalServicoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={fecharModalServico} />
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl relative z-10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{editandoServicoId ? "Editar Serviço" : "Novo Serviço"}</h3>
              <button onClick={fecharModalServico} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleSalvarServico} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Nome</label>
                <input type="text" required placeholder="Ex: Corte Degradê" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Preço (R$)</label>
                  <input type="number" step="0.01" required value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Duração (min)</label>
                  <input type="number" required value={novaDuracao} onChange={(e) => setNovaDuracao(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" />
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
                <button type="button" onClick={fecharModalServico} className="px-4 py-2 text-sm border border-border hover:bg-secondary rounded-lg text-foreground cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-md cursor-pointer">{editandoServicoId ? "Atualizar" : "Criar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}