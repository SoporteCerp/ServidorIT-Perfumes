import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAxsUgZiToDggc_io5kwQeYV7yjn7cn6Vo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "soportecerp-9643d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "soportecerp-9643d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "soportecerp-9643d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "693343484042",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:693343484042:web:aaba79d20a5a277ca69573"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);
