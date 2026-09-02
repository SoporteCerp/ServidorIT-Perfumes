import { getDocuments, addDocument, deleteDocument } from './firestoreService';

export const getReviews = async (productId) => {
  return await getDocuments('reviews', [{ field: 'productId', operator: '==', value: productId }], 'createdAt', 'desc');
};

export const addReview = async (productId, userId, userName, rating, comment) => {
  return await addDocument('reviews', {
    productId, userId, userName, rating, comment
  });
};

export const deleteReview = async (reviewId) => {
  return await deleteDocument('reviews', reviewId);
};

export const getAverageRating = async (productId) => {
  const reviews = await getDocuments('reviews', [{ field: 'productId', operator: '==', value: productId }]);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
};