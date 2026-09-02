import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, clearCart } from '../services/cartService';
import { addDocument, getDocuments } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { validateCoupon } from '../services/couponService';

const YAPPY_NUMBER = '62686706';
const WHATSAPP_NUMBER = '50767238540';
const IVA_RATE = 0.07;
const SHIPPING_ZONES = [
  { value: 'ciudad', label: 'Ciudad de Panama / San Miguelito', cost: 0 },
  { value: 'oeste', label: 'Panama Oeste', cost: 3 },
  { value: 'resto', label: 'Resto del pais', cost: 5 },
];

export default function Checkout() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [orderId, setOrderId] = useState(null);

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('yappy');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processingCard, setProcessingCard] = useState(false);

  const [shippingZone, setShippingZone] = useState('ciudad');
  const shippingCost = SHIPPING_ZONES.find(z => z.value === shippingZone)?.cost || 0;

  const iva = (total + shippingCost) * IVA_RATE;

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: auth.currentUser.uid }]);
      if (users.length > 0) {
        const u = users[0];
        setName(u.name || auth.currentUser?.displayName || '');
        setPhone(u.phone || '');
        setAddress(u.address || '');
      } else {
        setName(auth.currentUser?.displayName || '');
      }
      setEmail(auth.currentUser?.email || '');
    } catch {
      setName(auth.currentUser?.displayName || '');
      setEmail(auth.currentUser?.email || '');
    }
    const c = getCart();
    if (c.length === 0) { navigate('/cart'); return; }
    setCart(c);
    const t = getCartTotal();
    setTotal(t);
    setFinalTotal(t * (1 + IVA_RATE));
  };

  const recalcTotal = (base, coupon, zone) => {
    const zoneCost = SHIPPING_ZONES.find(z => z.value === zone)?.cost || 0;
    const subtotal = base + zoneCost;
    const ivaAmt = subtotal * IVA_RATE;
    return Math.max(0, subtotal + ivaAmt - coupon);
  };

  useEffect(() => {
    setFinalTotal(recalcTotal(total, couponDiscount, shippingZone));
  }, [shippingZone, total, couponDiscount]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Escribe un codigo'); return; }
    const result = await validateCoupon(couponCode, total);
    if (result.valid) {
      setCouponDiscount(result.discount);
      setFinalTotal(recalcTotal(total, result.discount, shippingZone));
      setCouponError('');
    } else {
      setCouponDiscount(0);
      setFinalTotal(recalcTotal(total, 0, shippingZone));
      setCouponError(result.error);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { compressImage } = await import('../services/imageUtils');
    const compressed = await compressImage(file, 700, 0.6);
    if (compressed) {
      setScreenshot(compressed);
      setScreenshotPreview(compressed);
    } else {
      alert('No se pudo procesar la imagen');
    }
  };

  const handleOrder = async () => {
    if (!name || !phone || !address) { alert('Completa todos los campos'); return; }
    setLoading(true);
    try {
      const orderData = {
        items: cart.map(i => ({ id: i.id, name: i.name, brand: i.brand, price: i.price, cost: i.cost ?? i.price, quantity: i.quantity, image: i.image })),
        subtotal: total,
        shippingCost: shippingCost,
        shippingZone: shippingZone,
        iva: iva,
        total: finalTotal,
        discount: couponDiscount,
        couponCode: couponCode || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: paymentMethod,
        userId: auth.currentUser.uid
      };

      if (paymentMethod === 'card') {
        orderData.paymentStatus = 'pagado';
        orderData.status = 'pagado';
        orderData.screenshot = null;
        orderData.reference = 'Pago tarjeta simulado';
      } else {
        orderData.paymentStatus = 'pendiente';
        orderData.status = 'pendiente_confirmacion';
        orderData.screenshot = null;
        orderData.reference = '';
      }

      const docRef = await addDocument('orders', orderData);
      setOrderId(docRef);
      clearCart();

      if (paymentMethod === 'card') {
        setProcessingCard(true);
        await new Promise(r => setTimeout(r, 2000));
        setProcessingCard(false);
        setStep('card-done');
      } else {
        setStep('yappy');
      }
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
    } catch (e) { console.error('ERROR COMPROBANTE:', e); alert('Error al subir comprobante: ' + (e?.message || e)); }
    finally { setUploading(false); }
  };

  const handleFormatCardNumber = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleFormatExpiry = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    setCardExpiry(val);
  };

  const getShippingLabel = () => {
    const zone = SHIPPING_ZONES.find(z => z.value === shippingZone);
    return zone ? zone.label + (zone.cost === 0 ? ' (Gratis)' : ' ($' + zone.cost.toFixed(2) + ')') : '';
  };

  if (processingCard) {
    return (
      <div style={{padding:40,textAlign:'center'}}>
        <div style={{fontSize:50,marginBottom:15}}>💳</div>
        <h2 className="section-title">Procesando Pago...</h2>
        <p style={{color:'var(--gray-500)',margin:'15px 0'}}>Simulando transaccion con tarjeta</p>
        <div style={{width:48,height:48,border:'4px solid var(--gray-200)',borderTop:'4px solid var(--primary)',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'20px auto'}}/>
      </div>
    );
  }

  if (step === 'card-done') {
    return (
      <div style={{padding:20,textAlign:'center'}}>
        <div style={{fontSize:60,marginBottom:15}}>✅</div>
        <h2 className="section-title">Pago Aprobado</h2>
        <p style={{color:'var(--gray-500)',margin:'15px 0',lineHeight:1.6}}>
          Tu pago con tarjeta fue procesado exitosamente.<br/>
          El pedido esta confirmado y listo para preparar.
        </p>
        <div className="card" style={{textAlign:'left',margin:'20px 0'}}>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>Numero de pedido</p>
          <p style={{fontWeight:700,fontSize:16}}>{orderId?.slice(0,8).toUpperCase()}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Metodo de pago</p>
          <p style={{fontWeight:600,fontSize:14}}>💳 Tarjeta terminada en {cardNumber.slice(-4) || '****'}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Total cobrado</p>
          <p style={{fontWeight:700,fontSize:20,color:'var(--primary-dark)'}}>${finalTotal.toFixed(2)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>Ver Mis Pedidos</button>
        <button className="btn btn-outline" style={{marginTop:10}} onClick={() => navigate('/')}>Volver al Catalogo</button>
      </div>
    );
  }

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
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Envio</p>
          <p style={{fontWeight:600,fontSize:14}}>{getShippingLabel()}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Subtotal</p>
          <p style={{fontWeight:600,fontSize:16}}>${total.toFixed(2)}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>IVA (7%)</p>
          <p style={{fontWeight:600,fontSize:16}}>${iva.toFixed(2)}</p>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:10}}>Total</p>
          <p style={{fontWeight:700,fontSize:20,color:'var(--primary-dark)'}}>${finalTotal.toFixed(2)}</p>
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
            Abre tu app Yappy y envia <strong>${finalTotal.toFixed(2)}</strong> al numero de arriba.
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
            {uploading ? 'Enviando...' : '\u2713 Enviar Comprobante'}
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

      <h3 className="section-title mb-15">Zona de Envio</h3>
      <div className="card">
        <select className="form-input" value={shippingZone} onChange={e => setShippingZone(e.target.value)}>
          {SHIPPING_ZONES.map(z => (
            <option key={z.value} value={z.value}>
              {z.label}{z.cost === 0 ? ' (Gratis)' : ' ($' + z.cost.toFixed(2) + ')'}
            </option>
          ))}
        </select>
        {shippingCost > 0 && (
          <p style={{color:'var(--gray-500)',fontSize:13,marginTop:8}}>Costo de envio: ${shippingCost.toFixed(2)}</p>
        )}
        {shippingCost === 0 && (
          <p style={{color:'var(--success)',fontSize:13,marginTop:8}}>Envio gratis para esta zona</p>
        )}
      </div>

      <h3 className="section-title mb-15">Metodo de Pago</h3>
      <div className="card">
        <div style={{display:'flex',gap:10}}>
          <button
            className={paymentMethod === 'yappy' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{flex:1,padding:'12px 8px',fontSize:14}}
            onClick={() => setPaymentMethod('yappy')}
          >
            {'\uD83D\uDCB0'} Yappy (subir comprobante)
          </button>
          <button
            className={paymentMethod === 'card' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{flex:1,padding:'12px 8px',fontSize:14}}
            onClick={() => setPaymentMethod('card')}
          >
            {'\uD83D\uDCB3'} Tarjeta (tarjeta ficticia)
          </button>
        </div>

        {paymentMethod === 'yappy' && (
          <div className="yappy-box" style={{marginTop:15}}>
            <div className="yappy-instruction">Paga con Yappy al numero <strong>{YAPPY_NUMBER}</strong></div>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div style={{marginTop:15}}>
            <div className="form-group">
              <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Numero de tarjeta</label>
              <input className="form-input" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={handleFormatCardNumber} maxLength={19} />
            </div>
            <div style={{display:'flex',gap:10}}>
              <div className="form-group" style={{flex:1}}>
                <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Vencimiento</label>
                <input className="form-input" placeholder="MM/AA" value={cardExpiry} onChange={handleFormatExpiry} maxLength={5} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>CVV</label>
                <input className="form-input" placeholder="123" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))} maxLength={4} type="password" />
              </div>
            </div>
            <div className="form-group">
              <label style={{fontSize:14,fontWeight:600,display:'block',marginBottom:6}}>Nombre en la tarjeta</label>
              <input className="form-input" placeholder="Como aparece en la tarjeta" value={cardName} onChange={e => setCardName(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <h3 className="section-title mb-15">Codigo de Descuento</h3>
      <div className="card">
        <div style={{display:'flex',gap:8}}>
          <input className="form-input" placeholder="Ej: DESCUENTO10" value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{flex:1,marginBottom:0}} />
          <button className="btn btn-primary" style={{width:'auto',padding:'0 20px',marginBottom:0}} onClick={handleApplyCoupon}>Aplicar</button>
        </div>
        {couponDiscount > 0 && <p style={{color:'var(--success)',marginTop:8,fontSize:14}}>Descuento aplicado: -${couponDiscount.toFixed(2)}</p>}
        {couponError && <p style={{color:'var(--danger)',marginTop:8,fontSize:14}}>{couponError}</p>}
      </div>

      <h3 className="section-title mb-15">Resumen</h3>
      <div className="card">
        {cart.map(item => (
          <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
            <span style={{fontSize:14,color:'var(--gray-700)'}}>{item.name} x{item.quantity}</span>
            <span style={{fontWeight:600}}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}>
          <span style={{fontSize:14,color:'var(--gray-700)'}}>Subtotal</span>
          <span style={{fontWeight:600}}>${total.toFixed(2)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
          <span style={{fontSize:14,color:'var(--gray-700)'}}>Envio ({getShippingLabel()})</span>
          <span style={{fontWeight:600}}>{shippingCost === 0 ? 'Gratis' : '$' + shippingCost.toFixed(2)}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}>
          <span style={{fontSize:14,color:'var(--gray-700)'}}>IVA (7%)</span>
          <span style={{fontWeight:600}}>${iva.toFixed(2)}</span>
        </div>
        {couponDiscount > 0 && (
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',color:'var(--success)'}}>
            <span style={{fontSize:14}}>Descuento ({couponCode})</span>
            <span style={{fontWeight:600}}>-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',marginTop:5}}>
          <span style={{fontSize:18,fontWeight:700}}>Total</span>
          <span style={{fontSize:20,fontWeight:700,color:'var(--primary-dark)'}}>${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleOrder} disabled={loading}>
        {loading ? 'Procesando...' : (paymentMethod === 'card' ? 'Pagar con Tarjeta' : 'Confirmar Pedido')}
      </button>

      <div style={{textAlign:'center',margin:'15px 0',color:'var(--gray-400)',fontSize:14}}>— o —</div>

      <button className="btn" onClick={() => {
        const date = new Date().toLocaleDateString('es-PA');
        const items = cart.map(function(i) {
          return i.name + '  ' + i.quantity + ' x $' + i.price.toFixed(2) + '    $' + (i.price * i.quantity).toFixed(2);
        }).join('\n');
        const divider = '--------------------';
        const msg = encodeURIComponent(
          'ESENCIA GALE\nTu tienda de fragancias\nTel: ' + WHATSAPP_NUMBER + '\n' + divider + '\nFACTURA DE PEDIDO\nFecha: ' + date + '\n' + divider + '\n\n' + items + '\n\nSubtotal: $' + total.toFixed(2) + '\nEnvio (' + getShippingLabel() + '): $' + shippingCost.toFixed(2) + '\nIVA (7%): $' + iva.toFixed(2) + '\n\n' + divider + '\nTOTAL: $' + finalTotal.toFixed(2) + '\n' + divider + '\n\nDATOS DEL CLIENTE:\nNombre: ' + name + '\nTelefono: ' + phone + '\nDireccion: ' + address + '\n' + divider + '\nGracias por tu compra!\nPara coordinar entrega enviar comprobante de pago'
        );
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
      }} style={{background:'#25D366',color:'#fff'}}>
        Enviar Pedido por WhatsApp
      </button>
    </div>
  );
}