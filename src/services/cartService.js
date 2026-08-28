import { auth } from './firebase';
import { getDocuments, addDocument, updateDocument, deleteDocument } from './firestoreService';

const CART_KEY = 'servidorit_cart';

const syncToFirestore = async (cart) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const existing = await getDocuments('carts', [{ field: 'userId', operator: '==', value: userId }]);
    if (existing.length > 0) {
      await updateDocument('carts', existing[0].id, { items: cart, updatedAt: new Date() });
    } else if (cart.length > 0) {
      await addDocument('carts', { userId, items: cart });
    }
  } catch {}
};

export const getCart = () => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const loadCartFromCloud = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return getCart();
    const carts = await getDocuments('carts', [{ field: 'userId', operator: '==', value: userId }]);
    if (carts.length > 0 && carts[0].items) {
      localStorage.setItem(CART_KEY, JSON.stringify(carts[0].items));
      return carts[0].items;
    }
    return getCart();
  } catch { return getCart(); }
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncToFirestore(cart);
  return cart;
};

export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncToFirestore(cart);
  return cart;
};

export const removeFromCart = (productId) => {
  const cart = getCart().filter(item => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncToFirestore(cart);
  return cart;
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  syncToFirestore([]);
  return [];
};

export const getCartTotal = () => {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

export const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
};
