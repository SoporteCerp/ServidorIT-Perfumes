import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try { await loginUser(email, password); navigate('/'); }
    catch { setError('Credenciales incorrectas'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">🧴</div>
          <h1 className="login-title">Perfumeria</h1>
          <p className="login-subtitle">Las mejores fragancias</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p style={{color:'var(--danger)',textAlign:'center',marginBottom:15}}>{error}</p>}
          <div className="form-group">
            <input className="form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <input className="form-input" type="password" placeholder="Contrasena" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>
        <div className="text-center" style={{marginTop:15}}>
          <button className="btn-link" onClick={() => navigate('/register')}>No tienes cuenta? Registrate</button>
        </div>
      </div>
    </div>
  );
}
