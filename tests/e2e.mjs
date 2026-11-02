// Tests de bout en bout (Playwright) : page de vente, aimant à prospects, module gratuit,
// refus puis accès avec un code valide, contenu payant inaccessible, progression, quiz, certificat,
// bonus, téléchargement n8n, activation après achat, pages légales. Ordinateur (1440) et mobile (390).
// Usage : node tests/e2e.mjs   (variables facultatives : E2E_PORT, E2E_CAPTURES=dossier de captures)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hacherCode } from '../netlify/lib/verificateurs.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 9542);
const BASE = `http://localhost:${PORT}`;
const CAPTURES = process.env.E2E_CAPTURES || '';
const CODE_PRO = 'LEV-E2EPR-OTEST-23456';
const CODE_ESS = 'LEV-E2EES-SENTL-23456';

/* ---------- serveur local (émule Netlify : fichiers, fonctions, formulaires) ---------- */
function demarrerServeur() {
  return new Promise((ok, ko) => {
    const p = spawn(process.execPath, ['outils/serveur-local.mjs', '--port', String(PORT)], {
      cwd: racine,
      env: { ...process.env, TOKEN_SECRET: randomBytes(32).toString('hex'), ACCESS_CODE_HASHES: `pro:${hacherCode(CODE_PRO)},essentiel:${hacherCode(CODE_ESS)}` },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const t = setTimeout(() => ko(new Error('Le serveur local ne démarre pas')), 10000);
    p.stdout.on('data', d => { if (String(d).includes('Serveur local')) { clearTimeout(t); ok(p); } });
    p.stderr.on('data', d => process.stderr.write(d));
    p.on('exit', c => { clearTimeout(t); ko(new Error('Serveur arrêté : ' + c)); });
  });
}

/* ---------- mini-harnais ---------- */
let reussis = 0, echecs = 0;
const verifier = (cond, msg) => { if (!cond) throw new Error(msg); };
async function etape(nom, fn) {
  try { await fn(); reussis++; console.log('  ✓ ' + nom); }
  catch (e) { echecs++; console.log('  ✗ ' + nom + '\n      ' + e.message.split('\n')[0]); }
}

async function nouveauContexte(navigateur, largeur) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: largeur < 600 ? 844 : 900 }, acceptDownloads: true });
  const erreurs = [];
  ctx.on('page', p => surveiller(p, erreurs));
  const page = await ctx.newPage();
  surveiller(page, erreurs);
  return { ctx, page, erreurs };
}
function surveiller(page, erreurs) {
  page.on('console', m => { if (m.type() === 'error') erreurs.push(`[console] ${m.text()} (${page.url()})`); });
  page.on('pageerror', e => erreurs.push(`[page] ${e.message} (${page.url()})`));
}
async function sansDebordement(page) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  verifier(sw <= w, `défilement horizontal sur ${page.url()} (${sw} > ${w})`);
}
async function capture(page, nom) {
  if (!CAPTURES) return;
  await page.screenshot({ path: path.join(CAPTURES, nom + '.png'), fullPage: false });
}
const formulaires = async page => (await (await page.request.get(BASE + '/__formulaires')).json());

/** Valide l'exercice affiché : texte (exemple de réponse), QCM (essais successifs) ou checklist. */
async function faireExercice(page) {
  const zone = page.locator('#exo');
  if (await zone.locator('textarea.answer').count()) {
    await zone.locator('.verif').click();
    await zone.locator('.sol').click();
    const solution = await zone.locator('.solution').evaluate(el => {
      const c = el.cloneNode(true); c.querySelector('b')?.remove();
      c.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
      return c.innerText.trim();
    });
    await zone.locator('textarea.answer').fill(solution);
    await zone.locator('.verif').click();
  } else if (await zone.locator('.checklist input').count()) {
    const cases = zone.locator('.checklist input');
    for (let i = 0; i < await cases.count(); i++) await cases.nth(i).check();
  } else {
    const options = zone.locator('.quiz input');
    for (let i = 0; i < await options.count(); i++) {
      await options.nth(i).check();
      await zone.locator('.valid').click();
      if (await zone.locator('.result-banner.ok').count()) break;
    }
  }
  await zone.locator('.result-banner.ok').waitFor({ timeout: 4000 });
}
async function faireQuiz(page, bonnes = false) {
  const q = page.locator('#quiz fieldset.q');
  for (let i = 0; i < await q.count(); i++) await q.nth(i).locator('input').first().check();
  await page.locator('#quiz .corr').click();
  if (bonnes) { // deuxième passage avec les bonnes réponses révélées
    for (let i = 0; i < await q.count(); i++) await q.nth(i).locator('label.ok input').check();
    await page.locator('#quiz .corr').click();
  }
}

