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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
