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
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [listening, setListening] = useState(false);

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

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Tu navegador no soporta busqueda por voz');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => { setSearch(e.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const offers = products.filter(p => p.category === 'ofertas');
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || p.category === filter;
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchSearch && matchFilter && matchPrice;
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

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <div style={{flex:1,position:'relative'}}>
          <input className="search-bar" placeholder="Buscar perfume..." value={search} onChange={e => setSearch(e.target.value)} style={{marginBottom:0}} />
          <button onClick={startVoiceSearch} style={{
            position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', fontSize:20, cursor:'pointer', padding:5
          }}>
            {listening ? '🔴' : '🎤'}
          </button>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} style={{
          background: showFilters ? 'var(--primary)' : 'var(--gray-100)',
          color: showFilters ? '#fff' : 'var(--gray-700)',
          border:'none', borderRadius:12, padding:'0 14px', fontSize:20, cursor:'pointer'
        }}>
          ⚙️
        </button>
      </div>

      {showFilters && (
        <div style={{background:'#fff',borderRadius:12,padding:16,marginBottom:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Rango de precio: ${priceRange[0]} - ${priceRange[1]}</div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--gray-400)'}}>$0</span>
            <input type="range" min="0" max="500" value={priceRange[0]} onChange={e => setPriceRange([parseInt(e.target.value), priceRange[1]])} style={{flex:1}} />
            <input type="range" min="0" max="500" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])} style={{flex:1}} />
            <span style={{fontSize:12,color:'var(--gray-400)'}}>$500</span>
          </div>
        </div>
      )}

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
