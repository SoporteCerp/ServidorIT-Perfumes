import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../services/firebase';
import { getUserRole } from '../services/authService';
import { getOrCreateChat, sendMessage, subscribeToMessages, subscribeToChats, updateChatLastMessage, deleteMessage, deleteChat } from '../services/chatService';
import { clearNotificationType, setChatActive } from '../services/notificationService';
import EmptyState from '../components/EmptyState';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [role, setRole] = useState('customer');
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { init(); return () => { setChatActive(false); }; }, []);

  const init = async () => {
    const r = await getUserRole(auth.currentUser.uid);
    setRole(r);
    if (r === 'admin') {
      const unsub = subscribeToChats(setChats);
      return unsub;
    } else {
      const id = await getOrCreateChat(auth.currentUser.uid, auth.currentUser.displayName || 'Cliente');
      setChatId(id);
      setSelectedChat(id);
    }
  };

  useEffect(() => {
    if (!selectedChat) return;
    clearNotificationType('chat');
    setChatActive(true);
    const unsub = subscribeToMessages(selectedChat, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => { unsub(); setChatActive(false); };
  }, [selectedChat]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setLoading(true);
    const senderName = role === 'admin' ? 'Admin' : (auth.currentUser.displayName || 'Cliente');
    await sendMessage(selectedChat, auth.currentUser.uid, senderName, newMessage.trim());
    await updateChatLastMessage(selectedChat, newMessage.trim());
    setNewMessage('');
    setLoading(false);
  };

  const selectChat = (chat) => {
    setSelectedChat(chat.id);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedChat) return;
    const confirmed = window.confirm('¿Eliminar este mensaje?');
    if (!confirmed) return;
    try {
      await deleteMessage(selectedChat, messageId);
    } catch (err) {
      console.error('Error al eliminar mensaje:', err);
    }
  };

  const handleDeleteChat = async (chat) => {
    const confirmed = window.confirm(`¿Eliminar toda la conversación con ${chat.userName || 'Cliente'}?`);
    if (!confirmed) return;
    try {
      await deleteChat(chat.id);
    } catch (err) {
      console.error('Error al eliminar conversación:', err);
    }
  };

  if (role === 'admin' && !selectedChat) {
    return (
      <>
        <h3 className="section-title mb-15">Mensajes</h3>
        {chats.length === 0 ? (
          <EmptyState icon="💬" title="No hay conversaciones" />
        ) : chats.map(c => (
          <div key={c.id} className="admin-card" style={{cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{flex:1}} onClick={() => selectChat(c)}>
              <div className="admin-name">{c.userName || 'Cliente'}</div>
              <div className="admin-brand">{c.lastMessage || 'Sin mensajes'}</div>
            </div>
            <button
              title="Eliminar conversación"
              style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--gray-400)',padding:'6px'}}
              onClick={(e) => { e.stopPropagation(); handleDeleteChat(c); }}
            >🗑️</button>
          </div>
        ))}
      </>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 180px)'}}>
      {role === 'admin' && (
        <button className="btn btn-outline btn-sm" style={{marginBottom:10,width:'auto'}} onClick={() => setSelectedChat(null)}>
          Volver a lista
        </button>
      )}

      <div style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
        {messages.map(m => (
          <div key={m.id} style={{
            display:'flex',justifyContent:m.senderId === auth.currentUser.uid ? 'flex-end' : 'flex-start',
            marginBottom:10,alignItems:'center',gap:6
          }}>
            <div style={{
              maxWidth:'80%',padding:'10px 14px',borderRadius:16,
              background:m.senderId === auth.currentUser.uid ? 'var(--primary)' : 'var(--gray-100)',
              color:m.senderId === auth.currentUser.uid ? '#fff' : 'var(--gray-900)'
            }}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4,opacity:0.8}}>{m.senderName}</div>
              <div style={{fontSize:14}}>{m.text}</div>
            </div>
            {(role === 'admin' || m.senderId === auth.currentUser.uid) && (
              <button
                title="Eliminar mensaje"
                style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--gray-400)'}}
                onClick={() => handleDeleteMessage(m.id)}
              >🗑️</button>
            )}
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      <div style={{display:'flex',gap:8,padding:'10px 0',borderTop:'1px solid var(--gray-200)'}}>
        <input
          className="form-input"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          style={{flex:1,marginBottom:0}}
        />
        <button className="btn btn-primary" style={{width:'auto',padding:'0 20px',marginBottom:0}} onClick={handleSend} disabled={loading || !newMessage.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}