// Mémoire : faits durables sur l'utilisateur, visibles, modifiables et validés un par un.

import { db } from './db.js';
import { uid } from './util.js';
import { bus } from './bus.js';

const KEY = 'memory';
let facts = [];
const listeners = new Set();

function emit() { listeners.forEach((fn) => fn(facts)); }

export const memory = {
  async load() {
    facts = (await db.kvGet(KEY)) || [];
    emit();
    return facts;
  },
  all() { return facts; },
  active() { return facts.filter((f) => f.enabled !== false); },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  async save() { await db.kvSet(KEY, facts); emit(); bus.post({ type: 'memory' }); },
  async add(text, source = 'manuel') {
    if (typeof text !== 'string') return null;
    const t = text.trim().slice(0, 280);
    if (!t) return null;
    if (facts.some((f) => norm(f.text) === norm(t))) return null;
    const fact = { id: uid('m_'), text: t, enabled: true, createdAt: Date.now(), source };
    facts = [...facts, fact];
    await this.save();
    return fact;
  },
  async update(id, patch) {
    facts = facts.map((f) => (f.id === id ? { ...f, ...patch } : f));
    await this.save();
  },
  async remove(id) {
    facts = facts.filter((f) => f.id !== id);
    await this.save();
  },
  async replaceAll(list) {
    facts = (Array.isArray(list) ? list : []).filter((f) => f && typeof f.text === 'string' && f.text.trim()).map((f) => ({
      id: f.id || uid('m_'), text: String(f.text), enabled: f.enabled !== false, createdAt: f.createdAt || Date.now(), source: f.source || 'import',
    }));
    await this.save();
  },
};

export function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function clip(s, n) { s = String(s || ''); return s.length > n ? `${s.slice(0, n)}…` : s; }

/** Messages envoyés au modèle pour proposer des souvenirs à partir d'une conversation. */
export function extractionMessages(conv, existing, userName = "l'utilisateur") {
  const transcript = conv.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-30)
    .map((m) => `${m.role === 'user' ? userName : 'Assistant'} : ${clip(m.content, 1600)}`)
    .join('\n\n');
  return [
    {
      role: 'system',
      content: `Tu analyses une conversation pour proposer des souvenirs utiles sur ${userName} (jamais sur l'assistant) : faits durables, préférences, projets en cours, contexte professionnel, contraintes, objectifs.
Ignore les informations ponctuelles ou sensibles (santé, opinions politiques ou religieuses, données bancaires, mots de passe, adresses précises) et celles déjà enregistrées.
Chaque souvenir est une phrase courte, autonome, à la troisième personne (exemple : « Préfère des réponses courtes avec un exemple concret. »).
Réponds UNIQUEMENT par un tableau JSON de chaînes, sans aucun texte autour. S'il n'y a rien à retenir, réponds [].`,
    },
    {
      role: 'user',
      content: `Souvenirs déjà enregistrés :\n${existing.map((f) => `- ${f.text}`).join('\n') || '(aucun)'}\n\nConversation :\n${transcript}`,
    },
  ];
}

/** Extrait une liste de faits de la réponse du modèle (JSON attendu, repli sur une liste à puces). */
export function parseFacts(text, existing = []) {
  let t = String(text || '').replace(/^\s*<think>[\s\S]*?(<\/think>|$)/, '').trim();
  t = t.replace(/```(?:json)?/gi, '');
  let arr = null;
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try { arr = JSON.parse(t.slice(start, end + 1)); } catch { arr = null; }
  }
  if (!Array.isArray(arr)) {
    arr = t.split('\n')
      .filter((l) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(l))
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ''));
  }
  const known = new Set(existing.map((f) => norm(f.text)));
  const out = [];
  for (const item of arr) {
    const s = typeof item === 'string' ? item : (item && (item.text || item.fact || item.souvenir)) || '';
    const clean = String(s).replace(/^["«\s]+|["»\s]+$/g, '').trim();
    if (clean.length < 4 || clean.length > 280) continue;
    const k = norm(clean);
    if (known.has(k)) continue;
    known.add(k);
    out.push(clean);
    if (out.length >= 12) break;
  }
  return out;
}
