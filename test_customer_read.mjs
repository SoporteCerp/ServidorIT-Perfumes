import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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
const email = 'cliente_' + Date.now() + '@test.local';
const pass = 'TempTest123!';

(async () => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), { uid, email, name: 'Test Cliente', role: 'customer' });
  console.log('usuario cliente creado:', uid);

  // 1) Lo que hace getUserRole/loginUser: collection query filtered by uid field
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const snap = await getDocs(q);
    console.log('READ LISTA users via uid field -> OK, docs:', snap.docs.length);
  } catch (e) {
    console.log('READ LISTA users via uid field -> DENEGADO:', e.code || e.message.slice(0, 60));
  }

  // 2) Lectura directa por doc id (lo que permiten las reglas)
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    console.log('READ DOC users por uid -> OK, exists:', snap.exists());
  } catch (e) {
    console.log('READ DOC users por uid -> DENEGADO:', e.code || e.message.slice(0, 60));
  }

  // clean up
  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(cred.user);
  console.log('limpieza ok');
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.code || e.message); process.exit(1); });