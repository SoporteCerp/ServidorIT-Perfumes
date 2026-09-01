import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { getUserRole } from '../services/authService';
import { getDocuments } from '../services/firestoreService';
import { addToCart } from '../services/cartService';
import ImageViewer from '../components/ImageViewer';

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [quantities, setQuantities] = useState({});
  const [added, setAdded] = useState({});
  const [role, setRole] = useState('customer');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerName, setViewerName] = useState('');

  const openViewer = (p) => {
    const imgs = (Array.isArray(p.images) && p.images.filter(Boolean).length > 0)
      ? p.images.filter(Boolean)
      : (p.image ? [p.image] : []);
    if (imgs.length === 0) return;
    setViewerImages(imgs);
    setViewerName(p.name);
    setViewerOpen(true);
  };

  useEffect(() => {
    loadProducts();
    if (auth.currentUser) {
      getUserRole(auth.currentUser.uid).then(r => setRole(r || 'customer')).catch(() => setRole('customer'));
    }
  }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data.filter(p => p.active === true));
  };

  const setQty = (id, value) => setQuantities(prev => ({ ...prev, [id]: value }));

  const handleAdd = (e, p) => {
    e.stopPropagation();
    const qty = quantities[p.id] || 1;
    addToCart(p, qty);
    setAdded(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 1500);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || p.category === filter;
    return matchSearch && matchFilter;
  });

  const firstLine = (desc) => desc ? desc.split('\n')[0] : '';

  return (
    <>
      <input className="search-bar" placeholder="Buscar perfume..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="filter-row">
        {[{v:'todos',l:'Todos'},{v:'hombre',l:'Hombre'},{v:'mujer',l:'Mujer'},{v:'unisex',l:'Unisex'}].map(f => (
          <button key={f.v} className={`filter-chip ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧴</div><div className="empty-text">No hay productos</div></div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="product-image" onClick={(e) => { e.stopPropagation(); openViewer(p); }} style={{cursor:'zoom-in'}}>
                {(() => {
                  const imgs = (Array.isArray(p.images) && p.images.filter(Boolean).length > 0) ? p.images : [p.image];
                  return imgs[0] ? <img src={imgs[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴';
                })()}
              </div>
              <div className="product-info">
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name}</div>
                {p.description && <div className="product-desc">{firstLine(p.description)}</div>}
                <div className="product-price">${p.price}</div>
                {(
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}} onClick={e => e.stopPropagation()}>
                    <div className="catalog-qty">
                      <button onClick={(e) => { e.stopPropagation(); setQty(p.id, Math.max(1, (quantities[p.id] || 1) - 1)); }}>-</button>
                      <span>{quantities[p.id] || 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); const max = p.stock || 99; setQty(p.id, Math.min(max, (quantities[p.id] || 1) + 1)); }}>+</button>
                    </div>
                    <button className={`catalog-add ${added[p.id] ? 'added' : ''}`} onClick={(e) => handleAdd(e, p)}>
                      {added[p.id] ? '✓' : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {viewerOpen && (
        <ImageViewer images={viewerImages} onClose={() => setViewerOpen(false)} productName={viewerName} />
      )}
    </>
  );
}