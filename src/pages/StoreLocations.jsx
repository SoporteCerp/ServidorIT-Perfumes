import React, { useState, useEffect } from 'react';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { getUserRole } from '../services/authService';

export default function StoreLocations() {
  const [locations, setLocations] = useState([]);
  const [role, setRole] = useState('customer');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', hours: '', mapUrl: '' });

  useEffect(() => { init(); }, []);

  const init = async () => {
    const r = await getUserRole(auth.currentUser.uid);
    setRole(r);
    const data = await getDocuments('locations', [], 'name', 'asc');
    setLocations(data);
  };

  const openAdd = () => { setEditingId(null); setForm({ name: '', address: '', phone: '', hours: '', mapUrl: '' }); setModalOpen(true); };

  const openEdit = (loc) => {
    setEditingId(loc.id);
    setForm({ name: loc.name, address: loc.address, phone: loc.phone || '', hours: loc.hours || '', mapUrl: loc.mapUrl || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) { alert('Nombre y direccion obligatorios'); return; }
    if (editingId) {
      await updateDocument('locations', editingId, form);
    } else {
      await addDocument('locations', form);
    }
    setModalOpen(false);
    const data = await getDocuments('locations', [], 'name', 'asc');
    setLocations(data);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Eliminar tienda "${name}"?`)) {
      await deleteDocument('locations', id);
      const data = await getDocuments('locations', [], 'name', 'asc');
      setLocations(data);
    }
  };

  const openInMaps = (url) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <>
      <h3 className="section-title mb-15">🏪 Nuestras Tiendas</h3>

      {locations.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏪</div><div className="empty-text">No hay tiendas registradas</div></div>
      ) : locations.map(loc => (
        <div key={loc.id} className="admin-card" style={{cursor: loc.mapUrl ? 'pointer' : 'default'}} onClick={() => openInMaps(loc.mapUrl)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div className="admin-name" style={{fontSize:16}}>{loc.name}</div>
              <div className="admin-brand">📍 {loc.address}</div>
              {loc.phone && <div className="admin-brand">📞 {loc.phone}</div>}
              {loc.hours && <div className="admin-brand">🕐 {loc.hours}</div>}
            </div>
            {role === 'admin' && (
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); openEdit(loc); }}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(loc.id, loc.name); }}>Eliminar</button>
              </div>
            )}
          </div>
          {loc.mapUrl && <div style={{fontSize:12,color:'var(--primary)',marginTop:8}}>🗺️ Ver en mapa</div>}
        </div>
      ))}

      {role === 'admin' && (
        <button className="fab" onClick={openAdd}>+</button>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Editar Tienda' : 'Nueva Tienda'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><input className="form-input" placeholder="Nombre de la tienda *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Direccion *" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Telefono" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Horario (ej: 9am-6pm)" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="URL de Google Maps (opcional)" value={form.mapUrl} onChange={e => setForm({...form, mapUrl: e.target.value})} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
