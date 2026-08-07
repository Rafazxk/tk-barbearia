self.addEventListener("push", (event) => {
  console.log("🔥 PUSH RECEBIDO");

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
    console.log("Payload:", data);
  } catch (e) {
    console.error("Erro ao ler payload como JSON", e);
    data = {
      title: "Nova Notificação",
      body: event.data?.text() ?? "Você tem uma nova atualização."
    };
  }

  const title = data.title || "Agendamento TK";
  
  const options = {
    body: data.body || "Novo evento registrado no sistema.",
    // Removi os ícones fixos (/icon.png) para evitar que a notificação 
    // falhe silenciosamente caso a imagem não exista na pasta public.
    // Se quiser colocar depois, certifique-se de que o arquivo existe na pasta public.
    vibrate: [200, 100, 200], // Vibração padrão ao chegar no celular
    data: {
      url: data.url || "/" // URL para redirecionar se o usuário clicar na notificação
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Opcional: Adiciona evento de clique na notificação para abrir o app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela
      for (let client of windowClients) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      // Se não houver, abre uma nova janela na URL principal
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});