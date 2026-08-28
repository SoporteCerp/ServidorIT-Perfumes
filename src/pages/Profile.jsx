import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { logoutUser, getUserRole } from '../services/authService';
import { getDocuments, updateDocument } from '../services/firestoreService';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('customer');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const users = await getDocuments('users', [{ field: 'uid', operator: '==', value: user.uid }]);
      if (users.length > 0) {
        const u = users[0];
        setUserId(u.id);
        setRole(u.role || 'customer');
        if (u.phone) setPhone(u.phone);
        if (u.address) setAddress(u.address);
        if (u.name) setName(u.name);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!name) { alert('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (userId) {
        await updateDocument('users', userId, { name, phone, address });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setLoading(false);
  };

  const handleLogout = async () => { await logoutUser(); navigate('/login'); };

  return (
    <div className="profile-page">
      <h3 className="section-title mb-15">Mi Perfil</h3>

      <div className="profile-card">
        <div className="profile-avatar">{name ? name.charAt(0).toUpperCase() : '?'}</div>
        <div className="profile-email">{user?.email}</div>
        <div className="profile-role">{role === 'admin' ? '🔧 Admin' : '👤 Cliente'}</div>
      </div>

      <div className="form-group">
        <label className="form-label">Nombre completo</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Telefono</label>
        <input className="form-input" placeholder="Ej: 6000-1234" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Direccion</label>
        <input className="form-input" placeholder="Tu direccion de entrega" value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      {saved && <p style={{color:'var(--success)',textAlign:'center',marginBottom:10}}>Guardado!</p>}

      <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{width:'100%'}}>
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      <button className="btn btn-outline" onClick={handleLogout} style={{width:'100%',marginTop:10}}>
        Cerrar Sesion
      </button>
    </div>
  );
}
