import React, { useState, useEffect } from 'react';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', brand: '', price: '', stock: '', category: 'unisex', description: '', image: '' });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price) { alert('Nombre, marca y precio obligatorios'); return; }
    await addDocument('products', {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      active: true
    });
    setModalOpen(false);
    setForm({ name: '', brand: '', price: '', stock: '', category: 'unisex', description: '', image: '' });
    loadProducts();
  };

  const toggleActive = async (id, active) => {
    await updateDocument('products', id, { active: !active });
    loadProducts();
  };

  const updateStock = async (id, stock, type) => {
    const newQty = type === 'add' ? stock + 1 : stock - 1;
    if (newQty < 0) return;
    await updateDocument('products', id, { stock: newQty });
    loadProducts();
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Eliminar "${name}"?`)) { await deleteDocument('products', id); loadProducts(); }
  };

  return (
    <>
      <h3 className="section-title mb-15">Inventario de Perfumes</h3>

      {products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧴</div><div className="empty-text">No hay productos</div></div>
      ) : products.map(p => (
        <div key={p.id} className="admin-card" style={!p.active ? {opacity:0.5} : {}}>
          <div className="admin-header">
            <div>
              <div className="admin-name">{p.name}</div>
              <div className="admin-brand">{p.brand} · {p.category}</div>
            </div>
            <div className="admin-price">${p.price}</div>
          </div>
          <div className="stock-row" style={{marginTop:10}}>
            <div className="stock-controls">
              <button className="stock-btn" onClick={() => updateStock(p.id, p.stock, 'subtract')}>-</button>
              <span className="stock-number">{p.stock}</span>
              <button className="stock-btn" onClick={() => updateStock(p.id, p.stock, 'add')}>+</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className={`btn btn-sm ${p.active ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleActive(p.id, p.active)}>
                {p.active ? 'Desactivar' : 'Activar'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, p.name)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      <button className="fab" onClick={() => setModalOpen(true)}>+</button>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nuevo Perfume</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group"><input className="form-input" placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Marca *" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Precio *" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
              <div className="chip-row">
                {[{v:'hombre',l:'Hombre'},{v:'mujer',l:'Mujer'},{v:'unisex',l:'Unisex'}].map(c => (
                  <button key={c.v} type="button" className={`chip ${form.category === c.v ? 'active' : ''}`} onClick={() => setForm({...form, category: c.v})}>{c.l}</button>
                ))}
              </div>
              <div className="form-group"><input className="form-input" placeholder="URL de imagen" value={form.image} onChange={e => setForm({...form, image: e.target.value})} /></div>
              <div className="form-group"><textarea className="form-input" placeholder="Descripcion" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{minHeight:60}} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
