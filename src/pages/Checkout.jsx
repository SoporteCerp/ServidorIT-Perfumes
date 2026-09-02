import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, clearCart } from '../services/cartService';
import { addDocument, getDocuments, updateDocument } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { getCoupons, getBestCoupon } from '../services/couponService';
import { compressImage } from '../services/imageUtils';

const YAPPY_NUMBER = '62686706';
const WHATSAPP_NUMBER = '50767238540';
const IVA_RATE = 0.07;
const SHIPPING_ZONES = [
  { value: 'panama', label: 'Panama / San Miguelito / Oeste', cost: 2 },
  { value: 'colon', label: 'Colon', cost: 0 },
  { value: 'resto', label: 'Resto del pais (mensajeria)', cost: 0 },
];

const COURIER_OPTIONS = [
  { value: 'ferguson', label: 'Ferguson / Golden Express', cost: 4 },
  { value: 'uno', label: 'Uno Express', cost: 5 },
  { value: 'cia', label: 'CIA Express', cost: 5 },
  { value: 'olva', label: 'Olva Courier', cost: 6 },
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
  const [couponFreeShipping, setCouponFreeShipping] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [finalTotal, setFinalTotal] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('yappy');

  const [shippingZone, setShippingZone] = useState('panama');
  const [courier, setCourier] = useState('ferguson');
  const shippingCost = (() => {
    const zone = SHIPPING_ZONES.find(z => z.value === shippingZone);
    if (shippingZone === 'resto') {
      return COURIER_OPTIONS.find(c => c.value === courier)?.cost || 0;
    }
    return zone?.cost || 0;
  })();

  const iva = (total + (couponFreeShipping ? 0 : shippingCost)) * IVA_RATE;

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    getCoupons().then(coupons => {
      setAvailableCoupons((coupons || []).filter(c => c.active));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    getBestCoupon(total, shippingCost).then(best => {
      if (!mounted) return;
      if (best) {
        setCouponCode(best.coupon.code);
        if (best.freeShipping) {
          setCouponFreeShipping(true);
          setCouponDiscount(0);
        } else {
          setCouponFreeShipping(false);
          setCouponDiscount(best.saving);
        }
      } else {
        setCouponFreeShipping(false);
        setCouponDiscount(0);
        setCouponCode('');
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [total, shippingCost, shippingZone, courier]);

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

  const recalcTotal = (base, coupon, zone, freeShip) => {
    const shippingTmp = freeShip ? 0 : shippingCost;
    const subtotal = base + shippingTmp;
    const ivaAmt = subtotal * IVA_RATE;
    return Math.max(0, subtotal + ivaAmt - coupon);
  };

  useEffect(() => {
    setFinalTotal(recalcTotal(total, couponDiscount, shippingZone, couponFreeShipping));
  }, [shippingZone, total, couponDiscount, couponFreeShipping]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
        courier: shippingZone === 'resto' ? courier : null,
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

      orderData.paymentStatus = 'pendiente';
      orderData.status = 'pendiente_confirmacion';
      orderData.screenshot = null;
      orderData.reference = '';

      const docRef = await addDocument('orders', orderData);
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
      await updateDocument('orders', orderId, {
        screenshot,
        reference: reference.trim(),
        status: 'pendiente_confirmacion'
      });
      setStep('done');
    } catch (e) { console.error('ERROR COMPROBANTE:', e); alert('Error al subir comprobante: ' + (e?.message || e)); }
    finally { setUploading(false); }
  };

  const getShippingLabel = () => {
    if (shippingZone === 'resto') {
      const c = COURIER_OPTIONS.find(c => c.value === courier);
      return 'Resto del pais - ' + (c ? c.label : '') + ' ($' + shippingCost.toFixed(2) + ')';
    }
    const zone = SHIPPING_ZONES.find(z => z.value === shippingZone);
    return zone ? zone.label + (zone.cost === 0 ? ' (Gratis)' : ' ($' + zone.cost.toFixed(2) + ')') : '';
  };

  const getNextCouponHint = () => {
    const next = (availableCoupons || [])
      .filter(c => c.active && !(c.minPurchase && total >= c.minPurchase))
      .sort((a, b) => (a.minPurchase || 0) - (b.minPurchase || 0))[0];
    if (!next || (next.minPurchase && total >= next.minPurchase)) return null;
    const label = next.type === 'free_shipping' ? 'env\u00EDo gratis' : next.type === 'percentage' ? `${next.discount}% de descuento` : `$${next.discount} de descuento`;
    return { minPurchase: next.minPurchase || 0, label };
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
              {z.label}{z.cost === 0 && z.value !== 'resto' ? ' (Gratis)' : ''}{z.cost > 0 ? ' ($' + z.cost.toFixed(2) + ')' : ''}
            </option>
          ))}
        </select>
        {shippingZone === 'resto' && (
          <>
            <p style={{fontSize:13,color:'var(--gray-500)',marginTop:10,marginBottom:6}}>Elige la empresa de mensajeria:</p>
            <select className="form-input" value={courier} onChange={e => setCourier(e.target.value)}>
              {COURIER_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label} (${c.cost.toFixed(2)})</option>
              ))}
            </select>
          </>
        )}
        {shippingZone !== 'resto' && shippingCost > 0 && (
          <p style={{color:'var(--gray-500)',fontSize:13,marginTop:8}}>Costo de envio: ${shippingCost.toFixed(2)}</p>
        )}
        {shippingZone !== 'resto' && shippingCost === 0 && (
          <p style={{color:'var(--success)',fontSize:13,marginTop:8}}>Envio gratis para esta zona</p>
        )}
      </div>

      <h3 className="section-title mb-15">Metodo de Pago</h3>
      <div className="card">
        <div className="yappy-box">
          <div className="yappy-instruction">Paga con Yappy al numero <strong>{YAPPY_NUMBER}</strong></div>
          <div className="yappy-title" style={{marginTop:8}}>{'\uD83D\uDCB0'} Yappy</div>
        </div>
      </div>

      <h3 className="section-title mb-15">Descuento</h3>
      <div className="card">
        {couponDiscount > 0 || couponFreeShipping ? (
          <div>
            <p style={{color:'var(--success)',fontSize:14,fontWeight:600}}>
              {'\uD83C\uDF89 Descuento aplicado autom\u00E1ticamente:'}
            </p>
            <p style={{color:'var(--success)',fontSize:16,fontWeight:700,marginTop:6}}>
              {couponFreeShipping ? 'Envio gratis' : `-$${couponDiscount.toFixed(2)}`} <span style={{fontSize:13,fontWeight:500,color:'var(--gray-500)'}}>({couponCode})</span>
            </p>
          </div>
        ) : (
          <p style={{color:'var(--gray-500)',fontSize:14}}>{'El mejor descuento se aplica autom\u00E1ticamente al superar el monto m\u00EDnimo de compra.'}</p>
        )}
      </div>

      {(() => {
        const next = getNextCouponHint();
        return next ? (
          <p style={{fontSize:13,color:'var(--gray-500)',marginTop:8}}>
            {'\uD83D\uDCA1 A\u00F1ade'} <strong>${(next.minPurchase - total).toFixed(2)}</strong> {'m\u00E1s para obtener'} <strong>{next.label}</strong>
          </p>
        ) : null;
      })()}

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
          <span style={{fontWeight:600}}>{couponFreeShipping ? 'Gratis (cupon)' : (shippingCost === 0 ? 'Gratis' : '$' + shippingCost.toFixed(2))}</span>
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
        {loading ? 'Procesando...' : 'Confirmar Pedido'}
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