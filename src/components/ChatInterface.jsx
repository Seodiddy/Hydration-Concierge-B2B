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
    quickReplies = qrMatch[1]
      .trim()
      .split(/\n+/)
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
  const [currentMessage, setCurrentMessage] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [quickReplies, setQuickReplies] = useState([]);
  const [showOrderCta, setShowOrderCta] = useState(false);
  const [recommendedProduct, setRecommendedProduct] = useState(null);
  const [productPrice, setProductPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentReply, setSentReply] = useState('');
  const [input, setInput] = useState('');
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [msgVisible, setMsgVisible] = useState(false);

  const messagesRef = useRef([]);
  const hasKickedOff = useRef(false);

  const handleAgentResponse = (fullText) => {
    const { message, quickReplies: qr, showOrderCta: orderCta, recommendedProduct: prod, productPrice: price } = parseAgentContent(fullText);
    setCurrentMessage(message);
    setQuickReplies(qr);
    setShowOrderCta(orderCta);
    if (prod) setRecommendedProduct(prod);
    if (price) setProductPrice(price);
    setSentReply('');
    setLoading(false);
    setStarted(true);
  };

  const sendToAgent = async (messages) => {
    setLoading(true);
    setMsgVisible(false);
    try {
      const fullText = await chatWithAdvisor(
        { messages, language },
        (partial) => {
          const parsed = parseAgentContent(partial);
          if (parsed.message) {
            setStreamingText(parsed.message);
            setMsgVisible(true);
          }
        }
      );
      messagesRef.current = [...messages, { role: 'assistant', content: fullText }];
      setStreamingText('');
      handleAgentResponse(fullText);
      setMsgVisible(true);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setStreamingText('');
      setCurrentMessage(t.errorRetry);
      setQuickReplies([t.retryLabel]);
      setMsgVisible(true);
    }
  };

  // Kick off the agent on mount (and whenever language changes)
  useEffect(() => {
    if (hasKickedOff.current) return;
    hasKickedOff.current = true;
    setCurrentMessage('');
    setStreamingText('');
    setQuickReplies([]);
    setShowOrderCta(false);
    setRecommendedProduct(null);
    setProductPrice(null);
    setSentReply('');
    setStarted(false);
    messagesRef.current = [];

    const kickoff = [{ role: 'user', content: 'Hello' }];
    messagesRef.current = kickoff;
    sendToAgent(kickoff);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset + re-kick when language changes
  useEffect(() => {
    hasKickedOff.current = false;
    setCurrentMessage('');
    setStreamingText('');
    setQuickReplies([]);
    setShowOrderCta(false);
    setRecommendedProduct(null);
    setProductPrice(null);
    setSentReply('');
    setStarted(false);
    setLoading(false);
    messagesRef.current = [];

    hasKickedOff.current = true;
    const kickoff = [{ role: 'user', content: 'Hello' }];
    messagesRef.current = kickoff;
    sendToAgent(kickoff);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

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
    setStreamingText('');

    const msgs = [...messagesRef.current, { role: 'user', content: reply }];
    messagesRef.current = msgs;
    sendToAgent(msgs);
  };

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    handleReply(msg);
  };

  const displayMessage = streamingText || currentMessage;
  const isCompact = started;

  return (
    <div style={{ background: 'var(--h2-bg)', minHeight: '100vh' }}>
      <HeroSection language={language} compact={isCompact} />

      <div className={`${isCompact ? 'pt-6 md:pt-10' : ''}`}>

        {/* Message area */}
        <div
          className={`w-full max-w-4xl mx-auto px-4 md:px-6 pb-8 transition-opacity duration-300 ${msgVisible || loading ? 'opacity-100' : 'opacity-0'}`}
        >
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
              renderMessage(displayMessage)
            )}
          </div>

          {/* Quick replies + free-text input */}
          {!loading && !showOrderCta && quickReplies?.length > 0 && (
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
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h2-cta"
                  style={{ padding: '12px 18px' }}
                  aria-label="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Free-text only (no quick replies but chat is active) */}
          {!loading && !showOrderCta && quickReplies?.length === 0 && displayMessage && (
            <div className="flex gap-2 max-w-xl mx-auto mt-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.typeYourOwn}
                className="h2-input flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="h2-cta"
                style={{ padding: '12px 18px' }}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Device order CTA — appears when agent recommends a product */}
        {showOrderCta && !loading && (
          <DeviceOrderCTA
            language={language}
            quickReplies={quickReplies}
            onReply={handleReply}
            recommendedProduct={recommendedProduct}
            productPrice={productPrice}
          />
        )}

        {/* Medical disclaimer */}
        {started && (
          <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-12">
            <p className="text-xs text-center" style={{ color: 'var(--h2-muted-soft)', lineHeight: 1.6 }}>
              {t.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
