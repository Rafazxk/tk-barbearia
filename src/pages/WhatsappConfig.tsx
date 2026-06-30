import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api"; 
import { toast } from "sonner"; 

interface WhatsappSettings {
  receiveAdminNotifications: boolean;
  sendClientNotifications: boolean;
  welcomeMessageTemplate: string;
}

export default function WhatsappConfig() {
  const queryClient = useQueryClient();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [adminNotif, setAdminNotif] = useState(false);
  const [clientNotif, setClientNotif] = useState(false);

  // 📥 BUSCAR CONFIGURAÇÕES (GET)
  const { data: settings, isLoading } = useQuery<WhatsappSettings>({
    queryKey: ["whatsapp-settings"],
    queryFn: async () => {
      const response = await api.get("/barber/whatsapp-settings");
      return response.data;
    },
  });

  // SINCRONIZAR ESTADO LOCAL
  useEffect(() => {
    if (settings) {
      setWelcomeMessage(settings.welcomeMessageTemplate);
      setAdminNotif(settings.receiveAdminNotifications);
      setClientNotif(settings.sendClientNotifications);
    }
  }, [settings]);

  // 📤 SALVAR CONFIGURAÇÕES (PATCH)
  const mutation = useMutation({
    mutationFn: async (newSettings: WhatsappSettings) => {
      return await api.patch("/barber/whatsapp-settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast.success("Configurações do WhatsApp atualizadas com sucesso!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar as configurações.");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      receiveAdminNotifications: adminNotif,
      sendClientNotifications: clientNotif,
      welcomeMessageTemplate: welcomeMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm font-medium text-muted-foreground animate-pulse">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card border border-border rounded-xl shadow-sm">
      {/* HEADER DA TELA */}
      <div className="border-b border-border pb-4 mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Configurações de Notificações do WhatsApp</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Controle como o sistema envia alertas automáticos de agendamentos.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* SWITCH 1: ADMIN */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/60 rounded-lg transition-colors">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-foreground">Notificar o Barbeiro</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receber uma mensagem no seu WhatsApp sempre que um cliente agendar um horário.
            </p>
          </div>
          <input
            type="checkbox"
            className="w-10 h-5 bg-secondary border border-border rounded-full appearance-none checked:bg-primary cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:top-[2px] before:left-[2px] before:bg-card before:rounded-full before:transition-all checked:before:translate-x-5 shadow-sm"
            checked={adminNotif}
            onChange={(e) => setAdminNotif(e.target.checked)}
          />
        </div>

        {/* SWITCH 2: CLIENTE */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/60 rounded-lg transition-colors">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-foreground">Notificar o Cliente</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enviar uma mensagem de confirmação para o WhatsApp do cliente assim que o agendamento for feito.
            </p>
          </div>
          <input
            type="checkbox"
            className="w-10 h-5 bg-secondary border border-border rounded-full appearance-none checked:bg-primary cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:top-[2px] before:left-[2px] before:bg-card before:rounded-full before:transition-all checked:before:translate-x-5 shadow-sm"
            checked={clientNotif}
            onChange={(e) => setClientNotif(e.target.checked)}
          />
        </div>

        {/* TEMPLATE DA MENSAGEM */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Template da Mensagem do Cliente
          </label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use as tags para preencher os dados automaticamente:{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[11px] border border-border">{"{cliente}"}</code>,{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[11px] border border-border">{"{servico}"}</code>,{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[11px] border border-border">{"{data}"}</code>,{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[11px] border border-border">{"{hora}"}</code>.
          </p>
          <textarea
            rows={4}
            className="w-full p-3 bg-secondary/20 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all placeholder:text-muted-foreground/50"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Olá {cliente}, seu agendamento para {servico} foi confirmado..."
          />
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end pt-2 border-t border-border/40">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 shadow-sm shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}