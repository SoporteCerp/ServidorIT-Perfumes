import React, { useState, useEffect } from 'react';
import { getCoupons, addCoupon, deleteCoupon, updateCoupon } from '../services/couponService';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState('percentage');
  const [minPurchase, setMinPurchase] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    const data = await getCoupons();
    setCoupons(data);
  };

  const hasUnsaved = code || discount || minPurchase || expiresAt;

  const closeModal = () => {
    if (hasUnsaved && !confirm('\u00BFDescartar los cambios del cup\u00F3n?')) return;
    setModalOpen(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!code) { toast.warning('C\u00F3digo obligatorio'); return; }
    if (type !== 'free_shipping' && !discount) { toast.warning('Descuento obligatorio'); return; }
    setLoading(true);
    try {
      await addCoupon(code, type === 'free_shipping' ? 0 : parseFloat(discount), type, parseFloat(minPurchase) || 0, expiresAt ? new Date(expiresAt) : null);
      setModalOpen(false);
      setCode(''); setDiscount(''); setMinPurchase(''); setExpiresAt('');
      loadCoupons();
    } catch (e) { console.error('Error al crear cupon', e); toast.error('Error', 'No se pudo crear el cup\u00F3n'); }
    setLoading(false);
  };

  const handleDelete = async (id, couponCode) => {
    if (confirm(`Eliminar cupon "${couponCode}"?`)) {
      try {
        await deleteCoupon(id);
        loadCoupons();
      } catch (e) { console.error('Error al eliminar cupon', e); toast.error('Error', 'No se pudo eliminar el cup\u00F3n'); }
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await updateCoupon(id, { active: !active });
      loadCoupons();
    } catch (e) { console.error('Error al actualizar cupon', e); toast.error('Error', 'No se pudo actualizar el cup\u00F3n'); }
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
        <EmptyState icon="🏷️" title="No hay cupones" subtext="Crea el primer cupon de descuento" />
      ) : coupons.map(c => (
        <div key={c.id} className="admin-card" style={!c.active ? {opacity:0.5} : {}}>
          <div className="admin-header">
            <div>
              <div className="admin-name" style={{fontSize:18,fontWeight:700,color:'var(--primary)'}}>{c.code}</div>
              <div className="admin-brand">
                {couponTypeLabel(c)}
                {c.minPurchase > 0 && ` \u00B7 Min $${c.minPurchase}`}
                {c.expiresAt && ` \u00B7 Vence ${new Date(c.expiresAt.seconds * 1000).toLocaleDateString()}`}
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

      <button className="fab" onClick={() => setModalOpen(true)} aria-label="Agregar cupon">+</button>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
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
              <div className="form-group"><input className="form-input" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creando...' : 'Crear Cupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}