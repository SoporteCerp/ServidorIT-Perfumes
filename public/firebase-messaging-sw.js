importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAxsUgZiToDggc_io5kwQeYV7yjn7cn6Vo",
  authDomain: "soportecerp-9643d.firebaseapp.com",
  projectId: "soportecerp-9643d",
  storageBucket: "soportecerp-9643d.firebasestorage.app",
  messagingSenderId: "693343484042",
  appId: "1:693343484042:web:aaba79d20a5a277ca69573"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'Esencia Gale';
  const notificationOptions = {
    body: payload.notification.body || 'Tienes una notificacion',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'esencia-notification',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('esencia-gale') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
