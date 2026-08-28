import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getUserRole } from './authService';

let unsubscribers = [];

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title, body, icon = '🧴') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: 'esencia-notification' });
  }
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
        showNotification('Nuevo Pedido', `${order.customerName} - $${order.total}`);
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
        showNotification('Pago Pendiente', `${order.customerName} envio comprobante de $${order.total}`);
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
          showNotification('Nuevo Mensaje', chat.lastMessage);
        }
      }
    });
  });
  unsubscribers.push(unsub);
};
