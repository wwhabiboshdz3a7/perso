// Tests du contenu (node --test) : structure des modules, exercices, bonus, workflows n8n,
// page de vente à jour et absence de contenu payant dans le dossier publié.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { verifierTout, verifierLecon, verifierWorkflow, racine } from '../outils/verifier-contenu.mjs';
import { mettreAJour } from '../outils/generer-programme.mjs';
import { modules, fichiers, totalLecons } from '../public/cours/content/catalogue.js';

const lireJson = async f => JSON.parse(await readFile(path.join(racine, f), 'utf8'));

describe('vérification globale du contenu', () => {
  test('aucun problème détecté (leçons, exercices, bonus, workflows, dossier publié)', async () => {
    const r = await verifierTout();
    assert.deepEqual(r.erreurs, []);
    assert.equal(r.lecons, totalLecons);
    assert.ok(r.prompts >= 100);
    assert.equal(r.workflows, Object.keys(fichiers).length);
    assert.ok(r.extraits > 150, 'assez d\'extraits payants recherchés');
  });
  test('le vérificateur détecte une leçon incomplète et un exemple de réponse incohérent', () => {
    const e = verifierLecon({
      titre: 'Test', theorie: '<p>trop court</p>', objectifs: ['a'], pas: [],
      exercice: { type: 'texte', enonce: 'x', criteres: [{ label: 'Contient « devis »', motif: 'devis', drapeaux: 'i' }, { label: 'Au moins 5 mots', minMots: 5 }], solution: '<p>rien</p>' },
      quiz: [{ q: 'Q', options: ['a', 'b', 'c'], bonne: 5, explication: 'x' }]
    }, 'test');
    assert.ok(e.some(x => /théorie trop courte/.test(x)));
    assert.ok(e.some(x => /ne valide pas le critère « Contient « devis » »/.test(x)));
    assert.ok(e.some(x => /quiz de moins de 3/.test(x)));
    assert.ok(e.some(x => /hors limites/.test(x)));
    assert.ok(e.some(x => /script vidéo incomplet/.test(x)));
  });
});

