import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/firestoreService';
import { auth } from '../services/firebase';

const statusConfig = {
  pendiente_confirmacion: { label: 'Esperando confirmacion', icon: '⏳', color: '#F59E0B', message: 'Tu comprobante esta siendo revisado' },
  en_transito: { label: 'Pendiente de entrega', icon: '📦', color: '#3B82F6', message: 'Tu pago fue confirmado y tu pedido esta en camino' },
  pagado: { label: 'Pago confirmado', icon: '✅', color: '#10B981', message: 'Tu pago fue verificado exitosamente' },
  rechazado: { label: 'Pago no verificado', icon: '❌', color: '#EF4444', message: 'El comprobante no pudo ser verificado. Contactanos.' },
  procesando: { label: 'Procesando', icon: '📦', color: '#3B82F6', message: 'Tu pedido esta siendo preparado' },
  entregado: { label: 'Entregado', icon: '🎉', color: '#059669', message: 'Tu pedido fue entregado' },
  pendiente: { label: 'Pendiente', icon: '⏳', color: '#F59E0B', message: 'Esperando pago' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const all = await getDocuments('orders', [], 'createdAt', 'desc');
    setOrders(all.filter(o => o.userId === auth.currentUser.uid));
  };

  return (
    <>
      <h3 className="section-title mb-15">Mis Pedidos</h3>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-text">No tienes pedidos</div></div>
      ) : orders.map(order => {
        const status = statusConfig[order.status] || statusConfig.pendiente;
        return (
          <div key={order.id} className="order-card" style={{borderLeft:`4px solid ${status.color}`}}>
            <div className="order-header">
              <span className="order-number">Pedido #{order.id?.slice(0,8).toUpperCase()}</span>
              <span className="badge" style={{background:status.color}}>{status.label}</span>
            </div>

            <div style={{background:`${status.color}15`,borderRadius:8,padding:12,marginBottom:12}}>
              <span style={{fontSize:18,marginRight:8}}>{status.icon}</span>
              <span style={{fontSize:14,color:status.color,fontWeight:500}}>{status.message}</span>
            </div>

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
                  Tu pago no pudo ser verificado. Por favor contactanos para mas informacion.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}