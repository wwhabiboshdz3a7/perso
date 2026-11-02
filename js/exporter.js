// Export / import des conversations (JSON complet, Markdown lisible) et estimation des jetons.

import { uid, formatDateTime } from './util.js';
import { personaById, PERSONAS } from './personas.js';
import { redact, knownSecrets } from './client.js';

export const FORMAT = 'nour-export';

/** Estimation simple : ~3,7 caractères par jeton en français, un peu moins pour le code. */
export function estimateTokens(text) {
  const s = String(text || '');
  if (!s) return 0;
  const code = (s.match(/[{}();=<>[\]]/g) || []).length;
  const ratio = code > s.length / 30 ? 3.2 : 3.7;
  return Math.ceil(s.length / ratio);
}

export function estimateMessages(messages) {
  let n = 3;
  for (const m of messages) {
    n += 4;
    if (typeof m.content === 'string') n += estimateTokens(m.content);
    else if (Array.isArray(m.content)) {
      for (const p of m.content) n += p.type === 'text' ? estimateTokens(p.text) : 850;
    }
  }
  return n;
}

/* Le Markdown exporté reste lisible partout ; de discrets commentaires HTML (invisibles une fois
   rendus) permettent de le réimporter sans ambiguïté. */
export function conversationToMarkdown(conv, assistantName = 'Nour', userName = 'Vous') {
  const lines = [];
  lines.push(`<!-- nour:conversation persona=${conv.persona || 'perso'} -->`, `# ${conv.title || 'Conversation'}`, '');
  const persona = personaById(conv.persona);
  lines.push(`*Exporté le ${formatDateTime(Date.now())} · mode « ${persona.name} »${conv.model ? ` · ${conv.model}` : ''}*`, '');
  for (const m of conv.messages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const who = m.role === 'user' ? userName : assistantName;
    const meta = [formatDateTime(m.createdAt || conv.createdAt)];
    if (m.role === 'assistant' && m.model) meta.push(m.model);
    lines.push('---', '', `<!-- nour:${m.role} -->`, `### ${who} — ${meta.join(' · ')}`, '');
    if (m.attachments && m.attachments.length) {
      lines.push(`> Pièces jointes : ${m.attachments.map((a) => a.name).join(', ')}`, '');
    }
    lines.push(m.content || (m.status === 'error' ? '*(erreur)*' : ''), '');
  }
  return lines.join('\n');
}

export function buildExport({ conversations, memory, templates, settings }) {
  return {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations,
    memory: memory || [],
    templates: templates || [],
    settings: settings ? stripSecrets(settings) : undefined,
  };
}

function stripSecrets(s) {
  const copy = JSON.parse(JSON.stringify(s));
  // Les clés ne sont jamais dans les réglages, mais on reste prudent.
  if (copy.connection) { delete copy.connection.key; delete copy.connection.apiKey; }
  return copy;
}

/** Repasse les messages d'erreur au masquage (clés connues de ce navigateur) avant un export. */
export function scrubForExport(data, secrets = knownSecrets()) {
  const copy = JSON.parse(JSON.stringify(data));
  const clean = (m) => {
    if (m && m.error) {
      m.error = { kind: m.error.kind, message: redact(m.error.message, secrets), detail: redact(m.error.detail, secrets), status: m.error.status || 0 };
    }
  };
  for (const c of copy.conversations || []) {
    for (const m of c.messages || []) {
      clean(m);
      (m.versions || []).forEach(clean);
    }
  }
  return copy;
}

