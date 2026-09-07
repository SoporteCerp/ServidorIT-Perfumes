import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoreSettings } from '../services/storeSettingsService';

function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

export default function Descargar() {
  const [store, setStore] = useState({ name: 'Esencia Gale' });
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    setDevice(detectDevice());
    getStoreSettings().then((s) => { if (s) setStore(s); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (loaded) document.title = store.name + ' - Descarga la App';
  }, [loaded, store.name]);

  const gold = '#d4af37';

  const iosSteps = [
    'Abre este enlace en Safari (el navegador de tu iPhone)',
    'Toca el boton Compartir: el cuadrado con la flecha hacia arriba \u2191',
    'Desplazate y presiona "Agregar a la pantalla de inicio"',
    'Confirma con "Agregar" y la app quedara en tu inicio con su icono'
  ].map((s, i) => ({ i: i + 1, s }));

  const androidSteps = [
    'Toca el boton "Descargar APK" arriba',
    'Tu celular te pedira permiso: acepta "Permitir desde esta fuente"',
    'Tambien veras un aviso de Google Play Protect: presiona "Instalar de todos modos"',
    'Listo, abre {store.name} desde tu pantalla de inicio'
  ].map((s, i) => ({ i: i + 1, s }));

  const desktopSteps = [
    'Para celulares Android: abre este enlace en el celular y descarga el APK',
    'Para iPhone: entra desde Safari y usa "Agregar a la pantalla de inicio"'
  ].map((s, i) => ({ i: i + 1, s }));

  const isAndroid = device === 'android';
  const isIOS = device === 'ios';

  const steps = isAndroid
    ? androidSteps
    : isIOS
      ? iosSteps
      : desktopSteps;

  const apkUrl = `${process.env.PUBLIC_URL ?? ''}/EsenciaGale.apk`;

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{store.name}</div>
      <div style={{ fontSize: 13, color: gold, marginBottom: 20, letterSpacing: 3, textTransform: 'uppercase' }}>Descarga la App</div>

      <div style={{ fontSize: 48, marginBottom: 8 }}>
        {isAndroid ? '\uD83D\uDCF1' : isIOS ? '\uD83C\uDF0D' : '\uD83D\uDCF1'}
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
        {isAndroid ? 'Instala la app en tu Android' : isIOS ? 'Instala la app en tu iPhone' : 'Descarga la app'}
      </h1>
      <p style={{ fontSize: 14, color: '#bbb', maxWidth: 380, lineHeight: 1.6, marginBottom: 24 }}>
        {isIOS
          ? 'Apple no permite instalar apps fuera de la App Store, pero puedes llevar la tienda a tu pantalla de inicio con Safari. Es gratis y toma 30 segundos.'
          : 'Lleva {store.name} a tu celular y compra tus fragancias favoritas con envios a todo Panama.'}
      </p>

      {isAndroid ? (
        <a
          href={apkUrl}
          download="EsenciaGale.apk"
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f0d060, #b8860b)', color: '#0b0b0b', fontWeight: 800, fontSize: 16, padding: '14px 34px', borderRadius: 50, textDecoration: 'none', boxShadow: '0 6px 20px rgba(212,175,55,.35)' }}
        >
          {'\u2B07'} Descargar APK {store.name.replace('{store.name}', '')}
        </a>
      ) : (
        <div
          style={{ background: 'linear-gradient(135deg, #f0d060, #b8860b)', color: '#0b0b0b', fontWeight: 800, fontSize: 16, padding: '6px 20px', borderRadius: 50, boxShadow: '0 6px 20px rgba(212,175,55,.35)' }}
        >
          {'\uD83D\uDCF1'} iOS: usa el boton Compartir de Safari
        </div>
      )}

      {!isAndroid && (
        <a
          href={apkUrl}
          style={{ fontSize: 12, color: '#8a7a3a', marginTop: 10, textDecoration: 'underline' }}
        >
          (Descargar APK para Android)
        </a>
      )}
      {isAndroid && (
        <div style={{ fontSize: 12, color: '#8a7a3a', marginTop: 8 }}>Android · 6.2 MB · Instalacion en 1 minuto</div>
      )}

      <div style={{ marginTop: 32, textAlign: 'left', maxWidth: 380, width: '100%', background: '#151515', borderRadius: 14, padding: 18, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: gold, marginBottom: 12 }}>
          {isIOS ? '\uD83D\uDCF1' : '\uD83D\uDCF1'} Como {isIOS ? 'agregarla a tu iPhone' : 'instalarla'}:
        </div>
        {steps.map(({ i, s }) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#ddd', lineHeight: 1.5, marginBottom: 10 }}>
            <b style={{ color: gold, minWidth: 20 }}>{i}.</b>
            <span>{s.replace('{store.name}', store.name)}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.5 }}>
          {isIOS
            ? 'La app en tu inicio se abre sin barra de direcciones y guarda tus datos como una app normal.'
            : '\u26A0\uFE0F La app funciona en celulares con sistema Android.'}
        </div>
      </div>

      <Link to="/" style={{ color: gold, fontSize: 13, textDecoration: 'underline', marginTop: 28 }}>{'\u2190'} Volver a la tienda</Link>
    </div>
  );
}