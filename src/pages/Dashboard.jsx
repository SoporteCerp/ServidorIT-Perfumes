import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/firestoreService';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, delivered: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await getDocuments('orders', [], 'createdAt', 'desc');
    setOrders(data);
    setStats({
      total: data.length,
      revenue: data.filter(o => o.paymentStatus === 'pagado').reduce((s, o) => s + (o.total || 0), 0),
      pending: data.filter(o => o.status === 'pendiente').length,
      delivered: data.filter(o => o.status === 'entregado').length
    });
  };

  return (
    <>
      <h3 className="section-title mb-15">Dashboard de Ventas</h3>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-number">${stats.revenue.toFixed(0)}</div>
          <div className="stat-label">Ingresos</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-number">{stats.delivered}</div>
          <div className="stat-label">Entregados</div>
        </div>
      </div>

      <h3 className="section-title mb-15">Ultimos Pedidos</h3>
      {orders.slice(0, 10).map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-number">{order.customerName}</span>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
          </div>
          <div className="order-items">{order.items?.length} productos</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span className="order-total">${order.total?.toFixed(2)}</span>
            <span style={{fontSize:12,color:'var(--gray-400)'}}>
              {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
