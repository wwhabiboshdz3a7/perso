// Page de vente : contenu piloté par config.js (offres, formateur, témoignages, garantie),
// formulaires Netlify (aimant à prospects, liste d'attente), menu mobile et animations.
const CFG = window.LEVIER_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lire = (obj, chemin) => chemin.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const urlSure = u => /^https:\/\/[^\s"'<>]+$/i.test(String(u || '').trim());
const euros = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CFG.produit?.devise || 'EUR', maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);

/* ---------- textes simples ---------- */
$$('[data-cfg]').forEach(el => {
  const v = lire(CFG, el.dataset.cfg);
  if (typeof v === 'string' && v.trim()) el.textContent = 'minuscule' in el.dataset ? v.charAt(0).toLowerCase() + v.slice(1) : v;
});
$$('[data-cfg-legal]').forEach(el => {
  const v = CFG.legal?.[el.dataset.cfgLegal] || CFG.produit?.nom;
  if (v) el.textContent = v;
});
const annee = $('#annee');
if (annee) annee.textContent = String(new Date().getFullYear());

/* ---------- formateur ---------- */
(function formateur() {
  const f = CFG.formateur || {};
  const nom = [f.prenom, f.nom].filter(Boolean).join(' ');
  $$('[data-formateur-nom]').forEach(el => { if (nom) el.textContent = nom; });
  const initiales = [f.prenom, f.nom].filter(x => x && x.trim()).map(x => x.trim()[0].toUpperCase()).join('');
  $$('[data-monogramme]').forEach(el => { if (initiales) el.textContent = initiales; });
  // Sans photo : un médaillon à initiales à côté du titre. Avec photo : le grand portrait en regard du texte.
  if (f.photo) {
    const img = new Image();
    img.alt = nom ? `Portrait de ${nom}` : 'Portrait du formateur';
    img.width = 440; img.height = 440; img.loading = 'lazy'; img.decoding = 'async';
    img.src = f.photo;
    img.addEventListener('load', () => { const p = $('#portrait'); p.textContent = ''; p.appendChild(img); p.hidden = false; $('#formateur').classList.add('avec-photo'); });
  }
  if (Array.isArray(f.presentation) && f.presentation.length) {
    $('#formateurFaits').innerHTML = f.presentation.map(x => `<li>${esc(x)}</li>`).join('');
  }
  if (f.parcours) { const p = $('#formateurParcours'); p.textContent = f.parcours; p.hidden = false; }
  const chiffres = (f.chiffres || []).filter(c => c && c.valeur && c.libelle);
  const zone = $('#formateurChiffres');
  if (chiffres.length) zone.innerHTML = chiffres.map(c => `<li><b>${esc(c.valeur)}</b><span>${esc(c.libelle)}</span></li>`).join('');
  else zone.hidden = true;
  const noms = { site: 'Site', linkedin: 'LinkedIn', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', github: 'GitHub' };
  const liens = Object.entries(f.liens || {}).filter(([, u]) => urlSure(u));
  if (CFG.agence?.url && urlSure(CFG.agence.url)) liens.unshift(['agence', CFG.agence.url]);
  if (liens.length) {
    const p = $('#formateurLiens');
    p.innerHTML = liens.map(([k, u]) => `<a href="${esc(u)}" rel="me noopener" target="_blank">${esc(k === 'agence' ? (CFG.agence.nom || 'Agence') : noms[k] || k)}</a>`).join('');
    p.hidden = false;
  }
})();

/* ---------- témoignages (uniquement réels, masqués si la liste est vide) ---------- */
(function temoignages() {
  const liste = (CFG.temoignages || []).filter(t => t && t.nom && t.texte);
  if (!liste.length) return;
  $('#listeTemoignages').innerHTML = liste.map(t => `<figure class="temoignage"><blockquote>« ${esc(t.texte)} »</blockquote>
    <figcaption><b>${esc(t.nom)}</b>${t.role ? ` · ${esc(t.role)}` : ''}${t.date ? ` · ${esc(t.date)}` : ''}${urlSure(t.lien) ? ` · <a href="${esc(t.lien)}" rel="noopener" target="_blank">voir</a>` : ''}</figcaption></figure>`).join('');
  $('#temoignages').hidden = false;
})();

/* ---------- offres ---------- */
// Une offre qui prévoit un accompagnement (VIP) n'est affichée que si cet accompagnement est décrit.
const offreVisible = o => o && (!Array.isArray(o.accompagnement) || o.accompagnement.some(x => String(x).trim()));
const offres = (Array.isArray(CFG.offres) ? CFG.offres : []).filter(offreVisible);
(function rendreOffres() {
  if (!offres.length) return;
  const ttc = CFG.prixTTC !== false;
  const noteTVA = CFG.mentionTVA ? esc(CFG.mentionTVA) : (ttc ? 'Prix TTC' : 'Prix HT');
  $('#offresListe').dataset.nombre = String(offres.length);
  $('#offresListe').innerHTML = offres.map(o => {
    const lien = urlSure(o.lienPaiement) ? o.lienPaiement.trim() : '';
    const cta = lien
      ? `<a class="bouton ${o.recommandee ? 'citron' : 'encre'}" href="${esc(lien)}" rel="noopener" data-offre="${esc(o.id)}">Choisir l'offre ${esc(o.nom)}</a>`
      : `<button class="bouton ${o.recommandee ? 'citron' : 'encre'}" type="button" data-attente="${esc(o.id)}">Être prévenu de l'ouverture</button>`;
    const prixBarre = typeof o.prixBarre === 'number' && o.prixBarre > o.prix ? `<s>${euros(o.prixBarre)}</s>` : '';
    return `<article class="offre${o.recommandee ? ' recommandee' : ''}" aria-labelledby="offre-${esc(o.id)}">
      ${o.recommandee ? '<span class="ruban">Recommandée</span>' : ''}
      <h3 id="offre-${esc(o.id)}">${esc(o.nom)}</h3>
      <p class="resume">${esc(o.resume || '')}</p>
      <p class="prix">${prixBarre}<b>${euros(o.prix)}</b></p>
      <p class="prix-note">${noteTVA} · paiement unique</p>
      <ul>${[...(o.inclus || []), ...(o.accompagnement || [])].filter(i => String(i).trim()).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      ${cta}
      <p class="offre-pied">${lien ? 'Accès immédiat après paiement' : 'Inscriptions bientôt ouvertes'}</p>
    </article>`;
  }).join('');
  const fournisseur = CFG.legal?.prestatairesPaiement;
  if (fournisseur) $('#offresNote').innerHTML = `Paiement sécurisé (${esc(fournisseur)}). Les contenus étant accessibles immédiatement, vous renoncez expressément à votre droit de rétractation lors de l'accès (voir les <a href="legal/cgv.html">CGV</a>).`;
})();

/* ---------- garantie ---------- */
(function garantie() {
  const g = CFG.garantie || {};
  if (!g.active) {
    $('#garantie').hidden = true;
    const f = $('#faqRemboursement');
    if (f) f.textContent = 'Les contenus étant accessibles immédiatement, vous renoncez expressément à votre droit de rétractation lors de l\'achat. Vous bénéficiez des garanties légales décrites dans les CGV ; en cas de problème d\'accès ou de contenu, écrivez-nous.';
    return;
  }
  const jours = parseInt(g.jours, 10) || 14;
  $$('[data-garantie-jours]').forEach(el => { el.textContent = String(jours); });
  if (g.conditions) $('#garantieTexte').textContent = g.conditions;
})();

/* ---------- contact dans la FAQ ---------- */
(function contact() {
  const email = CFG.contact?.email;
  if (email && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email)) {
    $('#faqContact').innerHTML = `Une autre question ? Écrivez à <a href="mailto:${esc(email)}">${esc(email)}</a>${CFG.contact.delaiReponse ? `, réponse sous ${esc(CFG.contact.delaiReponse)}` : ''}.`;
  }
})();

