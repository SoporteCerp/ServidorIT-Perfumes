import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/firestoreService';
import { addToCart, getCartCount } from '../services/cartService';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    const all = await getDocuments('products');
    setProduct(all.find(p => p.id === id));
  };

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) return <div className="empty-state"><div className="empty-icon">⏳</div></div>;

  return (
    <>
      <div className="detail-image">
        {product.image ? <img src={product.image} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🧴'}
      </div>
      <div className="detail-info">
        <div className="detail-brand">{product.brand}</div>
        <div className="detail-name">{product.name}</div>
        <div className="detail-price">${product.price}</div>
        <div className="detail-desc">{product.description || 'Fragancia exclusiva de alta calidad.'}</div>

        {product.stock > 0 ? (
          <>
            <div className="quantity-control">
              <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
              <span className="qty-number">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
            </div>

            <button className="btn btn-primary" onClick={handleAdd}>
              {added ? '✓ Agregado' : `Agregar al carrito - $${(product.price * qty).toFixed(2)}`}
            </button>

            <p style={{textAlign:'center',fontSize:13,color:'var(--gray-400)',marginTop:10}}>
              Stock disponible: {product.stock}
            </p>
          </>
        ) : (
          <button className="btn btn-outline" disabled>Agotado</button>
        )}
      </div>
    </>
  );
}
