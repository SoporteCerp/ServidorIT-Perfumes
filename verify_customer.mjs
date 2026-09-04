import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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
const email = 'cliente3_' + Date.now() + '@test.local';
const pass = 'TempTest123!';

const tryTag = async (label, fn) => {
  try { const r = await fn(); console.log(label, '-> OK', typeof r === 'number' ? `${r} docs` : ''); }
  catch (e) { console.log(label, '-> FALLA', e.code || e.message.slice(0, 50)); }
};

(async () => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), { uid, email, name: 'Test', role: 'customer' });

  await tryTag('getUserRole (doc directo)      ', async () => (await getDoc(doc(db, 'users', uid))).data().role);
  await tryTag('no existe doc -> null          ', async () => (await getDoc(doc(db, 'users', 'fakeid000'))).exists() === false);
  await tryTag('orders userId+createdAt desc   ', async () => (await getDocs(query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20)))).docs.length);
  await tryTag('orders userId+status+ordered   ', async () => (await getDocs(query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc')))).docs.length);
  await tryTag('chats userId+lastMessageAt desc', async () => (await getDocs(query(collection(db, 'chats'), where('userId', '==', uid), orderBy('lastMessageAt', 'desc'), limit(20)))).docs.length);
  await tryTag('chats userId+createdAt desc    ', async () => (await getDocs(query(collection(db, 'chats'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20)))).docs.length);
  await tryTag('chats userId solo              ', async () => (await getDocs(query(collection(db, 'chats'), where('userId', '==', uid), limit(20)))).docs.length);
  await tryTag('reviews productId+createdAt    ', async () => (await getDocs(query(collection(db, 'reviews'), where('productId', '==', 'x'), orderBy('createdAt', 'desc'), limit(20)))).docs.length);
  await tryTag('priceHistory productId+created ', async () => (await getDocs(query(collection(db, 'priceHistory'), where('productId', '==', 'x'), orderBy('createdAt', 'desc'), limit(20)))).docs.length);
  await tryTag('carts doc propio               ', async () => (await getDoc(doc(db, 'carts', uid))).exists() === false);

  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
  console.log('fin');
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.code || e.message); process.exit(1); });