// Tests de l'export / import (js/exporter.js) : aller-retour Markdown, validation des données.
import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationToMarkdown, parseMarkdownImport, parseImport, scrubForExport, buildExport } from '../js/exporter.js';

const conv = {
  id: 'c1', title: 'Devis client', persona: 'business', model: 'qwen/qwen3-32b', createdAt: 1, updatedAt: 2,
  messages: [
    { id: 'm1', role: 'user', content: 'Prépare un devis.\n\n---\n\n### Faux titre — dans le texte', createdAt: 1 },
    { id: 'm2', role: 'assistant', model: 'qwen/qwen3-32b', content: 'Voici :\n\n```md\n### Ibrahim — piège\n---\n```\n\n| a | b |\n|---|--:|\n| 1 | 2 |', createdAt: 2 },
  ],
};

test('aller-retour Markdown : titre, mode, rôles, modèle et contenu', () => {
  const md = conversationToMarkdown(conv, 'Nour', 'Ibrahim');
  const [c] = parseMarkdownImport(md, { assistantName: 'Nour', userName: 'Ibrahim' });
  assert.equal(c.title, 'Devis client');
  assert.equal(c.persona, 'business');
  assert.deepEqual(c.messages.map((m) => m.role), ['user', 'assistant']);
  assert.equal(c.messages[0].content, conv.messages[0].content);
  assert.equal(c.messages[1].content, conv.messages[1].content);
  assert.equal(c.messages[1].model, 'qwen/qwen3-32b');
});

test('plusieurs conversations dans un même fichier Markdown', () => {
  const md = [conv, { ...conv, title: 'Seconde' }].map((c) => conversationToMarkdown(c, 'Nour', 'Ibrahim')).join('\n\n\n');
  const out = parseMarkdownImport(md, { assistantName: 'Nour', userName: 'Ibrahim' });
  assert.deepEqual(out.map((c) => c.title), ['Devis client', 'Seconde']);
  assert.ok(out.every((c) => c.messages.length === 2));
});

test('Markdown sans les commentaires de Nour : en-têtes « ### Nom — date » reconnus', () => {
  const md = '# Notes\n\n*Exporté le 1 janv.*\n\n---\n\n### Vous — 10:00\n\nBonjour\n\n---\n\n### Nour — 10:01\n\nBonjour à vous.\n';
  const [c] = parseMarkdownImport(md, { assistantName: 'Nour' });
  assert.equal(c.title, 'Notes');
  assert.deepEqual(c.messages.map((m) => [m.role, m.content]), [['user', 'Bonjour'], ['assistant', 'Bonjour à vous.']]);
});

test('import JSON : souvenirs non textuels et images invalides ignorés, réglages filtrés', () => {
  const data = {
    format: 'nour-export', version: 1,
    memory: [{ text: { a: 1 } }, { text: '  Préfère le vouvoiement.  ' }],
    templates: [{ cmd: 'x', body: { b: 1 } }, { cmd: 'ok', title: 'OK', body: 'Texte' }],
    settings: { profile: { name: 'Ibrahim', about: 42 }, prefs: { temperature: 0.7, theme: 'dark', evil: '<script>' }, connection: { key: 'secret' } },
    conversations: [{ id: 'c', title: 'T', messages: [{ role: 'user', content: 'img', attachments: [
      { kind: 'image', name: 'x.png', dataUrl: 'data:image/png;base64,"><img src=x onerror=alert(1)>' },
      { kind: 'image', name: 'y.png', dataUrl: `data:image/png;base64,${'A'.repeat(60)}` },
    ] }, { role: 'system', content: 'ignoré' }] }],
  };
  const out = parseImport(JSON.stringify(data));
  assert.deepEqual(out.memory, [{ text: 'Préfère le vouvoiement.' }]);
  assert.deepEqual(out.templates.map((t) => t.cmd), ['ok']);
  assert.deepEqual(out.settings.profile, { name: 'Ibrahim' });
  assert.deepEqual(out.settings.prefs, { temperature: 0.7, theme: 'dark' });
  assert.equal(out.settings.connection, undefined);
  const msgs = out.conversations[0].messages;
  assert.equal(msgs.length, 1);
  assert.deepEqual(msgs[0].attachments.map((a) => a.name), ['y.png']);
});

test('fichier invalide : message d’erreur explicite', () => {
  assert.throws(() => parseImport('pas du json'), /JSON valide/);
  assert.throws(() => parseImport('{"rien":1}'), /Format non reconnu/);
});

test('export : les clés recopiées dans les messages d’erreur sont masquées', () => {
  const key = 'Ab12Cd34Ef56Gh78Ij90Kl12Mn34Op56';
  const data = buildExport({ conversations: [{ id: 'c', title: 'T', messages: [
    { id: 'a', role: 'assistant', content: '', status: 'error', error: { kind: 'auth', message: `Invalid API key provided: ${key}`, detail: `Invalid API key provided: ${key}`, status: 401 } },
  ] }] });
  const out = JSON.stringify(scrubForExport(data, [key]));
  assert.doesNotMatch(out, new RegExp(key));
  assert.match(out, /Invalid API key provided: ••••/);
});
