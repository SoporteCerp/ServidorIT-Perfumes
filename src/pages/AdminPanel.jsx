import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [couponCount, setCouponCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => { loadPanel(); }, []);

  const loadPanel = async () => {
    const [orders, products, coupons, chats] = await Promise.all([
      getDocuments('orders', [], 'createdAt', 'desc', 400),
      getDocuments('products', [], 'name', 'asc', 999),
      getDocuments('coupons', [], 'createdAt', 'desc', 200),
      getDocuments('chats', [], 'updatedAt', 'desc', 200)
    ]);

    const today = new Date().toDateString();
    const isToday = (t) => t && t.toDate && new Date(t.toDate()).toDateString() === today;

    setPendingPayments(orders.filter(o => o.status === 'pendiente_confirmacion').length);

    let sales = 0; let ordersToday = 0;
    orders.forEach(o => {
      if (isToday(o.createdAt)) ordersToday++;
      if (o.paymentStatus === 'pagado' && isToday(o.createdAt)) sales += (o.total || 0);
    });
    setTodaySales(sales);
    setTodayOrders(ordersToday);

    setProductCount(products.length);
    setLowStock(products.filter(p => p.active !== false && p.stock <= (p.minStock || 5)).length);

    setCouponCount(coupons.filter(c => c.active !== false).length);
    setChatCount(chats.length);
  };

  const fmt = (n) => '$' + (n || 0).toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const stats = [
    { icon: '⏳', label: 'Pagos por confirmar', value: String(pendingPayments), tone: pendingPayments > 0 ? 'warn' : 'ok' },
    { icon: '💰', label: 'Ventas de hoy', value: fmt(todaySales), tone: 'ok' },
    { icon: '📦', label: 'Pedidos de hoy', value: String(todayOrders), tone: 'ok' },
    { icon: '⚠️', label: 'Perfumes con stock bajo', value: String(lowStock), tone: lowStock > 0 ? 'danger' : 'ok' }
  ];

  const tools = [
    { icon: '📦', title: 'Pedidos y pagos', desc: 'Confirmar comprobantes, estados y entregas', path: '/dashboard', count: pendingPayments, countLabel: pendingPayments > 0 ? `${pendingPayments} por confirmar` : '' },
    { icon: '🧴', title: 'Inventario', desc: `${productCount} perfumes, agregar, editar y ofertas`, path: '/inventory', count: lowStock, countLabel: lowStock > 0 ? `${lowStock} con stock bajo` : '' },
    { icon: '📊', title: 'Ventas y reportes', desc: 'Reportes, historial y tendencias', path: '/reports', count: null, countLabel: '' },
    { icon: '🎟️', title: 'Cupones', desc: 'Crear y administrar descuentos para clientes', path: '/coupons', count: couponCount, countLabel: `${couponCount} activos` },
    { icon: '💬', title: 'Chat con clientes', desc: 'Atencion en tiempo real', path: '/chat', count: chatCount, countLabel: `${chatCount} conversaciones` },
    { icon: '📍', title: 'Ubicaciones', desc: 'Agregar tiendas y puntos de entrega', path: '/stores', count: null, countLabel: '' },
    { icon: '👤', title: 'Mi perfil', desc: 'Datos, foto de perfil y configuracion', path: '/profile', count: null, countLabel: '' },
    { icon: '🛍️', title: 'Ver la tienda', desc: 'La tienda como la ve el cliente', path: '/', count: null, countLabel: '' }
  ];

  return (
    <>
      <h3 className="section-title mb-15">Panel de administración</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: -10, marginBottom: 15 }}>
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="panel-stats">
        {stats.map(s => (
          <div key={s.label} className={`panel-stat panel-stat-${s.tone}`}>
            <div className="panel-stat-icon">{s.icon}</div>
            <div className="panel-stat-value">{s.value}</div>
            <div className="panel-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel-grid">
        {tools.map(t => (
          <div key={t.path + t.title} className="panel-card" onClick={() => navigate(t.path)} role="button" tabIndex={0} aria-label={t.title}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(t.path); } }}>
            <div className="panel-card-top">
              <span className="panel-card-icon">{t.icon}</span>
              {t.count !== null && t.count > 0 && <span className="panel-card-badge">{t.count}</span>}
            </div>
            <div className="panel-card-title">{t.title}</div>
            <div className="panel-card-desc">{t.desc}</div>
            {t.countLabel && <div className="panel-card-note">{t.countLabel}</div>}
          </div>
        ))}
      </div>
    </>
  );
}