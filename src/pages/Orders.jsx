import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/firestoreService';
import { auth } from '../services/firebase';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const all = await getDocuments('orders', [{ field: 'userId', operator: '==', value: auth.currentUser.uid }], 'createdAt', 'desc');
    setOrders(all);
  };

  const statusColors = { pendiente: '#F59E0B', procesando: '#3B82F6', entregado: '#10B981' };

  return (
    <>
      <h3 className="section-title mb-15">Mis Pedidos</h3>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-text">No tienes pedidos</div></div>
      ) : orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-number">{order.id.slice(0,8).toUpperCase()}</span>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
          </div>
          <div className="order-items">
            {order.items?.map((item, i) => (
              <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
            <span className="order-total">${order.total?.toFixed(2)}</span>
            <span style={{fontSize:12,color:'var(--gray-400)'}}>
              {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
            </span>
          </div>
          <div style={{marginTop:8,fontSize:13,color:'var(--gray-500)'}}>
            Pago: <span className={`badge badge-${order.paymentStatus}`}>{order.paymentStatus}</span>
          </div>
        </div>
      ))}
    </>
  );
}
