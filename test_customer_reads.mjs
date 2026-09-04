import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyAxsUgZiToDggc_io5kwQeYV7yjn7cn6Vo',
  authDomain: 'soportecerp-9643d.firebaseapp.com',
  projectId: 'soportecerp-9643d',
  storageBucket: 'soportecerp-9643d.firebasestorage.app',
  messagingSenderId: '693343484042',
  appId: '1:693343484042:web:aaba79d20a5a277ca69573',
});
const auth = getAuth(app);
const db = getFirestore(app);
const email = 'cliente2_' + Date.now() + '@test.local';
const pass = 'TempTest123!';

const tryTag = async (label, fn) => {
  try { const r = await fn(); console.log(label, '-> OK', typeof r === 'number' ? `${r} docs` : ''); }
  catch (e) { console.log(label, '-> DENEGADO', e.code || e.message.slice(0, 50)); }
};

(async () => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), { uid, email, name: 'Test', role: 'customer' });

  await tryTag('orders.where(userId)          ', async () => (await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))).docs.length);
  await tryTag('orders.where(status)+orderBy   ', async () => (await getDocs(query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc')))).docs.length);
  await tryTag('orders.where(paymentStatus)+ord', async () => (await getDocs(query(collection(db, 'orders'), where('paymentStatus', '==', 'pendiente'), orderBy('createdAt', 'desc'), limit(5)))).docs.length);
  await tryTag('orders.doc.id (own)            ', async () => (await getDoc(doc(db, 'orders', 'test-own-' + uid))).exists() || true);
  await tryTag('orders.where(userId)+orderBy   ', async () => (await getDocs(query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20)))).docs.length);
  await tryTag('chats.where(userId)            ', async () => (await getDocs(query(collection(db, 'chats'), where('userId', '==', uid), orderBy('lastMessageAt', 'desc'), limit(20)))).docs.length);
  await tryTag('carts.doc.id (own)             ', async () => { const d = await getDoc(doc(db, 'carts', uid)); return d.exists() || true; });
  await tryTag('products public                ', async () => (await getDocs(query(collection(db, 'products'), orderBy('name'), limit(5)))).docs.length);
  await tryTag('coupons customer read          ', async () => (await getDocs(query(collection(db, 'coupons'), limit(5)))).docs.length);
  await tryTag('fcmTokens.where(userId)?       ', async () => (await getDocs(query(collection(db, 'fcmTokens'), where('userId', '==', uid)))).docs.length);

  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(cred.user);
  console.log('limpieza ok');
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.code || e.message); process.exit(1); });