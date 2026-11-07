// Bibliothèque locale, répétition espacée (boîtes de Leitner) et partage par
// lien : le cours est compressé dans l'adresse elle-même, sans serveur.

const KEY = 'synapse.decks.v1';
export const BOXES = [0, 1, 3, 7, 16]; // jours avant la prochaine révision, boîte 1 à 5
const DAY = 864e5;

const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; } };

/** Empreinte courte et stable d'un texte (FNV-1a). */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

export const Library = {
  all() { return read().sort((a, b) => (b.opened || 0) - (a.opened || 0)); },
  get(id) { return read().find((d) => d.id === id) || null; },
  /** Enregistre (ou met à jour) un cours ; l'identifiant dépend du texte. */
  save(title, text) {
    const decks = read();
    const id = hash(text);
    let d = decks.find((x) => x.id === id);
    if (!d) { d = { id, title, text, created: Date.now(), srs: {} }; decks.push(d); }
    d.title = title; d.opened = Date.now();
    write(decks.slice(-60));
    return d;
  },
  remove(id) { write(read().filter((d) => d.id !== id)); },
  update(id, fn) {
    const decks = read();
    const d = decks.find((x) => x.id === id);
    if (!d) return null;
    fn(d);
    write(decks);
    return d;
  },
};

/** État d'une carte : boîte (0 à 4) et date de prochaine révision. */
export const cardState = (deck, card) => deck?.srs?.[hash(card.q)] || { box: 0, due: 0 };

/** Cartes à revoir maintenant (les nouvelles d'abord, puis les plus en retard). */
export function dueCards(deck, cards, now = Date.now()) {
  return cards
    .map((c) => ({ c, s: cardState(deck, c) }))
    .filter(({ s }) => s.due <= now)
    .sort((x, y) => x.s.box - y.s.box || x.s.due - y.s.due)
    .map(({ c }) => c);
}

/** Réponse à une carte : sue → boîte suivante, ratée → boîte 1. */
export function grade(deckId, card, known, now = Date.now()) {
  return Library.update(deckId, (d) => {
    d.srs ||= {};
    const k = hash(card.q);
    const s = d.srs[k] || { box: 0, due: 0 };
    const box = known ? Math.min(BOXES.length - 1, s.box + 1) : 0;
    d.srs[k] = { box, due: known ? now + BOXES[box] * DAY : now + 60_000, seen: (s.seen || 0) + 1 };
    const today = new Date(now).toDateString();
    if (d.lastDay !== today) { d.streak = d.lastDay === new Date(now - DAY).toDateString() ? (d.streak || 0) + 1 : 1; d.lastDay = today; }
  });
}

/** Répartition des cartes par boîte, et part maîtrisée (boîtes 4-5). */
export function mastery(deck, cards) {
  const boxes = BOXES.map(() => 0);
  for (const c of cards) boxes[cardState(deck, c).box]++;
  const mastered = cards.length ? (boxes[3] + boxes[4]) / cards.length : 0;
  return { boxes, mastered };
}

// ——— Partage par lien ————————————————————————————————————————————

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, Stream) {
  const cs = new Stream('deflate-raw');
  const out = new Blob([bytes]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Code compact d'un cours, à placer après « #c= » dans l'adresse. */
export async function encodeShare(title, text) {
  const raw = new TextEncoder().encode(JSON.stringify({ t: title, x: text }));
  if (typeof CompressionStream === 'function') {
    const z = await pipe(raw, CompressionStream);
    let s = '';
    for (let i = 0; i < z.length; i += 0x8000) s += String.fromCharCode(...z.subarray(i, i + 0x8000));
    return 'z' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return 'r' + b64url(raw);
}

export async function decodeShare(code) {
  const kind = code[0], body = unb64url(code.slice(1));
  const bytes = kind === 'z' ? await pipe(body, DecompressionStream) : body;
  const o = JSON.parse(new TextDecoder().decode(bytes));
  if (typeof o?.x !== 'string' || o.x.length > 200_000) throw new Error('Lien invalide');
  return { title: String(o.t || '').slice(0, 120), text: o.x };
}
