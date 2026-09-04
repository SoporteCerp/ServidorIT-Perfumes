import React from 'react';

export default function EmptyState({ icon, title, subtext, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <div className="empty-text">{title}</div>
      {subtext && <div className="empty-subtext">{subtext}</div>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}