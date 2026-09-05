import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getDocuments } from '../services/firestoreService';
import ImageViewer from '../components/ImageViewer';
import EmptyState from '../components/EmptyState';
import { isProductNew, isProductOffer, productDiscount, isLowStock, getProductImages } from '../utils/productHelpers';

const VALID_FILTERS = ['todos', 'hombre', 'mujer', 'unisex', 'ofertas', 'nuevos', 'importados'];

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [brandFilter, setBrandFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');
  const [quantities, setQuantities] = useState({});
  const [added, setAdded] = useState({});
  
  const { userRole: role } = useAuth();
  const { addToCart } = useCart();
  
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
    const cat = (searchParams.get('categoria') || '').toLowerCase();
    setFilter(VALID_FILTERS.includes(cat) ? cat : 'todos');
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const brands = useMemo(() => {
    const brandMap = {};
    products.forEach(p => { if (p.brand) brandMap[p.brand] = (brandMap[p.brand] || 0) + 1; });
    return Object.keys(brandMap).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const result = products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'todos'
        || (filter === 'nuevos' ? isProductNew(p)
          : filter === 'ofertas' ? isProductOffer(p)
            : filter === 'importados' ? p.category === 'importados'
              : p.category === filter);
      const matchBrand = !brandFilter || p.brand === brandFilter;
      const price = parseFloat(p.price) || 0;
      const matchMin = minPrice === '' || price >= parseFloat(minPrice);
      const matchMax = maxPrice === '' || price <= parseFloat(maxPrice);
      return matchSearch && matchFilter && matchBrand && matchMin && matchMax;
    });

    if (sort === 'price-asc') result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    else if (sort === 'price-desc') result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    else if (sort === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return result;
  }, [products, search, filter, brandFilter, minPrice, maxPrice, sort]);

  const firstLine = (desc) => desc ? desc.split('\n')[0] : '';

  const [openFilters, setOpenFilters] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [products]);

  const offerCount = products.filter(isProductOffer).length;
  const newCount = products.filter(isProductNew).length;

  const chips = [
    { v: 'todos', l: 'Todos', count: products.length },
    { v: 'hombre', l: 'Hombre', count: categoryCounts.hombre || 0 },
    { v: 'mujer', l: 'Mujer', count: categoryCounts.mujer || 0 },
    { v: 'unisex', l: 'Unisex', count: categoryCounts.unisex || 0 },
    { v: 'importados', l: 'Importados', count: categoryCounts.importados || 0 },
    { v: 'ofertas', l: 'Ofertas', count: offerCount },
    { v: 'nuevos', l: 'Nuevos', count: newCount }
  ];

  const priceList = useMemo(() => {
    return products.map(p => parseFloat(p.price) || 0).filter(v => v > 0).sort((a, b) => a - b);
  }, [products]);

  const pmin = priceList[0] || 0;
  const pmax = priceList[priceList.length - 1] || 100;
  const pstep = Math.round((pmax - pmin) / 3);
  const pricePresets = [
    { label: `Hasta $${pmin + pstep}`, min: '', max: String(pmin + pstep) },
    { label: `$${pmin + pstep} - $${pmax - pstep}`, min: String(pmin + pstep), max: String(pmax - pstep) },
    { label: `Desde $${pmax - pstep}`, min: String(pmax - pstep), max: '' }
  ];

  const activeFilterCount = (filter !== 'todos' ? 1 : 0)
    + (brandFilter ? 1 : 0)
    + (minPrice !== '' || maxPrice !== '' ? 1 : 0)
    + (sort !== 'default' ? 1 : 0);

  const clearFilters = () => {
    setFilter('todos');
    setBrandFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSort('default');
    setSearchInput('');
    setSearch('');
  };

  const selectCategory = (v) => {
    setFilter(v);
    const params = new URLSearchParams(searchParams);
    if (v === 'todos') params.delete('categoria');
    else params.set('categoria', v);
    setSearchParams(params, { replace: true });
  };

  const applyPrice = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
    setOpenFilters(true);
  };

  return (
    <>
      <div className="catalog-filter-bar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>{'\uD83D\uDD0D'}</span>
          {searchInput && (
            <button className="search-clear" onClick={() => { setSearchInput(''); setSearch(''); }} aria-label="Limpiar busqueda">{'\u2715'}</button>
          )}
          <input className="search-bar search-icon-pad" placeholder="Buscar perfume o marca..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>

        <div className="filter-row">
          {chips.map(f => (
            <button key={f.v} className={`filter-chip ${filter === f.v ? 'active' : ''}`} onClick={() => selectCategory(f.v)}>
              {f.l}
              <span className="chip-count">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="filter-toolbar">
          <button className={`filter-btn ${openFilters ? 'open' : ''}`} onClick={() => setOpenFilters(o => !o)}>
            <span className="filter-btn-chevron">{openFilters ? '\u25B2' : '\u25BC'}</span> Filtros
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button className="filter-clear" onClick={clearFilters}>{'\u2715'} Limpiar filtros</button>
          )}
        </div>

        {openFilters && (
          <div className="filter-panel">
            <select className="filter-select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
              <option value="">Marca: Todas</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="default">Orden: Por defecto</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre: A-Z</option>
            </select>
            <div className="price-presets">
              {pricePresets.map(pr => (
                <button
                  key={pr.label}
                  className={`filter-chip ${minPrice === pr.min && maxPrice === pr.max ? 'active' : ''}`}
                  onClick={() => applyPrice(pr.min, pr.max)}
                >
                  {pr.label}
                </button>
              ))}
            </div>
            <div className="filter-toolbar">
              <input className="price-input" placeholder={`Desde $${pmin}`} type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span className="price-sep">a</span>
              <input className="price-input" placeholder={`Hasta $${pmax}`} type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="catalog-results-bar">
        <span className="catalog-count">{filtered.length} {filtered.length === 1 ? 'perfume' : 'perfumes'}</span>
        {search.trim() && <span className="catalog-search-chip">"{search}"</span>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🧴" title="No hay productos" subtext={(activeFilterCount > 0 || search.trim()) ? 'Prueba con otros filtros o busca diferente' : undefined} />
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="product-image" onClick={(e) => { e.stopPropagation(); openViewer(p); }} style={{cursor:'zoom-in'}}>
                {(() => {
                  const imgs = getProductImages(p);
                  return imgs[0] ? <img src={imgs[0]} alt={p.name} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴';
                })()}
                <div className="product-badges">
                  {isProductOffer(p) && <span className="prod-badge badge-offer">-{productDiscount(p)}%</span>}
                  {isProductNew(p) && <span className="prod-badge badge-new">NUEVO</span>}
                  {p.category === 'importados' && <span className="prod-badge badge-imported">IMPORTADO</span>}
                </div>
              </div>
              <div className="product-info">
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name}</div>
                {p.description && <div className="product-desc">{firstLine(p.description)}</div>}
                <div className="product-price-line">
                  {isProductOffer(p) && <span className="price-old">${p.originalPrice}</span>}
                  <span className={`product-price ${isProductOffer(p) ? 'price-offer' : ''}`}>${p.price}</span>
                  {isLowStock(p) && <span className="stock-low-chip">Quedan pocos</span>}
                </div>
                {(
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}} onClick={e => e.stopPropagation()}>
                    <div className="catalog-qty">
                      <button onClick={(e) => { e.stopPropagation(); setQty(p.id, Math.max(1, (quantities[p.id] || 1) - 1)); }} aria-label={`Quitar cantidad de ${p.name}`}>-</button>
                      <span>{quantities[p.id] || 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); const max = p.stock || 99; setQty(p.id, Math.min(max, (quantities[p.id] || 1) + 1)); }} aria-label={`Agregar cantidad de ${p.name}`}>+</button>
                    </div>
                    <button className={`catalog-add ${added[p.id] ? 'added' : ''}`} onClick={(e) => handleAdd(e, p)} aria-label={`Agregar ${p.name} al carrito`}>
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