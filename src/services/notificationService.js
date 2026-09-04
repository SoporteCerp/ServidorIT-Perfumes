import { collection, onSnapshot, query, where, orderBy, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth, messaging } from './firebase';
import { getUserRole } from './authService';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from '../components/Toast';

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
        const token = await getToken(messaging, {
          vapidKey: 'BJfxo9EflInZE1zooyGxEuiHv92o81sbIYlStduAYAPWkcTU610G_IEgYtC-Kk9iP3QUwRDdSPZd6a0HUxGoyTQ'
        });
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
  } catch (err) { console.warn('No se pudo guardar el token FCM', err); }
};

export const setupForegroundListener = () => {
  onMessage(messaging, (payload) => {
    const title = payload.notification.title || 'Esencia Gale';
    const body = payload.notification.body || 'Tienes una notificacion';
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', tag: 'esencia-' + Date.now() });
    }
    showToast(title, body);
  });
};

export const showToast = (title, message) => {
  toast.info(title, message);
};

export const subscribeToNotifications = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  let initialized = { orders: false, payments: false, chat: false };
  let unsubNewOrders = () => {};
  let unsubPendingPayments = () => {};
  let unsubChat = () => {};

  (async () => {
    let role = null;
    try { role = await getUserRole(user.uid); } catch (e) { console.error('No se pudo obtener el rol', e); }

    if (role === 'admin') {
      unsubNewOrders = onSnapshot(
        query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          if (!initialized.orders) { initialized.orders = true; return; }
          snapshot.docChanges().forEach(c => {
            if (c.type === 'modified' && c.doc.data().screenshot) callback('order', prev => prev + 1);
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
    }

    let chatQuery;
    if (role === 'admin') {
      chatQuery = query(collection(db, 'chats'));
    } else {
      chatQuery = query(collection(db, 'chats'), where('userId', '==', user.uid), orderBy('lastMessageAt', 'desc'));
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

  let role = null;
  try { role = await getUserRole(user.uid); } catch (e) { console.error('No se pudo obtener el rol', e); }

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
      if (change.type === 'modified' && change.doc.data().screenshot && !shownOrderIds.has(change.doc.id)) {
        shownOrderIds.add(change.doc.id);
        const order = change.doc.data();
        showToast('Nuevo Pedido', order.customerName + ' - $' + order.total);
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
        showToast('Pago Pendiente', order.customerName + ' envio comprobante de $' + order.total);
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
            showToast('Nuevo Mensaje', (chat.userName || 'Cliente') + ': ' + chat.lastMessage);
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