const str = (v, max = 2_000_000) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function cleanAttachment(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.kind === 'image') {
    const url = str(a.dataUrl, 12_000_000);
    // L'URL entière est vérifiée (pas seulement son préfixe) : base64 valide uniquement.
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(url) || url.length < 40) return null;
    return { id: str(a.id) || uid('a_'), kind: 'image', name: str(a.name, 200) || 'image', type: str(a.type, 60), size: num(a.size, 0), width: num(a.width, 0), height: num(a.height, 0), dataUrl: url };
  }
  if (a.kind === 'text') {
    return { id: str(a.id) || uid('a_'), kind: 'text', name: str(a.name, 200) || 'fichier.txt', type: str(a.type, 60), size: num(a.size, 0), lang: str(a.lang, 24).replace(/[^\w+#.-]/g, ''), content: str(a.content), truncated: !!a.truncated, lines: num(a.lines, 0) };
  }
  return null;
}

function cleanMessage(m) {
  if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
  const out = {
    id: str(m.id, 64) || uid('msg_'),
    role: m.role,
    content: str(m.content),
    createdAt: num(m.createdAt, Date.now()),
  };
  if (m.role === 'assistant') {
    out.model = str(m.model, 200);
    out.reasoning = str(m.reasoning);
    out.status = ['done', 'stopped', 'error'].includes(m.status) ? m.status : 'done';
    if (Array.isArray(m.versions)) {
      out.versions = m.versions.slice(0, 20).map((v) => ({ content: str(v && v.content), reasoning: str(v && v.reasoning), model: str(v && v.model, 200), status: ['done', 'stopped', 'error'].includes(v && v.status) ? v.status : 'done', createdAt: num(v && v.createdAt, Date.now()) }));
      out.current = Math.min(Math.max(0, num(m.current, out.versions.length - 1)), out.versions.length - 1);
    }
  }
  if (Array.isArray(m.attachments)) out.attachments = m.attachments.map(cleanAttachment).filter(Boolean);
  return out;
}

export function cleanConversation(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.messages)) return null;
  const now = Date.now();
  return {
    id: str(c.id, 64) || uid('c_'),
    title: str(c.title, 200) || 'Conversation importée',
    createdAt: num(c.createdAt, now),
    updatedAt: num(c.updatedAt, now),
    pinned: !!c.pinned,
    customTitle: !!c.customTitle,
    persona: PERSONAS.some((p) => p.id === c.persona) ? c.persona : 'perso',
    model: str(c.model, 200),
    messages: c.messages.map(cleanMessage).filter(Boolean),
  };
}

/** Réglages importés : seules les sections connues et des valeurs du bon type sont gardées. */
function cleanSettings(s) {
  if (!s || typeof s !== 'object') return null;
  const out = {};
  const pick = (src, spec) => {
    if (!src || typeof src !== 'object') return null;
    const o = {};
    for (const [k, type] of Object.entries(spec)) {
      const v = src[k];
      if (type === 'string' && typeof v === 'string') o[k] = v.slice(0, 20000);
      else if (type === 'number' && typeof v === 'number' && Number.isFinite(v)) o[k] = v;
      else if (type === 'boolean' && typeof v === 'boolean') o[k] = v;
      else if (type === 'num|str' && ((typeof v === 'number' && Number.isFinite(v)) || v === '')) o[k] = v;
      else if (type === 'object' && v && typeof v === 'object' && !Array.isArray(v)) o[k] = v;
    }
    return Object.keys(o).length ? o : null;
  };
  out.profile = pick(s.profile, { name: 'string', about: 'string' });
  out.assistant = pick(s.assistant, { name: 'string', tone: 'string', defaultPersona: 'string', customInstructions: 'string', promptOverrides: 'object', avatar: 'object' });
  if (out.assistant) {
    if (out.assistant.name) out.assistant.name = out.assistant.name.slice(0, 40);
    const av = out.assistant.avatar;
    if (av && !(['glyph', 'initial', 'emoji'].includes(av.type) || (av.type === 'image' && /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(String(av.value || ''))))) delete out.assistant.avatar;
    if (out.assistant.promptOverrides) {
      const po = {};
      for (const [k, v] of Object.entries(out.assistant.promptOverrides)) if (PERSONAS.some((p) => p.id === k) && typeof v === 'string') po[k] = v.slice(0, 20000);
      out.assistant.promptOverrides = po;
    }
    if (out.assistant.defaultPersona && !PERSONAS.some((p) => p.id === out.assistant.defaultPersona)) delete out.assistant.defaultPersona;
  }
  out.prefs = pick(s.prefs, { theme: 'string', readingFont: 'string', textSize: 'string', enterToSend: 'boolean', temperature: 'number', maxTokens: 'num|str', contextTokens: 'number', voiceURI: 'string', speechRate: 'number', useMemory: 'boolean', idleTimeout: 'number' });
  return out.profile || out.assistant || out.prefs ? out : null;
}

/* ---------- Import Markdown ----------
   Reconnaît le format exporté par Nour : « # Titre », puis des messages « ### Nom — date »
   séparés par « --- ». Les commentaires <!-- nour:… --> (ajoutés à l'export) lèvent toute
   ambiguïté ; sans eux, un « # Titre » suivi de « *Exporté le… » ouvre une conversation.
   Les lignes situées dans des blocs de code ne sont jamais interprétées. */
