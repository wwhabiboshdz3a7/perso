// Recherche d'image inversée simulée : résultats fictifs de quatre moteurs (dont un tri par date
// à la façon de TinEye) pour s'entraîner à remonter à la première publication d'une image.
import { $, $$, esc, url, modale } from '../commun.js';

const MOTEURS = [
  { id: 'google', nom: 'Google Lens', note: 'Fort pour les objets, les produits et les lieux connus. Pense à « Trouver la source de l\'image ».' },
  { id: 'yandex', nom: 'Yandex Images', note: 'Souvent le meilleur pour les visages, les paysages et l\'Europe de l\'Est.' },
  { id: 'bing', nom: 'Bing Visual Search', note: 'Utile en complément, permet de recadrer la zone recherchée.' },
  { id: 'tineye', nom: 'TinEye', note: 'Correspondances exactes uniquement, mais triables par date : idéal pour trouver la plus ancienne.' }
];
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'date inconnue';

export function monter(el, opts) {
  const moteurs = MOTEURS.filter(m => opts.moteurs && opts.moteurs[m.id]);
  let actif = moteurs[0]?.id, tri = 'pertinence';
  el.innerHTML = `<div class="ln">
    <div class="ln-req"><figure><img src="${esc(url(opts.image.src))}" alt="${esc(opts.image.alt || 'Image recherchée')}"><figcaption>Image analysée</figcaption></figure>
      <div><p class="muted">Dans la vraie vie, tu déposerais l'image (ou une capture recadrée) dans chacun de ces moteurs. Ici, les résultats sont simulés.</p><button type="button" class="btn primary" data-go>🔍 Lancer la recherche inversée</button></div></div>
    <div class="ln-res" hidden>
      <div class="ln-tabs" role="tablist" aria-label="Moteurs de recherche">${moteurs.map(m => `<button type="button" role="tab" data-m="${m.id}" aria-selected="${m.id === actif}">${esc(m.nom)} <span>${opts.moteurs[m.id].length}</span></button>`).join('')}</div>
      <div class="ln-outils row"><span class="muted ln-note"></span><label class="ln-tri">Trier <select data-tri><option value="pertinence">par pertinence</option><option value="ancien">du plus ancien</option><option value="recent">du plus récent</option></select></label></div>
      <ol class="ln-liste" aria-live="polite"></ol>
    </div></div>`;
  const rendre = () => {
    const m = MOTEURS.find(x => x.id === actif);
    $$('[data-m]', el).forEach(b => b.setAttribute('aria-selected', b.dataset.m === actif));
    $('.ln-note', el).textContent = m.note;
    let l = [...opts.moteurs[actif]];
    if (tri !== 'pertinence') l.sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);
    if (tri === 'recent') l.reverse();
    $('.ln-liste', el).innerHTML = l.map(r => `<li><button type="button" class="ln-item" data-i="${opts.moteurs[actif].indexOf(r)}">
      <img src="${esc(url(r.miniature || opts.image.src))}" alt="" loading="lazy" ${r.miroir ? 'style="transform:scaleX(-1)"' : ''}>
      <span class="ln-txt"><b>${esc(r.titre)}</b><span class="ln-site">${esc(r.site)}${r.taille ? ' · ' + esc(r.taille) : ''}</span><span class="ln-date">${r.date ? 'Publiée le ' + fmtDate(r.date) : 'Date de publication inconnue'}</span>${r.extrait ? `<span class="ln-ext">${esc(r.extrait)}</span>` : ''}</span></button></li>`).join('') || '<li class="muted">Aucun résultat sur ce moteur.</li>';
  };
  $('[data-go]', el).addEventListener('click', e => {
    e.currentTarget.disabled = true; e.currentTarget.innerHTML = '<span class="spinner"></span> Recherche…';
    setTimeout(() => { $('.ln-res', el).hidden = false; e.target.closest('.ln-req').querySelector('[data-go]').textContent = 'Résultats affichés ci-dessous'; rendre(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
  });
  $$('[data-m]', el).forEach(b => b.addEventListener('click', () => { actif = b.dataset.m; rendre(); }));
  $('[data-tri]', el).addEventListener('change', e => { tri = e.target.value; rendre(); });
  $('.ln-liste', el).addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const r = opts.moteurs[actif][+b.dataset.i];
    modale({ titre: esc(r.titre), large: true, corps: `<p class="muted">${esc(r.site)} · ${r.date ? 'publiée le ' + fmtDate(r.date) : 'date inconnue'}${r.url ? ` · <code>${esc(r.url)}</code>` : ''}</p>
      ${r.detail && r.detail.image ? `<img class="ln-detail-img" src="${esc(url(r.detail.image))}" alt="${esc(r.detail.alt || '')}">` : `<img class="ln-detail-img" src="${esc(url(r.miniature || opts.image.src))}" alt="" ${r.miroir ? 'style="transform:scaleX(-1)"' : ''}>`}
      ${r.detail && r.detail.texte ? `<div class="ln-detail-txt">${r.detail.texte}</div>` : ''}` });
  });
  return { rendre };
}
