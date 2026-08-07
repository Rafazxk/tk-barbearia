import { useState, useEffect } from "react";
import { api } from "../lib/api"; 
import { useBarber } from "../contexts/BarberContext";

export function NotificationBanner() {
  const [show, setShow] = useState(false);
  const { user, isAuthenticated } = useBarber(); // Pegando o usuário logado
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  useEffect(() => {
    // Só mostramos o banner se o barbeiro estiver logado e ainda não tiver dado permissão
    if (isAuthenticated && 'Notification' in window && Notification.permission === "default") {
      setShow(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
  if (!isAuthenticated || !user) return;

  const syncSubscription = async () => {
    console.log("=== syncSubscription ===");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("permission:", Notification.permission);



      if (Notification.permission !== "granted") {
    console.log("Sem permissão");
    return;
  }

    const registration = await navigator.serviceWorker.ready;
  console.log("SW:", registration);

    let subscription =
      await registration.pushManager.getSubscription();
console.log("Subscription existente:", subscription);
    if (!subscription) {
      console.log("Criando nova inscrição...");
      const convertedVapidKey = urlBase64ToUint8Array(key);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log("Nova subscription:", subscription);
    }
      

    await api.post("/notifications/subscribe", {
      barberId: user.id,
      subscription,
    });

    console.log("Nova subscription:", subscription);
  };



  syncSubscription().catch(console.error);
}, [isAuthenticated, user]);

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

const handleSubscribe = async () => {
  try {
    console.log("1");
    const registration = await navigator.serviceWorker.ready;
     console.log("2");
    // 2. Converta a string para o formato aceito pelo navegador
    const convertedVapidKey = urlBase64ToUint8Array(key);
  console.log("3");
    const subscription = await registration.pushManager.subscribe({

      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey 
    });
  console.log("4", subscription);
    await api.post("/notifications/subscribe", {
      barberId: user?.id,
      subscription: subscription
    });

  console.log("5");
  } catch (err) {
    console.error("Erro na inscrição:", err);
  }
};

  const requestPermission = async () => {
    console.log("Cliquei no botão");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Aqui é onde você CHAMA a função que faz o trabalho pesado
      await handleSubscribe();
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-amber-500/50 p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-10">
      <div>
        <button onClick={requestPermission}>Ativar notificacoes</button>
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