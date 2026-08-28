import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Completa todos los campos'); return; }
    if (password !== confirm) { setError('Las contrasenas no coinciden'); return; }
    if (password.length < 6) { setError('Minimo 6 caracteres'); return; }
    setLoading(true); setError('');
    try { await registerUser(email, password, name); navigate('/'); }
    catch (err) { setError(err.message || 'Error al registrar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">Crear Cuenta</h1>
          <p className="login-subtitle">Registrate para comprar</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p style={{color:'var(--danger)',textAlign:'center',marginBottom:15}}>{error}</p>}
          <div className="form-group"><input className="form-input" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><input className="form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="form-group"><input className="form-input" type="password" placeholder="Contrasena" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div className="form-group"><input className="form-input" type="password" placeholder="Confirmar contrasena" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Cuenta'}</button>
        </form>
        <div className="text-center" style={{marginTop:15}}>
          <button className="btn-link" onClick={() => navigate('/login')}>Ya tienes cuenta? Inicia sesion</button>
        </div>
      </div>
    </div>
  );
}
