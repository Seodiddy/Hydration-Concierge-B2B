// API client — B2B agent only. No booking, no operator config.

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Stream the B2B advisor response.
 * Resolves with the final full text once streaming is complete.
 */
export async function chatWithAdvisor({ messages, language }, onDelta) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, language }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Chat API error ${response.status}: ${errText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      try {
        const data = JSON.parse(json);
        if (data.type === 'delta' && data.text) {
          fullText += data.text;
          onDelta?.(fullText);
        } else if (data.type === 'error') {
          throw new Error(data.message || 'Stream error');
        }
      } catch (e) {
        if (e.message?.includes('Chat API') || e.message?.includes('Stream error')) throw e;
      }
    }
  }

  return fullText;
}
