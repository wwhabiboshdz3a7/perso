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

// Mini-guide : servi par la fonction `guide` sur présentation du jeton reçu à l'inscription
// (mémorisé sur cet appareil, ou présent dans le lien envoyé par email : /merci/?g=…).
const zoneGuide = $('#guide');
if (zoneGuide) {
  const CLE_GUIDE = 'levier.guide';
  const params = new URLSearchParams(location.search);
  let jeton = params.get('g') || '';
  try {
    if (jeton) localStorage.setItem(CLE_GUIDE, jeton);
    else jeton = localStorage.getItem(CLE_GUIDE) || '';
  } catch { /* stockage indisponible */ }
  if (params.has('g')) history.replaceState(null, '', location.pathname);
  const sansGuide = (message = '') => {
    zoneGuide.hidden = true;
    $('#sansGuide').hidden = false;
    $('.merci-hero .actions').hidden = true; // les deux appels à l'action sont dans l'encadré
    if (message) $('#sansGuide p').textContent = message;
    $('#merciSurtitre').textContent = 'Mini-guide offert';
    $('#merciTitre').innerHTML = 'Le mini-guide des <em>7 services IA.</em>';
    $('#merciChapo').textContent = 'Sept prestations concrètes à vendre avec Claude, avec pour chacune le livrable, les outils et la façon de la livrer.';
  };
  const charger = async () => {
    if (!jeton) return sansGuide();
    $('#guideEtat').textContent = 'Chargement du mini-guide…';
    try {
      const rep = await fetch('/.netlify/functions/guide?g=' + encodeURIComponent(jeton), { headers: { Accept: 'application/json' } });
      const d = await rep.json();
      if (!rep.ok) throw new Error(d.erreur || 'indisponible');
      if (!d.ok) { try { localStorage.removeItem(CLE_GUIDE); } catch { /* */ } return sansGuide(d.erreur); }
      zoneGuide.innerHTML = d.html; // contenu servi par la fonction du site (fichier de prive/guide/)
      $('#imprimer').hidden = false;
      let envoye = params.has('g');
      try { envoye ||= sessionStorage.getItem('levier.guideEnvoye') === '1'; } catch { /* */ }
      if (envoye) $('#merciChapo').textContent = 'Il vous est aussi envoyé par email : vous le retrouverez quand vous voulez. Les modules gratuits vous attendent dans l\'espace membre, sans autre inscription.';
    } catch {
      $('#guideEtat').innerHTML = '';
      $('#guideEtat').append('Le guide n\'a pas pu être chargé (connexion ?). ');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bouton contour'; b.textContent = 'Réessayer';
      b.addEventListener('click', charger);
      $('#guideEtat').append(b);
    }
  };
  charger();
}

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
        $('.chapo').textContent = 'Votre accès est activé sur cet appareil. Dernière étape : mettre votre clé en lieu sûr.';
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
