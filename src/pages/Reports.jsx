import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/firestoreService';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => { loadOrders(); }, [period]);

  const loadOrders = async () => {
    const now = new Date();
    let startDate;
    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

    const filters = startDate ? [{ field: 'createdAt', operator: '>=', value: startDate }] : [];
    
    const data = await getDocuments('orders', filters, 'createdAt', 'desc', 500);
    setOrders(data.filter(o => o.status === 'pagado' || o.status === 'entregado'));
  };

  const filtered = orders;
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
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
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

  const salesByBrand = {};
  filtered.forEach(o => {
    (o.items || []).forEach(item => {
      const brand = item.brand || 'sin marca';
      if (!salesByBrand[brand]) salesByBrand[brand] = { count: 0, revenue: 0 };
      salesByBrand[brand].count += item.quantity || 1;
      salesByBrand[brand].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const exportCSV = () => {
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [[
      'Fecha', 'Pedido', 'Cliente', 'Telefono', 'Email', 'Estado', 'Pago', 'Items',
      'Subtotal', 'Envio', 'IVA', 'Descuento', 'Total'
    ]];
    filtered.forEach(o => {
      const fecha = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('es-PA') : '';
      const items = (o.items || []).map(i => `${i.name} x${i.quantity}`).join(' | ');
      rows.push([
        fecha, o.id, o.customerName, o.customerPhone, o.customerEmail, o.status, o.paymentStatus, items,
        o.subtotal, o.shippingCost, o.iva, o.discount, o.total
      ]);
    });
    const csv = rows.map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ventas_esencia_gale_' + period + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sortedProducts = Object.entries(topProducts).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  const sortedBrands = Object.entries(salesByBrand).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRevenue = Math.max(...Object.values(salesByCategory).map(c => c.revenue), 1);
  const maxBrandRevenue = Math.max(...sortedBrands.map(b => b[1].revenue), 1);

  return (
    <>
      <h3 className="section-title mb-15">Reportes de Ventas</h3>

      <div className="chip-row">
        {[{v:'week',l:'Esta Semana'},{v:'month',l:'Este Mes'},{v:'year',l:'Este Ano'}].map(p => (
          <button key={p.v} className={'chip ' + (period === p.v ? 'active' : '')} onClick={() => setPeriod(p.v)}>{p.l}</button>
        ))}
      </div>

      <button className="btn btn-outline mb-15" onClick={exportCSV} disabled={filtered.length === 0} style={{width:'100%',fontSize:14}}>
        {'\u2B73'} Descargar ventas (CSV) {filtered.length > 0 ? `(${filtered.length})` : ''}
      </button>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">${totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Ingresos</div>
          <div className="stat-icon">{'\uD83D\uDCB0'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalOrders}</div>
          <div className="stat-label">Pedidos</div>
          <div className="stat-icon">{'\uD83D\uDCE6'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${avgOrder.toFixed(2)}</div>
          <div className="stat-label">Promedio</div>
          <div className="stat-icon">{'\uD83D\uDCCA'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Object.keys(salesByCategory).length}</div>
          <div className="stat-label">Categorias</div>
          <div className="stat-icon">{'\uD83C\uDFF7\uFE0F'}</div>
        </div>
      </div>

      <div className="section-title mb-15">Ventas por Categoria</div>
      <div className="card">
        {Object.entries(salesByCategory).map(function([cat, data]) {
          return (
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:4}}>
                <span style={{textTransform:'capitalize'}}>{cat}</span>
                <span style={{fontWeight:600}}>${data.revenue.toFixed(2)}</span>
              </div>
              <div style={{background:'var(--gray-100)',borderRadius:4,height:8}}>
                <div style={{background:'var(--primary)',height:8,borderRadius:4,width:(data.revenue/maxRevenue*100)+'%',transition:'width 0.3s'}}/>
              </div>
              <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{data.count} unidades</div>
            </div>
          );
        })}
      </div>

      <div className="section-title mb-15">Ventas por Marca</div>
      <div className="card">
        {sortedBrands.map(function([brand, data]) {
          return (
            <div key={brand} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,marginBottom:4}}>
                <span style={{textTransform:'capitalize'}}>{brand}</span>
                <span style={{fontWeight:600}}>${data.revenue.toFixed(2)}</span>
              </div>
              <div style={{background:'var(--gray-100)',borderRadius:4,height:8}}>
                <div style={{background:'#25D366',height:8,borderRadius:4,width:(data.revenue/maxBrandRevenue*100)+'%',transition:'width 0.3s'}}/>
              </div>
              <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{data.count} unidades</div>
            </div>
          );
        })}
        {sortedBrands.length === 0 && (
          <p style={{color:'var(--gray-400)',fontSize:14}}>No hay datos de ventas por marca</p>
        )}
      </div>

      <div className="section-title mb-15">Productos Mas Vendidos</div>
      <div className="card">
        {sortedProducts.map(function([name, data], i) {
          return (
            <div key={name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i < sortedProducts.length - 1 ? '1px solid var(--gray-100)' : 'none'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{i + 1}. {name}</div>
                <div style={{fontSize:12,color:'var(--gray-400)'}}>{data.brand} · {data.count} vendidos</div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)'}}>${data.revenue.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      <div className="section-title mb-15">Ventas Mensuales</div>
      <div className="card">
        {Object.entries(salesByMonth).sort(function(a,b) { return b[0].localeCompare(a[0]); }).slice(0, 6).map(function([month, data]) {
          const parts = month.split('-');
          const monthName = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1).toLocaleDateString('es-ES', { month: 'long' });
          return (
            <div key={month} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gray-100)'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,textTransform:'capitalize'}}>{monthName} {parts[0]}</div>
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