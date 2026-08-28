import { collection, onSnapshot, query, where, orderBy, addDoc, getDocs, updateDoc } from 'firebase/firestore';
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
          await saveFCMToken(token);
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.log('Notification error:', err);
    return false;
  }
};

const saveFCMToken = async (token) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const tokens = await getDocs(query(collection(db, 'fcmTokens'), where('userId', '==', user.uid)));
    if (tokens.empty) {
      await addDoc(collection(db, 'fcmTokens'), { userId: user.uid, token, createdAt: new Date() });
    } else {
      await updateDoc(tokens.docs[0].ref, { token, updatedAt: new Date() });
    }
  } catch (err) {}
};

export const setupForegroundListener = () => {
  onMessage(messaging, (payload) => {
    const title = payload.notification.title || 'Esencia Gale';
    const body = payload.notification.body || 'Tienes una notificacion';

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: 'esencia-' + Date.now() });
    }
    showToast(title, body);
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

export const subscribeToNotifications = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  let count = 0;
  const increment = () => { count++; callback(count); };

  const unsubNewOrders = onSnapshot(
    query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc')),
    (snapshot) => { snapshot.docChanges().forEach(c => { if (c.type === 'added') increment(); }); }
  );

  const unsubPendingPayments = onSnapshot(
    query(collection(db, 'orders'), where('paymentStatus', '==', 'pendiente'), orderBy('createdAt', 'desc')),
    (snapshot) => { snapshot.docChanges().forEach(c => { if (c.type === 'added') increment(); }); }
  );

  const unsubChat = onSnapshot(
    query(collection(db, 'chats'), where('userId', '==', user.uid)),
    (snapshot) => {
      snapshot.docChanges().forEach(c => {
        if (c.type === 'modified') {
          const chat = c.doc.data();
          if (chat.lastMessage && !chat.lastMessage.startsWith('Admin')) increment();
        }
      });
    }
  );

  return () => { unsubNewOrders(); unsubPendingPayments(); unsubChat(); };
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
