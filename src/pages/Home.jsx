import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';

function ProductCard({ product, navigate }) {
  const imgs = (Array.isArray(product.images) && product.images.filter(Boolean).length > 0)
    ? product.images
    : (product.image ? [product.image] : []);
  return (
    <div
      className="product-card"
      style={{minWidth:180,maxWidth:220,flex:'0 0 auto',cursor:'pointer'}}
      onClick={() => navigate('/product/' + product.id)}
    >
      <div className="product-image" style={{height:200}}>
        {imgs[0] ? <img src={imgs[0]} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price">${product.price}</div>
      </div>
    </div>
  );
}

const horizontalScroll = {
  display:'flex',gap:12,overflowX:'auto',scrollSnapType:'x mandatory',paddingBottom:10,
  WebkitOverflowScrolling:'touch'
};

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await getDocuments('products', [], 'createdAt', 'desc');
    setProducts(data.filter(p => p.active === true));
  };

  const ofertas = products.filter(p => p.category === 'Ofertas' || p.category === 'ofertas');
  const nuevos = products.filter(p => p.category === 'Nuevos' || p.category === 'nuevos');
  const importados = products.filter(p => p.category === 'Importados' || p.category === 'importados');

  const sections = [
    { title: '\uD83D\uDD25 Ofertas', items: ofertas },
    { title: '\u2728 Nuevos', items: nuevos },
    { title: '\u2708\uFE0F Importados', items: importados }
  ].filter(s => s.items.length > 0);

  const perks = [
    { icon: '\uD83D\uDE9A', title: 'Envio Gratis', desc: 'En Panama / San Miguelito' },
    { icon: '\u2705', title: 'Pagos Seguros', desc: 'Yappy y tarjeta' },
    { icon: '\u23F3', title: '2-4 dias', desc: 'De entrega' },
    { icon: '\uD83D\uDCAC', title: 'Atencion', desc: 'Chat en tiempo real' }
  ];

  return (
    <div style={{paddingBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',padding:'40px 20px',borderRadius:16,margin:10,textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(circle at 20% 50%,rgba(212,175,55,0.15),transparent 50%)'}} />
        <div style={{fontSize:50,marginBottom:10}}>✨</div>
        <h1 style={{color:'#D4AF37',fontSize:28,fontWeight:800,margin:'0 0 8px',textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>Esencia Gale</h1>
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

      {sections.map(section => (
        <div key={section.title} style={{margin:'20px 10px'}}>
          <h3 style={{fontSize:20,fontWeight:700,marginBottom:12,paddingLeft:4}}>{section.title}</h3>
          <div style={horizontalScroll}>
            {section.items.map(p => (
              <div key={p.id} style={{scrollSnapAlign:'start'}}>
                <ProductCard product={p} navigate={navigate} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {products.length > 0 && (
        <div style={{margin:'20px 10px'}}>
          <h3 style={{fontSize:20,fontWeight:700,marginBottom:12,paddingLeft:4}}>Todos los productos</h3>
          <div className="product-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
            {products.slice(0, 8).map(p => (
              <div key={p.id} className="product-card" onClick={() => navigate('/product/' + p.id)} style={{cursor:'pointer'}}>
                <div className="product-image" style={{height:160}}>
                  {(() => {
                    const imgs2 = (Array.isArray(p.images) && p.images.filter(Boolean).length > 0) ? p.images : [p.image];
                    return imgs2[0] ? <img src={imgs2[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴';
                  })()}
                </div>
                <div className="product-info">
                  <div className="product-brand">{p.brand}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">${p.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:16}}>
            <button className="btn btn-primary" onClick={() => navigate('/catalog')} style={{padding:'12px 30px'}}>
              {'\uD83D\uDECD\uFE0F'} Ver Catalogo Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
