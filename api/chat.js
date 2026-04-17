// Vercel Serverless Function: /api/chat
// B2B-only agent — Hydration H2 device advisor (S900 Plus + S3000 Pro).
// No operator config needed; the B2B system prompt is self-contained.
//
// Request:
//   POST /api/chat
//   { messages: [{role, content}, ...], language: 'en' | 'de' | 'es' | 'fr' }
//
// Response (SSE):
//   data: {"type":"delta","text":"..."}
//   data: {"type":"delta","text":"<quick_replies>...</quick_replies>"}
//   data: {"type":"delta","text":"<metadata>{...}</metadata>"}
//   data: {"type":"done"}

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCors } from './_security.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ---- Load prompt & knowledge bases ONCE at cold start ----
const SYSTEM_PROMPT = readFileSync(join(DATA_DIR, 'system_prompt_b2b.txt'), 'utf8');
const FAQ_KB = JSON.parse(readFileSync(join(DATA_DIR, 'faq_knowledge_base.json'), 'utf8'));
const STUDIES_KB = JSON.parse(readFileSync(join(DATA_DIR, 'studies_knowledge_base.json'), 'utf8'));

// Build a general knowledge base context (no goal-specific prioritisation for B2B)
function buildKnowledgeContext() {
  const faqLines = FAQ_KB.map(
    (f) => `Q${f.id} [${f.category}]: ${f.question}\nA: ${f.answer}`
  ).join('\n\n');

  const categories = STUDIES_KB.categories || {};
  let studiesLines = '## Clinical evidence bank (top study per category):\n';
  for (const [cat, list] of Object.entries(categories)) {
    if (!list?.length) continue;
    const s = list[0];
    studiesLines += `- [${cat}] ${s.year} ${s.title} (${s.journal}): ${s.conclusion || ''}\n`;
  }

  return `\n\n---\n## KNOWLEDGE BASE — FAQ\n\n${faqLines}\n\n---\n## KNOWLEDGE BASE — CLINICAL STUDIES\n\n${studiesLines}\n`;
}

function languageInstruction(lang) {
  const map = {
    en: 'Respond in English.',
    de: 'Antworte ausschließlich auf Deutsch. Nutze professionelle, sachliche Sprache.',
    es: 'Responde siempre en español con un tono profesional y directo.',
    fr: 'Réponds toujours en français avec un ton professionnel et direct.',
  };
  return map[lang] || map.en;
}

// ---- Main handler ----
export default async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method === 'OPTIONS') {
    if (!applyCors(req, res)) return;
    res.status(204).end();
    return;
  }
  if (!applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!process.env.ANTHROPIC_API_KEY) { res.status(500).json({ error: 'Server missing ANTHROPIC_API_KEY' }); return; }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { res.status(400).json({ error: 'Invalid JSON body' }); return; }
  }

  const { messages = [], language = 'en' } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages[] required' });
    return;
  }

  const knowledge = buildKnowledgeContext();
  const runtimeCtx = `\n\n---\n## RUNTIME CONTEXT\n- ${languageInstruction(language)}\n`;
  const systemPrompt = SYSTEM_PROMPT + knowledge + runtimeCtx;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1024', 10);

  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : String(m.content || ''),
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        send({ type: 'delta', text: event.delta.text });
      }
    }

    send({ type: 'done' });
    res.end();
  } catch (err) {
    console.error('Claude API error:', err);
    send({ type: 'error', message: err.message || 'Upstream error' });
    res.end();
  }
}
