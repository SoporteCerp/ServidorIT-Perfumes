import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, limit, serverTimestamp, onSnapshot, setDoc, getAggregateFromServer, sum, count, average } from 'firebase/firestore';
import { db } from './firebase';

export const addDocument = async (col, data) => {
  const ref = await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const setDocument = async (col, id, data) => {
  await setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
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
    q = query(q, limit(Math.max(1, limitCount)));
  } else {
    q = query(collection(db, col), orderBy(orderByField, orderDir), limit(Math.max(1, limitCount)));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeToDocuments = (col, filters = [], orderByField = 'createdAt', orderDir = 'desc', limitCount = 100, callback) => {
  let q;
  if (filters.length > 0) {
    q = collection(db, col);
    filters.forEach(f => { q = query(q, where(f.field, f.operator, f.value)); });
  } else {
    q = query(collection(db, col), orderBy(orderByField, orderDir), limit(limitCount));
  }
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
};

export const getOrderStats = async () => {
  const coll = collection(db, 'orders');
  
  // Total orders count
  const allSnap = await getAggregateFromServer(coll, { total: count() });
  
  // Paid orders for revenue
  const paidQuery = query(coll, where('paymentStatus', '==', 'pagado'));
  const paidSnap = await getAggregateFromServer(paidQuery, { revenue: sum('total'), count: count() });
  
  // Status counts
  const pendingQuery = query(coll, where('status', '==', 'pendiente_confirmacion'));
  const pendingSnap = await getAggregateFromServer(pendingQuery, { count: count() });
  
  const deliveredQuery = query(coll, where('status', '==', 'entregado'));
  const deliveredSnap = await getAggregateFromServer(deliveredQuery, { count: count() });
  
  return {
    total: allSnap.data().total,
    revenue: paidSnap.data().revenue,
    paidCount: paidSnap.data().count,
    pending: pendingSnap.data().count,
    delivered: deliveredSnap.data().count
  };
};
