import React, { useState, useEffect } from 'react';

const listeners = new Set();

const emit = (type, title, message) => {
  const item = { id: Date.now() + Math.random(), type, title, message };
  listeners.forEach(fn => fn(item));
};

export const toast = {
  success: (title, message) => emit('success', title, message),
  error: (title, message) => emit('error', title, message),
  warning: (title, message) => emit('warning', title, message),
  info: (title, message) => emit('info', title, message),
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const ICONS = { success: '\u2705', error: '\u26D4', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
const COLORS = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => subscribe(item => {
    setItems(prev => [...prev, item]);
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== item.id)), 4500);
  }), []);

  return (
    <div className="toast-stack" aria-live="polite">
      {items.map(item => (
        <div
          key={item.id}
          className="toast-item"
          role="status"
          onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
          style={{ borderLeft: '4px solid ' + (COLORS[item.type] || COLORS.info) }}
        >
          <span className="toast-icon">{ICONS[item.type] || ICONS.info}</span>
          <div className="toast-body">
            {item.title && <strong>{item.title}</strong>}
            <div>{item.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}