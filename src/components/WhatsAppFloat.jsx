import React, { useEffect, useState } from 'react';
import { getStoreSettings, DEFAULT_STORE } from '../services/storeSettingsService';

export default function WhatsAppFloat({ visible = true }) {
  const [store, setStore] = useState(DEFAULT_STORE);

  useEffect(() => {
    getStoreSettings().then(setStore).catch(() => {});
  }, []);

  if (!visible || !store.whatsapp) return null;

  const msg = encodeURIComponent('Hola ' + store.name + '! 👋 Vi su tienda de fragancias y me encantaría una recomendación. ¿Me pueden asesorar sobre precios y envíos?');

  return (
    <a
      className="wa-float"
      href={'https://wa.me/' + store.whatsapp + '?text=' + msg}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Escribenos por WhatsApp"
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16.004 3C8.826 3 3 8.827 3 16.004c0 2.29.598 4.523 1.735 6.497L3 29l6.693-1.752A12.92 12.92 0 0 0 16.004 29C23.182 29 29 23.172 29 16.004S23.182 3 16.004 3zm0 23.77a10.8 10.8 0 0 1-5.53-1.516l-.396-.236-4.036 1.056 1.078-3.928-.258-.41A10.78 10.78 0 0 1 5.23 16 10.78 10.78 0 0 1 16.004 5.23 10.78 10.78 0 0 1 26.77 16a10.78 10.78 0 0 1-10.766 10.77z"/>
        <path fill="#ffffff" d="M22.846 18.103c-.287-.144-1.7-.839-1.964-.935-.263-.096-.454-.144-.646.144-.192.288-.744.935-.912 1.127-.168.192-.336.216-.623.072-.287-.144-1.213-.447-2.31-1.425-.854-.76-1.43-1.7-1.598-1.987-.168-.288-.018-.443.126-.587.13-.13.287-.335.431-.503.144-.168.192-.287.288-.48.096-.192.048-.36-.024-.503-.072-.144-.646-1.557-.886-2.132-.233-.559-.47-.483-.646-.492-.168-.009-.36-.009-.552-.009-.192 0-.503.072-.767.36-.263.287-1.005.982-1.005 2.395s1.03 2.779 1.174 2.971c.144.192 2.027 3.095 4.91 4.34.686.296 1.221.473 1.638.606.688.218 1.314.187 1.809.113.552-.082 1.7-.695 1.94-1.366.24-.67.24-1.245.168-1.365-.072-.12-.263-.192-.55-.335z"/>
      </svg>
    </a>
  );
}