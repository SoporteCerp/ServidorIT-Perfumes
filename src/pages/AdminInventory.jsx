import React, { useState, useEffect } from 'react';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { recordPrice } from '../services/priceHistoryService';
import { uploadProductImage } from '../services/storageService';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

const defaultForm = { name: '', brand: '', price: '', cost: '', stock: '', minStock: '', category: 'unisex', description: '', image: '', images: [] };

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data);
  };

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setImagePreview(null); setModalOpen(true); };

  const openEdit = (p) => {
    const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setEditingId(p.id);
    setForm({ name: p.name, brand: p.brand, price: p.price, cost: p.cost ?? '', stock: p.stock, minStock: p.minStock ?? '', category: p.category, description: p.description || '', image: imgs[0] || '', images: imgs });
    setImagePreview(imgs[0] || null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file) return;
      if (file.size > 800000) { toast.warning('Imagen muy grande', 'M\u00E1ximo 800KB'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(prev => {
          const next = { ...prev, images: [...(prev.images || []), ev.target.result], image: prev.images.length === 0 ? ev.target.result : prev.image };
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  const addImageUrl = () => {
    const url = (document.getElementById('img-url-input')?.value || '').trim();
    if (!url) { toast.warning('URL vac\u00EDa', 'Pega una URL de imagen'); return; }
    if (!/^(https?:\/\/)[^\s]+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)) { toast.error('URL inv\u00E1lida', 'Debe ser una imagen (jpg, png, webp...). Este formato requiere conexi\u00F3n'); return; }
    setForm(prev => ({ ...prev, images: [...(prev.images || []), url], image: prev.images.length === 0 ? url : prev.image }));
    if (document.getElementById('img-url-input')) document.getElementById('img-url-input').value = '';
  };

  const removeImage = (idx) => {
    setForm(prev => {
      const next = [...(prev.images || [])];
      next.splice(idx, 1);
      return { ...prev, images: next, image: next[0] || '' };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price) { toast.warning('Faltan datos', 'Nombre, marca y precio son obligatorios'); return; }
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) { toast.warning('Precio inv\u00E1lido', 'El precio debe ser mayor a 0'); return; }
    setSaving(true);
    try {
      const rawImgs = Array.isArray(form.images) ? form.images.filter(Boolean) : [];
      const uploaded = [];
      for (let i = 0; i < rawImgs.length; i++) {
        uploaded.push(await uploadProductImage(rawImgs[i], i));
      }
      const data = { ...form, images: uploaded, image: uploaded[0] || '', price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : parseFloat(form.price), stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 0 };
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
    } catch (err) {
      console.error('Error al guardar producto', err);
      toast.error('Error', 'No se pudo guardar el producto. Verifica las im\u00E1genes');
    }
    setSaving(false);
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

  const closeModal = () => {
    if (modalOpen && Object.values(form).some(v => Array.isArray(v) ? v.length > 0 : String(v).trim() !== '') && !confirm('\u00BFDescartar los cambios sin guardar?')) return;
    setModalOpen(false);
  };

  return (
    <>
      <h3 className="section-title mb-15">Inventario de Perfumes</h3>

      {products.length === 0 ? (
        <EmptyState icon="🧴" title="No hay productos" subtext="Agrega tu primer perfume al inventario" />
      ) : products.map(p => {
        const isLowStock = p.minStock && p.stock <= p.minStock;
        return (
          <div key={p.id} className="admin-card" style={!p.active ? {opacity:0.5} : {}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <div style={{width:60,height:60,borderRadius:10,background:'linear-gradient(135deg, #f3e8ff, #fce7f3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,overflow:'hidden'}}>
                {p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '\uD83E\uDDF4'}
              </div>
              <div style={{flex:1}}>
                <div className="admin-name">{p.name}</div>
                <div className="admin-brand">{p.brand} {'\u00B7'} {p.category}</div>
                <div className="admin-price">${p.price}</div>
                <div style={{fontSize:12,color:'var(--gray-400)'}}>Costo: ${p.cost ?? p.price}</div>
              </div>
              {isLowStock && <span style={{fontSize:18,color:'var(--danger)',fontWeight:700}} title={'Stock bajo! Minimo: ' + (p.minStock || 0)}>{'\u26A0\uFE0F'}</span>}
            </div>
            <div className="stock-row" style={{marginTop:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:13,color:'var(--gray-500)',fontWeight:600}}>Stock</span>
                <div className="catalog-qty">
                  <button onClick={() => updateStock(p.id, p.stock, 'subtract')} aria-label={`Disminuir stock de ${p.name}`}>-</button>
                  <span>{p.stock}</span>
                  <button onClick={() => updateStock(p.id, p.stock, 'add')} aria-label={`Aumentar stock de ${p.name}`}>+</button>
                </div>
                {isLowStock && <span style={{fontSize:11,color:'var(--danger)',fontWeight:500}}>Min: {p.minStock}</span>}
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
        );
      })}

      <button className="fab" onClick={openAdd} aria-label="Agregar producto">+</button>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Editar Perfume' : 'Nuevo Perfume'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><input className="form-input" placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Marca *" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Precio de venta *" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div className="form-group"><input className="form-input" placeholder="Costo (precio de compra)" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
              <div style={{display:'flex',gap:10}}>
                <div className="form-group" style={{flex:1}}><input className="form-input" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
                <div className="form-group" style={{flex:1}}><input className="form-input" placeholder="Stock minimo" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></div>
              </div>
              <div className="chip-row">
                {[{v:'hombre',l:'Hombre'},{v:'mujer',l:'Mujer'},{v:'unisex',l:'Unisex'},{v:'ofertas',l:'Ofertas'},{v:'nuevos',l:'Nuevos'},{v:'importados',l:'Importados'}].map(c => (
                  <button key={c.v} type="button" className={`chip ${form.category === c.v ? 'active' : ''}`} onClick={() => setForm({...form, category: c.v})}>{c.l}</button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Fotos del producto (puedes agregar varias)</label>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <label className="btn btn-sm btn-outline" style={{cursor:'pointer'}}>
                    {'\uD83D\uDCF7'} + Agregar fotos
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{display:'none'}} />
                  </label>
                  {(form.images || []).length > 0 && <span style={{fontSize:12,color:'var(--success)'}}>{'\u2713'} {(form.images || []).length} foto(s)</span>}
                </div>
                {(form.images || []).length > 0 && (
                  <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                    {(form.images || []).map((img, idx) => (
                      <div key={idx} style={{position:'relative',width:64,height:64}}>
                        <img src={img} alt={`foto ${idx + 1}`} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8,border:'1px solid var(--gray-200)'}} />
                        <button type="button" onClick={() => removeImage(idx)} aria-label={`Eliminar foto ${idx + 1}`} style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'var(--danger)',color:'#fff',border:'none',fontSize:11,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{'\u2715'}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{display:'flex',gap:8}}>
                <input id="img-url-input" className="form-input" placeholder="O URL de imagen" style={{flex:1,marginBottom:0}} />
                <button type="button" className="btn btn-sm btn-outline" style={{marginBottom:0,whiteSpace:'nowrap'}} onClick={addImageUrl}>Agregar</button>
              </div>
              <div className="form-group"><textarea className="form-input" placeholder="Descripcion" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{minHeight:80}} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}