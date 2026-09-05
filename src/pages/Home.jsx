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

  const ofertas = products.filter(p => p.category === 'Ofertas' || p.category === 'ofertas' || isProductOffer(p));
  const nuevos = products.filter(p => isProductNew(p)).slice(0, 10);

  const brandSections = [];
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  brands.forEach(brand => {
    const items = products.filter(p => p.brand === brand).slice(0, 3);
    if (items.length > 0) brandSections.push({ title: brand, items });
  });

  const perks = [
    { icon: '\uD83D\uDE9A', title: 'Envio a todo el pais', desc: 'Colon gratis, Panama $2' },
    { icon: '\u2705', title: 'Pagos Seguros', desc: 'Paga con Yappy' },
    { icon: '\u23F3', title: '2-4 dias', desc: 'De entrega' },
    { icon: '\uD83D\uDCAC', title: 'Atencion', desc: 'Chat en tiempo real' }
  ];

  return (
    <div style={{paddingBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',padding:'40px 20px',borderRadius:16,margin:10,textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(circle at 20% 50%,rgba(212,175,55,0.15),transparent 50%)'}} />
        <div style={{fontSize:50,marginBottom:10}}>✨</div>
        <h1 style={{color:'#D4AF37',fontSize:28,fontWeight:800,margin:'0 0 8px',textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>{store.name}</h1>
        <p style={{color:'#b8a86b',fontSize:15,margin:0,lineHeight:1.5}}>Fragancias que definen tu estilo</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,margin:'16px 10px'}}>
        {perks.map(p => (
          <div key={p.title} style={{background:'var(--card-bg,#fff)',borderRadius:12,padding:'14px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:26,marginBottom:4}}>{p.icon}</div>
            <div style={{fontSize:13,fontWeight:700}}>{p.title}</div>
            <div style={{fontSize:12,color:'var(--gray-400,#888)'}}>{p.desc}</div>
          </div>
        ))}
      </div>

      {ofertas.length > 0 && (
        <div style={{margin:'20px 10px'}}>
          <h3 style={{fontSize:20,fontWeight:700,marginBottom:12,paddingLeft:4}}>{'\uD83D\uDD25'} Ofertas</h3>
          <AutoCarousel items={ofertas} navigate={navigate} />
        </div>
      )}

      {nuevos.length > 0 && (
        <div style={{margin:'20px 10px'}}>
          <h3 style={{fontSize:20,fontWeight:700,marginBottom:12,paddingLeft:4}}>{'\u2728'} Nuevos lanzamientos</h3>
          <AutoCarousel items={nuevos} navigate={navigate} />
        </div>
      )}

      {brandSections.map(section => (
        <div key={section.title} style={{margin:'20px 10px'}}>
          <h3 style={{fontSize:18,fontWeight:700,marginBottom:12,paddingLeft:4}}>{section.title}</h3>
          <AutoCarousel items={section.items} navigate={navigate} />
        </div>
      ))}

      <div style={{background:'#1a1a2e',color:'#d4af37',borderRadius:16,margin:'20px 10px 0',padding:'24px 16px',textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>{store.name}</div>
        <div style={{fontSize:14,color:'#b8a86b',lineHeight:2}}>
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
