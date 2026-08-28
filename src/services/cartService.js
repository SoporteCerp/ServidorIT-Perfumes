const CART_KEY = 'servidorit_cart';

export const getCart = () => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
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
  return cart;
};

export const removeFromCart = (productId) => {
  const cart = getCart().filter(item => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  return [];
};

export const getCartTotal = () => {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

export const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
};
