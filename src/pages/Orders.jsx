import React, { useState, useEffect, useRef } from 'react';
import { getDocuments, updateDocument, subscribeToDocuments } from '../services/firestoreService';
import { auth } from '../services/firebase';
import OrderTracker from '../components/OrderTracker';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const statusConfig = {
  pendiente_confirmacion: { label: 'Esperando confirmacion', icon: '\u23F3', color: '#F59E0B', message: 'Tu comprobante esta siendo revisado' },
  en_transito: { label: 'Pendiente de entrega', icon: '\uD83D\uDCE6', color: '#3B82F6', message: 'Tu pago fue confirmado y tu pedido esta en camino' },
  pagado: { label: 'Pago confirmado', icon: '\u2705', color: '#10B981', message: 'Tu pago fue verificado exitosamente' },
  rechazado: { label: 'Pago no verificado', icon: '\u274C', color: '#EF4444', message: 'El comprobante no pudo ser verificado. Contactanos.' },
  procesando: { label: 'En proceso', icon: '\uD83D\uDD27', color: '#3B82F6', message: 'Tu pedido esta siendo preparado' },
  entregado: { label: 'Entregado', icon: '\uD83C\uDF89', color: '#059669', message: 'Tu pedido fue entregado' },
  pendiente: { label: 'Pendiente', icon: '\u23F3', color: '#F59E0B', message: 'Esperando pago' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [resubmitting, setResubmitting] = useState(null);
  const [newScreenshot, setNewScreenshot] = useState(null);
  const [newRef, setNewRef] = useState('');
  const [resubmitOrder, setResubmitOrder] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToDocuments('orders', [{ field: 'userId', operator: '==', value: uid }], 'createdAt', 'desc', 100, (docs) => {
      setOrders(docs);
    });
    return unsub;
  }, []);

  const loadOrders = async () => {
    const all = await getDocuments('orders', [], 'createdAt', 'desc');
    setOrders(all.filter(o => o.userId === auth.currentUser.uid));
  };

  const handleResubmit = async (order) => {
    if (!newScreenshot) { toast.warning('Falta el comprobante', 'Sube el comprobante de pago'); return; }
    if (!newRef.trim()) { toast.warning('Falta la referencia', 'Escribe el n\u00FAmero de referencia'); return; }
    setResubmitting(order.id);
    try {
      await updateDocument('orders', order.id, {
        screenshot: newScreenshot,
        reference: newRef.trim(),
        status: 'pendiente_confirmacion',
        paymentStatus: 'pendiente'
      });
      setNewScreenshot(null);
      setNewRef('');
      setResubmitOrder(null);
      loadOrders();
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo reenviar el comprobante'); }
    setResubmitting(null);
  };

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { compressImage } = await import('../services/imageUtils');
    const compressed = await compressImage(file, 700, 0.6);
    if (compressed) setNewScreenshot(compressed);
    else toast.error('Imagen', 'No se pudo procesar la imagen');
  };

  return (
    <>
      <h3 className="section-title mb-15">Mis Pedidos</h3>
      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No tienes pedidos" subtext="Cuando hagas tu primer pedido lo veras aqui" />
      ) : orders.map(order => {
        const status = statusConfig[order.status] || statusConfig.pendiente;
        return (
          <div key={order.id} className="order-card" style={{borderLeft:'4px solid ' + status.color}}>
            <div className="order-header">
              <span className="order-number">Pedido #{order.id?.slice(0,8).toUpperCase()}</span>
              <span className="badge" style={{background:status.color}}>{status.label}</span>
            </div>

            <div style={{background:status.color + '15',borderRadius:8,padding:12,marginBottom:12}}>
              <span style={{fontSize:18,marginRight:8}}>{status.icon}</span>
              <span style={{fontSize:14,color:status.color,fontWeight:500}}>{status.message}</span>
            </div>

            <OrderTracker order={order} />

            <div className="order-items">
              {order.items?.map((item, i) => (
                <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,paddingTop:10,borderTop:'1px solid var(--gray-100)'}}>
              <span style={{fontSize:20,fontWeight:700,color:'var(--primary-dark)'}}>${order.total?.toFixed(2)}</span>
              <span style={{fontSize:12,color:'var(--gray-400)'}}>
                {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
              </span>
            </div>

            {order.status === 'rechazado' && (
              <div style={{marginTop:10,background:'#FEE2E2',borderRadius:8,padding:12}}>
                <p style={{fontSize:13,color:'#EF4444',fontWeight:500}}>
                  Tu pago no pudo ser verificado. Sube un nuevo comprobante:
                </p>
                <input type="file" ref={fileRef} accept="image/*" style={{display:'none'}} onChange={handleImagePick} />
                <button className="btn btn-sm btn-outline" style={{marginTop:8}} onClick={() => { setResubmitOrder(order.id); fileRef.current?.click(); }}>
                  {newScreenshot && resubmitOrder === order.id ? '\u2713 Comprobante listo' : '\uD83D\uDCF8 Subir comprobante'}
                </button>
                {newScreenshot && resubmitOrder === order.id && (
                  <>
                    <input className="form-input" placeholder="Referencia Yappy" value={newRef} onChange={e => setNewRef(e.target.value)} style={{marginTop:8}} />
                    <button className="btn btn-sm btn-primary" style={{marginTop:8,width:'100%'}} onClick={() => handleResubmit(order)} disabled={resubmitting === order.id}>
                      {resubmitting === order.id ? 'Enviando...' : '\u2713 Reenviar comprobante'}
                    </button>
                  </>
                )}
              </div>
            )}

            </div>
        );
      })}
    </>
  );
}