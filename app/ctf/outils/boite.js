// Boîte à outils façon « recettes » : on enchaîne des opérations (décodages, chiffrements classiques,
// XOR, Morse, analyses). Les données circulent entre étapes sous forme d'octets.
import { $, $$, esc, copier, texteVersOctets as T, octetsVersTexte as U, versHex } from '../commun.js';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const decaler = (s, n) => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + ((n % 26) + 26)) % 26 + b); });
const sansAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.', '@': '.--.-.', '{': '-.--.', '}': '-.--.-' };
const MORSE_INV = Object.fromEntries(Object.entries(MORSE).filter(([k]) => k !== '{' && k !== '}').map(([k, v]) => [v, k]));
const FR = 'EASITNRULODCPMVQFBGHJXYZWK';

function hexVersOctets(t) {
  const h = t.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
  if (h.length % 2) throw new Error('Nombre impair de chiffres hexadécimaux');
  return Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16));
}
function b64VersOctets(t) {
  let s = t.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*=*$/.test(s)) throw new Error('Caractères invalides pour du Base64');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function octetsVersB64(b) { let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); }
function b32VersOctets(t) {
  const s = t.toUpperCase().replace(/[\s=]+/g, '');
  let bits = 0, val = 0; const out = [];
  for (const c of s) { const i = B32.indexOf(c); if (i < 0) throw new Error(`Caractère « ${c} » invalide en Base32`); val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Uint8Array.from(out);
}
function octetsVersB32(b) {
  let bits = 0, val = 0, out = '';
  for (const x of b) { val = (val << 8) | x; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) out += B32[(val << (5 - bits)) & 31];
  while (out.length % 8) out += '=';
  return out;
}
function vigenere(t, cle, sens) {
  const k = sansAccents(cle).toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) throw new Error('Indique une clé (lettres uniquement)');
  let j = 0;
  return t.replace(/[a-z]/gi, c => { const d = k.charCodeAt(j++ % k.length) - 65; return decaler(c, sens * d); });
}
function frequences(t) {
  const l = sansAccents(t).toUpperCase().replace(/[^A-Z]/g, '');
  const n = {}; for (const c of l) n[c] = (n[c] || 0) + 1;
  const tri = Object.entries(n).sort((a, b) => b[1] - a[1]);
  const lignes = tri.map(([c, k], i) => `${c}  ${String(k).padStart(4)}  ${(100 * k / l.length).toFixed(1).padStart(5)} %  ${'█'.repeat(Math.round(40 * k / tri[0][1]))}   (rang ${i + 1} → en français : ${FR[i] || '?'})`);
  return `${l.length} lettres analysées. Ordre de fréquence du français : ${FR.slice(0, 12)}…\n\n` + lignes.join('\n');
}

