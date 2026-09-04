import React from 'react';

export default function ImageViewer({ images, startIndex = 0, onClose, productName }) {
  const [index, setIndex] = React.useState(startIndex);
  const list = (images && images.length > 0 ? images : []).filter(Boolean);

  const prev = () => setIndex((index - 1 + list.length) % list.length);
  const next = () => setIndex((index + 1) % list.length);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  if (!onClose || list.length === 0) return null;

  return (
    <div className="iv-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={productName || 'Visor de imagen'}>
      <div className="iv-close" onClick={onClose} role="button" tabIndex={0} aria-label="Cerrar" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}>✕</div>
      {list.length > 1 && (
        <div className="iv-nav iv-prev" onClick={e => { e.stopPropagation(); prev(); }} role="button" tabIndex={0} aria-label="Anterior" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); prev(); } }}>‹</div>
      )}
      <img
        key={index}
        src={list[index]}
        alt={productName || 'Imagen'}
        className="iv-image"
        onClick={e => e.stopPropagation()}
      />
      {list.length > 1 && (
        <div className="iv-nav iv-next" onClick={e => { e.stopPropagation(); next(); }} role="button" tabIndex={0} aria-label="Siguiente" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } }}>›</div>
      )}
      {list.length > 1 && (
        <div className="iv-counter">{index + 1} / {list.length}</div>
      )}
    </div>
  );
}