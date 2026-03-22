import React, { useState, useEffect } from 'react';

// ── Offline Banner ────────────────────────────────────────────────────────────
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      background: '#fbbf24', color: '#1a1200',
      padding: '10px 20px', textAlign: 'center',
      fontSize: 14, fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span>⚡</span> You're offline — viewing cached data
    </div>
  );
}

// ── Install Prompt ────────────────────────────────────────────────────────────
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 30s or on second visit
      const visits = parseInt(localStorage.getItem('visits') || '0') + 1;
      localStorage.setItem('visits', visits);
      if (visits >= 2) setShow(true);
      else setTimeout(() => setShow(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show || !deferredPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px', zIndex: 999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 16,
      maxWidth: 380, width: 'calc(100vw - 48px)',
    }}>
      <div style={{ fontSize: 28 }}>⬡</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Install ExpenseTrack</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add to home screen for quick access</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShow(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '6px 10px' }}
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: 'var(--accent)', color: 'white', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
