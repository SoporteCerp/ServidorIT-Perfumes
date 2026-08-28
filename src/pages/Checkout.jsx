import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, clearCart } from '../services/cartService';
import { addDocument } from '../services/firestoreService';
import { auth } from '../services/firebase';

const YAPPY_NUMBER = '62686706';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');

  useEffect(() => {
    const c = getCart();
    if (c.length === 0) { navigate('/cart'); return; }
    setCart(c);
    setTotal(getCartTotal());
  }, []);

  const handleOrder = async () => {
    if (!name || !phone || !address) { alert('Completa todos los campos'); return; }
    setLoading(true);
    try {
      await addDocument('orders', {
        items: cart.map(i => ({ id: i.id, name: i.name, brand: i.brand, price: i.price, quantity: i.quantity, image: i.image })),
        total,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: 'yappy',
        paymentStatus: 'pendiente',
        status: 'pendiente',
        userId: auth.currentUser.uid
      });
      clearCart();
      setStep('yappy');
    } catch (e) { alert('Error al crear pedido'); }
    finally { setLoading(false); }
  };

  if (step === 'yappy') {
    return (
      <div style={{padding:20}}>
        <h2 className="section-title mb-15 text-center">Paso 2: Paga con Yappy</h2>
        <div className="yappy-box">
          <div className="yappy-title">Numero de Yappy</div>
          <div className="yappy-number">{YAPPY_NUMBER}</div>
          <div className="yappy-instruction">
            Abre tu app Yappy y envia <strong>${total.toFixed(2)}</strong> al numero de arriba.<br/><br/>
            Despues de pagar, tu pedido sera procesado.
          </div>
        </div>
        <div className="card" style={{textAlign:'center'}}>
          <p style={{fontSize:14,color:'var(--gray-500)',marginBottom:15}}>Monto a enviar:</p>
          <p style={{fontSize:32,fontWeight:700,color:'var(--primary-dark)'}}>${total.toFixed(2)}</p>
          <p style={{fontSize:12,color:'var(--gray-400)',marginTop:10}}>Yappy a: {YAPPY_NUMBER}</p>
        </div>
        <button className="btn btn-success" style={{marginTop:15}} onClick={() => { navigate('/orders'); }}>
          ✓ Ya Pague
        </button>
        <button className="btn btn-outline" style={{marginTop:10}} onClick={() => navigate('/')}>
          Volver al Catalogo
        </button>
      </div>
    );
  }

  return (
    <div style={{padding:10}}>
      <h3 className="section-title mb-15">Paso 1: Tus Datos</h3>

      <div className="card">
        <div className="form-group">
          <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Nombre *</label>
          <input className="form-input" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Telefono *</label>
          <input className="form-input" placeholder="Tu telefono" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
        </div>
        <div className="form-group">
          <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Direccion *</label>
          <input className="form-input" placeholder="Direccion de entrega" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
      </div>

      <h3 className="section-title mb-15">Resumen</h3>
      <div className="card">
        {cart.map(item => (
          <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
            <span style={{fontSize:14,color:'var(--gray-700)'}}>{item.name} x{item.quantity}</span>
            <span style={{fontWeight:600}}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',marginTop:5}}>
          <span style={{fontSize:18,fontWeight:700}}>Total</span>
          <span style={{fontSize:20,fontWeight:700,color:'var(--primary-dark)'}}>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="yappy-box" style={{margin:'15px 0'}}>
        <div className="yappy-title">Metodo de Pago</div>
        <div style={{fontSize:28,margin:'10px 0'}}>💜</div>
        <div className="yappy-instruction">Paga con Yappy al numero <strong>{YAPPY_NUMBER}</strong></div>
      </div>

      <button className="btn btn-primary" onClick={handleOrder} disabled={loading}>
        {loading ? 'Procesando...' : 'Confirmar Pedido'}
      </button>
    </div>
  );
}
