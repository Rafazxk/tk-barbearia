import { useState, useEffect } from "react";
import { api } from "../lib/api"; 
import { useBarber } from "../contexts/BarberContext";

export function NotificationBanner() {
  const [show, setShow] = useState(false);
  const { user, isAuthenticated } = useBarber(); 
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  // Verifica se deve exibir o banner de permissão
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === "default") {
      setShow(true);
    }
  }, [isAuthenticated]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Função centralizada e única para assinar e enviar ao backend
  const registerAndSubscribe = async () => {
    try {
      if (!user?.id) return;

      console.log("Aguardando Service Worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("SW pronto:", registration);

      const convertedVapidKey = urlBase64ToUint8Array(key);

      // Tenta recuperar inscrição existente ou cria uma nova
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log("Criando nova subscription...");
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      console.log("Enviando subscription para o backend...", subscription);
      await api.post("/notifications/subscribe", {
        barberId: user.id,
        subscription,
      });

      console.log("✅ Inscrito com sucesso no backend!");
    } catch (err) {
      console.error("❌ Erro no processo de inscrição:", err);
    }
  };

  // Sincroniza automaticamente se o usuário já tiver dado permissão antes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (Notification.permission === "granted") {
      registerAndSubscribe();
    }
  }, [isAuthenticated, user]);

  // Disparado pelo clique do usuário no banner
  const requestPermission = async () => {
    console.log("Solicitando permissão ao usuário...");
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await registerAndSubscribe();
    } else {
      console.log("Permissão negada pelo usuário.");
    }
    
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-amber-500/50 p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-10">
      <div>
        <p className="text-sm font-bold text-white">Ativar Notificações</p>
        <p className="text-xs text-zinc-400">Receba alertas de novos agendamentos.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShow(false)} className="text-xs text-zinc-500 px-2">Agora não</button>
        <button onClick={requestPermission} className="bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg">
          Ativar
        </button>
      </div>
    </div>
  );
}