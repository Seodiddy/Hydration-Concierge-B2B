import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface.jsx';

const LANGUAGES = ['de', 'en', 'es', 'fr'];

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
      {/* Language switcher — top right */}
      <div className="absolute top-4 right-4 md:top-5 md:right-6 z-50 flex items-center gap-2 md:gap-3 text-xs md:text-sm">
        {LANGUAGES.map((code, idx) => (
          <React.Fragment key={code}>
            <button
              onClick={() => setLanguage(code)}
              className="transition-all font-medium"
              style={{
                color: language === code ? 'var(--h2-primary-darker)' : 'var(--h2-muted)',
                fontWeight: language === code ? 700 : 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0',
              }}
            >
              {code.toUpperCase()}
            </button>
            {idx < LANGUAGES.length - 1 && (
              <span style={{ color: 'var(--h2-border-strong)', userSelect: 'none' }}>|</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <ChatInterface language={language} />
    </div>
  );
}
