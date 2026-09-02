import React from 'react';

const steps = [
  { key: 'realizado', label: 'Pedido realizado', icon: '📋', desc: 'Recibimos tu pedido' },
  { key: 'procesando', label: 'En proceso', icon: '🔧', desc: 'Estamos preparando tu pedido' },
  { key: 'en_transito', label: 'En camino', icon: '🚚', desc: 'Tu pedido fue enviado' },
  { key: 'entregado', label: 'Entregado', icon: '🏠', desc: '¡Pedido entregado!' },
];

const statusToIndex = {
  pendiente_confirmacion: 0,
  pendiente: 0,
  pagado: 0,
  procesando: 1,
  en_transito: 2,
  entregado: 4
};

export default function OrderTracker({ order }) {
  const status = order?.status;
  const isRejected = status === 'rechazado';
  const currentIdx = isRejected ? -1 : (statusToIndex[status] ?? 0);
  const delivered = status === 'entregado';

  return (
    <div className="tracker-card">
      <div className="tracker-header">
        <span>📦 Seguimiento del pedido</span>
        {!isRejected && !delivered && (
          <span className="tracker-est">{order?.estimatedDays || 3} días hábiles de entrega</span>
        )}
      </div>

      {isRejected ? (
        <div className="tracker-rejected">❌ Pago no verificado. Contacta al administrador para resolverlo.</div>
      ) : (
        <div className="tracker-steps">
          {steps.map((step, i) => {
            const done = i < currentIdx || delivered;
            const active = i === currentIdx && !delivered;
            const last = i === steps.length - 1;
            return (
              <div key={step.key} className="tracker-step" style={{flex: last ? '0 0 auto' : 1}}>
                <div className="tracker-dot-row">
                  <div className={`tracker-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                    {done ? '✓' : (active ? step.icon : '○')}
                  </div>
                  {!last && <div className={`tracker-line ${done ? 'done' : ''}`} />}
                </div>
                <div className={`tracker-label ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  <div className="tracker-step-label">{step.label}</div>
                  <div className="tracker-step-desc">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isRejected && !delivered && (
        <div className="tracker-foot">
          ⏱️ Tiempo estimado: <strong>2 a 4 días hábiles</strong> desde la confirmación del pago.
        </div>
      )}
    </div>
  );
}