/* ---------- formulaires Netlify ---------- */
const emailValide = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
async function envoyer(form) {
  const corps = new URLSearchParams(new FormData(form)).toString();
  const rep = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corps });
  if (!rep.ok) throw new Error('HTTP ' + rep.status);
}
function verifier(form, msg) {
  const email = form.querySelector('input[type=email]');
  const consent = form.querySelector('input[type=checkbox][name=consentement]');
  email.removeAttribute('aria-invalid');
  msg.className = 'form-msg';
  if (!emailValide(email.value.trim())) {
    email.setAttribute('aria-invalid', 'true'); msg.textContent = 'Indiquez une adresse email valide.'; msg.classList.add('ko'); email.focus(); return false;
  }
  if (consent && !consent.checked) {
    msg.textContent = 'Cochez la case pour confirmer votre accord.'; msg.classList.add('ko'); consent.focus(); return false;
  }
  return true;
}
const formAimant = $('#formAimant');
formAimant?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#aimantMsg'), btn = formAimant.querySelector('button[type=submit]');
  if (!verifier(formAimant, msg)) return;
  btn.disabled = true; msg.textContent = 'Envoi…';
  try {
    // 1. Jeton du mini-guide (fonction `guide`, qui l'envoie aussi par email si c'est configuré).
    const rep = await fetch('/.netlify/functions/guide', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formAimant.email.value.trim(), prenom: formAimant.prenom.value.trim(), consentement: formAimant.consentement.checked ? 'oui' : '', 'bot-field': formAimant['bot-field']?.value || '' })
    });
    const d = await rep.json().catch(() => ({}));
    if (!rep.ok || !d.ok || !d.jeton) throw new Error(d.erreur || '');
    // 2. Inscription enregistrée dans Netlify Forms (export vers l'outil d'emailing).
    await envoyer(formAimant);
    try { localStorage.setItem('levier.guide', d.jeton); } catch { /* */ }
    try { sessionStorage.setItem('levier.prenom', formAimant.prenom.value.trim().slice(0, 60)); } catch { /* */ }
    location.href = formAimant.getAttribute('action') || '/merci/';
  } catch (err) {
    msg.textContent = err instanceof TypeError || !err?.message ? 'L\'envoi a échoué. Vérifiez votre connexion et réessayez.' : err.message;
    msg.className = 'form-msg ko'; btn.disabled = false;
  }
});

