import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { logoutUser, getUserRole } from '../services/authService';
import { getDocuments, updateDocument, addDocument } from '../services/firestoreService';
import { uploadProfilePhoto } from '../services/storageService';
import { setLanguage, getLanguage, t } from '../services/i18n';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState('customer');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState(getLanguage());
  const [darkMode, setDarkMode] = useState(localStorage.getItem('esencia_dark') === 'true');

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('esencia_dark', darkMode);
  }, [darkMode]);

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
        if (u.photoURL) setPhotoURL(u.photoURL);
        else if (u.photoUrl) setPhotoURL(u.photoUrl);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!name) { alert(t('name') + ' required'); return; }
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return; }
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      setPhotoURL(url);
      if (userId) await updateDocument('users', userId, { photoURL: url });
      else if (user.uid) {
        const ref = await addDocument('users', { uid: user.uid, name, photoURL: url, role });
        setUserId(ref);
      }
    } catch { alert('Upload failed'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setLanguage(newLang);
    window.location.reload();
  };

  const handleLogout = async () => { await logoutUser(); navigate('/login'); };

  return (
    <div className="profile-page">
      <h3 className="section-title mb-15">{t('profile')}</h3>

      <div className="profile-card">
        <div
          className="profile-avatar"
          style={{
            backgroundImage: photoURL
              ? `url(${photoURL})`
              : (role === 'admin' ? 'url(/logo.jpg)' : 'none'),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'transparent'
          }}
        >
          {(!photoURL && role !== 'admin') ? (name ? name.charAt(0).toUpperCase() : '?') : ''}
        </div>
        <div className="profile-email">{user?.email}</div>
        <div className="profile-role">{role === 'admin' ? '🔧 Admin' : '👤 Customer'}</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />
        <button className="btn btn-outline" style={{marginTop:10,padding:'6px 12px',fontSize:12}} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Subiendo...' : (photoURL ? '📷 Cambiar foto' : (role === 'admin' ? '📷 Foto de perfil' : '📷 Subir foto'))}
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">{t('profile')} Name</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Phone</label>
        <input className="form-input" placeholder="6000-1234" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <input className="form-input" placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      {saved && <p style={{color:'var(--success)',textAlign:'center',marginBottom:10}}>Saved!</p>}

      <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{width:'100%'}}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>

      <div className="card" style={{marginTop:15}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gray-100)'}}>
          <span style={{fontSize:14,fontWeight:600}}>🌐 {t('language')}</span>
          <div className="chip-row" style={{margin:0}}>
            <button className={`chip ${lang === 'es' ? 'active' : ''}`} onClick={() => handleLanguageChange('es')} style={{padding:'6px 12px',fontSize:12}}>ES</button>
            <button className={`chip ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageChange('en')} style={{padding:'6px 12px',fontSize:12}}>EN</button>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0'}}>
          <span style={{fontSize:14,fontWeight:600}}>🌙 {t('darkMode')}</span>
          <div onClick={() => setDarkMode(!darkMode)} style={{
            width:50,height:28,borderRadius:14,background:darkMode?'var(--primary)':'var(--gray-300)',
            position:'relative',cursor:'pointer',transition:'background 0.3s'
          }}>
            <div style={{
              width:24,height:24,borderRadius:'50%',background:'#fff',position:'absolute',top:2,
              left:darkMode?24:2,transition:'left 0.3s',boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
            }}/>
          </div>
        </div>
      </div>

      <button className="btn btn-outline" onClick={handleLogout} style={{width:'100%',marginTop:15}}>
        🚪 {t('logout')}
      </button>
    </div>
  );
}
