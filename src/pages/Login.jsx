import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, resetPassword } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try { await loginUser(email, password); navigate('/'); }
    catch { setError('Credenciales incorrectas'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { setError('Escribe tu email primero'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError('Error: ' + (err.message || 'Intenta de nuevo'));
    } finally { setLoading(false); }
  };

  if (showReset) {
    return (
      <div className="login-page">
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo">📧</div>
            <h1 className="login-title">Recuperar Contrasena</h1>
            <p className="login-subtitle">Te enviaremos un link para crear una nueva contrasena</p>
          </div>

          {resetSent ? (
            <>
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:50,marginBottom:15}}>✅</div>
                <p style={{color:'#f5e6a8',fontSize:16,fontWeight:500}}>Email enviado!</p>
                <p style={{color:'#b8a86b',fontSize:14,marginTop:8}}>Revisa tu bandeja de entrada en <strong>{email}</strong></p>
              </div>
              <button className="btn btn-primary" onClick={() => { setShowReset(false); setResetSent(false); }}>
                Volver al Login
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <input className="form-input" type="email" placeholder="Tu email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {error && <p style={{color:'var(--danger)',textAlign:'center',marginBottom:15}}>{error}</p>}
              <button className="btn btn-primary" onClick={handleReset} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link de Recuperacion'}
              </button>
            </>
          )}

          <div className="text-center" style={{marginTop:15}}>
            <button className="btn-link" onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}>
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo"><img src="/logo.png" alt="Esencia Gale" style="width:96px;height:96px;borderRadius:50%;objectFit:cover;border:2px solid var(--primary,#D4AF37)" /></div>
          <h1 className="login-title">Esencia Gale</h1>
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
        <div className="text-center" style={{marginTop:10}}>
          <button className="btn-link" onClick={() => setShowReset(true)}>Olvidaste tu contrasena?</button>
        </div>
        <div className="text-center" style={{marginTop:5}}>
          <button className="btn-link" onClick={() => navigate('/register')}>No tienes cuenta? Registrate</button>
        </div>
      </div>
    </div>
  );
}
