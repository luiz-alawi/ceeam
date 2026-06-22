'use client';

import { useEffect } from 'react';

/** Registra o service worker para habilitar o PWA (instalação / offline básico). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.error('Falha ao registrar service worker:', e);
    });
  }, []);

  return null;
}
