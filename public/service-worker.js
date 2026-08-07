// public/service-worker.js

self.addEventListener("install", (event) => {
  if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500]);
  }
  // Força o service worker a assumir o controle imediatamente
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("🔥 PUSH RECEBIDO NO PWA");

  let data = {
    title: "Nova Notificação",
    body: "Você recebeu um novo agendamento."
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || data.body;
    }
  } catch (e) {
    console.error("Erro ao converter payload para JSON:", e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: undefined, // Mantém sem ícone para evitar bloqueio por 404
    badge: undefined,
    vibrate: [300, 100, 300],
    requireInteraction: true // Mantém a notificação visível até o usuário interagir (ótimo para testes)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log("✅ Notificação exibida com sucesso pelo SW!");
      })
      .catch((err) => {
        console.error("❌ Erro crítico ao chamar showNotification:", err);
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});