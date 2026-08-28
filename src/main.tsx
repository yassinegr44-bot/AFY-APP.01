import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
if (typeof window !== 'undefined') {
  registerSW({
    onNeedRefresh() {
      if (confirm('Une nouvelle version de AFY est disponible. Voulez-vous mettre à jour ?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('AFY est prête pour une utilisation hors ligne.');
    },
  });

  // Request persistent storage for durable offline data
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
      if (granted) {
        console.log('Persistent storage granted. Offline data is protected from eviction.');
      } else {
        console.warn('Persistent storage not granted. Offline data may be evicted under storage pressure.');
      }
    }).catch(err => {
      console.error('Error requesting persistent storage:', err);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
