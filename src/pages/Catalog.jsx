import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';
import { addToCart } from '../services/cartService';

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [quantities, setQuantities] = useState({});
  const [added, setAdded] = useState({});

  useEffect(() => { loadProducts(); }, []);

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
              <div className="product-image">{p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}</div>
              <div className="product-info">
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name}</div>
                {p.description && <div className="product-desc">{firstLine(p.description)}</div>}
                <div className="product-price">${p.price}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}} onClick={e => e.stopPropagation()}>
                  <div style={{display:'flex',alignItems:'center',border:'1px solid var(--primary)',borderRadius:6,overflow:'hidden'}}>
                    <button className="qty-btn" style={{background:'#fff',border:'none',cursor:'pointer',padding:'2px 6px',fontSize:12,lineHeight:1}} onClick={(e) => { e.stopPropagation(); setQty(p.id, Math.max(1, (quantities[p.id] || 1) - 1)); }}>-</button>
                    <span style={{minWidth:20,textAlign:'center',fontSize:12,fontWeight:600}}>{quantities[p.id] || 1}</span>
                    <button className="qty-btn" style={{background:'#fff',border:'none',cursor:'pointer',padding:'2px 6px',fontSize:12,lineHeight:1}} onClick={(e) => { e.stopPropagation(); const max = p.stock || 99; setQty(p.id, Math.min(max, (quantities[p.id] || 1) + 1)); }}>+</button>
                  </div>
                  <button className={added[p.id] ? "btn add-cart-btn added" : "btn add-cart-btn"} style={{flex:1,width:40,height:34}} onClick={(e) => handleAdd(e, p)}>
                    {added[p.id] ? '✓' : '🛒'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}