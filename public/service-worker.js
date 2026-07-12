// public/service-worker.js
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    // Tenta ler como JSON
    data = event.data.json();
  } catch (e) {
    // Se falhar (como no teste do DevTools), usa o texto puro
    data = {
      title: "Notificação de Teste",
      body: event.data ? event.data.text() : "Você recebeu uma nova notificação!"
    };
  }

  const options = {
    body: data.body || "Sem conteúdo adicional",
    icon: '/icon.png', 
    badge: '/badge.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Atenção!", options)
  );
});