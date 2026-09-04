import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, loadCartFromCloud, addToCart as serviceAddToCart, updateCartQuantity as serviceUpdateCart, removeFromCart as serviceRemoveCart, clearCart as serviceClearCart, getCartTotal, getCartCount } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext({
  cart: [],
  cartTotal: 0,
  cartCount: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {}
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const initCart = async () => {
      if (currentUser) {
        const cloudCart = await loadCartFromCloud();
        setCart(cloudCart);
      } else {
        setCart(getCart());
      }
    };
    initCart();
  }, [currentUser]);

  const addToCart = (product, quantity = 1) => {
    const newCart = serviceAddToCart(product, quantity);
    setCart(newCart);
  };

  const updateQuantity = (productId, quantity) => {
    const newCart = serviceUpdateCart(productId, quantity);
    setCart(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = serviceRemoveCart(productId);
    setCart(newCart);
  };

  const clearCart = () => {
    const newCart = serviceClearCart();
    setCart(newCart);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartTotal: getCartTotal(),
      cartCount: getCartCount(),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
