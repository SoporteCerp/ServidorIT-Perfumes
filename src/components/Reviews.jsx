import React, { useState, useEffect } from 'react';
import { getReviews, addReview, deleteReview } from '../services/reviewService';
import { auth } from '../services/firebase';
import { toast } from './Toast';

export default function Reviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = auth.currentUser;

  useEffect(() => { loadReviews(); }, [productId]);

  const loadReviews = async () => {
    const data = await getReviews(productId);
    setReviews(data);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addReview(productId, user.uid, user.displayName || 'Cliente', rating, comment.trim());
      setComment('');
      setRating(5);
      loadReviews();
      toast.success('Resena publicada');
    } catch (e) { console.error('Error al publicar resena', e); toast.error('Error', 'No se pudo publicar tu resena'); }
    setSubmitting(false);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Eliminar esta resena?')) return;
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch (e) { console.error('Error al eliminar resena', e); toast.error('Error', 'No se pudo eliminar la resena'); }
  };

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="reviews-section">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontSize:18,fontWeight:700}}>Resenas</span>
        <span style={{fontSize:14,color:'var(--gray-400)'}}>{'\u2605'} {avg} ({reviews.length})</span>
      </div>

      {user && (
        <div className="review-form" style={{marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Tu resena</div>
          <div style={{display:'flex',gap:4,marginBottom:10}}>
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
                aria-pressed={s <= rating}
                style={{fontSize:24,cursor:'pointer',color: s <= rating ? '#F59E0B' : 'var(--gray-200)',background:'none',border:'none',padding:0}}
              >{'\u2605'}</button>
            ))}
          </div>
          <textarea className="form-input" placeholder="Cuentanos que te parecio..." value={comment} onChange={e => setComment(e.target.value)} style={{minHeight:60}} />
          <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={handleSubmit} disabled={submitting || !comment.trim()}>
            {submitting ? 'Enviando...' : 'Publicar resena'}
          </button>
        </div>
      )}

      {reviews.map(r => (
        <div key={r.id} className="review-card" style={{borderBottom:'1px solid var(--gray-100)',paddingBottom:12,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:600}}>{r.userName || 'Cliente'}</div>
            <div style={{fontSize:12,color:'var(--gray-400)'}}>
              {r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleDateString() : ''}
            </div>
          </div>
          <div style={{fontSize:14,color:'#F59E0B',margin:'4px 0'}}>
            {'\u2605'.repeat(r.rating || 0)}{'\u2606'.repeat(5 - (r.rating || 0))}
          </div>
          <div style={{fontSize:13,color:'var(--gray-500)'}}>{r.comment}</div>
          {user && r.userId === user.uid && (
            <button onClick={() => handleDelete(r.id)} style={{background:'none',border:'none',color:'var(--danger)',fontSize:12,cursor:'pointer',marginTop:4}}>Eliminar</button>
          )}
        </div>
      ))}
      {reviews.length === 0 && <div style={{fontSize:13,color:'var(--gray-400)',textAlign:'center',padding:12}}>No hay resenas aun. Se el primero en resenar.</div>}
    </div>
  );
}