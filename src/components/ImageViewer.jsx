import React from 'react';

export default function ImageViewer({ images, startIndex = 0, onClose, productName }) {
  const [index, setIndex] = React.useState(startIndex);
  const list = (images && images.length > 0 ? images : []).filter(Boolean);
  if (!onClose || list.length === 0) return null;

  return (
    <div
      className="iv-overlay"
      onClick={onClose}
    >
      <div className="iv-close" onClick={onClose}>✕</div>
      {list.length > 1 && (
        <div className="iv-nav iv-prev" onClick={e => { e.stopPropagation(); setIndex((index - 1 + list.length) % list.length); }}>‹</div>
      )}
      <img
        key={index}
        src={list[index]}
        alt={productName || 'Imagen'}
        className="iv-image"
        onClick={e => e.stopPropagation()}
      />
      {list.length > 1 && (
        <div className="iv-nav iv-next" onClick={e => { e.stopPropagation(); setIndex((index + 1) % list.length); }}>›</div>
      )}
      {list.length > 1 && (
        <div className="iv-counter">{index + 1} / {list.length}</div>
      )}
    </div>
  );
}
