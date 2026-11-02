// Arène CTF — petites aides partagées par les vues et les outils.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const reduitMouvement = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chemin absolu vers la racine du site (fonctionne aussi dans un sous-dossier).
export const RACINE = new URL('../../', import.meta.url).href;
export const url = chemin => /^(https?:|data:|blob:)/.test(chemin) ? chemin : RACINE + String(chemin).replace(/^\.?\//, '');

const scripts = {};
export function chargerScript(chemin) {
  if (!scripts[chemin]) scripts[chemin] = new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = url(chemin); s.onload = ok; s.onerror = () => { delete scripts[chemin]; ko(new Error('Impossible de charger ' + chemin)); };
    document.head.appendChild(s);
  });
  return scripts[chemin];
}
const styles = {};
export function chargerStyle(chemin) {
  if (!styles[chemin]) styles[chemin] = new Promise(ok => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = url(chemin); l.onload = ok; l.onerror = ok;
    document.head.appendChild(l);
  });
  return styles[chemin];
}

const octets = new Map();
export async function chargerOctets(chemin) {
  if (chemin instanceof Uint8Array) return chemin;
  if (!octets.has(chemin)) octets.set(chemin, fetch(url(chemin)).then(r => { if (!r.ok) throw new Error('Fichier introuvable : ' + chemin); return r.arrayBuffer(); }).then(b => new Uint8Array(b)));
  try { return await octets.get(chemin); } catch (e) { octets.delete(chemin); throw e; }
}
export const lireFichier = f => f.arrayBuffer().then(b => new Uint8Array(b));

export function telecharger(nom, contenu, type = 'application/octet-stream') {
  const blob = contenu instanceof Blob ? contenu : new Blob([contenu], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; }
  catch {
    const t = document.createElement('textarea'); t.value = texte; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    t.remove(); return ok;
  }
}

// Fenêtre modale accessible : focus piégé, Échap pour fermer, renvoie une promesse résolue à la fermeture.
export function modale({ titre, corps, actions = [{ id: 'ok', texte: 'Fermer', primaire: true }], large = false }) {
  return new Promise(resolve => {
    const precedent = document.activeElement;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const idT = 'm' + Math.random().toString(36).slice(2, 8);
    bg.innerHTML = `<div class="modal ${large ? 'modal-large' : ''}" role="dialog" aria-modal="true" aria-labelledby="${idT}">
      <h3 id="${idT}">${titre}</h3><div class="modal-corps">${corps}</div>
      <div class="row modal-actions">${actions.map(a => `<button type="button" class="btn ${a.primaire ? 'primary' : ''} ${a.danger ? 'danger' : ''}" data-act="${a.id}">${a.texte}</button>`).join('')}</div></div>`;
    document.body.appendChild(bg);
    const fermer = v => { obs.disconnect(); bg.remove(); document.removeEventListener('keydown', clavier, true); if (precedent && precedent.focus) precedent.focus(); resolve(v); };
    // Si la fenêtre est retirée par ailleurs (Échap géré globalement), on résout quand même.
    const obs = new MutationObserver(() => { if (!bg.isConnected) { obs.disconnect(); document.removeEventListener('keydown', clavier, true); resolve(null); } });
    obs.observe(document.body, { childList: true });
    const clavier = e => {
      if (e.key === 'Escape') { e.stopPropagation(); fermer(null); }
      if (e.key === 'Tab') {
        const f = $$('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])', bg).filter(x => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', clavier, true);
    bg.addEventListener('click', e => {
      if (e.target === bg) return fermer(null);
      const b = e.target.closest('[data-act]');
      if (b) fermer(b.dataset.act);
    });
    const premier = $('.modal-corps input, .modal-corps textarea', bg) || $('[data-act]', bg);
    setTimeout(() => premier && premier.focus(), 30);
  });
}

export const formatDuree = s => {
  s = Math.round(s || 0);
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ' + String(s % 60).padStart(2, '0');
  return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');
};
export const formatOctets = n => n < 1024 ? n + ' o' : n < 1048576 ? (n / 1024).toFixed(1).replace('.', ',') + ' Ko' : (n / 1048576).toFixed(2).replace('.', ',') + ' Mo';

// Hexadécimal ↔ octets, texte ↔ octets
export const versHex = (b, sep = '') => [...b].map(x => x.toString(16).padStart(2, '0')).join(sep);
export const texteVersOctets = t => new TextEncoder().encode(t);
export const octetsVersTexte = b => new TextDecoder('utf-8', { fatal: false }).decode(b);
export const latin1 = b => { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
