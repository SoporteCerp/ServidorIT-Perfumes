import React from 'react';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img skeleton-pulse" />
      <div style={{padding:12}}>
        <div className="skeleton-line skeleton-pulse" style={{width:'40%',height:10}} />
        <div className="skeleton-line skeleton-pulse" style={{width:'80%',height:14,marginTop:8}} />
        <div className="skeleton-line skeleton-pulse" style={{width:'50%',height:18,marginTop:8}} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div className="skeleton-line skeleton-pulse" style={{ width, height, ...style }} />;
}