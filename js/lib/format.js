// Mise en forme française : nombres, téléphones, dates, échappement HTML.

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Espaces fines insécables de Intl remplacées par des espaces insécables simples (lisibles partout). */
function clean(s) { return s.replace(/ /g, ' '); }

export function fmtRating(r) {
  return Number.isFinite(r) && r > 0 ? clean(nf1.format(r)) : '–';
}

export function fmtInt(n) {
  return Number.isFinite(n) ? clean(nf0.format(n)) : '–';
}

export function fmtUsd(n) {
  return `${clean(nf2.format(n || 0))} $`;
}

export function plural(n, one, many) {
  return `${fmtInt(n)} ${Math.abs(n) >= 2 ? many : one}`;
}

export function fmtKm(km) {
  if (!Number.isFinite(km)) return '–';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${clean(nf1.format(km))} km`;
}

/** Chiffres seuls d'un numéro, avec +33 ramené au format national (0X…). */
export function phoneDigits(phone) {
  if (!phone) return '';
  let d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('+33')) d = `0${d.slice(3)}`;
  else if (d.startsWith('0033')) d = `0${d.slice(4)}`;
  return d.replace(/\+/g, '');
}

/** Affichage national : 05 61 22 33 44. Laisse intacts les numéros étrangers ou atypiques. */
export function formatPhoneFR(phone) {
  if (!phone) return '';
  const d = phoneDigits(phone);
  if (/^0\d{9}$/.test(d)) return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  return String(phone).trim();
}

/** Lien d'appel au format international (tel:+33…). */
export function telHref(phone) {
  if (!phone) return '';
  const raw = String(phone).trim();
  if (raw.startsWith('+')) return `tel:${raw.replace(/[^\d+]/g, '')}`;
  const d = phoneDigits(raw);
  if (/^0\d{9}$/.test(d)) return `tel:+33${d.slice(1)}`;
  return `tel:${d}`;
}

export function isMobileFR(phone) {
  return /^0[67]/.test(phoneDigits(phone));
}

export function smsHref(phone, body) {
  const t = telHref(phone).replace(/^tel:/, '');
  return t ? `sms:${t}?&body=${encodeURIComponent(body || '')}` : '';
}

/** Ville déduite d'une adresse « 12 rue X, 31000 Toulouse, France ». */
export function cityFromAddress(address) {
  if (!address) return '';
  const m = String(address).match(/\b\d{5}\s+([^,\d][^,]*)/);
  return m ? m[1].trim() : '';
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const relFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function fmtDate(ts) {
  return Number.isFinite(ts) ? dateFmt.format(new Date(ts)) : '';
}
export function fmtDateTime(ts) {
  return Number.isFinite(ts) ? clean(dateTimeFmt.format(new Date(ts))) : '';
}
export function fmtShortDateTime(ts) {
  return Number.isFinite(ts) ? clean(relFmt.format(new Date(ts))) : '';
}

/** Valeur pour <input type="datetime-local"> en heure locale. */
export function toLocalInput(ts) {
  if (!Number.isFinite(ts)) return '';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(v) {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

export function monthKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Normalisation de nom pour comparer deux établissements (accents, ponctuation, mots vides). */
const STOP = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'et', 'chez', 'au', 'aux', 'a', 'the', 'sarl', 'sas', 'eurl', 'sa']);
export function nameTokens(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !STOP.has(w));
}
export function nameSimilarity(a, b) {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return (2 * inter) / (A.size + B.size);
}
