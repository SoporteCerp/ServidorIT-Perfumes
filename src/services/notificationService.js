import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, auth, messaging } from './firebase';
import { getUserRole } from './authService';
import { getToken, onMessage } from 'firebase/messaging';

let unsubscribers = [];

export const requestNotificationPermission = async () => {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
        if (token) {
          console.log('FCM Token:', token);
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.log('Notification permission error:', err);
    return false;
  }
};

export const setupForegroundListener = () => {
  onMessage(messaging, (payload) => {
    const notificationTitle = payload.notification.title || 'Esencia Gale';
    const notificationOptions = {
      body: payload.notification.body || 'Tienes una notificacion',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'esencia-notification',
      requireInteraction: true
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }

    showToast(notificationTitle, notificationOptions.body);
  });
};

export const showToast = (title, message) => {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #1a1a2e; color: #fff; padding: 15px 20px; border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 9999; max-width: 90%;
    animation: slideDown 0.3s ease; cursor: pointer; font-size: 14px;
  `;
  toast.innerHTML = `<strong>${title}</strong><br/>${message}`;
  toast.onclick = () => toast.remove();
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

export const startListening = async () => {
  stopListening();
  const user = auth.currentUser;
  if (!user) return;

  const role = await getUserRole(user.uid);

  if (role === 'admin') {
    listenNewOrders();
    listenPendingPayments();
  }
  listenChatMessages(user.uid);
};

export const stopListening = () => {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
};

const listenNewOrders = () => {
  const q = query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const order = change.doc.data();
        showToast('Nuevo Pedido', `${order.customerName} - $${order.total}`);
      }
    });
  });
  unsubscribers.push(unsub);
};

const listenPendingPayments = () => {
  const q = query(collection(db, 'orders'), where('paymentStatus', '==', 'pendiente'));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const order = change.doc.data();
        showToast('Pago Pendiente', `${order.customerName} envio comprobante de $${order.total}`);
      }
    });
  });
  unsubscribers.push(unsub);
};

const listenChatMessages = (userId) => {
  const q = query(collection(db, 'chats'), where('userId', '==', userId));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const chat = change.doc.data();
        if (chat.lastMessage && !chat.lastMessage.startsWith('Admin')) {
          showToast('Nuevo Mensaje', chat.lastMessage);
        }
      }
    });
  });
  unsubscribers.push(unsub);
};
