import React, { useEffect, useRef, useState } from 'react';
import { chatWithAdvisor } from '../api/client.js';
import { I18N } from '../lib/i18n.js';
import HeroSection from './HeroSection.jsx';
import DeviceOrderCTA from './DeviceOrderCTA.jsx';

// Renders **bold** inside plain text — mirrors B2C QuestionScreen.
function MarkdownText({ children }) {
  if (!children) return null;
  const parts = String(children).split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} style={{ color: 'var(--h2-text)', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
}

// Parse streamed agent text into prose + quick_replies + metadata.
function parseAgentContent(content) {
  if (!content) return { message: '', quickReplies: [], showOrderCta: false, recommendedProduct: null, productPrice: null, isComplete: false };

  const isComplete = content.includes('</quick_replies>') || content.includes('</metadata>');

  let quickReplies = [];
  const qrMatch = content.match(/<quick_replies>([\s\S]*?)<\/quick_replies>/i);
  if (qrMatch) {
    const raw = qrMatch[1].trim();
    // Support both newline-separated and pipe-separated formats
    const hasPipe = raw.includes('|');
    const items = hasPipe ? raw.split('|') : raw.split(/\n+/);
    quickReplies = items
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('<'));
  }

  let message = content
    .replace(/<quick_replies>[\s\S]*?<\/quick_replies>/gi, '')
    .replace(/<quick_replies>[\s\S]*/gi, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
    .replace(/<metadata>[\s\S]*/gi, '')
    .trim();

  let showOrderCta = false;
  let recommendedProduct = null;
  let productPrice = null;
  const metaMatch = content.match(/<metadata>\s*([\s\S]*?)\s*<\/metadata>/i);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (meta.show_order_cta === true) showOrderCta = true;
      if (meta.recommended_product) recommendedProduct = meta.recommended_product;
      if (meta.price) productPrice = meta.price;
    } catch (_) {}
  }

  return { message, quickReplies, showOrderCta, recommendedProduct, productPrice, isComplete };
}

// Split text into heading + body paragraphs — mirrors B2C QuestionScreen.
function renderMessage(text) {
  if (!text) return null;
  const sentenceMatch = text.match(/^(.+?[a-zäöüéèáíóúß\)\!\?]\.)\s+([A-ZÄÖÜ].+)$/s);
  if (sentenceMatch) {
    const heading = sentenceMatch[1];
    const bodyText = sentenceMatch[2].trim();
    const bodySentences = bodyText
      .replace(/(\d)\.(\d)/g, '$1\u2024$2')
      .replace(/(\d)\.\s+(?=[A-ZÄÖÜ])/g, '$1\u2024 ')
      .match(/[^.!?]*[.!?]+(?:\s|$)/g)
      ?.map((s) => s.replace(/\u2024/g, '.')) || [bodyText];
    const paragraphs = [];
    for (let i = 0; i < bodySentences.length; i += 2) {
      paragraphs.push(bodySentences.slice(i, i + 2).join('').trim());
    }
    return (
      <div className="max-w-2xl mx-auto h2-prose">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug mb-4" style={{ color: 'var(--h2-text)' }}>
          <MarkdownText>{heading}</MarkdownText>
        </h2>
        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] md:text-base leading-relaxed" style={{ color: 'var(--h2-text-soft)' }}>
              <MarkdownText>{p}</MarkdownText>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <h2 className="text-xl md:text-2xl font-medium leading-snug max-w-2xl mx-auto h2-prose" style={{ color: 'var(--h2-text)' }}>
      <MarkdownText>{text}</MarkdownText>
    </h2>
  );
}

