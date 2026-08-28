import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAxsUgZiToDggc_io5kwQeYV7yjn7cn6Vo",
  authDomain: "soportecerp-9643d.firebaseapp.com",
  projectId: "soportecerp-9643d",
  storageBucket: "soportecerp-9643d.firebasestorage.app",
  messagingSenderId: "693343484042",
  appId: "1:693343484042:web:aaba79d20a5a277ca69573"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
