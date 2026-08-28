import { addDocument, getDocuments } from './firestoreService';

export const sendMessage = async (chatId, senderId, senderName, text) => {
  return await addDocument(`chats/${chatId}/messages`, {
    senderId,
    senderName,
    text,
    read: false
  });
};

export const getMessages = async (chatId) => {
  return await getDocuments(`chats/${chatId}/messages`, [], 'createdAt', 'asc');
};

export const getOrCreateChat = async (userId, userName) => {
  const chats = await getDocuments('chats', [{ field: 'userId', operator: '==', value: userId }]);
  if (chats.length > 0) return chats[0].id;
  return await addDocument('chats', { userId, userName, lastMessage: '', lastMessageAt: new Date() });
};

export const getUserChats = async () => {
  return await getDocuments('chats', [], 'lastMessageAt', 'desc');
};

export const updateChatLastMessage = async (chatId, message) => {
  const { updateDocument } = await import('./firestoreService');
  await updateDocument('chats', chatId, { lastMessage: message, lastMessageAt: new Date() });
};
