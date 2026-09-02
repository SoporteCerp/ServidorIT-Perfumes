import React, { useState, useEffect } from 'react';
import { getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';
import { sendInvoice } from '../services/emailService';

const statusLabel = {
  pagado: 'Pago aprobado',
  en_transito: 'En camino',
  entregado: 'Entregado',
  pendiente_confirmacion: 'Por confirmar',
  procesando: 'En proceso',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente'
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, cost: 0, profit: 0, pending: 0, delivered: 0 });
  const [viewingImage, setViewingImage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await getDocuments('orders', [], 'createdAt', 'desc');
    setOrders(data);
    const paid = data.filter(o => o.paymentStatus === 'pagado');
    const cost = paid.reduce((s, o) => s + (o.items?.reduce((si, i) => si + ((i.cost ?? i.price) * i.quantity), 0) || 0), 0);
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    setStats({
      total: data.length,
      revenue,
      cost,
      profit: revenue - cost,
      pending: data.filter(o => o.status === 'pendiente_confirmacion').length,
      delivered: data.filter(o => o.status === 'entregado').length
    });
  };

  const confirmPayment = async (order) => {
    if (!confirm(`Confirmar pago de $${order.total} de ${order.customerName}?`)) return;
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, {
        paymentStatus: 'pagado',
        status: 'procesando'
      });

      if (order.customerEmail) {
        const itemsText = order.items?.map(i => `- ${i.name} x${i.quantity} = $${(i.price * i.quantity).toFixed(2)}`).join('\n');
        await sendInvoice({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderId: order.id,
          items: order.items?.map(i => ({ name: i.name, brand: i.brand, price: i.price, quantity: i.quantity })),
          total: order.total
        });
      }

      loadData();
    } catch (e) { alert('Error al confirmar pago'); }
    finally { setLoadingAction(null); }
  };

  const rejectPayment = async (order) => {
    if (!confirm(`Rechazar pago de ${order.customerName}?`)) return;
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, {
        paymentStatus: 'rechazado',
        status: 'rechazado'
      });
      loadData();
    } catch (e) { alert('Error al rechazar'); }
    finally { setLoadingAction(null); }
  };

  const markDelivered = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'entregado' });
      loadData();
    } catch (e) { alert('Error'); }
    finally { setLoadingAction(null); }
  };

  const markProcessing = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'procesando', paymentStatus: 'pagado' });
      loadData();
    } catch (e) { alert('Error'); }
    finally { setLoadingAction(null); }
  };

  const markInTransit = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'en_transito' });
      loadData();
    } catch (e) { alert('Error'); }
    finally { setLoadingAction(null); }
  };

  const handleDelete = async (order) => {
    if (!confirm(`¿Eliminar el pedido de ${order.customerName} por $${order.total}? Esta accion no se puede deshacer.`)) return;
    setLoadingAction(order.id);
    try {
      await deleteDocument('orders', order.id);
      loadData();
    } catch (e) { alert('Error al eliminar'); }
    finally { setLoadingAction(null); }
  };

  const pendingOrders = orders.filter(o => o.status === 'pendiente_confirmacion');
  const paidOrders = orders.filter(o => o.status === 'pagado' || o.status === 'en_transito' || o.status === 'procesando');

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
          <div className="stat-label">Ingresos (ventas)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🧴</span>
          <div className="stat-number">${stats.cost.toFixed(0)}</div>
          <div className="stat-label">Costo perfumes</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-number">${stats.profit.toFixed(0)}</div>
          <div className="stat-label">Ganancia</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Por Confirmar</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-number">{stats.delivered}</div>
          <div className="stat-label">Entregados</div>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{color:'var(--warning)'}}>⏳ Pagos Pendientes ({pendingOrders.length})</h3>
          {pendingOrders.map(order => (
            <div key={order.id} className="card" style={{borderLeft:'4px solid var(--warning)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{order.customerName}</div>
                  <div style={{fontSize:13,color:'var(--gray-500)'}}>{order.customerPhone}</div>
                  <div style={{fontSize:13,color:'var(--gray-500)'}}>{order.customerEmail}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,fontSize:20,color:'var(--primary-dark)'}}>${order.total?.toFixed(2)}</div>
                  <div style={{fontSize:12,color:'var(--gray-400)'}}>
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>

              <div style={{fontSize:13,color:'var(--gray-500)',marginBottom:10}}>
                {order.items?.map((item, i) => (
                  <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                ))}
              </div>

              {order.screenshot && (
                <div style={{marginBottom:10}}>
                  <p style={{fontSize:13,color:'var(--gray-400)',marginBottom:5}}>Comprobante:</p>
                  <img 
                    src={order.screenshot} 
                    alt="Comprobante" 
                    style={{maxWidth:'100%',maxHeight:200,borderRadius:8,cursor:'pointer',border:'1px solid var(--gray-200)'}}
                    onClick={() => setViewingImage(order.screenshot)}
                  />
                </div>
              )}

              {order.reference && (
                <div className="card" style={{background:'var(--gray-50)',marginBottom:10}}>
                  <p style={{fontSize:12,color:'var(--gray-400)'}}>Referencia Yappy</p>
                  <p style={{fontWeight:700,fontSize:16}}>{order.reference}</p>
                </div>
              )}

              <div style={{display:'flex',gap:10}}>
                <button 
                  className="btn btn-success btn-sm" 
                  style={{flex:1}}
                  onClick={() => confirmPayment(order)}
                  disabled={loadingAction === order.id}
                >
                  {loadingAction === order.id ? '...' : '✓ Confirmar Pago'}
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  style={{flex:1}}
                  onClick={() => rejectPayment(order)}
                  disabled={loadingAction === order.id}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {paidOrders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{marginTop:20}}>✅ Pagos Confirmados</h3>
          {paidOrders.map(order => (
            <div key={order.id} className="order-card" style={{borderLeft:'4px solid var(--success)'}}>
              <div className="order-header">
                <span className="order-number">{order.customerName}</span>
                <span className={`badge badge-${order.status}`}>{statusLabel[order.status] || order.status}</span>
              </div>
              <div className="order-items">{order.items?.length} productos · ${order.total?.toFixed(2)}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                <span style={{fontSize:12,color:'var(--gray-400)'}}>
                  {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
                </span>
                {order.status === 'pagado' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markProcessing(order)} disabled={loadingAction === order.id}>
                    🔧 En proceso
                  </button>
                )}
                {order.status === 'procesando' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markInTransit(order)} disabled={loadingAction === order.id}>
                    🚚 En camino
                  </button>
                )}
                {order.status === 'en_transito' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markDelivered(order)} disabled={loadingAction === order.id}>
                    ✓ Marcar Entregado
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {orders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{marginTop:20}}>📋 Todos los Pedidos ({orders.length})</h3>
          {orders.map(order => {
            const st = statusLabel[order.status] || order.status;
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-number">{order.customerName}</span>
                  <span className={`badge badge-${order.status}`}>{st}</span>
                </div>
                <div className="order-items">
                  {order.items?.map((item, i) => (
                    <span key={i}>{item.name} x{item.quantity}{i < (order.items?.length || 0) - 1 ? ', ' : ''}</span>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,paddingTop:8,borderTop:'1px solid var(--gray-100)'}}>
                  <span style={{fontWeight:700,fontSize:16,color:'var(--primary-dark)'}}>${order.total?.toFixed(2)}</span>
                  <span style={{fontSize:12,color:'var(--gray-400)'}}>
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
                  </span>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => handleDelete(order)}
                  disabled={loadingAction === order.id}
                  style={{width:'100%',marginTop:10,padding:'6px 12px',fontSize:12,color:'#EF4444',borderColor:'#FECACA'}}
                >
                  {loadingAction === order.id ? '...' : '🗑 Eliminar'}
                </button>
              </div>
            );
          })}
        </>
      )}

      {viewingImage && (
        <div className="modal-overlay" onClick={() => setViewingImage(null)} style={{cursor:'pointer'}}>
          <img src={viewingImage} alt="Comprobante" style={{maxWidth:'90%',maxHeight:'90%',borderRadius:12}} />
        </div>
      )}
    </>
  );
}