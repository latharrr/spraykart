'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export const COOKIE_CONSENT_KEY = 'spraykart_cookie_consent_v1';

const defaultChoice = {
  essential: true,
  analytics: false,
  marketing: false,
  savedAt: null,
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [choice, setChoice] = useState(defaultChoice);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) setVisible(true);
      else setChoice({ ...defaultChoice, ...JSON.parse(saved) });
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (nextChoice) => {
    const payload = { ...nextChoice, essential: true, savedAt: new Date().toISOString() };
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    setChoice(payload);
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 80,
        maxWidth: 760,
        margin: '0 auto',
        background: '#0c0c0c',
        color: '#fff',
        border: '1px solid rgba(255,255,255,.12)',
        boxShadow: '0 16px 60px rgba(0,0,0,.35)',
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,.78)' }}>
            We use essential cookies for sign-in, cart, checkout, and security. Optional analytics or marketing
            cookies will only load after consent. Read our{' '}
            <Link href="/privacy" style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Privacy Policy
            </Link>.
          </p>
          {manageOpen && (
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
                <span>Essential cookies</span>
                <input type="checkbox" checked readOnly aria-label="Essential cookies always enabled" />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
                <span>Analytics cookies</span>
                <input
                  type="checkbox"
                  checked={choice.analytics}
                  onChange={(e) => setChoice((current) => ({ ...current, analytics: e.target.checked }))}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
                <span>Marketing cookies</span>
                <input
                  type="checkbox"
                  checked={choice.marketing}
                  onChange={(e) => setChoice((current) => ({ ...current, marketing: e.target.checked }))}
                />
              </label>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => save({ essential: true, analytics: true, marketing: true })}
            style={buttonStyle(true)}
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={() => save(defaultChoice)}
            style={buttonStyle(false)}
          >
            Reject Non-Essential
          </button>
          {manageOpen ? (
            <button type="button" onClick={() => save(choice)} style={buttonStyle(false)}>
              Save Choices
            </button>
          ) : (
            <button type="button" onClick={() => setManageOpen(true)} style={buttonStyle(false)}>
              Manage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function buttonStyle(primary) {
  return {
    minHeight: 44,
    padding: '0 14px',
    border: primary ? '1px solid #fff' : '1px solid rgba(255,255,255,.28)',
    background: primary ? '#fff' : 'transparent',
    color: primary ? '#0c0c0c' : '#fff',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };
}
