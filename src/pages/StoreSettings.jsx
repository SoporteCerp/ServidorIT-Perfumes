import React, { useState, useEffect } from 'react';
import { getStoreSettings, saveStoreSettings, DEFAULT_STORE } from '../services/storeSettingsService';
import { toast } from '../components/Toast';

export default function StoreSettings() {
  const [form, setForm] = useState(DEFAULT_STORE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const s = await getStoreSettings();
      setForm(s);
    } catch (e) { console.error('Error al cargar datos de la tienda', e); }
    setLoading(false);
  };

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.warning('Falta el nombre', 'Escribe el nombre de la tienda'); return; }
    const digits = form.whatsapp.replace(/\D/g, '');
    if (!digits) { toast.warning('Numero de WhatsApp', 'Escribe el numero de WhatsApp'); return; }
    setSaving(true);
    try {
      const s = await saveStoreSettings(form);
      setForm(s);
      toast.success('Guardado', 'Los datos de la tienda se actualizaron');
    } catch (err) { console.error(err); toast.error('Error', 'No se pudo guardar'); }
    setSaving(false);
  };

  if (loading) return <div className="empty-state"><div className="empty-icon">{'\u23F3'}</div></div>;

  return (
    <>
      <h3 className="section-title mb-15">{'Datos de la Tienda'}</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: -10, marginBottom: 15 }}>
        Estos datos se usan en el checkout, los botones de WhatsApp, el home y la factura.
      </p>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Nombre de la tienda</label>
          <input className="form-input" value={form.name} onChange={set('name')} />
        </div>

        <div className="form-group">
          <label className="form-label">Numero de Yappy</label>
          <input className="form-input" placeholder="6268-6706" value={form.yappy} onChange={set('yappy')} />
        </div>

        <div className="form-group">
          <label className="form-label">Numero de WhatsApp (codigo pais + numero, sin simbolos)</label>
          <input className="form-input" placeholder="50767238540" value={form.whatsapp} onChange={set('whatsapp')} />
        </div>

        <div className="form-group">
          <label className="form-label">Ciudad / zona de entrega</label>
          <input className="form-input" placeholder="Panama" value={form.address} onChange={set('address')} />
        </div>

        <div className="form-group">
          <label className="form-label">Horario</label>
          <input className="form-input" placeholder="Lun a Sab 9am - 7pm" value={form.hours} onChange={set('hours')} />
        </div>

        <button className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </>
  );
}