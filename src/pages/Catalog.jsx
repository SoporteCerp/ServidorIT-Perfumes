import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data.filter(p => p.active === true));
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || p.category === filter;
    return matchSearch && matchFilter;
  });

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
                <div className="product-price">${p.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
