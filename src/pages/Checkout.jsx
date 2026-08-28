import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, clearCart } from '../services/cartService';
import { addDocument } from '../services/firestoreService';
import { auth } from '../services/firebase';

const YAPPY_NUMBER = '62686706';

export default function Checkout() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [orderId, setOrderId] = useState(null);

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const c = getCart();
    if (c.length === 0) { navigate('/cart'); return; }
    setCart(c);
    setTotal(getCartTotal());
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000) { alert('La imagen es muy grande. Maximo 800KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshot(ev.target.result);
      setScreenshotPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOrder = async () => {
    if (!name || !phone || !address) { alert('Completa todos los campos'); return; }
    setLoading(true);
    try {
      const docRef = await addDocument('orders', {
        items: cart.map(i => ({ id: i.id, name: i.name, brand: i.brand, price: i.price, quantity: i.quantity, image: i.image })),
        total,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: 'yappy',
        paymentStatus: 'pendiente',
        status: 'pendiente_confirmacion',
        screenshot: null,
        reference: '',
        userId: auth.currentUser.uid
      });
      setOrderId(docRef);
      clearCart();
      setStep('yappy');
    } catch (e) { alert('Error al crear pedido'); }
    finally { setLoading(false); }
  };

  const handleConfirmPayment = async () => {
    if (!screenshot) { alert('Sube el comprobante de pago'); return; }
    if (!reference.trim()) { alert('Escribe el numero de referencia'); return; }
    setUploading(true);
    try {
      const { updateDocument } = await import('../services/firestoreService');
      await updateDocument('orders', orderId, {
        screenshot,
        reference: reference.trim(),
        status: 'pendiente_confirmacion'
      });
      setStep('done');
    } catch (e) { alert('Error al subir comprobante'); }
    finally { setUploading(false); }
  };

  if (step === 'done') {
    return (
      <div style={{padding:20,textAlign:'center'}}>
        <div style={{fontSize:60,marginBottom:15}}>✅</div>
        <h2 className="section-title">Comprobante Enviado</h2>
        <p style={{color:'var(--gray-500)',margin:'15px 0',lineHeight:1.6}}>
          Tu comprobante esta siendo revisado.<br/>
          Te confirmaremos por email cuando se verifique el pago.
        </p>
        <div className="card" style={{textAlign:'left',margin:'20px 0'}}>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>Numero de pedido</p>
          <p style={{fontWeight:700,fontSize:16}}>{orderId?.slice(0,8).toUpperCase()}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Referencia Yappy</p>
          <p style={{fontWeight:700,fontSize:16}}>{reference}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Total</p>
          <p style={{fontWeight:700,fontSize:20,color:'var(--primary-dark)'}}>${total.toFixed(2)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>Ver Mis Pedidos</button>
        <button className="btn btn-outline" style={{marginTop:10}} onClick={() => navigate('/')}>Volver al Catalogo</button>
      </div>
    );
  }

  if (step === 'yappy') {
    return (
      <div style={{padding:15}}>
        <h2 className="section-title mb-15 text-center">Paso 2: Paga con Yappy</h2>
        <div className="yappy-box">
          <div className="yappy-title">Numero de Yappy</div>
          <div className="yappy-number">{YAPPY_NUMBER}</div>
          <div className="yappy-instruction">
            Abre tu app Yappy y envia <strong>${total.toFixed(2)}</strong> al numero de arriba.
          </div>
        </div>

        <div className="card">
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:15}}>Sube tu comprobante</h3>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            style={{display:'none'}}
          />

          <div 
            style={{
              border:'2px dashed var(--gray-300)',
              borderRadius:12,
              padding:20,
              textAlign:'center',
              cursor:'pointer',
              marginBottom:15,
              background: screenshotPreview ? '#fff' : 'var(--gray-50)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {screenshotPreview ? (
              <img src={screenshotPreview} alt="Comprobante" style={{maxWidth:'100%',maxHeight:200,borderRadius:8}} />
            ) : (
              <>
                <div style={{fontSize:40,marginBottom:10}}>📸</div>
                <p style={{color:'var(--gray-500)',fontSize:14}}>Toca para subir screenshot del comprobante</p>
              </>
            )}
          </div>

          {screenshot && (
            <button 
              className="btn btn-outline btn-sm" 
              style={{marginBottom:15,width:'auto'}}
              onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
            >
              Cambiar imagen
            </button>
          )}

          <div className="form-group">
            <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Numero de referencia Yappy *</label>
            <input 
              className="form-input" 
              placeholder="Ej: 123456789" 
              value={reference} 
              onChange={e => setReference(e.target.value)} 
            />
          </div>

          <button 
            className="btn btn-success" 
            onClick={handleConfirmPayment}
            disabled={uploading || !screenshot || !reference.trim()}
            style={{opacity: (!screenshot || !reference.trim()) ? 0.5 : 1}}
          >
            {uploading ? 'Enviando...' : '✓ Enviar Comprobante'}
          </button>
        </div>

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
          <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Email (para recibir factura)</label>
          <input className="form-input" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
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
