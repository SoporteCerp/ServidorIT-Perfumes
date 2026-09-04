import { auth } from './firebase';
import { getDocument, setDocument } from './firestoreService';

const CART_KEY = 'servidorit_cart';

const syncToFirestore = async (cart) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await setDocument('carts', userId, { items: cart, userId });
  } catch (err) {
    console.error('Error syncing cart to Firestore:', err);
  }
};

export const getCart = () => {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (err) {
    console.error('Error parsing cart from localStorage:', err);
    return [];
  }
};

export const loadCartFromCloud = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return getCart();
    const cartDoc = await getDocument('carts', userId);
    if (cartDoc && cartDoc.items) {
      localStorage.setItem(CART_KEY, JSON.stringify(cartDoc.items));
      return cartDoc.items;
    }
    return getCart();
  } catch (err) {
    console.error('Error loading cart from cloud:', err);
    return getCart();
  }
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  
  let newCart;
  if (existing) {
    newCart = cart.map(item => 
      item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
    );
  } else {
    newCart = [...cart, { ...product, quantity }];
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(newCart));
  syncToFirestore(newCart);
  return newCart;
};

export const updateCartQuantity = (productId, quantity) => {
  if (quantity <= 0) return removeFromCart(productId);
  
  const cart = getCart();
  const newCart = cart.map(item => 
    item.id === productId ? { ...item, quantity } : item
  );
  
  localStorage.setItem(CART_KEY, JSON.stringify(newCart));
  syncToFirestore(newCart);
  return newCart;
};

export const removeFromCart = (productId) => {
  const cart = getCart();
  const newCart = cart.filter(item => item.id !== productId);
  
  localStorage.setItem(CART_KEY, JSON.stringify(newCart));
  syncToFirestore(newCart);
  return newCart;
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
