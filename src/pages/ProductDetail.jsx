import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';
import { addToCart, getCartCount } from '../services/cartService';
import { toggleWishlist, isInWishlist } from '../services/wishlistService';
import { getPriceHistory } from '../services/priceHistoryService';
import { getStoreSettings, DEFAULT_STORE } from '../services/storeSettingsService';
import ImageViewer from '../components/ImageViewer';
import { isProductNew, isProductOffer, productDiscount, isLowStock } from '../utils/productHelpers';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [store, setStore] = useState(DEFAULT_STORE);

  useEffect(() => {
    getStoreSettings().then(setStore).catch(() => setStore(DEFAULT_STORE));
  }, []);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    const all = await getDocuments('products');
    const p = all.find(p => p.id === id);
    setProduct(p);
    setFavorited(isInWishlist(id));
    if (p) {
      const sims = all.filter(x => x.id !== id && x.active && (x.category === p.category || x.brand === p.brand)).slice(0, 4);
      setSimilar(sims);
      const history = await getPriceHistory(id);
      setPriceHistory(history);
    }
  };

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleFavorite = () => {
    toggleWishlist(id);
    setFavorited(!favorited);
  };

  const handleShare = () => {
    const text = `🧴 ${product.name}\nMarca: ${product.brand}\nPrecio: $${product.price}\n\n¡Mira este perfume en Esencia Gale!`;
    if (navigator.share) {
      navigator.share({ title: product.name, text });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (!product) return <div className="empty-state"><div className="empty-icon">⏳</div></div>;

  const descLines = product.description ? product.description.split('\n').filter(l => l.trim()) : [];

  const renderPriceChart = () => {
    if (priceHistory.length < 2) return null;
    const prices = priceHistory.map(h => h.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice || 1;
    const chartHeight = 80;

    return (
      <div style={{marginTop:20,background:'#fff',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>📈 Historial de Precios</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:4,height:chartHeight}}>
          {priceHistory.slice(-10).map((h, i) => {
            const height = ((h.price - minPrice) / range) * (chartHeight - 20) + 20;
            const isLast = i === priceHistory.slice(-10).length - 1;
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:10,color:'var(--gray-400)'}}>${h.price}</div>
                <div style={{
                  width:'100%',height,height:isLast?'var(--primary)':'var(--primary-dark)',
                  borderRadius:4,opacity:isLast?1:0.5,minHeight:8
                }}/>
                <div style={{fontSize:8,color:'var(--gray-400)'}}>
                  {h.createdAt ? new Date(h.createdAt.seconds * 1000).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) : ''}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:12}}>
          <span style={{color:'var(--success)'}}>Min: ${minPrice}</span>
          <span style={{color:'var(--danger)'}}>Max: ${maxPrice}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="detail-image" style={{position:'relative'}}>
        {(() => {
          const images = (Array.isArray(product.images) && product.images.filter(Boolean).length > 0)
            ? product.images.filter(Boolean)
            : (product.image ? [product.image] : []);
          const current = images[imageIndex] || null;
          return current
            ? <img src={current} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'pointer'}} onClick={() => setViewerOpen(true)} />
            : '🧴';
        })()}
        <div style={{position:'absolute',top:15,right:15,display:'flex',gap:8}}>
          <button onClick={handleFavorite} style={{
            width:44, height:44, borderRadius:'50%', background:'#fff', border:'none',
            fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            {favorited ? '❤️' : '🤍'}
          </button>
          <button onClick={handleShare} style={{
            width:44, height:44, borderRadius:'50%', background:'#fff', border:'none',
            fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            📤
          </button>
        </div>
        <div className="product-badges" style={{top:15,left:15,right:'auto'}}>
          {isProductOffer(product) && <span className="prod-badge badge-offer">OFERTA -{productDiscount(product)}%</span>}
          {isProductNew(product) && <span className="prod-badge badge-new">NUEVO</span>}
          {product.category === 'importados' && <span className="prod-badge badge-imported">IMPORTADO</span>}
        </div>
      </div>
      {(() => {
        const images = (Array.isArray(product.images) && product.images.filter(Boolean).length > 0)
          ? product.images.filter(Boolean)
          : (product.image ? [product.image] : []);
        return images.length > 1 ? (
          <div className="gallery-thumbs">
            {images.map((img, i) => (
              <div key={i} className={`gallery-thumb ${i === imageIndex ? 'active' : ''}`} onClick={() => setImageIndex(i)} role="button" tabIndex={0} aria-label={`Ver imagen ${i + 1} de ${product.name}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setImageIndex(i); } }}>
                <img src={img} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
              </div>
            ))}
          </div>
        ) : null;
      })()}
      {viewerOpen && (
        <ImageViewer
          images={(Array.isArray(product.images) && product.images.filter(Boolean).length > 0) ? product.images : [product.image]}
          startIndex={imageIndex}
          onClose={() => setViewerOpen(false)}
          productName={product.name}
        />
      )}
      <div className="detail-info">
        <div className="detail-brand">{product.brand}</div>
        <div className="detail-name">{product.name}</div>
        <div className="detail-price">
          {isProductOffer(product) && <span className="detail-price-old">${product.originalPrice}</span>}
          <span className={isProductOffer(product) ? 'price-offer' : ''}>${product.price}</span>
          {isLowStock(product) && product.stock > 0 && (
            <span className="stock-low-chip" style={{marginLeft:10,verticalAlign:'middle'}}>¡Quedan solo {product.stock}!</span>
          )}
        </div>
        
        <div className="detail-desc">
          {descLines.length > 0 ? descLines.map((line, i) => (
            <React.Fragment key={i}>{line}<br/></React.Fragment>
          )) : 'Fragancia exclusiva de alta calidad.'}
        </div>

        {product.notes && product.notes.length > 0 && (
          <div style={{marginTop:16,background:'#fff',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>🌿 Elementos / Notas</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {product.notes.map((n, i) => (
                <span key={i} style={{
                  background:'var(--primary)',color:'#fff',padding:'4px 10px',borderRadius:20,
                  fontSize:12,fontWeight:500
                }}>{n}</span>
              ))}
            </div>
          </div>
        )}

        {product.stock > 0 ? (
          <>
            <div className="quantity-control">
              <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Disminuir cantidad">-</button>
              <span className="qty-number">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Aumentar cantidad">+</button>
            </div>

            <button className="btn btn-primary" onClick={handleAdd}>
              {added ? '✓ Agregado' : `Agregar al carrito - $${(product.price * qty).toFixed(2)}`}
            </button>

            <button className="btn" onClick={() => {
              const date = new Date().toLocaleDateString('es-PA');
              const divider = '--------------------';
              const msg = encodeURIComponent(
`*${(store.name || 'ESENCIA GALE').toUpperCase()}*
${store.tagline || 'Tu tienda de fragancias'}
Tel: ${store.whatsapp}
${divider}
PEDIDO RAPIDO
Fecha: ${date}
${divider}

${product.name}
  ${qty} x $${product.price.toFixed(2)}    $${(product.price * qty).toFixed(2)}

${divider}
*TOTAL: $${(product.price * qty).toFixed(2)}*
${divider}
Para coordinar entrega enviar comprobante de pago`);
              window.open(`https://wa.me/${store.whatsapp}?text=${msg}`, '_blank');
            }} style={{background:'#25D366',color:'#fff',marginTop:8}}>
              Comprar por WhatsApp
            </button>

            <p style={{textAlign:'center',fontSize:13,color:'var(--gray-400)',marginTop:10}}>
              Stock disponible: {product.stock}
            </p>
          </>
        ) : (
          <button className="btn btn-outline" disabled>Agotado</button>
        )}

        {renderPriceChart()}

        {similar.length > 0 && (
          <div style={{marginTop:25}}>
            <div className="section-title">Productos similares</div>
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:5}}>
              {similar.map(s => (
                <div key={s.id} onClick={() => navigate(`/product/${s.id}`)} style={{
                  minWidth:120, background:'#fff', borderRadius:10, overflow:'hidden',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.08)', cursor:'pointer', flexShrink:0
                }}>
                  <div style={{width:120,height:100,background:'linear-gradient(135deg, #f3e8ff, #fce7f3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:35}}>
                    {s.image ? <img src={s.image} alt={s.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
                  </div>
                  <div style={{padding:8}}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--primary)'}}>{s.brand}</div>
                    <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)'}}>${s.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
