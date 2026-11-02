// Coffre des clés API (une par fournisseur), en clair ou chiffré par phrase secrète.
// Les clés ne sont jamais écrites dans la console ni exportées.

import { seal, sealWithKey, open } from './crypto.js';

const PLAIN = 'nour.keys';
const SEALED = 'nour.keys.enc';

let unlocked = null; // { map, key, salt, iterations } quand le coffre chiffré est ouvert

function readPlain() {
  try { return JSON.parse(localStorage.getItem(PLAIN) || '{}') || {}; } catch { return {}; }
}
function readSealed() {
  try { return JSON.parse(localStorage.getItem(SEALED) || 'null'); } catch { return null; }
}

export const keystore = {
  isEncrypted() { return !!readSealed(); },
  isLocked() { return this.isEncrypted() && !unlocked; },

  async unlock(passphrase) {
    const box = readSealed();
    if (!box) return true;
    const { plaintext, key, salt, iterations } = await open(box, passphrase);
    unlocked = { map: JSON.parse(plaintext || '{}'), key, salt, iterations };
    return true;
  },

  lock() { unlocked = null; },

  get(provider) {
    if (this.isEncrypted()) return unlocked ? (unlocked.map[provider] || '') : '';
    return readPlain()[provider] || '';
  },

  has(provider) { return !!this.get(provider); },

  async set(provider, value) {
    const v = String(value || '').trim();
    if (this.isEncrypted()) {
      if (!unlocked) throw new Error('Coffre verrouillé : saisissez votre phrase secrète.');
      if (v) unlocked.map[provider] = v; else delete unlocked.map[provider];
      const box = await sealWithKey(unlocked.key, unlocked.salt, unlocked.iterations, JSON.stringify(unlocked.map));
      localStorage.setItem(SEALED, JSON.stringify(box));
      return;
    }
    const map = readPlain();
    if (v) map[provider] = v; else delete map[provider];
    localStorage.setItem(PLAIN, JSON.stringify(map));
  },

  async enableEncryption(passphrase) {
    if (!passphrase || passphrase.length < 8) throw new Error('Choisissez une phrase secrète d’au moins 8 caractères.');
    const map = this.isEncrypted() ? (unlocked ? unlocked.map : null) : readPlain();
    if (!map) throw new Error('Déverrouillez d’abord le coffre.');
    const { box, key, salt, iterations } = await seal(passphrase, JSON.stringify(map));
    localStorage.setItem(SEALED, JSON.stringify(box));
    localStorage.removeItem(PLAIN);
    unlocked = { map, key, salt, iterations };
  },

  disableEncryption() {
    if (!this.isEncrypted()) return;
    if (!unlocked) throw new Error('Déverrouillez d’abord le coffre.');
    localStorage.setItem(PLAIN, JSON.stringify(unlocked.map));
    localStorage.removeItem(SEALED);
    unlocked = null;
  },

  forgetAll() {
    localStorage.removeItem(PLAIN);
    localStorage.removeItem(SEALED);
    unlocked = null;
  },
};
