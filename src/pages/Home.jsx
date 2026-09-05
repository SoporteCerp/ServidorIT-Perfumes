import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';
import { getStoreSettings, formatWhatsapp, DEFAULT_STORE } from '../services/storeSettingsService';
import { isProductNew, isProductOffer, productDiscount, isLowStock, getProductImages } from '../utils/productHelpers';

function ProductCard({ product, navigate }) {
  const imgs = getProductImages(product);
  const discount = productDiscount(product);
  return (
    <div
      className="product-card"
      style={{minWidth:'calc(50% - 6px)',maxWidth:'calc(50% - 6px)',flex:'0 0 calc(50% - 6px)',cursor:'pointer',scrollSnapAlign:'start'}}
      onClick={() => navigate('/product/' + product.id)}
    >
      <div className="product-image" style={{aspectRatio:'1 / 1'}}>
        {imgs[0] ? <img src={imgs[0]} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
        <div className="product-badges">
          {discount > 0 && <span className="prod-badge badge-offer">-{discount}%</span>}
          {isProductNew(product) && <span className="prod-badge badge-new">NUEVO</span>}
        </div>
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price-line">
          {discount > 0 && <span className="price-old">${product.originalPrice}</span>}
          <span className={`product-price ${discount > 0 ? 'price-offer' : ''}`}>${product.price}</span>
          {isLowStock(product) && <span className="stock-low-chip">Quedan pocos</span>}
        </div>
      </div>
    </div>
  );
}

const horizontalScroll = {
  display:'flex',gap:12,overflowX:'auto',scrollSnapType:'x mandatory',paddingBottom:10,
  WebkitOverflowScrolling:'touch'
};

function AutoCarousel({ items, navigate }) {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const speed = 2000;
    const interval = setInterval(() => {
      if (document.hidden) return;
      const step = el.clientWidth / 2;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, speed);
    return () => clearInterval(interval);
  }, [items]);

  return (
    <div style={{position:'relative'}}>
      <div ref={container} style={{...horizontalScroll, scrollSnapType:'none'}}>
        {items.map(p => (
          <ProductCard key={p.id} product={p} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ emoji, title, action, onAction }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'20px 10px 12px'}}>
      <h3 style={{fontSize:20,fontWeight:800,margin:0,paddingLeft:4,borderLeft:'3px solid var(--primary,#D4AF37)',paddingLeft:10}}>
        <span style={{marginRight:6}}>{emoji}</span>{title}
      </h3>
      {action && (
        <button onClick={onAction} style={{background:'none',border:'none',color:'var(--primary,#D4AF37)',fontSize:13,fontWeight:700,cursor:'pointer',padding:4}}>
          {action} {'\u203A'}
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(DEFAULT_STORE);

  useEffect(() => {
    getStoreSettings().then(setStore).catch(() => setStore(DEFAULT_STORE));
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'createdAt', 'desc');
    setProducts(data.filter(p => p.active === true));
  };

  const goCatalog = (categoria) => navigate('/catalog' + (categoria ? `?categoria=${categoria}` : ''));

  const ofertas = products.filter(p => p.category === 'Ofertas' || p.category === 'ofertas' || isProductOffer(p));
  const nuevos = products.filter(p => isProductNew(p)).slice(0, 10);

  const brandStats = {};
  products.forEach(p => { if (p.brand) brandStats[p.brand] = (brandStats[p.brand] || 0) + 1; });
  const topBrands = Object.entries(brandStats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topBrandSections = topBrands
    .map(([brand]) => ({ brand, items: products.filter(p => p.brand === brand).slice(0, 4) }))
    .filter(s => s.items.length >= 2);

  const maxDiscount = ofertas.reduce((m, p) => Math.max(m, productDiscount(p)), 0);

  const categories = [
    { v: 'hombre', icon: '\uD83D\uDC54', label: 'Hombre' },
    { v: 'mujer', icon: '\uD83D\uDC85', label: 'Mujer' },
    { v: 'unisex', icon: '\uD83D\uDC51', label: 'Unisex' }
  ];

  const perks = [
    { icon: '\uD83D\uDE9A', title: 'Enviamos a todo Panama', desc: 'Colon gratis, Panama $2' },
    { icon: '\u2705', title: 'Perfumes 100% originales', desc: 'Marcas certificadas' },
    { icon: '\uD83D\uDCB0', title: 'Pago seguro', desc: 'Yappy con comprobante' },
    { icon: '\uD83D\uDCAC', title: 'Atencion directa', desc: 'Chat en tiempo real' }
  ];

  return (
    <div style={{paddingBottom:20}}>
      <div style={{
        background:'linear-gradient(160deg,#0f0f1e 0%,#1a1a2e 55%,#2b1e0e 100%)',
        padding:'36px 20px 30px',borderRadius:18,margin:10,textAlign:'center',
        position:'relative',overflow:'hidden',border:'1px solid rgba(212,175,55,0.25)'
      }}>
        <div style={{position:'absolute',top:-60,left:-60,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,0.18),transparent 70%)'}} />
        <div style={{position:'absolute',bottom:-80,right:-40,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,0.12),transparent 70%)'}} />
        <div style={{fontSize:56,marginBottom:6,filter:'drop-shadow(0 4px 12px rgba(212,175,55,0.35))'}}>{'\u2728'}</div>
        <h1 style={{color:'#D4AF37',fontSize:30,fontWeight:900,margin:'0 0 6px',textShadow:'0 2px 12px rgba(0,0,0,0.4)',letterSpacing:1}}>{store.name}</h1>
        <p style={{color:'#d9cc9e',fontSize:15,margin:'0 auto 18px',maxWidth:280,lineHeight:1.6}}>Fragancias originales para hombres, mujeres y unisex. Enviamos a todo Panama.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={() => goCatalog('')} style={{background:'linear-gradient(135deg,#d4af37,#b8860b)',color:'#000',border:'none',borderRadius:99,padding:'11px 26px',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 14px rgba(212,175,55,0.35)'}}>
            Ver Catálogo
          </button>
          <button onClick={() => goCatalog('ofertas')} style={{background:'transparent',color:'#d4af37',border:'1.5px solid rgba(212,175,55,0.6)',borderRadius:99,padding:'11px 20px',fontSize:14,fontWeight:700,cursor:'pointer'}}>
            {maxDiscount > 0 ? `Ofertas hasta -${maxDiscount}%` : 'Ofertas'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,margin:'18px 10px'}}>
        {categories.map(c => (
          <div key={c.v} onClick={() => goCatalog(c.v)} style={{
            background:'var(--card-bg,#fff)',borderRadius:14,padding:'14px 8px',textAlign:'center',
            boxShadow:'0 2px 10px rgba(0,0,0,0.07)',cursor:'pointer',border:'1px solid var(--gray-100,#eee)'
          }}>
            <div style={{fontSize:24,marginBottom:4}}>{c.icon}</div>
            <div style={{fontSize:13,fontWeight:800}}>{c.label}</div>
            <div style={{fontSize:11,color:'var(--gray-400,#888)'}}>{products.filter(p => p.category === c.v).length} perfumes</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,margin:'4px 10px 8px'}}>
        {perks.map(p => (
          <div key={p.title} style={{background:'var(--card-bg,#fff)',borderRadius:12,padding:'12px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:22,marginBottom:4}}>{p.icon}</div>
            <div style={{fontSize:12,fontWeight:800,lineHeight:1.3}}>{p.title}</div>
            <div style={{fontSize:11,color:'var(--gray-400,#888)',marginTop:2}}>{p.desc}</div>
          </div>
        ))}
      </div>

      {ofertas.length > 0 && (
        <>
          <SectionTitle emoji={'\uD83D\uDD25'} title="Ofertas de la semana" action="Ver todas" onAction={() => goCatalog('ofertas')} />
          <div style={{margin:'0 10px'}}>
            <AutoCarousel items={ofertas.slice(0, 10)} navigate={navigate} />
          </div>
        </>
      )}

      {nuevos.length > 0 && (
        <>
          <SectionTitle emoji={'\u2728'} title="Nuevos lanzamientos" action="Ver todos" onAction={() => goCatalog('nuevos')} />
          <div style={{margin:'0 10px'}}>
            <AutoCarousel items={nuevos} navigate={navigate} />
          </div>
        </>
      )}

      {topBrandSections.length > 0 && (
        <>
          <SectionTitle emoji={'\uD83D\uDC51'} title="Marcas destacadas" action="Ver todo" onAction={() => goCatalog('')} />
          <div style={{margin:'0 10px 4px',display:'flex',gap:8,flexWrap:'wrap'}}>
            {topBrands.map(([brand, count]) => (
              <button key={brand} onClick={() => goCatalog('')} style={{
                background:'var(--card-bg,#fff)',border:'1px solid var(--gray-100,#eee)',borderRadius:99,
                padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6
              }}>
                {brand} <span style={{color:'var(--primary,#D4AF37)'}}>{count}</span>
              </button>
            ))}
          </div>
          {topBrandSections.map(section => (
            <div key={section.brand} style={{margin:'16px 10px 0'}}>
              <h4 style={{fontSize:15,fontWeight:800,margin:'0 0 10px',paddingLeft:4}}>{section.brand}</h4>
              <AutoCarousel items={section.items} navigate={navigate} />
            </div>
          ))}
        </>
      )}

      <div onClick={() => goCatalog('')} style={{
        margin:'22px 10px 0',borderRadius:16,padding:'20px 16px',
        background:'linear-gradient(135deg,#b8860b,#d4af37)',color:'#000',textAlign:'center',cursor:'pointer',
        boxShadow:'0 6px 18px rgba(212,175,55,0.3)'
      }}>
        <div style={{fontSize:20,fontWeight:900}}>{'\uD83C\uDF81 No sabes cual elegir?'}</div>
        <div style={{fontSize:13,fontWeight:600,marginTop:4}}>Explora el catalogo completo y encuentra tu favorito</div>
        <div style={{display:'inline-block',marginTop:10,background:'#000',color:'#f5e6a8',borderRadius:99,padding:'8px 22px',fontSize:13,fontWeight:800}}>
          Explorar Catálogo {'\u2192'}
        </div>
      </div>

      <div style={{background:'#14141f',color:'#d4af37',borderRadius:16,margin:'20px 10px 0',padding:'24px 16px',textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:12}}>{store.name}</div>
        <div style={{fontSize:14,color:'#b8a86b',lineHeight:2.1}}>
          <div>{'\uD83D\uDCCD'} {store.address}</div>
          <div>{'\uD83D\uDCAC'} Yappy: {store.yappy}</div>
          <div>{'\uD83D\uDCF1'} WhatsApp: {formatWhatsapp(store.whatsapp)}</div>
          <div>{'\uD83D\uDECD\uFE0F'} Envios a Colon gratis, resto del pais por mensajeria</div>
          <div>{'\uD83D\uDD52'} Horario: {store.hours}</div>
        </div>
        <div style={{fontSize:12,color:'#8a7a3a',marginTop:14}}>© {(new Date()).getFullYear()} {store.name}. Todos los derechos reservados.</div>
      </div>
    </div>
  );
}