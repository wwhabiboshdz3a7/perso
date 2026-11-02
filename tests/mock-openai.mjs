#!/usr/bin/env node
// Faux serveur compatible OpenAI pour développer et tester sans clé ni réseau.
//   node tests/mock-openai.mjs 9302   → http://127.0.0.1:9302/v1
//
// Clés reconnues : « cle-valide » (ou toute clé commençant par « sk-test »),
// « cle-quota » (429), « cle-panne » (500) ; toute autre clé renvoie 401.
// Le contenu de la réponse dépend du dernier message : « markdown », « xss », « lent »,
// « raisonne », « think », « erreur-flux », image ou fichier joint, sinon un écho.

import http from 'node:http';
import { fileURLToPath } from 'node:url';

export const MODELS = [
  { id: 'openai/gpt-oss-120b', context_length: 131072, owned_by: 'openai' },
  { id: 'meta-llama/llama-3.3-70b-instruct', context_length: 131072, owned_by: 'meta' },
  { id: 'qwen/qwen3-32b', context_length: 32768 },
  { id: 'mistralai/mistral-small-3.2', context_length: 32768 },
  { id: 'deepseek/deepseek-r1-distill-llama-70b', context_length: 65536 },
  { id: 'google/gemma-3-27b-it:free', context_length: 96000, pricing: { prompt: '0', completion: '0' }, architecture: { input_modalities: ['text', 'image'] } },
  { id: 'meta-llama/llama-4-scout', context_length: 131072, architecture: { input_modalities: ['text', 'image'] } },
  { id: 'nomic-embed-text', context_length: 8192 },
];

const MARKDOWN = `## Plan en trois temps

Voici un **résumé** clair avec une liste :

- Premier point avec \`code en ligne\`
- Deuxième point
  - sous-point

| Offre | Prix | Délai |
|---|---:|---|
| Essentiel | 690 € | 1 semaine |
| Pro | 1 490 € | 3 semaines |

\`\`\`js
function salut(nom) {
  return \`Bonjour \${nom} !\`;
}
console.log(salut('Ibrahim'));
\`\`\`

La formule d'Euler $e^{i\\pi} + 1 = 0$ est célèbre, tout comme :

$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$

> Une citation pour finir.`;

