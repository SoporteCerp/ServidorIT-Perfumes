import { collection, onSnapshot, query, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { addDocument, getDocuments, updateDocument } from './firestoreService';

export const sendMessage = async (chatId, senderId, senderName, text) => {
  return await addDocument(`chats/${chatId}/messages`, {
    senderId,
    senderName,
    text,
    read: false
  });
};

export const subscribeToMessages = (chatId, callback) => {
  const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
};

export const getOrCreateChat = async (userId, userName) => {
  const chats = await getDocuments('chats', [{ field: 'userId', operator: '==', value: userId }]);
  if (chats.length > 0) return chats[0].id;
  return await addDocument('chats', { userId, userName, lastMessage: '', lastMessageAt: new Date() });
};

export const subscribeToChats = (callback) => {
  const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
};

export const updateChatLastMessage = async (chatId, message) => {
  await updateDocument('chats', chatId, { lastMessage: message, lastMessageAt: new Date() });
};

export const deleteMessage = async (chatId, messageId) => {
  const { deleteDocument } = await import('./firestoreService');
  await deleteDocument(`chats/${chatId}/messages`, messageId);
};

export const deleteChat = async (chatId) => {
  const batch = writeBatch(db);
  const msgs = await getDocs(query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc')));
  msgs.forEach(m => batch.delete(m.ref));
  batch.delete(doc(db, 'chats', chatId));
  await batch.commit();
};