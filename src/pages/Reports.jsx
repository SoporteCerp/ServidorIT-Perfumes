import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/firestoreService';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const data = await getDocuments('orders');
    setOrders(data.filter(o => o.status === 'pagado' || o.status === 'entregado'));
  };

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      const date = o.createdAt ? new Date(o.createdAt.seconds * 1000) : new Date();
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      } else if (period === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (period === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = getFilteredOrders();
  const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filtered.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const salesByCategory = {};
  filtered.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = item.category || 'sin categoria';
      if (!salesByCategory[cat]) salesByCategory[cat] = { count: 0, revenue: 0 };
      salesByCategory[cat].count += item.quantity || 1;
      salesByCategory[cat].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const salesByMonth = {};
  filtered.forEach(o => {
    const date = o.createdAt ? new Date(o.createdAt.seconds * 1000) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!salesByMonth[key]) salesByMonth[key] = { count: 0, revenue: 0 };
    salesByMonth[key].count++;
    salesByMonth[key].revenue += o.total || 0;
  });

  const topProducts = {};
  filtered.forEach(o => {
    (o.items || []).forEach(item => {
      if (!topProducts[item.name]) topProducts[item.name] = { count: 0, revenue: 0, brand: item.brand };
      topProducts[item.name].count += item.quantity || 1;
      topProducts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const sortedProducts = Object.entries(topProducts).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  const maxRevenue = Math.max(...Object.values(salesByCategory).map(c => c.revenue), 1);

  return (
    <>
      <h3 className="section-title mb-15">Reportes de Ventas</h3>

      <div className="chip-row">
        {[{v:'week',l:'Esta Semana'},{v:'month',l:'Este Mes'},{v:'year',l:'Este Año'}].map(p => (
          <button key={p.v} className={`chip ${period === p.v ? 'active' : ''}`} onClick={() => setPeriod(p.v)}>{p.l}</button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">${totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Ingresos</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalOrders}</div>
          <div className="stat-label">Pedidos</div>
          <div className="stat-icon">📦</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${avgOrder.toFixed(2)}</div>
          <div className="stat-label">Promedio</div>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Object.keys(salesByCategory).length}</div>
          <div className="stat-label">Categorias</div>
          <div className="stat-icon">🏷️</div>
        </div>
      </div>

      <div className="section-title mb-15">Ventas por Categoria</div>
      <div className="card">
        {Object.entries(salesByCategory).map(([cat, data]) => (
          <div key={cat} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:4}}>
              <span style={{textTransform:'capitalize'}}>{cat}</span>
              <span style={{fontWeight:600}}>${data.revenue.toFixed(2)}</span>
            </div>
            <div style={{background:'var(--gray-100)',borderRadius:4,height:8}}>
              <div style={{background:'var(--primary)',height:8,borderRadius:4,width:`${(data.revenue/maxRevenue)*100}%`,transition:'width 0.3s'}}/>
            </div>
            <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{data.count} unidades</div>
          </div>
        ))}
      </div>

      <div className="section-title mb-15">Productos Mas Vendidos</div>
      <div className="card">
        {sortedProducts.map(([name, data], i) => (
          <div key={name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i < sortedProducts.length - 1 ? '1px solid var(--gray-100)' : 'none'}}>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{i + 1}. {name}</div>
              <div style={{fontSize:12,color:'var(--gray-400)'}}>{data.brand} · {data.count} vendidos</div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)'}}>${data.revenue.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="section-title mb-15">Ventas Mensuales</div>
      <div className="card">
        {Object.entries(salesByMonth).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 6).map(([month, data]) => {
          const [y, m] = month.split('-');
          const monthName = new Date(y, m - 1).toLocaleDateString('es-ES', { month: 'long' });
          return (
            <div key={month} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gray-100)'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,textTransform:'capitalize'}}>{monthName} {y}</div>
                <div style={{fontSize:12,color:'var(--gray-400)'}}>{data.count} pedidos</div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)'}}>${data.revenue.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