export const OPERATIONS = [
  { id: 'b64d', nom: 'Depuis Base64', groupe: 'Encodages', f: b => b64VersOctets(U(b)) },
  { id: 'b64e', nom: 'Vers Base64', groupe: 'Encodages', f: b => T(octetsVersB64(b)) },
  { id: 'b32d', nom: 'Depuis Base32', groupe: 'Encodages', f: b => b32VersOctets(U(b)) },
  { id: 'b32e', nom: 'Vers Base32', groupe: 'Encodages', f: b => T(octetsVersB32(b)) },
  { id: 'hexd', nom: 'Depuis hexadécimal', groupe: 'Encodages', f: b => hexVersOctets(U(b)) },
  { id: 'hexe', nom: 'Vers hexadécimal', groupe: 'Encodages', f: b => T(versHex(b, ' ')) },
  { id: 'bind', nom: 'Depuis binaire', groupe: 'Encodages', f: b => { const s = U(b).replace(/[^01]/g, ''); if (s.length % 8) throw new Error('Le nombre de bits doit être un multiple de 8'); return Uint8Array.from(s.match(/.{8}/g) || [], x => parseInt(x, 2)); } },
  { id: 'bine', nom: 'Vers binaire', groupe: 'Encodages', f: b => T([...b].map(x => x.toString(2).padStart(8, '0')).join(' ')) },
  { id: 'decd', nom: 'Depuis codes décimaux', groupe: 'Encodages', f: b => Uint8Array.from((U(b).match(/\d+/g) || []).map(Number).filter(x => x < 256)) },
  { id: 'urld', nom: 'Décodage d\'URL (%xx)', groupe: 'Encodages', f: b => T(decodeURIComponent(U(b).replace(/\+/g, ' '))) },
  { id: 'rot13', nom: 'ROT13', groupe: 'Chiffrements classiques', f: b => T(decaler(U(b), 13)) },
  { id: 'cesar', nom: 'César : décaler de n', groupe: 'Chiffrements classiques', params: [{ id: 'n', nom: 'Décalage (négatif pour reculer)', type: 'number', def: -3 }], f: (b, p) => T(decaler(U(b), Math.round(+p.n || 0))) },
  { id: 'cesarbf', nom: 'César : tester les 25 décalages', groupe: 'Chiffrements classiques', f: b => { const t = U(b); return T(Array.from({ length: 25 }, (_, i) => `−${String(i + 1).padStart(2)} : ${decaler(t, -(i + 1))}`).join('\n')); } },
  { id: 'atbash', nom: 'Atbash (A↔Z)', groupe: 'Chiffrements classiques', f: b => T(U(b).replace(/[a-z]/gi, c => { const base = c <= 'Z' ? 65 : 97; return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base)); })) },
  { id: 'vigd', nom: 'Vigenère : déchiffrer', groupe: 'Chiffrements classiques', params: [{ id: 'cle', nom: 'Clé', type: 'text', def: '' }], f: (b, p) => T(vigenere(U(b), p.cle, -1)) },
  { id: 'vige', nom: 'Vigenère : chiffrer', groupe: 'Chiffrements classiques', params: [{ id: 'cle', nom: 'Clé', type: 'text', def: '' }], f: (b, p) => T(vigenere(U(b), p.cle, 1)) },
  { id: 'subst', nom: 'Substitution de lettres', groupe: 'Chiffrements classiques', params: [{ id: 'de', nom: 'Lettres du chiffré', type: 'text', def: A }, { id: 'vers', nom: 'Remplacées par', type: 'text', def: A.toLowerCase() }],
    f: (b, p) => { const de = String(p.de || '').toUpperCase(), vers = String(p.vers || ''); const m = {}; [...de].forEach((c, i) => { if (vers[i] && vers[i] !== '?' && vers[i] !== '.') m[c] = vers[i]; }); return T(U(b).replace(/[a-z]/gi, c => m[c.toUpperCase()] ?? (c === c.toUpperCase() ? c : c.toUpperCase()))); } },
  { id: 'morsed', nom: 'Depuis Morse', groupe: 'Chiffrements classiques', f: b => T(U(b).trim().replace(/[·•]/g, '.').replace(/[–—_]/g, '-').split(/\s*[/|]\s*|\s{3,}|\n+/).map(m => m.trim().split(/\s+/).map(x => x ? (MORSE_INV[x] ?? '?') : '').join('')).join(' ')) },
  { id: 'morsee', nom: 'Vers Morse', groupe: 'Chiffrements classiques', f: b => T(sansAccents(U(b)).toUpperCase().split(/\s+/).map(m => [...m].map(c => MORSE[c] || '').filter(Boolean).join(' ')).join(' / ')) },
  { id: 'xor', nom: 'XOR avec une clé', groupe: 'Opérations binaires', params: [{ id: 'cle', nom: 'Clé', type: 'text', def: '' }, { id: 'fmt', nom: 'Format de la clé', type: 'select', options: [['hex', 'hexadécimal'], ['texte', 'texte']], def: 'hex' }],
    f: (b, p) => { const k = p.fmt === 'texte' ? T(p.cle || '') : hexVersOctets(p.cle || ''); if (!k.length) throw new Error('Indique une clé'); return b.map((x, i) => x ^ k[i % k.length]); } },
  { id: 'xorbf', nom: 'XOR : tester les 255 clés d\'un octet', groupe: 'Opérations binaires', params: [{ id: 'cherche', nom: 'Ne garder que si le résultat contient', type: 'text', def: '' }],
    f: (b, p) => { const l = []; for (let k = 1; k < 256; k++) { const t = [...b].map(x => x ^ k); const lisible = t.filter(x => x >= 32 && x < 127).length / Math.max(1, t.length); const s = String.fromCharCode(...t.map(x => x >= 32 && x < 127 ? x : 46)); if (lisible > 0.85 && (!p.cherche || s.toLowerCase().includes(String(p.cherche).toLowerCase()))) l.push(`clé 0x${k.toString(16).padStart(2, '0')} : ${s}`); } return T(l.length ? l.join('\n') : 'Aucune clé ne donne un texte lisible.'); } },
  { id: 'freq', nom: 'Analyse de fréquences', groupe: 'Analyse', f: b => T(frequences(U(b))) },
  { id: 'inverser', nom: 'Inverser le texte', groupe: 'Texte', f: b => T([...U(b)].reverse().join('')) },
  { id: 'maj', nom: 'Majuscules', groupe: 'Texte', f: b => T(U(b).toUpperCase()) },
  { id: 'min', nom: 'Minuscules', groupe: 'Texte', f: b => T(U(b).toLowerCase()) },
  { id: 'espaces', nom: 'Supprimer espaces et retours', groupe: 'Texte', f: b => T(U(b).replace(/\s+/g, '')) }
];
const PAR_ID = Object.fromEntries(OPERATIONS.map(o => [o.id, o]));

