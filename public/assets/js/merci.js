// Pages de remerciement : prénom saisi, impression du guide, activation d'un achat, clé perdue.
import { activerCle, telechargerCle, brancherRecuperation } from './acces-client.js';

const CFG = window.LEVIER_CONFIG || {};
const $ = s => document.querySelector(s);

document.querySelectorAll('[data-cfg]').forEach(el => {
  const v = el.dataset.cfg.split('.').reduce((o, k) => (o == null ? undefined : o[k]), CFG);
  if (typeof v === 'string' && v.trim()) el.textContent = v;
});

// Prénom transmis par le formulaire de la page de vente (stockage de session uniquement).
try {
  const prenom = sessionStorage.getItem('levier.prenom');
  const zone = $('[data-prenom]');
  if (prenom && zone) zone.textContent = ', ' + prenom;
} catch { /* stockage indisponible */ }

$('#imprimer')?.addEventListener('click', () => window.print());

const email = CFG.contact?.email;
if (email && $('#supportAchat')) {
  const a = document.createElement('a');
  a.href = 'mailto:' + email; a.textContent = email;
  const p = $('#supportAchat');
  p.textContent = 'Un problème d\'activation ? Écrivez à ';
  p.append(a, CFG.contact.delaiReponse ? ` (réponse sous ${CFG.contact.delaiReponse}).` : '.');
}

// Activation après achat : ?session_id=cs_… (Stripe) ou ?cle=… (lien envoyé par email).
const NOMS = { essentiel: 'Essentiel', pro: 'Pro', vip: 'VIP' };
const form = $('#formActivation');
if (form) {
  const champ = $('#cle'), msg = $('#activationMsg'), btn = form.querySelector('button');
  const params = new URLSearchParams(location.search);
  const cle = (params.get('session_id') || params.get('cle') || '').trim();
  if (cle && cle.length <= 200) champ.value = cle;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const v = champ.value.trim();
    msg.className = 'form-msg';
    champ.removeAttribute('aria-invalid');
    if (!v) { msg.textContent = 'Collez votre code ou votre clé de licence.'; msg.classList.add('ko'); champ.focus(); return; }
    btn.disabled = true; msg.textContent = 'Vérification…';
    try {
      const a = await activerCle(v);
      if (a.conserve) {
        msg.textContent = `Votre accès ${NOMS[a.offre]} reste actif sur cet appareil : la clé saisie correspond à l'offre ${NOMS[a.offreSaisie]}, inférieure.`;
        msg.classList.add('ok'); btn.disabled = false; return;
      }
      msg.textContent = `Accès ${NOMS[a.offre] || ''} activé.`;
      msg.classList.add('ok');
      if (/^cs_/.test(v)) {
        // Achat Stripe : la clé n'existe nulle part ailleurs, on la fait conserver avant de partir.
        const p = $('#panneauCle');
        $('#cleTexte').textContent = v;
        form.hidden = true;
        p.hidden = false;
        p.querySelector('h2').setAttribute('tabindex', '-1');
        p.querySelector('h2').focus();
      } else {
        msg.textContent += ' Redirection vers l\'espace membre…';
        setTimeout(() => { location.href = '../cours/#/'; }, 900);
      }
    } catch (err) {
      msg.textContent = err.message; msg.classList.add('ko');
      champ.setAttribute('aria-invalid', 'true');
      btn.disabled = false;
    }
  });
  $('#copierCle')?.addEventListener('click', async () => {
    const v = $('#cleTexte').textContent, m = $('#cleMsg');
    try { await navigator.clipboard.writeText(v); m.textContent = 'Clé copiée. Collez-la dans un endroit sûr (gestionnaire de mots de passe, note).'; m.className = 'form-msg ok'; }
    catch { m.textContent = 'Copie impossible : sélectionnez la clé et copiez-la à la main.'; m.className = 'form-msg ko'; }
  });
  $('#telechargerCle')?.addEventListener('click', () => telechargerCle($('#cleTexte').textContent, CFG.produit?.nom || 'Levier'));
}
brancherRecuperation($('#formRecuperer'), email || '');
