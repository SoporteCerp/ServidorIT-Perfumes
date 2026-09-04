import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { getUserRole } from '../services/authService';
import EmptyState from '../components/EmptyState';

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

    let unsubOrders = () => {};
    if (r === 'admin') {
      unsubOrders = onSnapshot(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          const notifs = [];
          snapshot.forEach(docSnap => {
            const order = docSnap.data();
            if (order.status === 'pendiente_confirmacion' && order.screenshot) {
              notifs.push({
                id: docSnap.id,
                type: 'order',
                title: 'Nuevo Pedido',
                message: `${order.customerName} - $${order.total}`,
                date: order.createdAt,
                read: false
              });
            }
            if (order.paymentStatus === 'pendiente' && order.screenshot) {
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
    }

    let unsubChat = () => {};
    const chatQuery = r === 'admin'
      ? query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'))
      : query(collection(db, 'chats'), where('userId', '==', auth.currentUser.uid));
    unsubChat = onSnapshot(chatQuery, (snapshot) => {
      snapshot.forEach(docSnap => {
        const chat = docSnap.data();
        if (chat.lastMessage) {
          const isAdminReply = chat.lastMessage.startsWith('Admin');
          const shouldNotify = r === 'admin' ? !isAdminReply : isAdminReply;
          if (shouldNotify) {
            setNotifications(prev => [...prev, {
              id: docSnap.id + '_chat_' + (chat.lastMessageAt?.seconds || Date.now()),
              type: 'chat',
              title: r === 'admin' ? 'Nuevo Mensaje' : 'Respuesta del Admin',
              message: chat.lastMessage,
              date: chat.lastMessageAt,
              read: false
            }]);
          }
        }
      });
    });

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
        <EmptyState icon="🔔" title="No hay notificaciones" />
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
