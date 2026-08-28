import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const addDocument = async (col, data) => {
  const ref = await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateDocument = async (col, id, data) => {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (col, id) => {
  await deleteDoc(doc(db, col, id));
};

export const getDocuments = async (col, filters = [], orderByField = 'createdAt', orderDir = 'desc', limitCount = 100) => {
  let q;
  if (filters.length > 0) {
    q = collection(db, col);
    filters.forEach(f => { q = query(q, where(f.field, f.operator, f.value)); });
  } else {
    q = query(collection(db, col), orderBy(orderByField, orderDir), limit(limitCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
