import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartQuantity, removeFromCart, getCartTotal } from '../services/cartService';

const IVA_RATE = 0.07;

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => { setCart(getCart()); }, []);

  const updateQty = (id, qty) => { setCart(updateCartQuantity(id, qty)); };
  const remove = (id) => { setCart(removeFromCart(id)); };
  const total = getCartTotal();
  const iva = total * IVA_RATE;
  const fullTotal = total + iva;

  return (
    <>
      <h3 className="section-title mb-15">Mi Carrito</h3>
      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-text">Tu carrito esta vacio</div>
          <button className="btn btn-primary" style={{marginTop:20,maxWidth:250,margin:'20px auto 0'}} onClick={() => navigate('/')}>Ver Catalogo</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">{item.image ? <img src={item.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:10}} /> : '🧴'}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                <div className="cart-item-qty">
                  <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  <button className="cart-qty-btn" style={{color:'var(--danger)',marginLeft:8}} onClick={() => remove(item.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}

          <div className="cart-total">
            <div className="total-row"><span className="total-label">Subtotal</span><span className="total-value">${total.toFixed(2)}</span></div>
            <div className="total-row"><span className="total-label">IVA (7%)</span><span className="total-value">${iva.toFixed(2)}</span></div>
            <div className="total-row"><span className="total-label">Envio</span><span className="total-value">Gratis</span></div>
            <div className="total-row grand"><span className="total-label">Total</span><span className="total-value">${fullTotal.toFixed(2)}</span></div>
          </div>

          <button className="btn btn-primary" style={{marginTop:15}} onClick={() => navigate('/checkout')}>
            Proceder al Pago
          </button>
        </>
      )}
    </>
  );
}