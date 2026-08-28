import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { toggleWishlist, isInWishlist } from '../services/wishlistService';

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [recentOrders, setRecentOrders] = useState([]);
  const [favIds, setFavIds] = useState([]);

  useEffect(() => { loadProducts(); loadRecentOrders(); loadFavorites(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'name', 'asc');
    setProducts(data.filter(p => p.active === true));
  };

  const loadRecentOrders = async () => {
    try {
      const orders = await getDocuments('orders', [{ field: 'userId', operator: '==', value: auth.currentUser.uid }]);
      const sorted = orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecentOrders(sorted.slice(0, 3));
    } catch {}
  };

  const loadFavorites = () => {
    const favs = JSON.parse(localStorage.getItem('esencia_wishlist') || '[]');
    setFavIds(favs);
  };

  const handleFavorite = (e, productId) => {
    e.stopPropagation();
    toggleWishlist(productId);
    loadFavorites();
  };

  const offers = products.filter(p => p.category === 'ofertas');
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || p.category === filter;
    return matchSearch && matchFilter;
  });

  const statusConfig = {
    pendiente_confirmacion: { icon: '⏳', color: 'var(--warning)', text: 'Pendiente' },
    pagado: { icon: '✅', color: 'var(--success)', text: 'Pagado' },
    rechazado: { icon: '❌', color: 'var(--danger)', text: 'Rechazado' },
    procesando: { icon: '📦', color: 'var(--primary)', text: 'Procesando' },
    entregado: { icon: '🎉', color: 'var(--success)', text: 'Entregado' },
  };

  return (
    <>
      {recentOrders.length > 0 && (
        <div className="recent-orders-section">
          <h3 className="section-title">Tus Pedidos Recientes</h3>
          {recentOrders.map(o => {
            const s = statusConfig[o.status] || statusConfig.pendiente;
            return (
              <div key={o.id} className="recent-order-card" onClick={() => navigate('/orders')}>
                <div className="recent-order-left">
                  <div className="recent-order-id">#{o.id.slice(0, 8)}</div>
                  <div className="recent-order-date">{o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('es-ES') : ''}</div>
                </div>
                <div className="recent-order-right">
                  <span className="status-badge" style={{background: s.color + '22', color: s.color}}>{s.icon} {s.text}</span>
                  <div className="recent-order-total">${o.total}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {offers.length > 0 && (
        <div className="offers-banner">
          <div className="offers-header">🏷️ Ofertas Especiales</div>
          <div className="offers-scroll">
            {offers.map(p => (
              <div key={p.id} className="offer-card" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="offer-image">{p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}</div>
                <div className="offer-name">{p.name}</div>
                <div className="offer-price">${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input className="search-bar" placeholder="Buscar perfume..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="filter-row">
        {[{v:'todos',l:'Todos'},{v:'hombre',l:'Hombre'},{v:'mujer',l:'Mujer'},{v:'unisex',l:'Unisex'},{v:'nuevos',l:'Nuevos'},{v:'importados',l:'Importados'}].map(f => (
          <button key={f.v} className={`filter-chip ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧴</div><div className="empty-text">No hay productos</div></div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="product-image" style={{position:'relative'}}>
                {p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
                <button onClick={(e) => handleFavorite(e, p.id)} style={{
                  position:'absolute', top:8, right:8, width:32, height:32, borderRadius:'50%',
                  background:'#fff', border:'none', fontSize:16, cursor:'pointer',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {favIds.includes(p.id) ? '❤️' : '🤍'}
                </button>
              </div>
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