// Applique une recette (liste d'étapes { id, params, off }) à un texte. Utilisé aussi par les tests.
export function cuisiner(entree, recette) {
  let b = T(entree);
  for (const [i, e] of recette.entries()) {
    if (e.off) continue;
    const op = PAR_ID[e.id];
    try { b = op.f(b, e.params || {}); } catch (err) { return { ok: false, etape: i, erreur: err.message, octets: b }; }
  }
  return { ok: true, octets: b };
}
const lisible = b => { const t = U(b); const bad = (t.match(/[\u0000-\u0008\u000e-\u001f�]/g) || []).length; return bad / Math.max(1, t.length) < 0.08; };

export function monter(el, { toast = () => {} } = {}) {
  let recette = [];
  try { recette = JSON.parse(localStorage.getItem('lumio.ctf.recette') || '[]').filter(e => PAR_ID[e.id]); } catch { recette = []; }
  const groupes = [...new Set(OPERATIONS.map(o => o.groupe))];
  el.innerHTML = `<div class="bx">
    <div class="bx-ops"><label for="bxQ" class="bx-lab">Opérations</label><input id="bxQ" type="search" placeholder="Filtrer : base64, xor…" autocomplete="off">
      <div class="bx-liste">${groupes.map(g => `<p class="bx-g">${esc(g)}</p>${OPERATIONS.filter(o => o.groupe === g).map(o => `<button type="button" class="bx-op" data-op="${o.id}" title="Ajouter « ${esc(o.nom)} » à la recette">${esc(o.nom)}</button>`).join('')}`).join('')}</div></div>
    <div class="bx-rec"><div class="bx-tete"><span class="bx-lab">Recette</span><button type="button" class="btn small ghost" data-vider>Vider</button></div><ol class="bx-etapes" aria-live="polite"></ol></div>
    <div class="bx-io"><label for="bxIn" class="bx-lab">Entrée</label><textarea id="bxIn" class="bx-in" spellcheck="false" placeholder="Colle ici le texte à transformer."></textarea>
      <div class="bx-tete"><span class="bx-lab" id="bxOutLab">Sortie</span><span class="row"><label class="ctf-check small"><input type="checkbox" data-hex> hexa</label><button type="button" class="btn small ghost" data-copier>Copier</button><button type="button" class="btn small ghost" data-vers-entree title="Remplacer l'entrée par la sortie">↑ En entrée</button></span></div>
      <pre class="bx-out" aria-labelledby="bxOutLab" tabindex="0"></pre><p class="bx-stat muted"></p></div>
  </div>`;
  const etapes = $('.bx-etapes', el), entree = $('#bxIn', el), sortie = $('.bx-out', el), stat = $('.bx-stat', el);
  let dernier = new Uint8Array();
  const sauver = () => { try { localStorage.setItem('lumio.ctf.recette', JSON.stringify(recette)); } catch { /* ignoré */ } };
  const calculer = () => {
    const r = cuisiner(entree.value, recette);
    dernier = r.octets;
    $$('.bx-etape', el).forEach((li, i) => li.classList.toggle('err', !r.ok && r.etape === i));
    const hex = $('[data-hex]', el).checked || (!lisible(r.octets) && r.ok);
    sortie.textContent = r.ok ? (hex ? versHex(r.octets, ' ') : U(r.octets)) : `⚠ Étape ${r.etape + 1} (${PAR_ID[recette[r.etape].id].nom}) : ${r.erreur}`;
    sortie.classList.toggle('err', !r.ok);
    stat.textContent = r.ok ? `${r.octets.length} octet(s)${hex && !$('[data-hex]', el).checked ? ' · affichage hexadécimal (sortie non textuelle)' : ''}` : '';
  };
  const rendre = () => {
    etapes.innerHTML = recette.length ? recette.map((e, i) => { const op = PAR_ID[e.id]; return `<li class="bx-etape ${e.off ? 'off' : ''}"><div class="bx-et-tete"><b>${i + 1}. ${esc(op.nom)}</b><span class="bx-et-act">
        <button type="button" data-act="haut" data-i="${i}" aria-label="Monter l'étape ${i + 1}" ${i ? '' : 'disabled'}>↑</button><button type="button" data-act="bas" data-i="${i}" aria-label="Descendre l'étape ${i + 1}" ${i < recette.length - 1 ? '' : 'disabled'}>↓</button><button type="button" data-act="off" data-i="${i}" aria-pressed="${!!e.off}" aria-label="Désactiver l'étape ${i + 1}">⏸</button><button type="button" data-act="suppr" data-i="${i}" aria-label="Supprimer l'étape ${i + 1}">✕</button></span></div>
        ${(op.params || []).map(p => `<label class="bx-param"><span>${esc(p.nom)}</span>${p.type === 'select' ? `<select data-i="${i}" data-p="${p.id}">${p.options.map(([v, t]) => `<option value="${v}" ${(e.params[p.id] ?? p.def) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>` : `<input type="${p.type}" data-i="${i}" data-p="${p.id}" value="${esc(e.params[p.id] ?? p.def)}" spellcheck="false" autocomplete="off">`}</label>`).join('')}</li>`; }).join('')
      : '<li class="bx-vide muted">Clique sur une opération pour l\'ajouter. Les étapes s\'enchaînent de haut en bas.</li>';
    sauver(); calculer();
  };
  const ajouter = id => { const op = PAR_ID[id]; recette.push({ id, params: Object.fromEntries((op.params || []).map(p => [p.id, p.def])) }); rendre(); };
  $$('.bx-op', el).forEach(b => b.addEventListener('click', () => ajouter(b.dataset.op)));
  $('#bxQ', el).addEventListener('input', e => { const q = e.target.value.toLowerCase(); $$('.bx-op', el).forEach(b => { b.hidden = q && !b.textContent.toLowerCase().includes(q); }); });
  etapes.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.dataset.i;
    if (b.dataset.act === 'suppr') recette.splice(i, 1);
    if (b.dataset.act === 'haut') [recette[i - 1], recette[i]] = [recette[i], recette[i - 1]];
    if (b.dataset.act === 'bas') [recette[i + 1], recette[i]] = [recette[i], recette[i + 1]];
    if (b.dataset.act === 'off') recette[i].off = !recette[i].off;
    rendre();
  });
  etapes.addEventListener('input', e => { const x = e.target; if (x.dataset.p) { recette[+x.dataset.i].params[x.dataset.p] = x.value; sauver(); calculer(); } });
  $('[data-vider]', el).addEventListener('click', () => { recette = []; rendre(); });
  $('[data-hex]', el).addEventListener('change', calculer);
  $('[data-copier]', el).addEventListener('click', async () => toast(await copier(sortie.textContent) ? 'Sortie copiée.' : 'Copie impossible.'));
  $('[data-vers-entree]', el).addEventListener('click', () => { entree.value = U(dernier); recette = []; rendre(); });
  let t; entree.addEventListener('input', () => { clearTimeout(t); t = setTimeout(calculer, 120); });
  rendre();
  return {
    charger({ texte, recette: r }) { if (texte !== undefined) entree.value = texte; if (r) { recette = r; } rendre(); },
    recette: () => recette, sortie: () => sortie.textContent, ajouter
  };
}
