import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlist, toggleWishlist } from '../services/wishlistService';
import { getDocuments } from '../services/firestoreService';
import { addToCart } from '../services/cartService';

export default function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWishlist(); }, []);

  const loadWishlist = async () => {
    const ids = getWishlist();
    if (ids.length === 0) { setItems([]); setLoading(false); return; }
    const all = await getDocuments('products');
    setItems(all.filter(p => ids.includes(p.id)));
    setLoading(false);
  };

  const remove = (id) => {
    toggleWishlist(id);
    setItems(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div style={{textAlign:'center',paddingTop:60,fontSize:24}}>&#9203;</div>;

  return (
    <>
      <h3 className="section-title mb-15">Mis Favoritos</h3>
      {items.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">&#10084;&#65039;</div><div className="empty-text">No tienes favoritos</div><div className="empty-subtext">Toca el corazon en un producto para guardarlo</div></div>
      ) : items.map(p => (
        <div key={p.id} className="admin-card" style={{marginBottom:10}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{width:50,height:50,borderRadius:10,overflow:'hidden',flexShrink:0,background:'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
              {p.image ? <img src={p.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '\uD83E\uDDF4'}
            </div>
            <div style={{flex:1,cursor:'pointer'}} onClick={() => navigate('/product/' + p.id)}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--primary)'}}>{p.brand}</div>
              <div style={{fontSize:14,fontWeight:600}}>{p.name}</div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--primary-dark)'}}>${p.price}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className="btn btn-sm btn-primary" onClick={() => { addToCart(p, 1); navigate('/cart'); }}>{'\uD83D\uDED2'}</button>
              <button className="btn btn-sm btn-outline" onClick={() => remove(p.id)} style={{color:'var(--danger)'}}>{'\u2764\uFE0F'}</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}