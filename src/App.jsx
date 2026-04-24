import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface.jsx';

const LANGUAGES = ['de', 'en', 'es', 'fr', 'pt', 'ro', 'bg', 'ru'];

// Native endonyms shown in the dropdown — lets users pick their
// language even if they can't read the currently-selected one.
const LANGUAGE_LABELS = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ro: 'Română',
  bg: 'Български',
  ru: 'Русский',
};

function detectLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && LANGUAGES.includes(urlLang.toLowerCase())) return urlLang.toLowerCase();
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGUAGES.includes(browser) ? browser : 'en';
}

export default function App() {
  const [language, setLanguage] = useState(detectLanguage);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--h2-bg)', position: 'relative' }}>
      {/* Language switcher — native <select> styled as a pill. With 8 languages
          a dropdown scales better than the former inline "DE | EN | ES | FR" row. */}
      <div className="absolute top-4 right-4 md:top-5 md:right-6 z-50">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              background: 'var(--h2-surface)',
              border: '1px solid var(--h2-border-strong)',
              borderRadius: '999px',
              padding: '6px 28px 6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--h2-primary-darker)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              lineHeight: '1.2',
            }}
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code] || code.toUpperCase()}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              fontSize: '10px',
              color: 'var(--h2-muted)',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      <ChatInterface language={language} />
    </div>
  );
}