/* ---------- liste d'attente ---------- */
const modale = $('#modaleAttente');
const formAttente = $('#formAttente');
function ouvrirAttente(id) {
  const o = offres.find(x => x.id === id) || {};
  $('#attenteOffre').value = id || '';
  $('#attenteOffreNom').textContent = o.nom || '';
  $('#attenteMsg').textContent = '';
  if (typeof modale.showModal === 'function') modale.showModal(); else modale.setAttribute('open', '');
  $('#attenteEmail').focus();
}
function fermerAttente() { if (modale.open) { if (typeof modale.close === 'function') modale.close(); else modale.removeAttribute('open'); } }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-attente]');
  if (b) { ouvrirAttente(b.dataset.attente); return; }
  if (e.target.closest('[data-fermer]') || e.target === modale) fermerAttente();
});
formAttente?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#attenteMsg'), btn = formAttente.querySelector('button[type=submit]');
  if (!verifier(formAttente, msg)) return;
  btn.disabled = true; msg.textContent = 'Envoi…';
  try {
    await envoyer(formAttente);
    msg.textContent = 'C\'est noté : vous serez prévenu dès l\'ouverture.'; msg.className = 'form-msg ok';
    formAttente.reset();
  } catch {
    msg.textContent = 'L\'envoi a échoué. Réessayez dans un instant.'; msg.className = 'form-msg ko';
  } finally { btn.disabled = false; }
});

/* ---------- navigation ---------- */
const nav = $('#nav'), menu = $('#navMenu');
menu?.addEventListener('click', () => {
  const ouvert = nav.classList.toggle('ouvert');
  menu.setAttribute('aria-expanded', String(ouvert));
  menu.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
});
$('#navLiens')?.addEventListener('click', e => {
  if (e.target.closest('a')) { nav.classList.remove('ouvert'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Ouvrir le menu'); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('ouvert')) { nav.classList.remove('ouvert'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); }
});
const majNav = () => nav.classList.toggle('defile', window.scrollY > 8);
window.addEventListener('scroll', majNav, { passive: true });
majNav();

/* ---------- apparition au défilement ---------- */
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduit && 'IntersectionObserver' in window) {
  const cibles = $$('.section h2, .constats li, .piliers li, .carte, .chaine li, .video-plus > div, .recus li, .offre, .medaillon, .faq details');
  const obs = new IntersectionObserver(entrees => {
    entrees.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  cibles.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // déjà visible : pas d'animation
    el.classList.add('apparait');
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    obs.observe(el);
  });
}
