import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { getUserRole } from '../services/authService';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [role, setRole] = useState('customer');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const r = await getUserRole(auth.currentUser.uid);
    setRole(r);

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const notifs = [];
        snapshot.forEach(docSnap => {
          const order = docSnap.data();
          if (order.status === 'pendiente_confirmacion' && r === 'admin') {
            notifs.push({
              id: docSnap.id,
              type: 'order',
              title: 'Nuevo Pedido',
              message: `${order.customerName} - $${order.total}`,
              date: order.createdAt,
              read: false
            });
          }
          if (order.paymentStatus === 'pendiente' && order.screenshot && r === 'admin') {
            notifs.push({
              id: docSnap.id + '_pay',
              type: 'payment',
              title: 'Pago Pendiente',
              message: `${order.customerName} envio comprobante de $${order.total}`,
              date: order.createdAt,
              read: false
            });
          }
        });
        setNotifications(notifs);
      }
    );

    const unsubChat = onSnapshot(
      query(collection(db, 'chats'), where('userId', '==', auth.currentUser.uid)),
      (snapshot) => {
        snapshot.forEach(docSnap => {
          const chat = docSnap.data();
          if (chat.lastMessage && !chat.lastMessage.startsWith('Admin')) {
            setNotifications(prev => [...prev, {
              id: docSnap.id + '_chat',
              type: 'chat',
              title: 'Nuevo Mensaje',
              message: chat.lastMessage,
              date: chat.lastMessageAt,
              read: false
            }]);
          }
        });
      }
    );

    return () => { unsubOrders(); unsubChat(); };
  };

  const getStatusIcon = (type) => {
    switch(type) {
      case 'order': return '📦';
      case 'payment': return '💳';
      case 'chat': return '💬';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.type === 'order' || notif.type === 'payment') {
      navigate('/orders');
    } else if (notif.type === 'chat') {
      navigate('/chat');
    }
  };

  return (
    <>
      <h3 className="section-title mb-15">Notificaciones</h3>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-text">No hay notificaciones</div>
        </div>
      ) : (
        notifications.map(notif => (
          <div
            key={notif.id}
            className="admin-card"
            style={{cursor:'pointer', borderLeft: '4px solid var(--primary)'}}
            onClick={() => handleNotificationClick(notif)}
          >
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div style={{fontSize:24}}>{getStatusIcon(notif.type)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{notif.title}</div>
                <div style={{color:'var(--gray-500)',fontSize:14,marginTop:4}}>{notif.message}</div>
                <div style={{color:'var(--gray-400)',fontSize:12,marginTop:6}}>
                  {notif.date ? new Date(notif.date.seconds * 1000).toLocaleString('es-ES') : ''}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