async function scenarios(navigateur, largeur) {
  const suffixe = largeur < 600 ? 'mobile' : 'ordinateur';
  console.log(`\n▶ ${suffixe} (${largeur} px)`);
  const tousLesErreurs = [];

  /* 1. Page de vente */
  {
    const { ctx, page, erreurs } = await nouveauContexte(navigateur, largeur);
    await etape('page de vente : contenu, programme, offres, mentions', async () => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      verifier(/votre levier/i.test(await page.locator('h1').innerText()), 'titre principal');
      verifier(await page.locator('#mentionIndependance').isVisible(), 'mention d\'indépendance visible');
      verifier((await page.locator('.prog > li').count()) === 10, 'programme : 9 modules + bonus');
      verifier((await page.locator('#offresListe .offre').count()) === 3, '3 offres');
      verifier(await page.locator('#temoignages').isHidden(), 'témoignages masqués (aucun avis réel)');
      verifier(await page.locator('#garantie').isVisible(), 'garantie affichée');
      verifier(/Ibrahim/.test(await page.locator('#titreFormateur').innerText()), 'formateur');
      await page.locator('.prog-mod.vedette summary').click();
      verifier(/HyperFrames/.test(await page.locator('.prog-mod.vedette .prog-lecons').innerText()), 'leçons du module 6');
      await sansDebordement(page);
      await capture(page, `e2e-vente-${suffixe}`);
    });
    await etape('page de vente : menu mobile ou navigation', async () => {
      if (largeur < 600) {
        await page.locator('#navMenu').click();
        verifier(await page.locator('#navLiens a[href="#offres"]').isVisible(), 'menu ouvert');
        await page.locator('#navLiens a[href="#offres"]').click();
        verifier(await page.locator('#navMenu').getAttribute('aria-expanded') === 'false', 'menu refermé');
      } else {
        verifier(await page.locator('#navLiens a[href="#programme"]').isVisible(), 'liens visibles');
      }
    });
    await etape('liste d\'attente quand le lien de paiement est vide', async () => {
      await page.locator('[data-attente="pro"]').click();
      verifier(await page.locator('#modaleAttente').isVisible(), 'modale ouverte');
      await page.locator('#formAttente button[type=submit]').click();
      verifier(/email valide/.test(await page.locator('#attenteMsg').innerText()), 'email exigé');
      await page.fill('#attenteEmail', `attente-${suffixe}@example.com`);
      await page.locator('#attenteConsent').check();
      await page.locator('#formAttente button[type=submit]').click();
      await page.locator('#attenteMsg.ok').waitFor();
      const f = await formulaires(page);
      verifier(f.some(x => x['form-name'] === 'liste-attente' && x.offre === 'pro' && x.email === `attente-${suffixe}@example.com`), 'soumission enregistrée');
      await page.keyboard.press('Escape');
    });
    tousLesErreurs.push(...erreurs);
    await ctx.close();
  }

  /* 2. Aimant à prospects */
  {
    const { ctx, page, erreurs } = await nouveauContexte(navigateur, largeur);
    await etape('aimant à prospects : consentement exigé, puis page du mini-guide', async () => {
      await page.goto(BASE + '/#module-gratuit', { waitUntil: 'networkidle' });
      await page.fill('#aimantPrenom', 'Ana');
      await page.fill('#aimantEmail', `ana-${suffixe}@example.com`);
      await page.locator('#formAimant button[type=submit]').click();
      verifier(/Cochez la case/.test(await page.locator('#aimantMsg').innerText()), 'consentement exigé');
      await page.locator('#aimantConsent').check();
      await Promise.all([page.waitForURL(/\/merci\/$/), page.locator('#formAimant button[type=submit]').click()]);
      verifier(/C'est noté, Ana/.test(await page.locator('h1').innerText()), 'prénom repris');
      verifier((await page.locator('.service').count()) === 7, '7 services du guide');
      const f = await formulaires(page);
      verifier(f.some(x => x['form-name'] === 'aimant' && x.email === `ana-${suffixe}@example.com` && x.consentement === 'oui'), 'inscription enregistrée avec consentement');
      await sansDebordement(page);
      await capture(page, `e2e-merci-${suffixe}`);
    });
    await etape('du mini-guide au module gratuit', async () => {
      await page.locator('a[href="../cours/#/module/m0"]').first().click();
      await page.waitForURL(/cours\/#\/module\/m0/);
      await page.locator('ol.lessons li').first().waitFor();
      verifier((await page.locator('ol.lessons li').count()) === 2, 'module 0 : 2 leçons');
    });
    tousLesErreurs.push(...erreurs);
    await ctx.close();
  }

  /* 3. Module gratuit : exercices, quiz, progression, certificat */
  {
    const { ctx, page, erreurs } = await nouveauContexte(navigateur, largeur);
    await etape('module gratuit : exercice corrigé, quiz et validation automatique', async () => {
      await page.goto(BASE + '/cours/#/lecon/m0/1', { waitUntil: 'networkidle' });
      await page.locator('.theorie').waitFor();
      await faireExercice(page);
      await faireQuiz(page, true);
      await page.locator('#doneBar.is-done').waitFor({ timeout: 4000 });
      verifier(/4\/4/.test(await page.locator('.quiz-score').innerText()), 'quiz corrigé à 4/4');
      await sansDebordement(page);
      await capture(page, `e2e-lecon-${suffixe}`);
    });
    await etape('progression : leçon 2 (checklist), certificat du module', async () => {
      await page.locator('#navSuiv').click();
      await page.waitForURL(/lecon\/m0\/2/);
      await page.locator('#exo .checklist').waitFor();
      await faireExercice(page);
      await faireQuiz(page);
      await page.locator('#doneBar.is-done').waitFor({ timeout: 4000 });
      await page.goto(BASE + '/cours/#/profil');
      await page.fill('#nom', 'Ana Martin');
      await page.locator('#nom').press('Tab');
      await page.goto(BASE + '/cours/#/certificat/m0');
      await page.locator('.certif').waitFor();
      verifier((await page.locator('.certif .name').innerText()) === 'Ana Martin', 'nom sur le certificat');
      verifier(/Module 0/.test(await page.locator('.certif-titre').innerText()), 'titre du certificat');
      verifier(/non affiliée à Anthropic/.test(await page.locator('.certif-note').innerText()), 'mention sur le certificat');
      await page.goto(BASE + '/cours/#/');
      verifier(/2<\/b> leçons? sur/.test(await page.locator('.dash-hero .lead').innerHTML()) || /2 leçons sur/.test(await page.locator('.dash-hero .lead').innerText()), 'tableau de bord : 2 leçons terminées');
      await sansDebordement(page);
      await capture(page, `e2e-certificat-${suffixe}`);
    });
    tousLesErreurs.push(...erreurs);
    await ctx.close();
  }

  /* 4. Accès payant */
  {
    const { ctx, page, erreurs } = await nouveauContexte(navigateur, largeur);
    await etape('contenu payant introuvable dans le dossier publié et protégé côté serveur', async () => {
      for (const u of ['/prive/modules/m4.mjs', '/prive/n8n/01-qualification-prospects.json', '/n8n/01-qualification-prospects.json', '/cours/content/m4.js', '/modules/m6.mjs']) {
        verifier((await page.request.get(BASE + u)).status() === 404, `${u} doit répondre 404`);
      }
      verifier((await page.request.get(BASE + '/.netlify/functions/content?module=m4')).status() === 401, 'contenu sans jeton : 401');
    });
    await etape('module verrouillé : refus d\'un code invalide, sans erreur console', async () => {
      await page.goto(BASE + '/cours/#/module/m4', { waitUntil: 'networkidle' });
      await page.locator('#unlock').waitFor();
      verifier((await page.locator('.theorie').count()) === 0, 'aucune leçon affichée');
      await page.fill('#unlock-cle', 'LEV-FAUX0-FAUX0-FAUX0');
      await page.locator('#unlock button[type=submit]').click();
      await page.locator('#unlock-msg.ko').waitFor();
      verifier(/non reconnu/.test(await page.locator('#unlock-msg').innerText()), 'message de refus');
      await capture(page, `e2e-refus-${suffixe}`);
    });
    await etape('offre Essentiel : modules 2 et 7 ouverts, module 4 toujours réservé à l\'offre Pro', async () => {
      await page.fill('#unlock-cle', CODE_ESS);
      await page.locator('#unlock button[type=submit]').click();
      await page.locator('.unlock', { hasText: 'Votre accès Essentiel est actif' }).waitFor();
      verifier(/offre Pro/.test(await page.locator('#unlockTitre').innerText()), 'M4 exige Pro');
      verifier(/Accès Essentiel/.test(await page.locator('#accesBtn').innerText()), 'badge Accès Essentiel');
      await page.goto(BASE + '/cours/#/lecon/m7/1');
      await page.locator('.theorie h2').first().waitFor();
      verifier(/Six modèles/.test(await page.locator('.theorie').innerText()), 'leçon M7 chargée');
    });
    await etape('code Pro valide : module 4 chargé depuis la fonction sécurisée', async () => {
      await page.goto(BASE + '/cours/#/acces');
      await page.fill('#accesForm-cle', CODE_PRO);
      await page.locator('#accesForm button[type=submit]').click();
      await page.waitForURL(/#\/$/);
      verifier(/Accès Pro/.test(await page.locator('#accesBtn').innerText()), 'badge Accès Pro');
      await page.goto(BASE + '/cours/#/lecon/m4/1');
      await page.locator('.theorie').waitFor();
      verifier(/Claude Code/.test(await page.locator('.theorie').innerText()), 'théorie M4');
      await page.goto(BASE + '/cours/#/lecon/m6/5');
      await page.locator('.theorie').waitFor();
      verifier(/npx hyperframes/.test(await page.locator('.theorie').innerText()), 'leçon M6 HyperFrames');
      verifier(await page.locator('details.script').count() === 1, 'script vidéo');
      await sansDebordement(page);
      await capture(page, `e2e-m6-${suffixe}`);
    });
    await etape('workflow n8n téléchargeable (JSON valide)', async () => {
      await page.goto(BASE + '/cours/#/lecon/m6/1');
      const bouton = page.locator('button.dl').first();
      await bouton.waitFor();
      const [dl] = await Promise.all([page.waitForEvent('download'), bouton.click()]);
      verifier(dl.suggestedFilename() === '06-chaine-video.json', 'nom du fichier');
      const wf = JSON.parse(await readFile(await dl.path(), 'utf8'));
      verifier(Array.isArray(wf.nodes) && wf.nodes.length >= 10, 'workflow complet');
    });
    await etape('bonus : 112 prompts, recherche et filtres', async () => {
      await page.goto(BASE + '/cours/#/prompts');
      await page.locator('.pcard').first().waitFor();
      verifier((await page.locator('.pcard').count()) === 112, '112 prompts');
      await page.fill('#pq', 'avis');
      const n = await page.locator('.pcard').count();
      verifier(n > 0 && n < 112, 'recherche filtrée');
      await page.fill('#pq', '');
      await page.locator('.chip', { hasText: 'Immobilier' }).click();
      verifier((await page.locator('.pcard').count()) === 7, 'filtre par métier');
      await page.goto(BASE + '/cours/#/ressources');
      await page.locator('details.modele').first().waitFor();
      verifier((await page.locator('details.modele').count()) >= 12, 'modèles');
      await sansDebordement(page);
    });
    await etape('recherche dans les leçons accessibles', async () => {
      await page.goto(BASE + '/cours/#/recherche?q=' + encodeURIComponent('HyperFrames'));
      await page.locator('.results li').first().waitFor();
      verifier(/M06/.test(await page.locator('.results').innerText()), 'résultat dans le module 6');
    });
    tousLesErreurs.push(...erreurs);
    await ctx.close();
  }

  /* 5. Activation après achat et pages légales */
  {
    const { ctx, page, erreurs } = await nouveauContexte(navigateur, largeur);
    await etape('page de confirmation d\'achat : activation et redirection', async () => {
      await page.goto(BASE + '/merci/achat.html?cle=' + encodeURIComponent(CODE_PRO), { waitUntil: 'networkidle' });
      verifier((await page.inputValue('#cle')) === CODE_PRO, 'clé pré-remplie');
      await Promise.all([page.waitForURL(/\/cours\/#\/$/), page.locator('#formActivation button').click()]);
      await page.locator('#accesBtn.actif').waitFor();
      await sansDebordement(page);
    });
    await etape('pages légales : informations à compléter signalées', async () => {
      for (const p of ['mentions-legales', 'cgv', 'confidentialite']) {
        await page.goto(`${BASE}/legal/${p}.html`, { waitUntil: 'networkidle' });
        verifier(await page.locator('.a-completer').count() > 0, `${p} : repères à compléter`);
        verifier(/non affiliée à Anthropic|Anthropic/.test(await page.locator('main').innerText()) || p === 'confidentialite', `${p} : mention`);
        await sansDebordement(page);
      }
      await page.goto(`${BASE}/legal/cgv.html`);
      verifier(/renonce expressément à son droit de rétractation/.test(await page.locator('main').innerText()), 'renonciation au droit de rétractation');
      verifier((await page.locator('#tableOffres tbody tr').count()) === 3, 'offres dans les CGV');
    });
    tousLesErreurs.push(...erreurs);
    await ctx.close();
  }

  await etape('aucune erreur dans la console', async () => {
    verifier(tousLesErreurs.length === 0, tousLesErreurs.join('\n      '));
  });
}

const serveur = await demarrerServeur();
let navigateur;
try {
  if (CAPTURES) await mkdir(CAPTURES, { recursive: true });
  navigateur = await chromium.launch();
  await scenarios(navigateur, 1440);
  await scenarios(navigateur, 390);
} finally {
  await navigateur?.close();
  serveur.kill();
}
console.log(`\n${reussis} étape(s) réussie(s), ${echecs} échec(s).`);
process.exit(echecs ? 1 : 0);
