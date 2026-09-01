import React, { useState, useEffect } from 'react';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { recordPrice } from '../services/priceHistoryService';

const defaultForm = { name: '', brand: '', price: '', cost: '', stock: '', category: 'unisex', description: '', image: '' };

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data);
  };

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setImagePreview(null); setModalOpen(true); };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, brand: p.brand, price: p.price, cost: p.cost ?? '', stock: p.stock, category: p.category, description: p.description || '', image: p.image || '' });
    setImagePreview(p.image || null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { alert('Imagen muy grande. Maximo 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setForm({...form, image: ev.target.result});
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price) { alert('Nombre, marca y precio obligatorios'); return; }
    const data = { ...form, price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : parseFloat(form.price), stock: parseInt(form.stock) || 0 };
    if (editingId) {
      const oldProduct = products.find(p => p.id === editingId);
      if (oldProduct && oldProduct.price !== data.price) {
        await recordPrice(editingId, data.price);
      }
      await updateDocument('products', editingId, data);
    } else {
      const docRef = await addDocument('products', { ...data, active: true });
      await recordPrice(docRef, data.price);
    }
    setModalOpen(false);
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
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{width:60,height:60,borderRadius:10,background:'linear-gradient(135deg, #f3e8ff, #fce7f3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,overflow:'hidden'}}>
              {p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
            </div>
            <div style={{flex:1}}>
              <div className="admin-name">{p.name}</div>
              <div className="admin-brand">{p.brand} · {p.category}</div>
              <div className="admin-price">${p.price}</div>
              <div style={{fontSize:12,color:'var(--gray-400)'}}>Costo: ${p.cost ?? p.price}</div>
            </div>
          </div>
          <div className="stock-row" style={{marginTop:10}}>
            <div className="stock-controls">
              <button className="stock-btn" onClick={() => updateStock(p.id, p.stock, 'subtract')}>-</button>
              <span className="stock-number">{p.stock}</span>
              <button className="stock-btn" onClick={() => updateStock(p.id, p.stock, 'add')}>+</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-sm btn-primary" onClick={() => openEdit(p)}>Editar</button>
              <button className={`btn btn-sm ${p.active ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleActive(p.id, p.active)}>
                {p.active ? 'Desactivar' : 'Activar'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, p.name)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      <button className="fab" onClick={openAdd}>+</button>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Editar Perfume' : 'Nuevo Perfume'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><input className="form-input" placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Marca *" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Precio de venta *" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Costo (precio de compra)" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
              <div className="chip-row">
                {[{v:'hombre',l:'Hombre'},{v:'mujer',l:'Mujer'},{v:'unisex',l:'Unisex'},{v:'ofertas',l:'Ofertas'},{v:'nuevos',l:'Nuevos'},{v:'importados',l:'Importados'}].map(c => (
                  <button key={c.v} type="button" className={`chip ${form.category === c.v ? 'active' : ''}`} onClick={() => setForm({...form, category: c.v})}>{c.l}</button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Foto del producto</label>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <label className="btn btn-sm btn-outline" style={{cursor:'pointer'}}>
                    📷 Elegir foto
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
                  </label>
                  {form.image && <span style={{fontSize:12,color:'var(--success)'}}>✓ Foto cargada</span>}
                </div>
                {imagePreview && <img src={imagePreview} alt="preview" style={{width:80,height:80,objectFit:'cover',borderRadius:8,marginTop:8}} />}
              </div>
              <div className="form-group"><input className="form-input" placeholder="O URL de imagen" value={form.image} onChange={e => {setForm({...form, image: e.target.value}); setImagePreview(e.target.value);}} /></div>
              <div className="form-group"><textarea className="form-input" placeholder="Descripcion" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{minHeight:80}} /></div>
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
