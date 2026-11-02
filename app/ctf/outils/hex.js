// Hex & signatures : vue hexadécimale, détection des « nombres magiques » (y compris au milieu d'un fichier),
// chaînes lisibles façon `strings`, extraction d'une archive ZIP cachée.
import { $, $$, esc, chargerOctets, lireFichier, telecharger, formatOctets, latin1 } from '../commun.js';

export const SIGNATURES = [
  { nom: 'Image JPEG (début)', type: 'image/jpeg', ext: 'jpg', m: [0xFF, 0xD8, 0xFF] },
  { nom: 'Marqueur de fin JPEG', fin: true, m: [0xFF, 0xD9] },
  { nom: 'Image PNG', type: 'image/png', ext: 'png', m: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { nom: 'Fin d\'image PNG (IEND)', fin: true, m: [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82] },
  { nom: 'Archive ZIP (fichier)', type: 'application/zip', ext: 'zip', zip: true, m: [0x50, 0x4B, 0x03, 0x04] },
  { nom: 'Document PDF', type: 'application/pdf', ext: 'pdf', m: [0x25, 0x50, 0x44, 0x46, 0x2D] },
  { nom: 'Image GIF', type: 'image/gif', ext: 'gif', m: [0x47, 0x49, 0x46, 0x38] },
  { nom: 'Conteneur RIFF (WAV, AVI, WebP)', type: 'audio/wav', ext: 'wav', m: [0x52, 0x49, 0x46, 0x46] },
  { nom: 'Exécutable Linux (ELF)', ext: 'elf', m: [0x7F, 0x45, 0x4C, 0x46] },
  { nom: 'Archive gzip', type: 'application/gzip', ext: 'gz', m: [0x1F, 0x8B, 0x08] }
];
export function detecter(b) {
  const res = [];
  for (const s of SIGNATURES) {
    const m = s.m;
    for (let i = 0; i + m.length <= b.length; i++) {
      if (b[i] !== m[0]) continue;
      let ok = true; for (let k = 1; k < m.length; k++) if (b[i + k] !== m[k]) { ok = false; break; }
      if (ok) { res.push({ ...s, offset: i }); if (res.length > 200) return res; }
    }
  }
  return res.sort((a, c) => a.offset - c.offset);
}
export function chaines(b, min = 4) {
  const out = []; let debut = -1;
  for (let i = 0; i <= b.length; i++) {
    const c = b[i], ok = i < b.length && ((c >= 32 && c < 127) || c === 9);
    if (ok && debut < 0) debut = i;
    if (!ok && debut >= 0) { if (i - debut >= min) out.push({ offset: debut, texte: latin1(b.subarray(debut, i)) }); debut = -1; }
  }
  return out;
}
// Lit les entrées d'une archive ZIP à partir des en-têtes locaux.
export async function lireZip(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.length);
  const entrees = []; let o = 0;
  while (o + 30 <= b.length && v.getUint32(o, true) === 0x04034b50) {
    const flags = v.getUint16(o + 6, true), methode = v.getUint16(o + 8, true);
    const taille = v.getUint32(o + 18, true), tailleOrig = v.getUint32(o + 22, true);
    const ln = v.getUint16(o + 26, true), lx = v.getUint16(o + 28, true);
    const nom = new TextDecoder().decode(b.subarray(o + 30, o + 30 + ln));
    const data = b.subarray(o + 30 + ln + lx, o + 30 + ln + lx + taille);
    entrees.push({ nom, methode, taille, tailleOrig, chiffre: !!(flags & 1), data });
    o += 30 + ln + lx + taille;
  }
  for (const e of entrees) {
    if (e.chiffre) { e.erreur = 'Entrée chiffrée par mot de passe'; continue; }
    if (e.methode === 0) e.contenu = e.data;
    else if (e.methode === 8 && 'DecompressionStream' in window) {
      try { e.contenu = new Uint8Array(await new Response(new Blob([e.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
      catch (err) { e.erreur = 'Décompression impossible : ' + err.message; }
    } else e.erreur = 'Méthode de compression non prise en charge (' + e.methode + ')';
  }
  return entrees;
}

const LIGNES = 32;
export function monter(el) {
  el.innerHTML = `<div class="hx">
    <div class="row hx-tete"><label class="btn small" for="hxFile">Ouvrir un fichier…</label><input type="file" id="hxFile" hidden><span class="muted hx-nom">Aucun fichier chargé.</span></div>
    <div class="hx-onglets row" role="group" aria-label="Vue"><button type="button" class="btn small" data-v="sig" aria-pressed="true">Signatures</button><button type="button" class="btn small" data-v="hex" aria-pressed="false">Hexadécimal</button><button type="button" class="btn small" data-v="str" aria-pressed="false">Chaînes (strings)</button></div>
    <div class="hx-corps"></div></div>`;
  const corps = $('.hx-corps', el);
  let b = null, nom = '', vue = 'sig', page = 0, minStr = 4, filtre = '';
  const ext = () => (nom.split('.').pop() || '').toLowerCase();

  function rendre() {
    $$('[data-v]', el).forEach(x => x.setAttribute('aria-pressed', x.dataset.v === vue));
    if (!b) { corps.innerHTML = '<p class="muted">Ouvre un fichier, ou utilise le bouton « Hex & signatures » d\'une ressource.</p>'; return; }
    if (vue === 'sig') {
      const s = detecter(b), premier = s.find(x => x.offset === 0 && !x.fin);
      const finsJ = s.filter(x => x.nom === 'Marqueur de fin JPEG');
      const debuts = s.filter(x => !x.fin);
      corps.innerHTML = `<div class="hx-verdict ${premier && premier.ext !== ext() && !(premier.ext === 'jpg' && ext() === 'jpeg') ? 'warn' : ''}">
          <b>Type réel :</b> ${premier ? esc(premier.nom) : 'inconnu (pas de signature reconnue au début)'} · <b>extension :</b> .${esc(ext())}
          ${premier && premier.ext !== ext() && !(premier.ext === 'jpg' && ext() === 'jpeg') ? `<span>L'extension ment : les premiers octets disent que c'est un fichier ${esc(premier.ext.toUpperCase())}.</span>` : ''}</div>
        <div class="row"><button type="button" class="btn small" data-image>Essayer d'afficher comme image</button></div>
        <div class="table-scroll"><table class="ctf-table hx-sig"><caption class="sr">Signatures trouvées</caption><thead><tr><th scope="col">Position</th><th scope="col">Signature</th><th scope="col">Octets</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>
        ${debuts.concat(finsJ.slice(-3)).sort((x, y) => x.offset - y.offset).map(x => `<tr><td><code>0x${x.offset.toString(16).padStart(6, '0')}</code> <span class="muted">(${x.offset})</span></td><td>${esc(x.nom)}</td><td><code>${x.m.map(o => o.toString(16).padStart(2, '0')).join(' ')}</code></td><td class="row">
          <button type="button" class="btn small ghost" data-aller="${x.offset}">Voir</button>${!x.fin && x.offset > 0 ? `<button type="button" class="btn small" data-extraire="${x.offset}" data-sig="${SIGNATURES.indexOf(SIGNATURES.find(s2 => s2.nom === x.nom))}">Extraire à partir d'ici</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>
        ${finsJ.length && finsJ[finsJ.length - 1].offset + 2 < b.length && premier && premier.ext === 'jpg' ? `<p class="callout warn"><b>Données après la fin de l'image</b>Le dernier marqueur FF D9 est à la position ${finsJ[finsJ.length - 1].offset} mais le fichier fait ${b.length} octets : ${b.length - finsJ[finsJ.length - 1].offset - 2} octets ont été collés après l'image. Un visualiseur d'images les ignore.</p>` : ''}
        <div class="hx-extrait"></div>`;
      $('[data-image]', corps).addEventListener('click', () => apercu(b, 'image/' + (premier && premier.type && premier.type.startsWith('image') ? premier.ext.replace('jpg', 'jpeg') : 'png'), $('.hx-extrait', corps)));
      $$('[data-aller]', corps).forEach(x => x.addEventListener('click', () => { page = Math.floor(+x.dataset.aller / (LIGNES * 16)); vue = 'hex'; rendre(); }));
      $$('[data-extraire]', corps).forEach(x => x.addEventListener('click', () => extraire(+x.dataset.extraire, SIGNATURES[+x.dataset.sig], $('.hx-extrait', corps))));
    } else if (vue === 'hex') {
      const pages = Math.ceil(b.length / (LIGNES * 16));
      page = Math.min(Math.max(0, page), pages - 1);
      const debut = page * LIGNES * 16;
      let lignes = '';
      for (let o = debut; o < Math.min(b.length, debut + LIGNES * 16); o += 16) {
        const seg = b.subarray(o, o + 16);
        lignes += `${o.toString(16).padStart(8, '0')}  ${[...seg].map(x => x.toString(16).padStart(2, '0')).join(' ').padEnd(47)}  ${[...seg].map(x => x >= 32 && x < 127 ? String.fromCharCode(x) : '.').join('')}\n`;
      }
      corps.innerHTML = `<div class="row hx-nav"><button type="button" class="btn small" data-p="-1" ${page ? '' : 'disabled'}>← Précédent</button><span class="muted">Page ${page + 1}/${pages}</span><button type="button" class="btn small" data-p="1" ${page < pages - 1 ? '' : 'disabled'}>Suivant →</button>
        <label class="hx-aller">Aller à l'octet <input type="text" inputmode="numeric" placeholder="0x1a2b ou 6699" size="12"></label><button type="button" class="btn small" data-p="fin">Fin du fichier</button></div>
        <pre class="hx-dump" tabindex="0" aria-label="Vue hexadécimale">${esc(lignes)}</pre>`;
      $$('[data-p]', corps).forEach(x => x.addEventListener('click', () => { page = x.dataset.p === 'fin' ? pages - 1 : page + +x.dataset.p; rendre(); }));
      $('.hx-aller input', corps).addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.value.trim(); const n = /^0x/i.test(t) ? parseInt(t, 16) : parseInt(t, 10); if (Number.isFinite(n)) { page = Math.floor(n / (LIGNES * 16)); rendre(); } } });
    } else {
      const l = chaines(b, minStr).filter(x => !filtre || x.texte.toLowerCase().includes(filtre.toLowerCase()));
      corps.innerHTML = `<div class="row hx-nav"><label>Longueur minimale <input type="number" min="3" max="40" value="${minStr}" data-min style="width:5em"></label><label>Filtrer <input type="search" value="${esc(filtre)}" data-filtre placeholder="ex. LUMIO, http, pass"></label><span class="muted">${l.length} chaîne(s)</span></div>
        <pre class="hx-dump" tabindex="0" aria-label="Chaînes lisibles">${esc(l.slice(0, 3000).map(x => `${x.offset.toString(16).padStart(8, '0')}  ${x.texte}`).join('\n'))}</pre>`;
      $('[data-min]', corps).addEventListener('change', e => { minStr = Math.max(3, +e.target.value || 4); rendre(); });
      $('[data-filtre]', corps).addEventListener('input', e => { filtre = e.target.value; const pos = e.target.selectionStart; rendre(); const f = $('[data-filtre]', corps); f.focus(); f.setSelectionRange(pos, pos); });
    }
  }
  function apercu(octets, type, z) {
    const u = URL.createObjectURL(new Blob([octets], { type }));
    const img = new Image();
    img.onload = () => { z.innerHTML = `<figure class="ex-fig"><img src="${u}" alt="Aperçu du contenu"><figcaption>Le contenu s'affiche bien comme une image.</figcaption></figure>`; };
    img.onerror = () => { z.innerHTML = '<p class="callout warn">Ces octets ne forment pas une image lisible par le navigateur.</p>'; URL.revokeObjectURL(u); };
    img.src = u;
  }
  async function extraire(offset, sig, z) {
    const part = b.slice(offset);
    if (sig && sig.zip) {
      const entrees = await lireZip(part);
      z.innerHTML = `<h4>Archive ZIP trouvée à la position ${offset} : ${entrees.length} fichier(s)</h4><ul class="hx-zip">${entrees.map((e, i) => `<li><code>${esc(e.nom)}</code> <span class="muted">${formatOctets(e.tailleOrig)}${e.methode === 8 ? ' (compressé)' : ''}</span>
        ${e.erreur ? `<span class="muted">— ${esc(e.erreur)}</span>` : `<button type="button" class="btn small" data-voir="${i}">Afficher</button><button type="button" class="btn small ghost" data-dl="${i}">Télécharger</button>`}<pre class="hx-dump" hidden></pre></li>`).join('')}</ul>
        <button type="button" class="btn small ghost" data-dlzip>Télécharger l'archive extraite</button>`;
      $$('[data-voir]', z).forEach(x => x.addEventListener('click', () => { const e = entrees[+x.dataset.voir]; const pre = x.parentElement.querySelector('pre'); pre.hidden = false; pre.textContent = new TextDecoder().decode(e.contenu); }));
      $$('[data-dl]', z).forEach(x => x.addEventListener('click', () => { const e = entrees[+x.dataset.dl]; telecharger(e.nom.split('/').pop(), e.contenu); }));
      $('[data-dlzip]', z).addEventListener('click', () => telecharger('extrait.zip', part, 'application/zip'));
    } else if (sig && sig.type && sig.type.startsWith('image')) apercu(part, sig.type, z);
    else { z.innerHTML = `<p>${formatOctets(part.length)} extraits.</p><button type="button" class="btn small" data-dl>Télécharger</button>`; $('[data-dl]', z).addEventListener('click', () => telecharger('extrait.' + ((sig && sig.ext) || 'bin'), part)); }
  }
  $$('[data-v]', el).forEach(x => x.addEventListener('click', () => { vue = x.dataset.v; rendre(); }));
  $('#hxFile', el).addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; b = await lireFichier(f); nom = f.name; page = 0; $('.hx-nom', el).textContent = `${nom} · ${formatOctets(b.length)}`; rendre(); });
  rendre();
  return {
    async charger({ src, octets, nom: n, vue: v }) {
      b = octets || await chargerOctets(src); nom = n || String(src).split('/').pop(); page = 0; if (v) vue = v;
      $('.hx-nom', el).textContent = `${nom} · ${formatOctets(b.length)}`; rendre();
    }
  };
}
