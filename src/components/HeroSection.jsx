import React, { useEffect, useState } from 'react';
import { I18N } from '../lib/i18n.js';

// Full hero on first load, collapses to thin logo bar once chat has started.
export default function HeroSection({ language, compact }) {
  const t = I18N[language] || I18N.en;
  const words = t.heroWords;
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (compact) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setFadeIn(true);
      }, 500);
    }, 4500);
    return () => clearInterval(interval);
  }, [compact, words.length]);

  // Compact: thin top bar with logo only
  if (compact) {
    return (
      <header
        className="w-full px-4 md:px-10 flex items-center"
        style={{
          height: 72,
          background: 'var(--h2-surface)',
          borderBottom: '1px solid var(--h2-border)',
        }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white text-sm"
            style={{ background: 'var(--h2-primary)' }}
          >
            H₂
          </span>
          <span className="font-semibold text-[15px]" style={{ color: 'var(--h2-text)' }}>
            Hydration H2
          </span>
        </div>
      </header>
    );
  }

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center text-center px-4 md:px-6 pt-20 md:pt-12"
      style={{ minHeight: '36vh', background: 'var(--h2-bg)' }}
    >
      {/* Logo top-left */}
      <div className="absolute top-4 left-4 md:top-6 md:left-10 z-20">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white text-sm"
            style={{ background: 'var(--h2-primary)' }}
          >
            H₂
          </span>
          <span className="font-semibold text-[15px]" style={{ color: 'var(--h2-text)' }}>
            Hydration H2
          </span>
        </div>
      </div>

      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 60%, color-mix(in srgb, var(--h2-primary) 14%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto py-10 md:py-24">
        <h1
          className="mb-4 md:mb-5 text-3xl md:text-6xl font-bold tracking-tight leading-[1.1]"
          style={{ color: 'var(--h2-text)' }}
        >
          <span
            className="h2-rotating-word"
            style={{ opacity: fadeIn ? 1 : 0, color: 'var(--h2-primary-darker)' }}
          >
            {words[wordIndex]}
          </span>
          <br />
          <span className="text-2xl md:text-5xl font-semibold" style={{ color: 'var(--h2-text-soft)' }}>
            {t.heroSubline}
          </span>
        </h1>

        <p
          className="mb-4 uppercase tracking-widest px-2"
          style={{ fontSize: 10, color: 'var(--h2-primary-darker)', letterSpacing: '0.18em', opacity: 0.85 }}
        >
          {t.heroTagline}
        </p>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--h2-bg))' }}
      />
    </section>
  );
}
