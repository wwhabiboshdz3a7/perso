// Tests de l'analyseur SSE et de la normalisation des modèles.
//   node --test tests/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSSEParser, readSSE } from '../js/sse.js';

test('événements découpés à n’importe quel endroit', () => {
  const events = [];
  const p = createSSEParser((e) => events.push(e));
  const raw = ': commentaire\n\ndata: {"a":1}\n\nevent: fin\ndata: ligne1\ndata: ligne2\r\n\r\ndata: [DONE]\n\n';
  for (const ch of raw) p.feed(ch);
  p.end();
  assert.deepEqual(events.map((e) => e.data), ['{"a":1}', 'ligne1\nligne2', '[DONE]']);
  assert.equal(events[1].event, 'fin');
});

test('readSSE : JSON reçu en morceaux, arrêt sur [DONE]', async () => {
  const enc = new TextEncoder();
  const parts = ['data: {"choices":[{"delta":{"content":"Bon"}}]}\n', '\ndata: {"choices":[{"de', 'lta":{"content":"jour"}}]}\n\n', 'data: [DONE]\n\n', 'data: {"ignoré":true}\n\n'];
  const stream = new ReadableStream({ start(c) { parts.forEach((p) => c.enqueue(enc.encode(p))); c.close(); } });
  let text = '';
  let count = 0;
  await readSSE(stream, (j) => { count++; text += j.choices[0].delta.content; });
  assert.equal(text, 'Bonjour');
  assert.equal(count, 2);
});

test('readSSE : une erreur levée dans le rappel interrompt la lecture', async () => {
  const enc = new TextEncoder();
  const stream = new ReadableStream({ start(c) { c.enqueue(enc.encode('data: {"error":{"message":"x"}}\n\n')); c.close(); } });
  await assert.rejects(readSSE(stream, (j) => { if (j.error) throw new Error(j.error.message); }), /x/);
});
