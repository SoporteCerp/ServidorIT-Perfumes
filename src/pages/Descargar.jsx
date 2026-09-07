import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoreSettings } from '../services/storeSettingsService';

export default function Descargar() {
  const [store, setStore] = useState({ name: 'Esencia Gale' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getStoreSettings().then((s) => { if (s) setStore(s); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (loaded) document.title = store.name + ' - Descarga la App';
  }, [loaded, store.name]);

  const gold = '#d4af37';

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{store.name}</div>
      <div style={{ fontSize: 13, color: gold, marginBottom: 20, letterSpacing: 3, textTransform: 'uppercase' }}>Descarga la App</div>

      <div style={{ fontSize: 48, marginBottom: 8 }}>{'\uD83C\uDF89'}</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Lleva nuestra tienda en tu bolsillo</h1>
      <p style={{ fontSize: 14, color: '#bbb', maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
        Instala {store.name} en tu celular Android y compra tus fragancias favoritas con envios a todo Panama.
      </p>

      <a
        href={`${process.env.PUBLIC_URL ?? ''}/EsenciaGale.apk`}
        download="EsenciaGale.apk"
        style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f0d060, #b8860b)', color: '#0b0b0b', fontWeight: 800, fontSize: 16, padding: '14px 34px', borderRadius: 50, textDecoration: 'none', boxShadow: '0 6px 20px rgba(212,175,55,.35)' }}
      >
        {'\u2B07'} Descargar APK
      </a>
      <div style={{ fontSize: 12, color: '#8a7a3a', marginTop: 8 }}>Android · 6.2 MB · Instalacion en 1 minuto</div>

      <div style={{ marginTop: 32, textAlign: 'left', maxWidth: 380, width: '100%', background: '#151515', borderRadius: 14, padding: 18, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: gold, marginBottom: 12 }}>{'\uD83D\uDCF1'} Como instalarla:</div>
        {[
          'Toca el boton "Descargar APK" arriba',
          'Tu celular te pedira permiso: acepta "Permitir desde esta fuente"',
          'Tambien veras un aviso de Google Play Protect: presiona "Instalar de todos modos"',
          'Listo, abre {store.name} desde tu pantalla de inicio'
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#ddd', lineHeight: 1.5, marginBottom: 10 }}>
            <b style={{ color: gold, minWidth: 20 }}>{i + 1}.</b>
            <span>{s.replace('{store.name}', store.name)}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.5 }}>
          {'\u26A0\uFE0F'} Solo para celulares Android. Si tiene preguntas, escríbenos por WhatsApp.
        </div>
      </div>

      <Link to="/" style={{ color: gold, fontSize: 13, textDecoration: 'underline', marginTop: 28 }}>{'\u2190'} Volver a la tienda</Link>
    </div>
  );
}