const XSS = `Voici des pièges : <img src=x onerror="window.__xss=1"> et <script>window.__xss=2</script>
<iframe src="javascript:window.__xss=3"></iframe>

[lien piégé](javascript:window.__xss=4) et [lien sûr](https://example.org)

![pixel espion](https://tracker.example.com/p.png?data=secret)

<a href="#" onclick="window.__xss=5">clic</a> <svg onload="window.__xss=6"></svg> <b>gras autorisé</b>`;

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((p) => p.type === 'text').map((p) => p.text).join('\n');
  return '';
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function startMock({ port = 0, host = '127.0.0.1', log = false } = {}) {
  const state = { requests: [], count: 0 };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, HTTP-Referer, X-Title, Accept',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Expose-Headers': 'Retry-After',
    };
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...cors, ...headers });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

    // Outils de test
    if (url.pathname === '/__mock/last') return send(200, state.requests[state.requests.length - 1] || null);
    if (url.pathname === '/__mock/count') return send(200, { count: state.count });
    if (url.pathname === '/__mock/reset') { state.requests = []; state.count = 0; return send(200, { ok: true }); }

    const auth = req.headers.authorization || '';
    const key = auth.replace(/^Bearer\s+/i, '');
    if (url.pathname.startsWith('/v1/')) {
      if (key === 'cle-quota') return send(429, { error: { message: 'Rate limit reached for requests. Please try again in 12s.', type: 'rate_limit_exceeded' } }, { 'Retry-After': '12' });
      if (key === 'cle-panne') return send(500, { error: { message: 'Internal server error', type: 'server_error' } });
      if (!(key === 'cle-valide' || key.startsWith('sk-test'))) return send(401, { error: { message: `Invalid API Key: ${key.slice(0, 4)}…`, type: 'invalid_request_error', code: 'invalid_api_key' } });
    }

    if (url.pathname === '/v1/models' && req.method === 'GET') {
      return send(200, { object: 'list', data: MODELS.map((m) => ({ object: 'model', ...m })) });
    }

    if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
      let raw = '';
      for await (const c of req) raw += c;
      let body;
      try { body = JSON.parse(raw); } catch { return send(400, { error: { message: 'Invalid JSON' } }); }
      state.count += 1;
      state.requests.push(body);
      if (log) console.log(`[mock] ${body.model} · ${body.messages.length} messages`);
      if (body.model === 'modele-inexistant') return send(404, { error: { message: 'The model `modele-inexistant` does not exist', code: 'model_not_found' } });

      const msgs = body.messages || [];
      const system = textOf(msgs.find((m) => m.role === 'system')?.content);
      const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
      const text = textOf(lastUser?.content);
      const images = Array.isArray(lastUser?.content) ? lastUser.content.filter((p) => p.type === 'image_url').length : 0;

      let reasoning = '';
      let answer;
      let delay = 12;
      let breakStream = false;
      if (/proposer des souvenirs/i.test(system)) {
        answer = '["Dirige l\'agence digitale NEXORA à Toulouse.", "Préfère des réponses courtes avec un exemple concret.", "Prépare une offre de sites pour les restaurants."]';
      } else if (/markdown/i.test(text)) answer = MARKDOWN;
      else if (/xss/i.test(text)) answer = XSS;
      else if (/lent/i.test(text)) { answer = Array.from({ length: 80 }, (_, i) => `mot${i + 1}`).join(' '); delay = 70; }
      else if (/raisonne/i.test(text)) { reasoning = 'Je décompose le problème en étapes. Ensuite je vérifie.'; answer = 'La réponse est **42**.'; }
      else if (/think/i.test(text)) answer = '<think>Réflexion cachée du modèle.</think>Voici la réponse finale.';
      else if (/erreur-flux/i.test(text)) { answer = 'Début de réponse '; breakStream = true; }
      else if (images) answer = `J'ai bien reçu ${images} image${images > 1 ? 's' : ''}.`;
      else if (/Fichier joint : (.+)/.test(text)) answer = `J'ai lu le fichier « ${/Fichier joint : ([^\n(]+)/.exec(text)[1].trim()} ».`;
      else answer = `Bonjour ! Vous avez écrit : « ${text.slice(0, 120)} ». Réponse n°${state.count}.`;

      const id = `chatcmpl-${state.count}`;
      const created = Math.floor(Date.now() / 1000);
      if (body.stream === false) {
        return send(200, { id, object: 'chat.completion', created, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: answer, reasoning_content: reasoning || undefined }, finish_reason: 'stop' }], usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 } });
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', ...cors });
      let closed = false;
      req.on('close', () => { closed = true; });
      res.on('close', () => { closed = true; });
      const chunk = (delta, finish = null, extra = {}) => `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created, model: body.model, choices: [{ index: 0, delta, finish_reason: finish }], ...extra })}\n\n`;
      res.write(': mock en cours\n\n');
      res.write(chunk({ role: 'assistant', content: '' }));
      for (const piece of (reasoning.match(/\S+\s*/g) || [])) {
        if (closed) return;
        res.write(chunk({ reasoning_content: piece }));
        await sleep(delay);
      }
      const pieces = answer.match(/[\s\S]{1,6}/g) || [];
      for (const piece of pieces) {
        if (closed) return;
        res.write(chunk({ content: piece }));
        await sleep(delay);
      }
      if (breakStream) {
        res.write(`data: ${JSON.stringify({ error: { message: 'Model overloaded, please retry', code: 503 } })}\n\n`);
        res.end();
        return;
      }
      res.write(chunk({}, 'stop', { usage: { prompt_tokens: 120, completion_tokens: pieces.length, total_tokens: 120 + pieces.length } }));
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    send(404, { error: { message: 'Not found' } });
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const { port: p } = server.address();
      resolve({ server, port: p, url: `http://${host}:${p}/v1`, state, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 9302);
  startMock({ port, log: true }).then(({ url }) => console.log(`Faux serveur OpenAI prêt : ${url}`));
}
