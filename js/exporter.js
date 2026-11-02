// Export / import des conversations (JSON complet, Markdown lisible) et estimation des jetons.

import { uid, formatDateTime } from './util.js';
import { personaById } from './personas.js';

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

export function conversationToMarkdown(conv, assistantName = 'Nour', userName = 'Vous') {
  const lines = [];
  lines.push(`# ${conv.title || 'Conversation'}`, '');
  const persona = personaById(conv.persona);
  lines.push(`*Exporté le ${formatDateTime(Date.now())} · mode « ${persona.name} »${conv.model ? ` · ${conv.model}` : ''}*`, '');
  for (const m of conv.messages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const who = m.role === 'user' ? userName : assistantName;
    const meta = [formatDateTime(m.createdAt || conv.createdAt)];
    if (m.role === 'assistant' && m.model) meta.push(m.model);
    lines.push('---', '', `### ${who} — ${meta.join(' · ')}`, '');
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

const str = (v, max = 2_000_000) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function cleanAttachment(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.kind === 'image') {
    const url = str(a.dataUrl);
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url)) return null;
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
    persona: str(c.persona, 40) || 'perso',
    model: str(c.model, 200),
    messages: c.messages.map(cleanMessage).filter(Boolean),
  };
}

/** Analyse un fichier d'export ; accepte aussi un tableau de conversations ou une conversation seule. */
export function parseImport(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Ce fichier n’est pas un JSON valide.'); }
  let convs = [];
  let memory = null;
  let templates = null;
  if (Array.isArray(data)) convs = data;
  else if (data && data.format === FORMAT) {
    convs = Array.isArray(data.conversations) ? data.conversations : [];
    memory = Array.isArray(data.memory) ? data.memory : null;
    templates = Array.isArray(data.templates) ? data.templates : null;
  } else if (data && Array.isArray(data.messages)) convs = [data];
  else throw new Error('Format non reconnu : utilisez un export de Nour.');
  const conversations = convs.map(cleanConversation).filter(Boolean);
  return { conversations, memory, templates };
}