export default function ChatInterface({ language }) {
  const t = I18N[language] || I18N.en;

  const [started, setStarted] = useState(false); // true after agent first replies
  // Hardcoded opening question shown immediately — no agent call needed
  const [currentMessage, setCurrentMessage] = useState(() => (I18N[language] || I18N.en).openingQuestion);
  const [streamingText, setStreamingText] = useState('');
  const [quickReplies, setQuickReplies] = useState(() => (I18N[language] || I18N.en).openingOptions);
  const [showOrderCta, setShowOrderCta] = useState(false);
  const [ctaReady, setCtaReady] = useState(false); // true only after user clicks "view recommendation"
  const [recommendedProduct, setRecommendedProduct] = useState(null);
  const [productPrice, setProductPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentReply, setSentReply] = useState('');
  const [input, setInput] = useState('');
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const prevMessageRef = useRef('');
  const prevStreamingRef = useRef(false);

  const messagesRef = useRef([]);

  // Derived display value — defined early so useEffects below can reference it
  const displayMessage = streamingText || currentMessage;

  const handleAgentResponse = (fullText) => {
    const { message, quickReplies: qr, showOrderCta: orderCta, recommendedProduct: prod, productPrice: price } = parseAgentContent(fullText);
    setCurrentMessage(message);
    setQuickReplies(qr);
    // Guard: only allow the CTA screen after at least 4 messages (2 full exchanges).
    // This prevents the agent from jumping to the product screen too early.
    const enoughExchanges = messagesRef.current.length >= 4;
    setShowOrderCta(orderCta && enoughExchanges);
    if (prod) setRecommendedProduct(prod);
    if (price) setProductPrice(price);
    setSentReply('');
    setLoading(false);
    setStarted(true);
  };

  const sendToAgent = async (messages) => {
    setLoading(true);
    try {
      const fullText = await chatWithAdvisor(
        { messages, language },
        (partial) => {
          const parsed = parseAgentContent(partial);
          if (parsed.message) setStreamingText(parsed.message);
          // Quick replies are hidden during loading — don't update them mid-stream
          // as each call re-triggers the repliesVisible effect (opacity flicker).
          // They are set once in handleAgentResponse when the full text arrives.
        }
      );
      messagesRef.current = [...messages, { role: 'assistant', content: fullText }];
      setStreamingText('');
      handleAgentResponse(fullText);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setStreamingText('');
      setCurrentMessage(t.errorRetry);
      setQuickReplies([t.retryLabel]);
    }
  };

  // Reset to hardcoded opening question when language switches
  useEffect(() => {
    const tLang = I18N[language] || I18N.en;
    setCurrentMessage(tLang.openingQuestion);
    setQuickReplies(tLang.openingOptions);
    setStreamingText('');
    setShowOrderCta(false);
    setCtaReady(false);
    setRecommendedProduct(null);
    setProductPrice(null);
    setSentReply('');
    setStarted(false);
    setLoading(false);
    prevMessageRef.current = '';
    messagesRef.current = [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Fade-in when text first appears
  useEffect(() => {
    if (!prevMessageRef.current && displayMessage) {
      setTextVisible(false);
      const to = setTimeout(() => setTextVisible(true), 40);
      prevMessageRef.current = displayMessage;
      return () => clearTimeout(to);
    }
    if (displayMessage) prevMessageRef.current = displayMessage;
    if (!displayMessage) { prevMessageRef.current = ''; setTextVisible(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!displayMessage]);

  // Cross-fade when streaming ends → formatted final text appears smoothly
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isStreaming = !!streamingText;
    prevStreamingRef.current = isStreaming;
    if (wasStreaming && !isStreaming && currentMessage) {
      setTextVisible(false);
      const to = setTimeout(() => setTextVisible(true), 180);
      return () => clearTimeout(to);
    }
  }, [streamingText, currentMessage]);

  useEffect(() => {
    if (quickReplies?.length > 0) {
      setRepliesVisible(false);
      const to = setTimeout(() => setRepliesVisible(true), 80);
      return () => clearTimeout(to);
    }
    setRepliesVisible(false);
  }, [quickReplies]);

  const handleReply = (reply) => {
    if (loading) return;
    if (reply === t.retryLabel && messagesRef.current.length > 0) {
      setSentReply('');
      sendToAgent(messagesRef.current);
      return;
    }
    setSentReply(reply);
    setCurrentMessage('');
    setQuickReplies([]);
    setShowOrderCta(false);
    setCtaReady(false);
    setStreamingText('');

    // First reply: seed the conversation with the opening Q + user's answer
    const isFirstReply = messagesRef.current.length === 0;
    const msgs = isFirstReply
      ? [
          { role: 'user', content: `${t.openingQuestion} — ${reply}` },
        ]
      : [...messagesRef.current, { role: 'user', content: reply }];
    messagesRef.current = msgs;
    sendToAgent(msgs);
  };

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    handleReply(msg);
  };

  return (
    <div style={{ background: 'var(--h2-bg)', minHeight: '100vh' }}>
      <HeroSection language={language} compact={false} />

      {/* ── B2C-identical spacing: pt-6/pt-10 · mb-8 text · mt-4 replies ── */}
      <div className="pt-6 md:pt-10">

        {showOrderCta && ctaReady && !loading ? (
          <DeviceOrderCTA
            language={language}
            quickReplies={quickReplies}
            onReply={handleReply}
            recommendedProduct={recommendedProduct}
            productPrice={productPrice}
          />
        ) : (
          <div className="w-full max-w-4xl mx-auto px-4 md:px-6 pb-8">

            {/* Text — identical to B2C QuestionScreen */}
            <div className="text-center mb-8">
              {loading && !streamingText ? (
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  {sentReply && (
                    <div
                      className="px-5 py-3 rounded-2xl text-sm font-medium mb-2"
                      style={{
                        background: 'color-mix(in srgb, var(--h2-primary) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--h2-primary) 30%, transparent)',
                        color: 'var(--h2-primary-darker)',
                      }}
                    >
                      ✓ {sentReply}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="h2-dot" />
                    <span className="h2-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="h2-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              ) : (
                // renderMessage for both streaming and final — same function,
                // no format switch. Cross-fade effect handles the streaming→final
                // transition smoothly (textVisible goes false→true over 180ms).
                <div className="transition-opacity duration-300" style={{ opacity: textVisible ? 1 : 0 }}>
                  {renderMessage(displayMessage)}
                </div>
              )}
            </div>

            {/* Quick replies — identical to B2C QuestionScreen */}
            {!loading && quickReplies?.length > 0 && (
              <div
                className="w-full max-w-3xl mx-auto mt-4 transition-all duration-500"
                style={{ opacity: repliesVisible ? 1 : 0, transform: repliesVisible ? 'translateY(0)' : 'translateY(12px)' }}
              >
                <div className="flex flex-wrap justify-center gap-3 mb-5">
                  {quickReplies.map((reply, idx) => (
                    <button key={`${reply}-${idx}`} onClick={() => handleReply(reply)} className="h2-pill">
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 max-w-xl mx-auto">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t.typeYourOwn}
                    className="h2-input flex-1"
                  />
                  <button onClick={handleSend} disabled={!input.trim()} className="h2-cta" style={{ padding: '12px 18px' }} aria-label="Send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* "View recommendation" button — shown after agent finishes, before CTA screen */}
            {!loading && showOrderCta && !ctaReady && (
              <div className="w-full max-w-3xl mx-auto mt-6 flex justify-center">
                <button
                  onClick={() => setCtaReady(true)}
                  className="h2-cta px-8 py-3 text-base font-semibold rounded-2xl"
                >
                  {t.viewRecommendation}
                </button>
              </div>
            )}

            {/* Free-text only (no quick replies) */}
            {!loading && quickReplies?.length === 0 && displayMessage && !showOrderCta && (
              <div className="flex gap-2 max-w-xl mx-auto mt-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.typeYourOwn}
                  className="h2-input flex-1"
                />
                <button onClick={handleSend} disabled={!input.trim()} className="h2-cta" style={{ padding: '12px 18px' }} aria-label="Send">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}

          </div>
        )}

        {started && (
          <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-12">
            <p className="text-xs text-center" style={{ color: 'var(--h2-muted-soft)', lineHeight: 1.6 }}>{t.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
