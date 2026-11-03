// Protocole de transfert pair-à-pair : paquets binaires (en-tête JSON + charge
// utile), découpage en morceaux, réassemblage et empreinte SHA-256.
// Fonctionne à l'identique dans le navigateur et dans Node (tests).

export const CHUNK_SIZE = 48 * 1024;
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans 0/O, 1/I/L
export const PEER_PREFIX = 'jarvis-nx-';

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Paquet binaire : [longueur en-tête u32 LE][en-tête JSON UTF-8][charge utile]. */
export function encodePacket(header, payload = new Uint8Array(0)) {
  const h = enc.encode(JSON.stringify(header));
  const body = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  const buf = new ArrayBuffer(4 + h.length + body.length);
  new DataView(buf).setUint32(0, h.length, true);
  const u8 = new Uint8Array(buf);
  u8.set(h, 4);
  u8.set(body, 4 + h.length);
  return buf;
}

export function decodePacket(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8.byteLength < 4) throw new Error('Paquet trop court');
  const len = new DataView(u8.buffer, u8.byteOffset, u8.byteLength).getUint32(0, true);
  if (4 + len > u8.byteLength) throw new Error('En-tête invalide');
  const header = JSON.parse(dec.decode(u8.subarray(4, 4 + len)));
  return { header, payload: u8.slice(4 + len) };
}

/** Découpe des octets en morceaux. */
export function chunkify(bytes, size = CHUNK_SIZE) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const total = Math.max(1, Math.ceil(u8.byteLength / size));
  const chunks = [];
  for (let i = 0; i < total; i++) chunks.push(u8.subarray(i * size, Math.min(u8.byteLength, (i + 1) * size)));
  return chunks;
}

/** Réassemble les morceaux reçus (ordre quelconque, doublons ignorés). */
export class Assembler {
  constructor(meta) {
    this.meta = meta;
    this.total = meta.chunks;
    this.size = meta.size;
    this.parts = new Array(this.total);
    this.count = 0;
    this.bytes = 0;
  }

  add(index, data) {
    if (index < 0 || index >= this.total || !Number.isInteger(index)) throw new Error('Index de morceau invalide');
    if (this.parts[index]) return this.progress;
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.parts[index] = u8;
    this.count++;
    this.bytes += u8.byteLength;
    return this.progress;
  }

  get progress() {
    return this.size ? Math.min(1, this.bytes / this.size) : this.count / this.total;
  }

  get complete() {
    return this.count === this.total;
  }

  assemble() {
    if (!this.complete) throw new Error('Transfert incomplet');
    const out = new Uint8Array(this.bytes);
    let off = 0;
    for (const p of this.parts) { out.set(p, off); off += p.byteLength; }
    if (this.size && out.byteLength !== this.size) throw new Error('Taille inattendue');
    return out;
  }
}

export async function sha256Hex(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', u8);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Code d'appairage court (6 caractères non ambigus). */
export function makeCode(length = 6, rng = Math.random) {
  let s = '';
  for (let i = 0; i < length; i++) s += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return s;
}

/** Normalise une saisie d'utilisateur (« k7p-2qx » → « K7P2QX »), ou null si invalide. */
export function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  // On tolère espaces, tirets et minuscules. Les caractères ambigus (0, O, 1, I, L)
  // n'existent pas dans l'alphabet : on refuse plutôt que deviner.
  const s = input.toUpperCase().replace(/[\s\-_.]/g, '');
  if (s.length !== 6) return null;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return null;
  return s;
}

export function formatCode(code) {
  return code && code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code || '';
}

export function makeTransferId(rng = Math.random) {
  return `tx-${Date.now().toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`;
}

/** Messages de contrôle reconnus (validation défensive des entrées réseau). */
const CONTROL_TYPES = new Set(['hello', 'bye', 'grab', 'cancel', 'claim', 'granted', 'denied', 'taken', 'received', 'throw', 'file-begin', 'file-end', 'ping', 'pong']);

export function validControl(msg) {
  return !!msg && typeof msg === 'object' && typeof msg.type === 'string' && CONTROL_TYPES.has(msg.type)
    && (msg.tid === undefined || (typeof msg.tid === 'string' && msg.tid.length < 80));
}

export function formatBytes(n) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/** Vignette annoncée par un autre appareil : petite image data: stricte (rien d'autre). */
export function validThumb(s) {
  return typeof s === 'string' && s.length < 200_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
}

/** Dimension d'image annoncée : entier raisonnable, sinon null. */
export function validDim(v) {
  return Number.isInteger(v) && v > 0 && v <= 16384 ? v : null;
}

/** Type d'image reconnu à ses premiers octets (JPEG, PNG, WebP), sinon null. */
export function sniffImage(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}
