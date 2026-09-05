import React, { useState, useEffect } from 'react';
import { getDocuments, getDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { sendInvoice } from '../services/emailService';
import { clearNotificationType } from '../services/notificationService';
import { toast } from '../components/Toast';

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
  const [stats, setStats] = useState({ total: 0, revenue: 0, cost: 0, profit: 0, pending: 0, delivered: 0, avgDeliveryDays: 0 });
  const [viewingImage, setViewingImage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    clearNotificationType('order');
    clearNotificationType('payment');
  }, []);

  const loadData = async () => {
    const data = await getDocuments('orders', [], 'createdAt', 'desc', 500);
    setOrders(data);

    const paid = data.filter(o => o.paymentStatus === 'pagado');
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const cost = paid.reduce((s, o) => s + (o.items?.reduce((si, i) => si + ((i.cost ?? i.price) * i.quantity), 0) || 0), 0);
    const pendingCount = data.filter(o => o.status === 'pendiente_confirmacion' && o.screenshot).length;
    const delivered = data.filter(o => o.status === 'entregado');

    let avgDeliveryDays = 0;
    const deliveredTracked = delivered.filter(o => o.createdAt?.toDate && o.deliveredAt?.toDate);
    if (deliveredTracked.length > 0) {
      const totalDays = deliveredTracked.reduce((s, o) => {
        const created = new Date(o.createdAt.toDate());
        const deliveredDate = new Date(o.deliveredAt.toDate());
        const diff = Math.max(0, Math.round((deliveredDate - created) / (1000 * 60 * 60 * 24)));
        return s + diff;
      }, 0);
      avgDeliveryDays = Math.round((totalDays / deliveredTracked.length) * 10) / 10;
    }

    setStats({
      total: data.length,
      revenue,
      cost,
      profit: revenue - cost,
      pending: pendingCount,
      delivered: delivered.length,
      avgDeliveryDays
    });

    import('../services/firestoreService').then(async ({ getOrderStats }) => {
      try {
        const serverStats = await getOrderStats();
        setStats(prev => ({
          ...prev,
          total: serverStats.total,
          revenue: serverStats.revenue,
          pending: serverStats.pending,
          delivered: serverStats.delivered,
          profit: serverStats.revenue - prev.cost
        }));
      } catch (err) {
        console.warn('Agregados del servidor no disponibles, usando calculo local', err);
      }
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
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo confirmar el pago'); }
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
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo rechazar el pago'); }
    finally { setLoadingAction(null); }
  };

  const markDelivered = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'entregado', deliveredAt: new Date() });

      if (!order.stockDeducted && Array.isArray(order.items) && order.items.length > 0) {
        await Promise.all(order.items.map(async (item) => {
          if (!item?.id) return;
          try {
            const product = await getDocument('products', item.id);
            if (!product || typeof product.stock === 'undefined') return;
            const qty = parseInt(item.quantity, 10) || 0;
            const newStock = Math.max(0, (parseInt(product.stock, 10) || 0) - qty);
            await updateDocument('products', item.id, { stock: newStock });
          } catch (e) { console.warn('No se pudo descontar stock de', item.id, e); }
        }));
        await updateDocument('orders', order.id, { stockDeducted: true });
      }

      loadData();
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo completar la accion'); }
    finally { setLoadingAction(null); }
  };

  const markProcessing = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'procesando', paymentStatus: 'pagado' });
      loadData();
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo completar la accion'); }
    finally { setLoadingAction(null); }
  };

  const markInTransit = async (order) => {
    setLoadingAction(order.id);
    try {
      await updateDocument('orders', order.id, { status: 'en_transito' });
      loadData();
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo completar la accion'); }
    finally { setLoadingAction(null); }
  };

  const handleDelete = async (order) => {
    if (!confirm(`\u00BFEliminar el pedido de ${order.customerName} por $${order.total}? Esta accion no se puede deshacer.`)) return;
    setLoadingAction(order.id);
    try {
      await deleteDocument('orders', order.id);
      loadData();
    } catch (e) { console.error(e); toast.error('Error', 'No se pudo eliminar el pedido'); }
    finally { setLoadingAction(null); }
  };

  const handlePrint = () => {
    const pendingOrders = orders.filter(o => o.status === 'pendiente_confirmacion');
    const deliveredOrders = orders.filter(o => o.status === 'entregado');
    const allPaid = orders.filter(o => o.paymentStatus === 'pagado');
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Reporte Esencia Gale</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #B8860B; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 20px; }
    .stat { display: inline-block; margin: 10px 20px 10px 0; }
    .stat strong { font-size: 24px; color: #B8860B; display: block; }
    .stat span { font-size: 12px; color: #888; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #f5f0dc; color: #B8860B; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Esencia Gale - Reporte de Ventas</h1>
  <p>Fecha: ${new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
  <div class="stat"><strong>${stats.total}</strong><span>Total Pedidos</span></div>
  <div class="stat"><strong>$${stats.revenue.toFixed(2)}</strong><span>Ingresos</span></div>
  <div class="stat"><strong>$${stats.profit.toFixed(2)}</strong><span>Ganancia</span></div>
  <div class="stat"><strong>${stats.delivered}</strong><span>Entregados</span></div>
  <div class="stat"><strong>${stats.pending}</strong><span>Pendientes</span></div>
  ${stats.avgDeliveryDays > 0 ? `<div class="stat"><strong>${stats.avgDeliveryDays} dias</strong><span>Prom. Entrega</span></div>` : ''}
  <h2>Pedidos por Estado</h2>
  <table>
    <tr><th>Cliente</th><th>Estado</th><th>Total</th><th>Fecha</th></tr>
    ${orders.map(o => `<tr><td>${o.customerName || '-'}</td><td>${statusLabel[o.status] || o.status}</td><td>$${(o.total || 0).toFixed(2)}</td><td>${o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleDateString() : '-'}</td></tr>`).join('')}
  </table>
  <div class="footer">Esencia Gale - Sistema de Ventas</div>
</body>
</html>`;
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  const pendingOrders = orders.filter(o => o.status === 'pendiente_confirmacion' && o.screenshot);
  const missingPaymentOrders = orders.filter(o => o.status === 'pendiente_confirmacion' && !o.screenshot);
  const paidOrders = orders.filter(o => o.status === 'pagado' || o.status === 'en_transito' || o.status === 'procesando');

  const last7 = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7.push({ key: d.toDateString(), label: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), total: 0 });
  }
  (orders || []).forEach(o => {
    if (o.paymentStatus === 'pagado' && o.createdAt && o.createdAt.toDate) {
      const slot = last7.find(s => s.key === new Date(o.createdAt.toDate()).toDateString());
      if (slot) slot.total += (o.total || 0);
    }
  });
  const maxDay = Math.max(...last7.map(s => s.total), 1);

  const productTotals = {};
  (orders || []).forEach(o => {
    (o.items || []).forEach(it => {
      const name = it.name || 'Producto';
      if (!productTotals[name]) productTotals[name] = { qty: 0, revenue: 0 };
      productTotals[name].qty += it.quantity || 0;
      productTotals[name].revenue += (it.price || 0) * (it.quantity || 0);
    });
  });
  const topProducts = Object.entries(productTotals)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxTopQty = Math.max(...topProducts.map(t => t.qty), 1);

  const formatMoney = (n) => '$' + (n ? n.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0);

  return (
    <>
      <h3 className="section-title mb-15">Dashboard de Ventas</h3>

      <button className="btn btn-outline mb-15" onClick={handlePrint} style={{width:'100%',fontSize:14}}>
        {'\uD83D\uDDA8\uFE0F'} Imprimir reporte
      </button>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">{'\uD83D\uDCE6'}</span>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{'\uD83D\uDCB0'}</span>
          <div className="stat-number">${stats.revenue.toFixed(0)}</div>
          <div className="stat-label">Ingresos (ventas)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{'\uD83E\uDDF4'}</span>
          <div className="stat-number">${stats.cost.toFixed(0)}</div>
          <div className="stat-label">Costo perfumes</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{'\uD83D\uDCC8'}</span>
          <div className="stat-number">${stats.profit.toFixed(0)}</div>
          <div className="stat-label">Ganancia</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{'\u23F3'}</span>
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Por Confirmar</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{'\u2705'}</span>
          <div className="stat-number">{stats.delivered}</div>
          <div className="stat-label">Entregados</div>
        </div>
      </div>

      {stats.avgDeliveryDays > 0 && (
        <div className="delivery-card">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div>
              <div className="delivery-number">{stats.avgDeliveryDays} dias</div>
              <div className="delivery-label">Tiempo promedio de entrega</div>
            </div>
            <div style={{marginLeft:'auto',fontSize:32}}>{'\uD83D\uDE9A'}</div>
          </div>
        </div>
      )}

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-title">📈 Ventas últimos 7 días</div>
          <div className="sales-bars">
            {last7.map(s => (
              <div key={s.key} className="sales-bar-col">
                <span className="sales-bar-value">{s.total > 0 ? formatMoney(s.total) : ''}</span>
                <div className="sales-bar-track">
                  <div className="sales-bar" style={{height: `${Math.max(4, Math.round((s.total / maxDay) * 100))}%`}} />
                </div>
                <span className="sales-bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">🔥 Top productos vendidos</div>
          {topProducts.length === 0 ? (
            <div style={{fontSize:13,color:'var(--gray-400)',textAlign:'center',padding:20}}>Aun no hay ventas para mostrar</div>
          ) : (
            <div className="top-products">
              {topProducts.map(t => (
                <div key={t.name} className="top-product-row">
                  <div className="top-product-head">
                    <span className="top-product-name" title={t.name}>{t.name}</span>
                    <span className="top-product-qty">{t.qty} unid. · {formatMoney(t.revenue)}</span>
                  </div>
                  <div className="top-bar-track">
                    <div className="top-bar-fill" style={{width: `${Math.max(4, Math.round((t.qty / maxTopQty) * 100))}%`}} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {missingPaymentOrders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{color:'var(--gray-500)'}}>{'\u25CB'} Pedidos sin comprobante ({missingPaymentOrders.length})</h3>
          <p style={{fontSize:12,color:'var(--gray-400)',marginTop:-10,marginBottom:12}}>
            El cliente creo el pedido pero aun no sube la imagen ni la referencia de pago. No los confirmes hasta recibir el comprobante.
          </p>
          {missingPaymentOrders.map(order => (
            <div key={order.id} className="card" style={{borderLeft:'4px solid var(--gray-400)',opacity:0.85}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{order.customerName}</div>
                  <div style={{fontSize:13,color:'var(--gray-500)'}}>{order.customerPhone}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,fontSize:20,color:'var(--gray-500)'}}>${order.total?.toFixed(2)}</div>
                  <div style={{fontSize:12,color:'var(--gray-400)'}}>
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
              <div style={{fontSize:13,color:'var(--gray-500)',marginBottom:8}}>
                {order.items?.map((item, i) => (
                  <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
              <div style={{background:'var(--gray-100)',borderRadius:8,padding:10,fontSize:13,color:'var(--gray-500)'}}>
                {'\u23F3'} Esperando comprobante de pago del cliente...
              </div>
            </div>
          ))}
        </>
      )}

      {pendingOrders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{color:'var(--warning)'}}>{'\u23F3'} Pagos Pendientes ({pendingOrders.length})</h3>
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
                  {loadingAction === order.id ? '...' : '\u2713 Confirmar Pago'}
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
          <h3 className="section-title mb-15" style={{marginTop:20}}>{'\u2705'} Pagos Confirmados</h3>
          {paidOrders.map(order => (
            <div key={order.id} className="order-card" style={{borderLeft:'4px solid var(--success)'}}>
              <div className="order-header">
                <span className="order-number">{order.customerName}</span>
                <span className={`badge badge-${order.status}`}>{statusLabel[order.status] || order.status}</span>
              </div>
              <div className="order-items">
                {order.items?.map((item, i) => (
                  <span key={i}>{item.name} x{item.quantity}${item.price?.toFixed(2)}{i < (order.items?.length || 0) - 1 ? ', ' : ''}</span>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                <span style={{fontSize:12,color:'var(--gray-400)'}}>
                  {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : ''}
                </span>
                {order.status === 'pagado' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markProcessing(order)} disabled={loadingAction === order.id}>
                    {'\uD83D\uDD27'} En proceso
                  </button>
                )}
                {order.status === 'procesando' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markInTransit(order)} disabled={loadingAction === order.id}>
                    {'\uD83D\uDE9A'} En camino
                  </button>
                )}
                {order.status === 'en_transito' && (
                  <button className="btn btn-sm btn-outline" onClick={() => markDelivered(order)} disabled={loadingAction === order.id}>
                    {'\u2713'} Marcar Entregado
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {orders.length > 0 && (
        <>
          <h3 className="section-title mb-15" style={{marginTop:20}}>{'\uD83D\uDCCB'} Todos los Pedidos ({orders.length})</h3>
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
                  {loadingAction === order.id ? '...' : '\uD83D\uDDD1 Eliminar'}
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