describe('catalogue et modules', () => {
  test('9 modules de M0 à M8, dont M0 et M1 gratuits', () => {
    assert.deepEqual(modules.map(m => m.id), ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8']);
    assert.deepEqual(modules.filter(m => m.offre === 'gratuit').map(m => m.id), ['m0', 'm1']);
  });
  test('les modules gratuits sont publiés, les payants restent dans prive/', () => {
    for (const m of modules) {
      const pub = existsSync(path.join(racine, 'public', 'cours', 'content', `${m.id}.js`));
      const priv = existsSync(path.join(racine, 'prive', 'modules', `${m.id}.mjs`));
      if (m.offre === 'gratuit') assert.ok(pub && !priv, m.id);
      else assert.ok(priv && !pub, m.id);
    }
    assert.ok(!existsSync(path.join(racine, 'public', 'prive')));
    assert.ok(!existsSync(path.join(racine, 'public', 'n8n')));
  });
  test('le module 6 (vidéo) couvre toute la chaîne et le légal', () => {
    const titres = modules.find(m => m.id === 'm6').lecons.join(' | ');
    for (const mot of ['ElevenLabs', 'HyperFrames', 'Remotion', 'CapCut', 'Sous-titres', 'Publication', 'MCP', 'faceless', 'AI Act']) assert.match(titres, new RegExp(mot), mot);
  });
  test('la page de vente affiche le programme et les chiffres à jour', async () => {
    const html = await readFile(path.join(racine, 'public', 'index.html'), 'utf8');
    assert.equal(mettreAJour(html), html, 'lancez node outils/generer-programme.mjs');
    for (const m of modules) assert.ok(html.includes(m.titre.replace(/'/g, '\'')), m.titre);
  });
});

describe('quiz et QCM : aucune réponse devinable à sa position ou à sa longueur', () => {
  const charger = async m => (await import(pathToFileURL(path.join(racine, m.offre === 'gratuit' ? `public/cours/content/${m.id}.js` : `prive/modules/${m.id}.mjs`)).href)).default;
  let questions = [], qcm = [];
  test('lecture des 9 modules', async () => {
    for (const m of modules) {
      const d = await charger(m);
      for (const l of d.lecons) {
        questions.push(...(l.quiz || []));
        if (l.exercice?.type === 'qcm') qcm.push(l.exercice);
      }
    }
    assert.ok(questions.length >= 200);
  });
  test('bonnes réponses réparties : aucune position ne dépasse 40 %', () => {
    const pos = {};
    for (const q of questions) pos[q.bonne] = (pos[q.bonne] || 0) + 1;
    for (const [i, n] of Object.entries(pos)) assert.ok(n / questions.length <= 0.4, `position ${i} : ${n}/${questions.length}`);
    const uniques = qcm.filter(e => !Array.isArray(e.bonne)).map(e => e.bonne);
    const posQcm = {};
    for (const b of uniques) posQcm[b] = (posQcm[b] || 0) + 1;
    for (const [i, n] of Object.entries(posQcm)) assert.ok(n / uniques.length <= 0.4, `QCM, position ${i} : ${n}/${uniques.length}`);
  });
  test('longueurs comparables : la bonne réponse n\'est jamais nettement la plus longue', () => {
    let plusLongue = 0;
    const ecarts = [];
    for (const q of [...questions, ...qcm.filter(e => !Array.isArray(e.bonne))]) {
      const L = q.options.map(o => o.length);
      const leurres = L.filter((_, i) => i !== q.bonne);
      if (L[q.bonne] > Math.max(...leurres)) plusLongue++;
      if (L[q.bonne] > 1.3 * Math.max(...leurres)) ecarts.push(q.q || q.options[q.bonne]);
    }
    assert.deepEqual(ecarts, [], 'bonne réponse plus de 1,3 fois plus longue que tous les leurres');
    assert.ok(plusLongue / questions.length < 0.5, `bonne réponse la plus longue dans ${plusLongue} cas`);
  });
  test('options distinctes, quatre par question, explication fournie', () => {
    for (const q of questions) {
      assert.equal(new Set(q.options).size, q.options.length, q.q);
      assert.equal(q.options.length, 4, q.q);
      assert.ok(q.explication, q.q);
    }
  });
});

describe('workflows n8n', () => {
  test('six exports valides, importables (structure, connexions, code)', async () => {
    const noms = Object.keys(fichiers);
    assert.equal(noms.length, 6);
    for (const f of noms) {
      const wf = await lireJson(path.join('prive', f));
      assert.deepEqual(verifierWorkflow(wf, f), []);
      assert.equal(wf.active, false, 'importé désactivé');
      assert.ok(wf.nodes.some(n => n.type === 'n8n-nodes-base.stickyNote'), 'note « Mode d\'emploi »');
      const claude = wf.nodes.find(n => n.name === 'Claude');
      assert.equal(claude.parameters.url, 'https://api.anthropic.com/v1/messages');
      assert.equal(claude.parameters.authentication, 'genericCredentialType');
    }
  });

  // Mini environnement d'exécution des nœuds « Code » (mode « tous les éléments »).
  const executer = (wf, nom, entrees, sorties = {}) => {
    const n = wf.nodes.find(x => x.name === nom);
    const fn = new Function('$', '$input', n.parameters.jsCode);
    const noeud = k => {
      const items = sorties[k] || [];
      return { first: () => items[0], all: () => items, item: items[0] };
    };
    return fn(noeud, { all: () => entrees, first: () => entrees[0] });
  };

  test('chaîne vidéo : requête structurée, découpage par vidéo, SRT et plan de montage', async () => {
    const wf = await lireJson('prive/n8n/06-chaine-video.json');
    const params = [{ json: { marque: 'Chaîne test', niche: 'astuces', public: 'commerçants', ton: 'direct', piliers: 'astuce', nb_videos: 2, duree_secondes: 40, modele: 'claude-opus-5-5', modele_voix: 'eleven_multilingual_v2', voice_id: 'v1' } }];
    const [req] = executer(wf, 'Préparer la requête', params, { 'Paramètres': params });
    assert.equal(req.json.requete.model, 'claude-opus-5-5');
    assert.equal(req.json.requete.output_config.format.type, 'json_schema');
    assert.match(req.json.requete.system, /96 mots/);

    const videos = { videos: [1, 2].map(i => ({
      titre: `Relancer un devis ${i}`, pilier: 'astuce', accroche: 'Ton devis dort ?', narration: 'Ton devis dort ? Relance-le.',
      scenes: [{ visuel: 'desk, soft light', texte_ecran: 'Devis', poids: 1 }, { visuel: 'phone', texte_ecran: '', poids: 3 }],
      legende: 'Relance', hashtags: ['commerce', '#astuce'], mention_ia: i === 1
    })) };
    const reponse = [{ json: { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(videos) }] } }];
    const items = executer(wf, 'Un item par vidéo', reponse);
    assert.equal(items.length, 2);
    assert.match(items[0].json.nom_fichier, /^\d{4}-\d{2}-\d{2}-1-relancer-un-devis-1$/);

    // Alignement ElevenLabs simulé : « Ton devis dort ? Relance-le. »
    const phrase = 'Ton devis dort ? Relance-le.';
    const debut = [...phrase].map((_, i) => i * 0.1), fin = debut.map(t => t + 0.1);
    const voix = items.map(() => ({ json: { audio_base64: 'QUJD', alignment: { characters: [...phrase], character_start_times_seconds: debut, character_end_times_seconds: fin } } }));
    const sortie = executer(wf, 'Sous-titres et plan de montage', voix, { 'Un item par vidéo': items });
    assert.equal(sortie.length, 2);
    const html = sortie[0].json.html;
    assert.match(html, /1\n00:00:00,000 --&gt; 00:00:01,600\nTon devis dort\u00a0\?\n\n2\n00:00:01,700 --&gt; 00:00:02,800\nRelance-le\./);
    assert.match(html, /"duree": 2\.8/);
    assert.equal(sortie[0].json.mention_ia, 'oui');
    assert.equal(sortie[0].json.statut, 'à monter');
    const ligne = executer(wf, 'Ligne du calendrier', sortie);
    assert.equal(ligne[0].json.audio_base64, undefined, 'pas d\'audio dans le tableur');
    assert.equal(ligne[0].json.html, undefined);
  });

  test('qualification de prospects : robot ignoré, données minimisées, réponse lue', async () => {
    const wf = await lireJson('prive/n8n/01-qualification-prospects.json');
    const params = [{ json: { entreprise: 'Test', offre: 'Sites', cible: 'TPE', budget_minimum: '500 €', modele: 'claude-opus-5-5' } }];
    const formulaire = [
      { json: { body: { nom: 'Ana', email: 'ana@example.com', telephone: '0600000000', entreprise: 'Boulangerie', message: 'Je veux un site', budget: '1000 €' } } },
      { json: { body: { message: 'spam', site_web: 'http://robot' } } }
    ];
    const reqs = executer(wf, 'Préparer la requête', formulaire, { 'Paramètres': params, 'Formulaire du site': formulaire });
    assert.equal(reqs.length, 1);
    const contenu = JSON.stringify(reqs[0].json.requete.messages);
    assert.ok(!contenu.includes('ana@example.com') && !contenu.includes('0600000000'), 'email et téléphone non envoyés');
    const rep = [{ json: { stop_reason: 'end_turn', model: 'claude-opus-5-5', usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'text', text: JSON.stringify({ score: 80, categorie: 'chaud', besoin: 'site', urgence: 'haute', points_a_clarifier: ['délai'], prochaine_action: 'appel', brouillon_reponse: 'Bonjour' }) }] } }];
    const lu = executer(wf, 'Lire la réponse', rep, { 'Préparer la requête': reqs });
    assert.equal(lu[0].json.score, 80);
    assert.equal(lu[0].json.email, 'ana@example.com');
    assert.throws(() => executer(wf, 'Lire la réponse', [{ json: { stop_reason: 'refusal', content: [] } }], { 'Préparer la requête': reqs }), /refusée/);
  });
});
