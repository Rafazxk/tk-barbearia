// public/service-worker.js

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "TK Barbearia",
    body: "Novo agendamento recebido!",
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error("Erro ao ler JSON do push:", error);

    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );

});