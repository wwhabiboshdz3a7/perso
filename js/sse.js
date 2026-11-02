// Analyseur de flux Server-Sent Events (format utilisé par /v1/chat/completions en streaming).
// Indépendant du DOM : utilisable dans le navigateur, la fonction Netlify et les tests Node.

export function createSSEParser(onEvent) {
  let buffer = '';
  let dataLines = [];
  let eventName = '';

  function dispatch() {
    if (!dataLines.length) { eventName = ''; return; }
    const data = dataLines.join('\n');
    dataLines = [];
    const name = eventName || 'message';
    eventName = '';
    onEvent({ event: name, data });
  }

  function line(l) {
    if (l === '') { dispatch(); return; }
    if (l.startsWith(':')) return; // commentaire (ex. « : OPENROUTER PROCESSING »)
    const i = l.indexOf(':');
    const field = i === -1 ? l : l.slice(0, i);
    let value = i === -1 ? '' : l.slice(i + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') dataLines.push(value);
    else if (field === 'event') eventName = value;
  }

  return {
    feed(chunk) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.search(/\r\n|\r|\n/)) !== -1) {
        const l = buffer.slice(0, idx);
        const nl = buffer[idx] === '\r' && buffer[idx + 1] === '\n' ? 2 : 1;
        // Un « \r » seul en fin de tampon peut être suivi d'un « \n » au prochain morceau.
        if (buffer[idx] === '\r' && idx + 1 === buffer.length) break;
        buffer = buffer.slice(idx + nl);
        line(l);
      }
    },
    end() {
      if (buffer) { line(buffer.replace(/\r$/, '')); buffer = ''; }
      dispatch();
    },
  };
}

/**
 * Lit un ReadableStream d'octets SSE et appelle onJSON pour chaque événement « data: {...} ».
 * onChunk est appelé à chaque morceau reçu (délai d'inactivité). Renvoie { done } : done vaut
 * true si le marqueur de fin « [DONE] » a été reçu.
 */
export async function readSSE(stream, onJSON, { signal, onChunk } = {}) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let done = false;
  const parser = createSSEParser(({ data }) => {
    if (done) return;
    const d = data.trim();
    if (!d) return;
    if (d === '[DONE]') { done = true; return; }
    let json;
    try { json = JSON.parse(d); } catch { return; }
    onJSON(json);
  });
  let finished = false;
  try {
    while (!done) {
      if (signal && signal.aborted) break;
      const r = await reader.read();
      if (r.done) { finished = true; break; }
      onChunk?.();
      parser.feed(decoder.decode(r.value, { stream: true }));
    }
    if (!done) {
      parser.feed(decoder.decode());
      parser.end();
    }
  } finally {
    if (!finished) { try { await reader.cancel(); } catch { /* flux déjà fermé */ } }
    try { reader.releaseLock(); } catch { /* déjà libéré */ }
  }
  return { done };
}
