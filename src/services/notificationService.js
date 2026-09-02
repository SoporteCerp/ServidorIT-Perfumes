import { collection, onSnapshot, query, where, orderBy, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth, messaging } from './firebase';
import { getUserRole } from './authService';
import { getToken, onMessage } from 'firebase/messaging';

let unsubscribers = [];
let shownOrderIds = new Set();
let shownPaymentIds = new Set();
let shownChatIds = new Set();
let chatActive = false;

export const setChatActive = (v) => { chatActive = !!v; };
export const isChatActive = () => chatActive;

export const requestNotificationPermission = async () => {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
        if (token) await saveFCMToken(token);
        return true;
      }
    }
    return false;
  } catch (err) { return false; }
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
      new Notification(title, { body, icon: '/favicon.svg', tag: 'esencia-' + Date.now() });
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

  let initialized = { orders: false, payments: false, chat: false };
  let unsubNewOrders = () => {};
  let unsubPendingPayments = () => {};
  let unsubChat = () => {};

  (async () => {
    const role = await getUserRole(user.uid);

    unsubNewOrders = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        if (!initialized.orders) { initialized.orders = true; return; }
        snapshot.docChanges().forEach(c => {
          if (c.type === 'added') callback('order', prev => prev + 1);
        });
      }
    );

    unsubPendingPayments = onSnapshot(
      query(collection(db, 'orders'), where('paymentStatus', '==', 'pendiente'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        if (!initialized.payments) { initialized.payments = true; return; }
        snapshot.docChanges().forEach(c => {
          if (c.type === 'added') callback('payment', prev => prev + 1);
        });
      }
    );

    let chatQuery;
    if (role === 'admin') {
      chatQuery = query(collection(db, 'chats'));
    } else {
      chatQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
    }

    unsubChat = onSnapshot(chatQuery, (snapshot) => {
      if (!initialized.chat) { initialized.chat = true; return; }
      if (isChatActive()) return;
      snapshot.docChanges().forEach(c => {
        if (c.type === 'modified') {
          const chat = c.doc.data();
          if (role === 'admin') {
            if (chat.lastMessage && !chat.lastMessage.startsWith('Admin')) callback('chat', prev => prev + 1);
          } else {
            if (chat.lastMessage && chat.lastMessage.startsWith('Admin')) callback('chat', prev => prev + 1);
          }
        }
      });
    });
  })();

  return () => { unsubNewOrders(); unsubPendingPayments(); unsubChat(); };
};

export const clearNotificationType = (type) => {
  window.dispatchEvent(new CustomEvent('clear-notifications', { detail: type }));
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
  listenChatMessages(user.uid, role);
};

export const stopListening = () => {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  shownOrderIds.clear();
  shownPaymentIds.clear();
  shownChatIds.clear();
};

const listenNewOrders = () => {
  let initialized = false;
  const q = query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    if (!initialized) { initialized = true; return; }
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' && !shownOrderIds.has(change.doc.id)) {
        shownOrderIds.add(change.doc.id);
        const order = change.doc.data();
        showToast('Nuevo Pedido', `${order.customerName} - $${order.total}`);
      }
    });
  });
  unsubscribers.push(unsub);
};

const listenPendingPayments = () => {
  let initialized = false;
  const q = query(collection(db, 'orders'), where('paymentStatus', '==', 'pendiente'));
  const unsub = onSnapshot(q, (snapshot) => {
    if (!initialized) { initialized = true; return; }
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified' && !shownPaymentIds.has(change.doc.id)) {
        shownPaymentIds.add(change.doc.id);
        const order = change.doc.data();
        showToast('Pago Pendiente', `${order.customerName} envio comprobante de $${order.total}`);
      }
    });
  });
  unsubscribers.push(unsub);
};

const listenChatMessages = (userId, role) => {
  let initialized = false;
  let q;
  if (role === 'admin') {
    q = query(collection(db, 'chats'));
  } else {
    q = query(collection(db, 'chats'), where('userId', '==', userId));
  }
  const unsub = onSnapshot(q, (snapshot) => {
    if (!initialized) { initialized = true; return; }
    if (isChatActive()) return;
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified' && !shownChatIds.has(change.doc.id + '_' + Date.now())) {
        const chat = change.doc.data();
        if (role === 'admin') {
          if (chat.lastMessage && !chat.lastMessage.startsWith('Admin')) {
            shownChatIds.add(change.doc.id + '_' + Date.now());
            showToast('Nuevo Mensaje', `${chat.userName || 'Cliente'}: ${chat.lastMessage}`);
          }
        } else {
          if (chat.lastMessage && chat.lastMessage.startsWith('Admin')) {
            shownChatIds.add(change.doc.id + '_' + Date.now());
            showToast('Respuesta del Admin', chat.lastMessage);
          }
        }
      }
    });
  });
  unsubscribers.push(unsub);
};
