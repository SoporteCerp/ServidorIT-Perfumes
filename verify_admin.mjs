import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, limit, getDocs, where, orderBy } from 'firebase/firestore';

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

const tryTag = async (label, fn) => {
  try { const r = await fn(); console.log(label, '-> OK', r); }
  catch (e) { console.log(label, '-> FALLA', e.code || e.message.slice(0, 60)); }
};

(async () => {
  const cred = await signInWithEmailAndPassword(auth, 'esenciagale@gmail.com', 'Cerpik0*');
  const uid = cred.user.uid;
  const docSnap = await getDoc(doc(db, 'users', uid));
  console.log('admin uid:', uid);
  console.log('admin doc existe:', docSnap.exists(), '->', docSnap.exists() ? JSON.stringify(docSnap.data()) : '');
  await tryTag('chats admin (all, lastMessageAt desc)', async () => (await getDocs(query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'), limit(3)))).docs.length);
  await tryTag('orders admin (createdAt desc)', async () => (await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(3)))).docs.length);
  await tryTag('orders admin status asc', async () => (await getDocs(query(collection(db, 'orders'), where('status', '==', 'pendiente_confirmacion'), orderBy('createdAt', 'desc'), limit(3)))).docs.length);
  console.log('fin');
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.code || e.message); process.exit(1); });