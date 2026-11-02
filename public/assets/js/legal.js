// Pages légales : remplissage à partir de config.js.
// <span data-champ="legal.siret" data-libelle="numéro SIRET"></span> : valeur ou repère jaune « à compléter ».
// data-optionnel : l'élément parent [data-si] est masqué si la valeur est vide (information facultative).
const CFG = window.LEVIER_CONFIG || {};
const lire = chemin => chemin.split('.').reduce((o, k) => (o == null ? undefined : o[k]), CFG);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const euros = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CFG.produit?.devise || 'EUR' }).format(n);
let manquants = 0;

document.querySelectorAll('[data-champ]').forEach(el => {
  const v = lire(el.dataset.champ);
  const vide = v == null || (typeof v === 'string' && !v.trim());
  if (!vide) { el.textContent = String(v); return; }
  if ('optionnel' in el.dataset) { const bloc = el.closest('[data-si]'); if (bloc) bloc.hidden = true; return; }
  manquants++;
  el.innerHTML = `<mark class="a-completer">[À compléter : ${esc(el.dataset.libelle || el.dataset.champ)}]</mark>`;
});

// Nom du formateur, email cliquable.
const formateur = [CFG.formateur?.prenom, CFG.formateur?.nom].filter(Boolean).join(' ');
document.querySelectorAll('[data-formateur]').forEach(el => { if (formateur) el.textContent = formateur; });
document.querySelectorAll('[data-email]').forEach(el => {
  const e = CFG.contact?.email;
  if (e) el.innerHTML = `<a href="mailto:${esc(e)}">${esc(e)}</a>`;
});

// Offres et prix (CGV).
const t = document.getElementById('tableOffres');
if (t && Array.isArray(CFG.offres)) {
  const ttc = CFG.prixTTC !== false;
  t.innerHTML = `<thead><tr><th>Offre</th><th>Contenu</th><th>Prix ${ttc ? 'TTC' : 'HT'}</th></tr></thead><tbody>${CFG.offres.map(o =>
    `<tr><td><b>${esc(o.nom)}</b></td><td>${(o.inclus || []).map(esc).join(' ; ')}</td><td>${euros(o.prix)}</td></tr>`).join('')}</tbody>`;
  const m = document.getElementById('mentionTVA');
  if (m && CFG.mentionTVA) m.textContent = CFG.mentionTVA + '.';
}

// Garantie commerciale facultative.
const g = CFG.garantie || {};
document.querySelectorAll('[data-garantie]').forEach(el => { el.hidden = !g.active; });
document.querySelectorAll('[data-sans-garantie]').forEach(el => { el.hidden = !!g.active; });
document.querySelectorAll('[data-garantie-jours]').forEach(el => { el.textContent = String(parseInt(g.jours, 10) || 14); });
const gc = document.getElementById('garantieConditions');
if (gc && g.conditions) gc.textContent = g.conditions;

// Bandeau pour le propriétaire tant que des informations obligatoires manquent.
const bandeau = document.getElementById('bandeauCompleter');
if (bandeau && manquants) {
  bandeau.hidden = false;
  bandeau.querySelector('b').textContent = String(manquants);
}
