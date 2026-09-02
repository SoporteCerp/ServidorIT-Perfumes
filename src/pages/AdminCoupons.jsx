import React, { useState, useEffect } from 'react';
import { getCoupons, addCoupon, deleteCoupon } from '../services/couponService';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState('percentage');
  const [minPurchase, setMinPurchase] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    const data = await getCoupons();
    setCoupons(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code) { alert('Codigo obligatorio'); return; }
    if (type !== 'free_shipping' && !discount) { alert('Descuento obligatorio'); return; }
    setLoading(true);
    try {
      await addCoupon(code, type === 'free_shipping' ? 0 : parseFloat(discount), type, parseFloat(minPurchase) || 0);
      setModalOpen(false);
      setCode(''); setDiscount(''); setMinPurchase('');
      loadCoupons();
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id, couponCode) => {
    if (confirm(`Eliminar cupon "${couponCode}"?`)) {
      await deleteCoupon(id);
      loadCoupons();
    }
  };

  const toggleActive = async (id, active) => {
    const { updateCoupon } = await import('../services/couponService');
    await updateCoupon(id, { active: !active });
    loadCoupons();
  };

  const couponTypeLabel = (c) => {
    if (c.type === 'free_shipping') return 'Envio Gratis';
    if (c.type === 'percentage') return `${c.discount}% off`;
    return `$${c.discount} off`;
  };

  return (
    <>
      <h3 className="section-title mb-15">Cupones de Descuento</h3>

      {coupons.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">{'\uD83C\uDFF7\uFE0F'}</div><div className="empty-text">No hay cupones</div></div>
      ) : coupons.map(c => (
        <div key={c.id} className="admin-card" style={!c.active ? {opacity:0.5} : {}}>
          <div className="admin-header">
            <div>
              <div className="admin-name" style={{fontSize:18,fontWeight:700,color:'var(--primary)'}}>{c.code}</div>
              <div className="admin-brand">
                {couponTypeLabel(c)}
                {c.minPurchase > 0 && ` \u00B7 Min $${c.minPurchase}`}
              </div>
              <div className="admin-brand">Usado {c.usedCount || 0} veces</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className={`btn btn-sm ${c.active ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleActive(c.id, c.active)}>
                {c.active ? 'Desactivar' : 'Activar'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id, c.code)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      <button className="fab" onClick={() => setModalOpen(true)}>+</button>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nuevo Cupon</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group"><input className="form-input" placeholder="Codigo (ej: DESCUENTO10)" value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
              <div className="chip-row">
                {[{v:'percentage',l:'Porcentaje %'},{v:'fixed',l:'Monto $'},{v:'free_shipping',l:'Envio Gratis'}].map(t => (
                  <button key={t.v} type="button" className={`chip ${type === t.v ? 'active' : ''}`} onClick={() => setType(t.v)}>{t.l}</button>
                ))}
              </div>
              {type !== 'free_shipping' && (
                <div className="form-group"><input className="form-input" placeholder="Descuento" type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
              )}
              <div className="form-group"><input className="form-input" placeholder="Compra minima (opcional)" type="number" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creando...' : 'Crear Cupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}