export function parseMarkdownImport(text, { assistantName = 'Nour', userName = '' } = {}) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const marked = /<!--\s*nour:(user|assistant|conversation)/.test(text);
  const convs = [];
  const names = new Map();
  let conv = null;
  let msg = null;
  let fence = null;
  let pendingRole = null;
  let awaitingTitle = false;

  const roleFor = (name) => {
    const n = name.trim().toLowerCase();
    if (names.has(n)) return names.get(n);
    let role;
    if (assistantName && n === assistantName.toLowerCase()) role = 'assistant';
    else if ((userName && n === userName.toLowerCase()) || n === 'vous') role = 'user';
    else role = [...names.values()].includes('user') ? 'assistant' : 'user';
    names.set(n, role);
    return role;
  };
  const flush = () => {
    if (msg && conv) {
      const body = msg.lines.join('\n').replace(/\s+$/, '').replace(/\n?-{3,}$/, '').trim();
      conv.messages.push({ role: msg.role, model: msg.model, content: body });
    }
    msg = null;
  };
  const newConv = (title = '', persona = 'perso') => {
    flush();
    conv = { title, persona, messages: [] };
    convs.push(conv);
  };
  const lastLine = () => {
    if (!msg) return '';
    for (let i = msg.lines.length - 1; i >= 0; i--) if (msg.lines[i].trim()) return msg.lines[i].trim();
    return '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      if (fence.test(line)) fence = null;
      msg?.lines.push(line);
      continue;
    }
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (f) {
      fence = new RegExp(`^ {0,3}\\${f[1][0]}{${f[1].length},}\\s*$`);
      msg?.lines.push(line);
      continue;
    }
    const mc = /^<!--\s*nour:conversation(?:\s+persona=([\w-]+))?\s*-->\s*$/.exec(line);
    if (mc) { newConv('', mc[1] || 'perso'); awaitingTitle = true; continue; }
    const mr = /^<!--\s*nour:(user|assistant)\s*-->\s*$/.exec(line);
    if (mr) { flush(); pendingRole = mr[1]; continue; }

    const h1 = /^# (.+)$/.exec(line);
    if (h1) {
      if (awaitingTitle && conv) { conv.title = h1[1].trim(); awaitingTitle = false; continue; }
      const next = lines.slice(i + 1, i + 3).find((l) => l.trim()) || '';
      if (!marked && (!msg || /^\*Exporté le /.test(next))) { newConv(h1[1].trim()); continue; }
    }
    const head = /^### (.+?) — (.+)$/.exec(line);
    if (head && (pendingRole || (!marked && (!msg || lastLine() === '---')))) {
      if (!conv) newConv('Conversation importée');
      flush();
      const role = pendingRole || roleFor(head[1]);
      if (!names.has(head[1].trim().toLowerCase())) names.set(head[1].trim().toLowerCase(), role);
      pendingRole = null;
      const meta = head[2].split(' · ');
      msg = { role, model: role === 'assistant' && meta.length > 1 ? meta.slice(1).join(' · ').trim().slice(0, 200) : '', lines: [] };
      continue;
    }
    if (!msg) continue; // en-tête de conversation (date d'export, etc.)
    if (!msg.lines.some((l) => l.trim()) && /^> Pièces jointes : /.test(line)) continue;
    msg.lines.push(line);
  }
  flush();
  const now = Date.now();
  return convs.filter((c) => c.messages.some((m) => m.content)).map((c, ci) => cleanConversation({
    id: uid('c_'),
    title: c.title || 'Conversation importée',
    persona: c.persona,
    createdAt: now - ci * 1000,
    updatedAt: now - ci * 1000,
    messages: c.messages.map((m, i) => ({ id: uid('msg_'), role: m.role, content: m.content, model: m.model, status: 'done', createdAt: now - ci * 1000 - (c.messages.length - i) })),
  }));
}

/** Analyse un fichier d'export ; accepte aussi un tableau de conversations ou une conversation seule. */
export function parseImport(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Ce fichier n’est pas un JSON valide.'); }
  let convs = [];
  let memory = null;
  let templates = null;
  let settings = null;
  if (Array.isArray(data)) convs = data;
  else if (data && data.format === FORMAT) {
    convs = Array.isArray(data.conversations) ? data.conversations : [];
    memory = Array.isArray(data.memory) ? data.memory.filter((f) => f && typeof f.text === 'string' && f.text.trim()).map((f) => ({ text: f.text.trim().slice(0, 280) })) : null;
    templates = Array.isArray(data.templates) ? data.templates.filter((t) => t && typeof t.cmd === 'string' && typeof t.body === 'string' && (t.title === undefined || typeof t.title === 'string')) : null;
    settings = cleanSettings(data.settings);
  } else if (data && Array.isArray(data.messages)) convs = [data];
  else throw new Error('Format non reconnu : utilisez un export de Nour.');
  const conversations = convs.map(cleanConversation).filter(Boolean);
  return { conversations, memory, templates, settings };
}
