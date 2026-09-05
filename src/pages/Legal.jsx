import React from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = {
  envios: {
    title: 'Politicas de Envio',
    icon: '\uD83D\uDE9A',
    intro: 'En Esencia Gale enviamos a todo Panama de forma segura y rapida.',
    items: [
      ['\uD83D\uDCCD \uD83C\uDDF5\uD83C\uDDE6 Panama / San Miguelito / Oeste', 'Costo de $2.00. Entrega en 2 a 4 dias habiles.'],
      ['\uD83D\uDCCD Colon', 'Envio gratis. Entrega en 2 a 4 dias habiles.'],
      ['\uD83D\uDCE6 Resto del pais', 'Mensajeria: Ferguson / Golden Express ($4), Uno Express ($5), CIA Express ($5) o Olva Courier ($6).'],
      ['\u23F3 Tiempo de entrega', 'El pedido se coordina por WhatsApp/internamente una vez confirmado el pago. El envio empieza desde la confirmacion del comprobante.'],
      ['\uD83C\uDF89 Envio gratis', 'Aplican cupones de envio gratis que se aplican automaticamente en el checkout al superar el monto minimo.']
    ]
  },
  devoluciones: {
    title: 'Politicas de Devoluciones',
    icon: '\u21BA\uFE0F',
    intro: 'Queremos que quedes satisfecho con tu compra. Estas son nuestras condiciones:',
    items: [
      ['\uD83D\uDCCC Plazo para reportar', 'Tienes 3 dias habiles desde la entrega para reportar cualquier problema (producto equivocado, dañado o en mal estado).'],
      ['\uD83E\uDDF4 Estado del producto', 'Los perfumes deben devolverse sellados y sin usar, en su empaque original, para aplicar cambios.'],
      ['\u2705 Cambios', 'Si el producto llego dañado o incorrecto, hacemos el cambio sin costo adicional.'],
      ['\uD83D\uDCB0 Reembolsos', 'Los reembolsos se evalúan caso a caso y se realizan por Yappy al mismo numero del que se recibio el pago.'],
      ['\uD83D\uDCAC Como contactarnos', 'Escríbenos por WhatsApp para coordinar la devolucion con tu numero de pedido a la mano.']
    ]
  },
  terminos: {
    title: 'Terminos y Condiciones',
    icon: '\uD83D\uDCDC',
    intro: 'Al usar nuestra tienda aceptas estos terminos.',
    items: [
      ['\uD83D\uDCB0 Precios', 'Todos los precios incluyen IVA (7%). Los precios pueden cambiar sin previo aviso; el precio vigente es el confirmado en tu pedido.'],
      ['\uD83D\uDED2 Pedidos', 'Los pedidos se confirman manualmente al verificar el comprobante de pago por Yappy. Si el comprobante no puede verificarse, te contactaremos.'],
      ['\uD83D\uDCC6 Disponibilidad', 'Si un producto no tiene stock, nos contactaremos para ofrecerte una alternativa o coordinar el reembolso.'],
      ['\uD83D\uDD10 Privacidad', 'Tus datos personales solo se usan para procesar tu pedido y coordinar la entrega. Nunca los compartimos con terceros.'],
      ['\uD83D\uDCDE Contacto', 'WhatsApp y chat en la app para consultas y soporte. Nuestro horario: Lun a Sab 9am - 7pm.']
    ]
  }
};

const LINKS = [
  { v: 'envios', label: 'Envios' },
  { v: 'devoluciones', label: 'Devoluciones' },
  { v: 'terminos', label: 'Terminos y Condiciones' }
];

export default function Legal({ kind }) {
  const navigate = useNavigate();
  const section = SECTIONS[kind] || SECTIONS.envios;

  return (
    <div style={{ paddingBottom: 20 }}>
      <h3 className="section-title mb-15">{section.icon} {section.title}</h3>
      <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 15, lineHeight: 1.6 }}>{section.intro}</p>

      <div className="card" style={{ margin: 0 }}>
        {section.items.map(([title, desc], i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < section.items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.55 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="chip-row" style={{ marginTop: 18, marginBottom: 0 }}>
        {LINKS.filter(l => l.v !== kind).map(l => (
          <button key={l.v} className="chip" onClick={() => navigate('/' + l.v)}>{l.label}</button>
        ))}
        <button className="chip" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    </div>
  );
}