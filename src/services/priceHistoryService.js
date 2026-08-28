import { addDocument, getDocuments } from './firestoreService';

export const recordPrice = async (productId, price) => {
  await addDocument('priceHistory', { productId, price });
};

export const getPriceHistory = async (productId) => {
  const history = await getDocuments('priceHistory', [{ field: 'productId', operator: '==', value: productId }]);
  return history.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
};
