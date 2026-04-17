import React, { useEffect, useState } from 'react';
import { I18N } from '../lib/i18n.js';

const PRODUCT_INFO = {
  's900-plus': {
    name: 'Hydration S900 Plus',
    spec: '600 ml/min · 1 user · home use',
    artNr: '8101',
  },
  's3000-pro': {
    name: 'Hydration S3000 Pro',
    spec: '2,000 ml/min · 2 simultaneous users · professional',
    artNr: '8102',
  },
};

const ORDER_URL = 'https://hydration-h2.com/contact/';

export default function DeviceOrderCTA({ language, quickReplies, onReply, recommendedProduct, productPrice }) {
  const t = I18N[language] || I18N.en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const to = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(to);
  }, []);

  const product = PRODUCT_INFO[recommendedProduct] || PRODUCT_INFO['s900-plus'];
  const priceLabel = productPrice
    ? `€${Number(productPrice).toLocaleString('de-DE')}`
    : '';

  return (
    <div
      className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-16 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      {/* Follow-up pills */}
      {quickReplies?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {quickReplies.map((reply, idx) => (
            <button
              key={`${reply}-${idx}`}
              onClick={() => onReply(reply)}
              className="h2-pill"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Product card */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-full max-w-md rounded-2xl p-5 text-center"
          style={{
            background: 'var(--h2-surface)',
            border: '1px solid var(--h2-border-strong)',
            boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
          }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--h2-muted)' }}>
            {t.artNr} {product.artNr}
          </p>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--h2-text)' }}>
            {product.name}
          </p>
          {priceLabel && (
            <p
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--h2-primary-darker)' }}
            >
              {priceLabel}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--h2-muted)' }}>
            {product.spec}
          </p>
        </div>

        {/* Primary CTA — external link, opens contact page */}
        <a
          href={ORDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="h2-cta w-full max-w-md"
          style={{ textDecoration: 'none' }}
        >
          {t.orderCta}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>

        <p className="text-xs text-center" style={{ color: 'var(--h2-muted-soft)' }}>
          {t.orderNote}
        </p>
      </div>
    </div>
  );
}
