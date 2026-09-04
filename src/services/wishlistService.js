import { auth } from './firebase';
import { updateDocument, getDocuments } from './firestoreService';

const WISHLIST_KEY = 'esencia_wishlist';

const syncToFirestore = async (wishlist) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await updateDocument('users', userId, { wishlist });
  } catch (err) {
    console.error('Error syncing wishlist:', err);
  }
};

export const loadWishlistFromCloud = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return getWishlist();
    const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: userId }]);
    if (users.length > 0 && users[0].wishlist) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(users[0].wishlist));
      return users[0].wishlist;
    }
    return getWishlist();
  } catch (err) {
    console.error('Error loading wishlist from cloud:', err);
    return getWishlist();
  }
};

export const getWishlist = () => {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn('Wishlist corrupta en localStorage', err);
    return [];
  }
};

export const toggleWishlist = (productId) => {
  const current = getWishlist();
  let newWishlist;
  
  if (current.includes(productId)) {
    newWishlist = current.filter(id => id !== productId);
  } else {
    newWishlist = [...current, productId];
  }
  
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(newWishlist));
  syncToFirestore(newWishlist);
  return newWishlist;
};

export const isInWishlist = (productId) => {
  return getWishlist().includes(productId);
};

export const getWishlistCount = () => {
  return getWishlist().length;
};
