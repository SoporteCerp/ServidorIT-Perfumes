import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { addDocument, getDocuments } from './firestoreService';

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
  const { updateDocument } = await import('./firestoreService');
  await updateDocument('chats', chatId, { lastMessage: message, lastMessageAt: new Date() });
};
