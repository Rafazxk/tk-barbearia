// public/service-worker.js

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  // SE ISSO RODAR, O CELULAR TEM QUE VIBRAR E O LOG TEM QUE APARECER NO CONSOLE
  console.log("🔥 EVENTO PUSH DISPARADO PELO SERVIDOR NO CELULAR!");
  
  if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500]);
  }

  let data = {
    title: "TK Barbearia",
    body: "Novo agendamento recebido!"
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Erro ao ler JSON do push:", e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log("✅ showNotification executado com sucesso!"))
      .catch((err) => console.error("❌ Erro no showNotification:", err))
  );
});