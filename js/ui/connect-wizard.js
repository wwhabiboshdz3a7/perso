// Assistant « Choisir le cerveau de Nour » : où réfléchit le modèle ?
//   1. Cloud open source (recommandé) : Groq, OpenRouter, Hugging Face, Cerebras, Together, Mistral, DeepInfra.
//   2. Serveur Netlify : la clé reste côté serveur, accès par mot de passe (guide + générateur intégrés).
//   3. Avancé : local (Ollama, LM Studio) ou URL personnalisée.
// Rien n'est enregistré avant « Utiliser… » : le test se fait avec une connexion candidate.

import { esc, icon, $, $$, copyText, formatTime, formatDateTime } from '../util.js';
import { settings, preset } from '../settings.js';
import { keystore } from '../keystore.js';
import {
  CLOUD_PROVIDERS, LOCAL_PROVIDERS, providerById, recommendedModels, openModels, pickDefaultModel,
  cleanKey, keyOwner, suggestionLabels, localCorsHelp,
} from '../providers.js';
import { browserConnection, listModels, probeServer, probeReachable, serverLogin, session, authState, redact, ApiError } from '../client.js';
import {
  hashAccessPassword, randomTokenSecret, generatePassphrase, passwordStrength, serverVariables, envBlock,
  setupAvailable, MIN_PASSWORD,
} from '../server-setup.js';
import { openDialog, toast } from './dialogs.js';
import { mountModelPicker } from './model-picker.js';
import { formatWait } from './errors.js';

/* ---------- Détection du serveur (mise en cache pour l'accueil) ---------- */
let serverCache = null;
let serverPending = null;

/** État de la fonction Netlify sur ce site : 'ready' | 'incomplete' | 'absent' | 'unknown'. */
export function detectServer({ force = false } = {}) {
  if (serverCache && !force) return Promise.resolve(serverCache);
  if (serverPending && !force) return serverPending;
  serverPending = probeServer().then((s) => { serverCache = s; serverPending = null; return s; });
  return serverPending;
}
export const serverState = () => serverCache;

const host = (url) => { try { return new URL(url).host; } catch { return String(url || ''); } };
const shortModel = (id) => String(id || '').split('/').pop();

function formatExpiry(ts) {
  const day = (x) => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diff = Math.round((day(ts) - day(Date.now())) / 86400000);
  if (diff === 0) return `aujourd’hui à ${formatTime(ts)}`;
  if (diff === 1) return `demain à ${formatTime(ts)}`;
  return `le ${formatDateTime(ts)}`;
}

/* =====================================================================
   Les trois choix (accueil et première étape de l'assistant)
   ===================================================================== */
export function brainChoicesHTML({ server = null } = {}) {
  const s = server ? server.state : 'checking';
  const srvBadge = s === 'ready' ? '<span class="brain-badge ok">Détecté sur ce site</span>'
    : s === 'incomplete' ? '<span class="brain-badge warn">À terminer</span>'
      : '<span class="brain-badge">Idéal sur téléphone</span>';
  const srvCta = s === 'ready' ? 'Se connecter avec le mot de passe' : s === 'incomplete' ? 'Terminer la configuration' : 'Configurer pas à pas';
  return `<div class="brain${s === 'ready' ? ' has-detected' : ''}">
    ${s === 'ready' ? `<button type="button" class="brain-detected" data-connect="serveur">
      <span class="brain-detected-ico">${icon('shield')}</span>
      <span class="brain-detected-text"><b>Votre serveur Nour est prêt sur ce site</b><small>La clé reste cachée sur Netlify : connectez-vous simplement avec votre mot de passe.</small></span>
      <span class="brain-detected-go">Se connecter${icon('arrow-right')}</span>
    </button>` : ''}
    <div class="brain-grid">
      <button type="button" class="brain-card reco" data-connect="cloud">
        <span class="brain-top"><span class="brain-ico">${icon('cloud')}</span><span class="brain-badge reco">Recommandé</span></span>
        <span class="brain-title">Cloud open source</span>
        <span class="brain-text">Llama, Qwen, gpt-oss, Kimi, Mistral… hébergés sur des serveurs ultra-rapides. Rien ne tourne sur votre ordinateur.</span>
        <span class="brain-points"><span>Prêt en 3 minutes</span><span>Offres gratuites (limitées)</span><span>Clé gardée dans ce navigateur</span></span>
        <span class="brain-cta">Choisir un fournisseur${icon('arrow-right')}</span>
      </button>
      <button type="button" class="brain-card" data-connect="serveur">
        <span class="brain-top"><span class="brain-ico">${icon('server')}</span>${srvBadge}</span>
        <span class="brain-title">Mon serveur Netlify</span>
        <span class="brain-text">La clé reste cachée côté serveur, derrière un mot de passe. Le même Nour sur l’ordinateur et le téléphone.</span>
        <span class="brain-points"><span>Clé jamais dans le navigateur</span><span>Un mot de passe, tous vos appareils</span><span>Guide et générateur intégrés</span></span>
        <span class="brain-cta">${srvCta}${icon('arrow-right')}</span>
      </button>
    </div>
    <details class="brain-adv">
      <summary>${icon('chevron-down')}Avancé : faire tourner le modèle sur cet ordinateur</summary>
      <button type="button" class="brain-local" data-connect="local">
        <span class="brain-ico sm">${icon('laptop')}</span>
        <span class="brain-local-text"><b>Local — Ollama, LM Studio ou URL personnalisée</b><small>Le modèle tourne sur votre PC : machine puissante, plusieurs Go à télécharger, et seulement depuis cet appareil.</small></span>
        ${icon('arrow-right')}
      </button>
    </details>
  </div>`;
}

/** Comparatif des trois façons de brancher Nour. */
function compareHTML() {
  const rows = [
    ['Mise en route', '3 minutes : une clé', '10 minutes : variables Netlify', 'Installer, télécharger un modèle'],
    ['Coût', 'Gratuit (limité) ou quelques centimes', 'Celui du fournisseur choisi', 'Gratuit, mais votre matériel travaille'],
    ['Où est la clé', 'Dans ce navigateur (chiffrable)', 'Sur Netlify, jamais dans le navigateur', 'Aucune clé'],
    ['Votre ordinateur', 'Ne calcule rien', 'Ne calcule rien', 'Fait tout le calcul'],
    ['Sur le téléphone', 'Oui (clé à saisir)', 'Oui, avec le mot de passe', 'Non'],
  ];
  return `<div class="cw-compare-wrap"><table class="cw-compare">
    <caption>Comparer en un coup d’œil</caption>
    <thead><tr><th scope="col"><span class="sr-only">Critère</span></th><th scope="col" class="is-reco">Cloud open source</th><th scope="col">Serveur Netlify</th><th scope="col">Local (avancé)</th></tr></thead>
    <tbody>${rows.map(([k, ...v]) => `<tr><th scope="row">${esc(k)}</th>${v.map((x, i) => `<td${i === 0 ? ' class="is-reco"' : ''}>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

/* =====================================================================
   Boîte de dialogue
   ===================================================================== */
const STEPS = {
  choix: { sub: 'Le « cerveau », c’est le modèle d’IA qui répond. Où doit-il réfléchir ?' },
  cloud: { sub: 'Cloud open source · un fournisseur, une clé, un modèle' },
  serveur: { sub: 'Serveur Netlify · la clé reste côté serveur' },
  local: { sub: 'Avancé · le modèle tourne sur cet ordinateur' },
};

export function openConnectWizard(app, { step = 'choix', provider = null } = {}) {
  const conn = settings.get().connection;
  const cur = providerById(conn.provider);
  const st = {
    step: STEPS[step] ? step : 'choix',
    cloudId: provider && providerById(provider).cloud ? provider
      : (cur.cloud && conn.mode === 'browser' ? cur.id : (preset.provider || 'groq')),
    localId: provider && !providerById(provider).cloud ? provider : (!cur.cloud ? cur.id : 'ollama'),
    keys: {}, bases: {}, models: {}, chosen: {}, tested: {}, diag: {},
    // Choix « gratuits uniquement » déjà fait sur OpenRouter, sinon préréglage (config.js), sinon oui.
    freeOnly: conn.mode === 'browser' && conn.provider === 'openrouter' && settings.get().onboarded ? !!conn.freeOnly : (preset.freeOnly ?? true),
    server: serverState(),
    serverModels: null,
    serverModel: conn.serverModel || preset.serverModel || '',
    srvProvider: preset.provider || 'groq',
    generated: null,
    busy: false,
  };
  // Clé et adresse déjà enregistrées : reprises telles quelles.
  if (!keystore.isLocked()) for (const p of [...CLOUD_PROVIDERS, ...LOCAL_PROVIDERS]) { const k = keystore.get(p.id); if (k) st.keys[p.id] = k; }
  if (conn.mode === 'browser' && conn.baseUrl) st.bases[cur.id] = conn.baseUrl;
  if (conn.mode === 'browser' && conn.model) st.chosen[cur.id] = conn.model;

  const d = openDialog({
    id: 'dlg-connect', size: 'xl', title: 'Choisir le cerveau de Nour',
    sub: '<span data-cw-sub></span>',
    body: '<div class="cw" data-cw></div>',
    foot: `<button class="btn btn-ghost" type="button" data-cw-back>${icon('arrow-left')}Retour</button>
      <span class="spacer"></span>
      <span class="cw-foot-note" data-cw-note></span>
      <button class="btn btn-primary" type="button" data-cw-finish disabled></button>`,
  });
  const root = $('[data-cw]', d);
  const body = $('.modal-body', d);
  const finishBtn = $('[data-cw-finish]', d);
  const backBtn = $('[data-cw-back]', d);
  const note = $('[data-cw-note]', d);

  const current = () => providerById(st.step === 'local' ? st.localId : st.cloudId);

  function go(step, { focus = true } = {}) {
    st.step = step;
    render();
    body.scrollTop = 0;
    if (!focus) return;
    requestAnimationFrame(() => {
      // Écran tactile : pas de clavier virtuel d'office, on reste en haut de l'étape.
      if (matchMedia('(pointer: coarse)').matches && step !== 'choix') {
        ($('[data-cw-prov][aria-pressed="true"]', root) || $('[data-cw-srv-status]', root) || $('h2', d))?.focus?.({ preventScroll: true });
        return;
      }
      const target = step === 'choix' ? $('[data-connect="cloud"]', root)
        : step === 'serveur' ? ($('#cw-pass', root) || $('[data-cw-srv-status] [data-cw-recheck]', root) || $('[data-cw-finish]:not(:disabled)', d))
          : ($('#cw-base:not([readonly])', root) || $('#cw-key', root));
      target?.focus({ preventScroll: true });
      if (target && step !== 'choix') target.scrollIntoView({ block: 'nearest' });
    });
  }

  function render() {
    $('[data-cw-sub]', d).textContent = STEPS[st.step].sub;
    backBtn.hidden = st.step === 'choix';
    d.dataset.step = st.step;
    if (st.step === 'choix') drawChoices();
    else if (st.step === 'serveur') drawServer();
    else drawProviders();
    updateFoot();
  }

  /* ---------- Pied de fenêtre ---------- */
  function updateFoot() {
    finishBtn.hidden = st.step === 'choix';
    note.textContent = '';
    if (st.step === 'choix') { note.textContent = 'Rien n’est enregistré tant que vous n’avez pas validé.'; return; }
    if (st.step === 'serveur') {
      const ready = st.server && st.server.state === 'ready';
      const ok = ready && !!session.get();
      finishBtn.hidden = !ready;
      finishBtn.disabled = !ok;
      finishBtn.innerHTML = ok ? `${icon('check')}Utiliser mon serveur` : 'Connexion requise';
      note.textContent = ready ? (ok ? '' : 'La clé ne quitte jamais le serveur.') : 'Après le redéploiement, Nour détectera votre serveur ici.';
      return;
    }
    const p = current();
    const model = st.chosen[p.id];
    const ready = st.tested[p.id] && !!model;
    finishBtn.disabled = !ready;
    finishBtn.innerHTML = ready ? `${icon('check')}Utiliser ${esc(p.name)} · ${esc(shortModel(model))}` : 'Testez la connexion';
    note.textContent = ready && !p.local && !p.custom ? 'La clé reste dans ce navigateur.' : '';
  }

  /* ---------- Étape 1 : les trois choix ---------- */
  function drawChoices() {
    root.innerHTML = `<div class="cw-choices">${brainChoicesHTML({ server: st.server })}
      ${compareHTML()}
      <p class="cw-choices-foot">${icon('info')}<span>Vous pourrez changer de cerveau à tout moment : <b>Réglages → Connexion</b>. Vos conversations restent sur cet appareil quel que soit le choix.</span></p></div>`;
    if (!st.server) refreshServer().then(() => { if (d.open && st.step === 'choix') drawChoices(); });
  }

  async function refreshServer(force = false) {
    st.server = await detectServer({ force });
    return st.server;
  }

  /* ---------- Étape 2 : fournisseurs (cloud ou local) ---------- */
  function drawProviders() {
    const local = st.step === 'local';
    const list = local ? LOCAL_PROVIDERS : CLOUD_PROVIDERS;
    const sel = current();
    root.innerHTML = `
      ${local ? `<div class="notice warn cw-local-warn">${icon('laptop')}<div><p><b>Le modèle tournera sur cet ordinateur.</b> Processeur ou carte graphique très sollicités, plusieurs Go à télécharger, et Nour ne répond que sur cet appareil, tant qu’il est allumé.</p><p>Pour éviter de faire travailler votre PC : <button type="button" class="link-btn" data-go="cloud">choisissez le cloud open source</button>.</p></div></div>` : ''}
      <div class="cw-split">
        <div class="cw-side">
          <p class="cw-side-title">${local ? 'Sur cet ordinateur ou ailleurs' : 'Fournisseurs cloud · modèles ouverts'}</p>
          <div class="cw-list" role="group" aria-label="${local ? 'Serveurs locaux' : 'Fournisseurs cloud'}">
            ${list.map((p) => `<button type="button" class="cw-prov" data-cw-prov="${p.id}" aria-pressed="${p.id === sel.id}">
              <span class="cw-prov-row"><b>${esc(p.name)}</b>${p.price ? `<span class="price ${p.price.kind}">${esc(p.price.label)}</span>` : (p.tag ? `<span class="price local">${esc(p.tag)}</span>` : '')}</span>
              <span class="cw-prov-pitch">${esc(p.pitch || p.blurb)}</span>
              ${st.tested[p.id] ? `<span class="cw-prov-ok">${icon('check')}Connexion testée</span>` : ''}
            </button>`).join('')}
          </div>
          ${local ? '' : '<p class="hint cw-side-note">Offres gratuites : au moment de l’écriture, à vérifier chez chaque fournisseur. Elles changent souvent.</p>'}
        </div>
        <div class="cw-detail" data-cw-detail aria-live="off"></div>
      </div>`;
    drawDetail();
  }

  function drawDetail() {
    const p = current();
    const box = $('[data-cw-detail]', root);
    const needsBase = !!(p.local || p.custom);
    const base = st.bases[p.id] ?? p.baseUrl;
    const tested = !!st.tested[p.id];
    box.innerHTML = `
      <header class="cw-head">
        <div class="cw-head-text">
          <h3>${esc(p.name)}</h3>
          <p class="cw-what">${esc(p.what || p.blurb)}</p>
        </div>
        ${p.price ? `<span class="price big ${p.price.kind}">${icon(p.price.kind === 'paid' ? 'bolt' : 'gift')}${esc(p.price.label)}</span>` : ''}
      </header>
      ${p.price ? `<p class="cw-price-note">${icon('info')}<span>${esc(p.price.note)}</span></p>` : ''}
      ${p.local ? `<p class="cw-price-note">${icon('info')}<span>${localCorsHelp(p)}</span></p>` : ''}
      <div class="cw-sugg" ${tested ? 'hidden' : ''}><span class="cw-label">Modèles ouverts conseillés</span>
        <span class="cw-sugg-list">${suggestionLabels(p).map((l) => `<span class="chip static">${esc(l)}</span>`).join('')}</span>
        <span class="hint">Identifiants confirmés par le test, dans la liste en direct du fournisseur.</span></div>
      <ol class="cw-steps">
        <li>
          <b class="cw-step-title">${p.local ? 'Installer et lancer' : p.custom ? 'Votre serveur' : p.price && p.price.kind !== 'paid' ? 'Créer une clé (sans frais)' : 'Créer une clé'}</b>
          <p class="hint">${esc(p.steps || '')}</p>
          ${p.keyUrl ? `<p><a class="btn btn-sm" href="${esc(p.keyUrl)}" target="_blank" rel="noopener noreferrer">${p.local ? 'Télécharger' : 'Ouvrir la page des clés'}${icon('external')}</a></p>` : ''}
        </li>
        ${needsBase ? `<li>
          <label class="cw-step-title" for="cw-base">Adresse de l’API</label>
          <input type="url" id="cw-base" class="input mono" value="${esc(base)}" placeholder="https://mon-serveur.exemple/v1" spellcheck="false" autocomplete="off">
          <p class="hint">Point d’accès compatible OpenAI, terminé en général par <code>/v1</code>.${p.custom ? ' Fonctionne avec vLLM, llama.cpp, ou un modèle ouvert hébergé sur un GPU cloud.' : ''}</p>
        </li>` : ''}
        <li>
          <label class="cw-step-title" for="cw-key">${p.keyOptional ? 'Clé API <span class="hint-inline">(facultative)</span>' : 'Coller la clé'}</label>
          <div class="input-wrap">
            <input type="password" id="cw-key" class="input mono" value="${esc(st.keys[p.id] || '')}" placeholder="${p.keyOptional ? 'Laissez vide si le serveur n’en demande pas' : 'Collez votre clé ici'}" autocomplete="off" spellcheck="false" ${keystore.isLocked() ? 'disabled' : ''}>
            <button type="button" class="reveal" data-cw-reveal aria-label="Afficher la clé" aria-pressed="false">${icon('eye')}</button>
          </div>
          ${keystore.isLocked() ? `<p class="hint">Vos clés sont chiffrées : <button type="button" class="link-btn" data-cw-unlock>déverrouillez le coffre</button> pour en saisir une.</p>` : `<p class="hint">${p.keyHint ? `${esc(p.keyHint)} ` : ''}Elle reste dans ce navigateur et n’est envoyée qu’à ${esc(p.name)}.</p>`}
          <div class="cw-keywarn" data-cw-keywarn hidden></div>
        </li>
        <li>
          <span class="cw-step-title">Tester la connexion</span>
          <div class="cw-test-row"><button type="button" class="btn btn-primary" data-cw-test>${icon('bolt')}Tester la connexion</button><span class="hint" data-cw-host>${esc(host(base) || '')}</span></div>
          <div class="cw-diag" data-cw-diag role="status" aria-live="polite"></div>
        </li>
        <li data-cw-models-step ${tested ? '' : 'hidden'}>
          <span class="cw-step-title">Choisir le modèle</span>
          ${p.freeFilter ? `<label class="check cw-free"><input type="checkbox" data-cw-free ${st.freeOnly ? 'checked' : ''}><span>Modèles gratuits uniquement</span></label>` : ''}
          <div class="cw-reco" role="radiogroup" aria-label="Modèles conseillés" data-cw-reco></div>
          <details class="cw-all"><summary>${icon('chevron-down')}<span>Tous les modèles ouverts disponibles (<span data-cw-count>0</span>)</span></summary><div data-cw-picker></div></details>
        </li>
      </ol>`;
    if (st.diag[p.id]) showDiag(st.diag[p.id]);
    if (tested) drawModels();
    checkKey();
  }

  /* ---------- Diagnostic du test ---------- */
  function showDiag(info) {
    st.diag[current().id] = info;
    const el = $('[data-cw-diag]', root);
    if (!el) return;
    el.dataset.kind = info.kind;
    el.innerHTML = `${info.kind === 'loading' ? '<span class="cw-spin" aria-hidden="true"></span>' : icon(info.kind === 'ok' ? 'check' : info.kind === 'warn' ? 'info' : 'alert')}
      <div><b>${esc(info.title)}</b>${info.text ? `<p>${esc(info.text)}</p>` : ''}${info.detail ? `<p class="cw-diag-detail">${esc(info.detail)}</p>` : ''}
      ${info.actions?.length ? `<p class="cw-diag-actions">${info.actions.map((a) => (a.href
    ? `<a class="btn btn-sm" href="${esc(a.href)}" target="_blank" rel="noopener noreferrer">${esc(a.label)}${icon('external')}</a>`
    : `<button type="button" class="btn btn-sm" data-go="${esc(a.go)}">${esc(a.label)}</button>`)).join('')}</p>` : ''}</div>`;
  }

  function diagnose(err, p, base) {
    const where = host(base) || p.name;
    const kind = err && err.kind;
    const detail = err && err.detail && err.detail !== base ? redact(err.detail, [st.keys[p.id]]) : '';
    const local = p.local || p.custom;
    switch (kind) {
      case 'auth':
        return { kind: 'error', title: `Clé refusée (erreur ${err.status || 401})`, text: `${p.name} ne reconnaît pas cette clé. Vérifiez qu’elle est complète, toujours active et créée chez ${p.name}.${p.keyHint ? ` ${p.keyHint}` : ''}`, detail, actions: p.keyUrl && !local ? [{ label: 'Créer une nouvelle clé', href: p.keyUrl }] : [] };
      case 'payment':
        return { kind: 'error', title: 'Crédit insuffisant (erreur 402)', text: `La clé est valide, mais ${p.name} demande du crédit. Choisissez un fournisseur avec offre gratuite, ou ajoutez du crédit.`, detail };
      case 'quota':
        return { kind: 'warn', title: 'Quota atteint (erreur 429)', text: `La clé fonctionne, mais la limite de l’offre est atteinte.${err.retryAfter ? ` Réessayez dans ${formatWait(err.retryAfter)}.` : ' Patientez un peu avant de réessayer.'} Un autre fournisseur gratuit peut prendre le relais.`, detail };
      case 'cors':
        if (p.local) return { kind: 'error', title: 'Le serveur local refuse ce site (CORS)', text: `${where} répond, mais n’autorise pas les appels venant de ce site. ${localCorsHelp(p).replace(/<[^>]+>/g, '')}`.trim() };
        if (p.custom) return { kind: 'error', title: 'Appels depuis ce site refusés (CORS)', text: `${where} répond, mais n’autorise pas les appels venant de ce site. Autorisez son origine (${location.origin}) dans la configuration CORS du serveur, ou passez par votre serveur Netlify.`, actions: [{ label: 'Configurer le serveur Netlify', go: 'serveur' }] };
        return { kind: 'error', title: 'Appels directs refusés (CORS)', text: `${where} répond, mais refuse les appels venant d’un navigateur. Passez par votre serveur Netlify : il garde la clé et appelle ${p.name} à votre place.`, actions: [{ label: 'Configurer le serveur Netlify', go: 'serveur' }] };
      case 'network':
        return local
          ? { kind: 'error', title: 'Rien ne répond à cette adresse', text: `Impossible de joindre ${where}. ${p.custom ? 'Vérifiez l’adresse et que le serveur est démarré.' : `${p.name} est-il lancé sur cet ordinateur ?`}` }
          : { kind: 'error', title: 'Fournisseur injoignable', text: `Impossible de joindre ${where}. Vérifiez votre connexion Internet ; un bloqueur de publicités, un VPN ou un pare-feu d’entreprise peut aussi bloquer cette adresse.` };
      case 'offline':
        return { kind: 'error', title: 'Vous êtes hors ligne', text: 'Le test demande une connexion Internet.' };
      case 'timeout':
        return { kind: 'error', title: 'Pas de réponse', text: `${where} ne répond pas (délai dépassé). Réessayez dans un instant.` };
      case 'notfound':
        return { kind: 'error', title: 'Adresse introuvable (erreur 404)', text: 'Cette adresse ne mène pas à une API compatible OpenAI. Elle finit généralement par /v1.', detail };
      case 'server':
        return { kind: 'error', title: `Le fournisseur rencontre un problème (erreur ${err.status || 500})`, text: 'Ce n’est pas votre clé : réessayez dans un instant ou choisissez un autre fournisseur.', detail };
      case 'bad-response':
        return { kind: 'error', title: 'Réponse illisible', text: 'Ce serveur ne renvoie pas une liste de modèles au format OpenAI. Vérifiez l’adresse.' };
      case 'nokey':
        return { kind: 'error', title: 'Clé manquante', text: `Collez d’abord votre clé ${p.name}.` };
      case 'nobase':
        return { kind: 'error', title: 'Adresse manquante', text: 'Indiquez l’adresse de l’API compatible OpenAI.' };
      default:
        return { kind: 'error', title: 'Le test a échoué', text: (err && err.message) || 'Erreur inconnue.', detail };
    }
  }

  /* ---------- Vérification du format de la clé ---------- */
  function checkKey() {
    const p = current();
    const input = $('#cw-key', root);
    const warn = $('[data-cw-keywarn]', root);
    if (!input || !warn) return;
    const k = cleanKey(input.value);
    const owner = keyOwner(k);
    let html = '';
    if (owner && owner.id !== p.id && !p.custom) {
      html = `${icon('info')}<span>Cette clé ressemble à une clé <b>${esc(owner.name)}</b>.</span> <button type="button" class="btn btn-sm" data-cw-switch="${owner.id}">Passer à ${esc(owner.name)}</button>`;
    } else if (/^sk-(?!or-)/.test(k) && !p.custom && !p.local) {
      html = `${icon('info')}<span>Cette clé ressemble à une clé OpenAI (« sk-… ») : elle ne fonctionne pas chez ${esc(p.name)}.</span>`;
    }
    warn.hidden = !html;
    warn.innerHTML = html;
  }

  /* ---------- Test ---------- */
  async function runTest() {
    const p = current();
    if (st.busy) return;
    const keyInput = $('#cw-key', root);
    const baseInput = $('#cw-base', root);
    const key = cleanKey(keyInput?.value);
    if (keyInput) keyInput.value = key;
    st.keys[p.id] = key;
    let base = p.baseUrl;
    if (baseInput) {
      base = baseInput.value.trim().replace(/\/+$/, '');
      st.bases[p.id] = base;
    }
    if (!base) { showDiag(diagnose({ kind: 'nobase' }, p, base)); baseInput?.focus(); return; }
    if (!key && !p.keyOptional) { showDiag(diagnose({ kind: 'nokey' }, p, base)); keyInput?.focus(); return; }
    const conn = { ...browserConnection({ providerId: p.id, baseUrl: base === p.baseUrl ? '' : base, key }), candidate: true };
    const btn = $('[data-cw-test]', root);
    st.busy = true;
    if (btn) btn.disabled = true;
    st.tested[p.id] = false;
    $('[data-cw-models-step]', root)?.setAttribute('hidden', '');
    updateFoot();
    showDiag({ kind: 'loading', title: `Connexion à ${host(base)}…`, text: '' });
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      let models;
      try {
        models = await listModels(conn, { signal: ctl.signal });
      } catch (e) {
        if (e && e.name === 'AbortError') throw new ApiError('timeout', 'Délai dépassé');
        if (e && e.kind === 'network' && navigator.onLine !== false) {
          // Le serveur répond-il quand on ne lit pas la réponse ? Alors c'est un blocage CORS.
          throw (await probeReachable(base)) ? new ApiError('cors', 'CORS') : e;
        }
        throw e;
      }
      if (current().id !== p.id) return;
      st.models[p.id] = models;
      st.tested[p.id] = true;
      const prefer = st.chosen[p.id] || (p.id === settings.get().connection.provider ? settings.get().connection.model : '') || (p.cloud ? preset.model : '');
      st.chosen[p.id] = pickDefaultModel(p, models, { preferred: prefer, freeOnly: !!(p.freeFilter && st.freeOnly) });
      const open = openModels(models);
      const free = open.filter((m) => m.free).length;
      const n = (open.length || models.filter((m) => m.chat).length);
      if (!n) {
        showDiag({ kind: 'warn', title: 'Connexion réussie, mais aucun modèle listé', text: `${p.name} ne propose aucun modèle de discussion pour cette clé. Saisissez l’identifiant exact du modèle ci-dessous, ou vérifiez les droits de la clé.` });
      } else showDiag({
        kind: 'ok',
        title: 'Connexion réussie',
        text: `${n} modèle${n > 1 ? 's' : ''} ${open.length ? 'ouvert' : 'de discussion'}${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''} chez ${p.name}${free ? `, dont ${free} gratuit${free > 1 ? 's' : ''}` : ''}. ${st.chosen[p.id] ? 'Un modèle conseillé est déjà sélectionné.' : ''}`.trim(),
      });
      $('.cw-sugg', root)?.setAttribute('hidden', '');
      $('[data-cw-models-step]', root)?.removeAttribute('hidden');
      $(`[data-cw-prov="${p.id}"]`, root)?.insertAdjacentHTML('beforeend', `<span class="cw-prov-ok">${icon('check')}Connexion testée</span>`);
      drawModels();
      updateFoot();
      requestAnimationFrame(() => $('[data-cw-models-step]', root)?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
    } catch (err) {
      if (current().id !== p.id) return;
      showDiag(diagnose(err, p, base));
    } finally {
      clearTimeout(timer);
      st.busy = false;
      const b = $('[data-cw-test]', root);
      if (b) b.disabled = false;
    }
  }

  /* ---------- Choix du modèle ---------- */
  let picker = null;
  function drawModels() {
    const p = current();
    const models = st.models[p.id] || [];
    const freeOnly = !!(p.freeFilter && st.freeOnly);
    let reco = recommendedModels(p, models, { freeOnly, max: 6 }).map((r) => ({ label: r.label, why: r.why, m: r.model }));
    const open = openModels(models, { freeOnly });
    if (!reco.length) reco = (open.length ? open : models.filter((m) => m.chat && (!freeOnly || m.free))).slice(0, 4).map((m) => ({ label: shortModel(m.id), why: '', m }));
    const chosen = st.chosen[p.id];
    if (chosen && !reco.some((r) => r.m.id === chosen)) {
      const m = models.find((x) => x.id === chosen) || { id: chosen };
      reco.unshift({ label: shortModel(chosen), why: 'Votre choix', m });
    }
    const box = $('[data-cw-reco]', root);
    box.innerHTML = reco.length ? reco.map((r) => `<label class="cw-model">
        <input type="radio" name="cw-model" value="${esc(r.m.id)}" ${r.m.id === chosen ? 'checked' : ''}>
        <span class="cw-model-main"><b>${esc(r.label)}</b><span class="mono">${esc(r.m.id)}</span></span>
        ${r.why ? `<span class="cw-model-why">${esc(r.why)}</span>` : ''}
        <span class="cw-model-tags">${r.m.free ? '<span class="pill free">Gratuit</span>' : ''}${r.m.vision ? '<span class="pill vision">Vision</span>' : ''}${r.m.context ? `<span class="pill">${Math.round(r.m.context / 1000)} k</span>` : ''}</span>
      </label>`).join('') : '<p class="hint">Aucun modèle avec ces filtres.</p>';
    const list = open.length ? open : models;
    $('[data-cw-count]', root).textContent = String(list.filter((m) => m.chat).length);
    picker = mountModelPicker($('[data-cw-picker]', root), {
      models: list, value: chosen, freeFilter: false,
      onChange: (id) => { choose(id, { redraw: true }); },
    });
  }

  function choose(id, { redraw = false } = {}) {
    const p = current();
    st.chosen[p.id] = id;
    if (redraw) {
      const radios = $$('[data-cw-reco] input', root);
      if (radios.some((r) => r.value === id)) radios.forEach((r) => { r.checked = r.value === id; });
      else drawModelsKeepOpen();
    } else picker?.setValue(id);
    updateFoot();
  }
  function drawModelsKeepOpen() {
    const open = $('.cw-all', root)?.open;
    drawModels();
    if (open) $('.cw-all', root).open = true;
  }

  /* ---------- Validation (cloud / local) ---------- */
  async function finishBrowser() {
    const p = current();
    const model = st.chosen[p.id];
    if (!st.tested[p.id] || !model) return;
    if (keystore.isLocked()) {
      const ok = await app.unlock();
      if (!ok) return;
    }
    const base = st.bases[p.id] ?? p.baseUrl;
    try {
      await keystore.set(p.id, st.keys[p.id] || '');
    } catch (e) {
      showDiag({ kind: 'error', title: 'Clé non enregistrée', text: e.message });
      return;
    }
    settings.set('connection', { mode: 'browser', provider: p.id, baseUrl: base && base !== p.baseUrl ? base : '', model, ...(p.freeFilter ? { freeOnly: st.freeOnly } : {}) });
    settings.set('onboarded', true);
    authState.ok();
    app.setModels(st.models[p.id] || []);
    app.refreshStatus(true);
    d.close();
    toast(`Nour réfléchit maintenant avec ${shortModel(model)} sur ${p.name}${p.cloud ? ' (cloud)' : ''}.`, { kind: 'ok', timeout: 6000 });
    app.afterConnect();
  }

  /* =====================================================================
     Serveur Netlify
     ===================================================================== */
  function drawServer() {
    const s = st.server;
    const state = s ? s.state : 'checking';
    const logged = !!session.get();
    root.innerHTML = `
      <div class="cw-server">
        <div class="cw-srv-status" data-state="${state}" data-cw-srv-status>${serverStatusHTML(s)}</div>
        ${state === 'ready' ? `<section class="cw-login" data-cw-login>${logged ? loggedHTML() : loginHTML()}</section>` : ''}
        ${state === 'ready'
    ? `<details class="cw-guide-wrap"><summary>${icon('chevron-down')}Revoir le guide de configuration <span class="hint-inline">(changer de mot de passe, de fournisseur…)</span></summary>${guideHTML()}</details>`
    : `<section class="cw-guide-wrap open"><h3 class="cw-guide-title">Mettre en place le serveur, pas à pas <span class="hint-inline">(environ 10 minutes)</span></h3>${guideHTML()}</section>`}
      </div>`;
    if (!s) refreshServer().then(() => { if (d.open && st.step === 'serveur') { drawServer(); updateFoot(); $('#cw-pass', root)?.focus(); } });
    if (state === 'ready' && logged) mountServerModels();
    drawVars();
  }

  function serverStatusHTML(s) {
    const recheck = `<button type="button" class="btn btn-sm" data-cw-recheck>${icon('refresh')}Vérifier à nouveau</button>`;
    if (!s) return `<span class="cw-spin" aria-hidden="true"></span><div><b>Recherche d’un serveur Nour sur ce site…</b></div>`;
    if (s.state === 'ready') return `${icon('shield')}<div><b>Serveur Nour détecté et configuré sur ce site</b><p>La clé du fournisseur reste dans les variables d’environnement Netlify. Il ne vous faut que le mot de passe d’accès.</p></div>`;
    if (s.state === 'incomplete') return `${icon('alert')}<div><b>La fonction est déployée, mais sa configuration est incomplète</b><p>Variable${s.missing.length > 1 ? 's' : ''} manquante${s.missing.length > 1 ? 's' : ''} ou invalide${s.missing.length > 1 ? 's' : ''} : ${s.missing.map((m) => `<code>${esc(m)}</code>`).join(', ') || 'inconnue'}. Suivez le guide ci-dessous, puis redéployez.</p><p>${recheck}</p></div>`;
    if (s.state === 'unknown') return `${icon('wifi-off')}<div><b>Impossible de vérifier le serveur</b><p>Vérifiez votre connexion, puis réessayez.</p><p>${recheck}</p></div>`;
    return `${icon('info')}<div><b>Pas encore de serveur Nour sur ce site</b><p>C’est normal tant que le site n’est pas publié sur Netlify avec ses variables d’environnement. Le guide ci-dessous génère tout ce qu’il faut, sans ligne de commande.</p><p>${recheck}</p></div>`;
  }

  function loginHTML() {
    return `<form class="cw-login-form" data-cw-login-form>
      <label class="cw-step-title" for="cw-pass">Mot de passe d’accès</label>
      <div class="input-row"><div class="input-wrap"><input type="password" id="cw-pass" class="input" autocomplete="current-password" required></div>
      <button class="btn btn-primary" type="submit">${icon('lock')}Se connecter avec le mot de passe</button></div>
      <div class="cw-diag" data-cw-login-status role="status" aria-live="polite"></div>
    </form>`;
  }

  function loggedHTML() {
    const s = session.get();
    return `<div class="cw-logged">
      <span class="cw-logged-dot" aria-hidden="true"></span>
      <div class="grow"><b>Connecté à votre serveur</b><div class="hint">Session valable jusqu’à ${esc(formatExpiry(s.expiresAt))}</div></div>
      <button type="button" class="btn btn-sm" data-cw-logout>${icon('logout')}Se déconnecter</button>
    </div>
    <div class="cw-srv-models">
      <span class="cw-step-title">Modèle utilisé par Nour <span class="hint-inline">(facultatif)</span></span>
      <p class="hint">Sans choix ici, le serveur utilise <code>PROVIDER_DEFAULT_MODEL</code>.</p>
      <div class="cw-diag" data-cw-models-status role="status" aria-live="polite"></div>
      <div data-cw-srv-picker></div>
    </div>`;
  }

  async function mountServerModels() {
    const box = $('[data-cw-srv-picker]', root);
    const status = $('[data-cw-models-status]', root);
    if (!box) return;
    const p = mountModelPicker(box, {
      models: st.serverModels || [], value: st.serverModel, freeFilter: true,
      onChange: (id) => { st.serverModel = id; },
    });
    if (st.serverModels) return;
    status.dataset.kind = 'loading';
    status.innerHTML = '<span class="cw-spin" aria-hidden="true"></span><div><b>Chargement des modèles du serveur…</b></div>';
    try {
      const models = await listModels();
      st.serverModels = models;
      p.setModels(models);
      status.dataset.kind = 'ok';
      status.innerHTML = `${icon('check')}<div><b>${models.filter((m) => m.chat).length} modèles disponibles sur le serveur</b></div>`;
      // Sans modèle par défaut côté serveur, on en choisit un pour que la première question aboutisse.
      if (!st.serverModel && st.server && st.server.hasDefault === false) {
        const pick = pickDefaultModel(providerById('custom'), models, {});
        if (pick) { st.serverModel = pick; p.setValue(pick); }
      }
    } catch (err) {
      status.dataset.kind = 'error';
      status.innerHTML = `${icon('alert')}<div><b>Modèles indisponibles</b><p>${esc(err.kind === 'auth' ? 'Le fournisseur refuse la clé configurée sur le serveur (PROVIDER_API_KEY).' : (err.message || 'Erreur'))}</p></div>`;
    }
  }

  async function doLogin(form) {
    const pass = $('#cw-pass', form);
    const status = $('[data-cw-login-status]', form);
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    status.dataset.kind = 'loading';
    status.innerHTML = '<span class="cw-spin" aria-hidden="true"></span><div><b>Connexion…</b></div>';
    try {
      await serverLogin(pass.value);
      settings.set('connection', { mode: 'server' });
      settings.set('onboarded', true);
      authState.ok();
      app.refreshStatus(true);
      drawServer();
      updateFoot();
      finishBtn.focus();
    } catch (err) {
      btn.disabled = false;
      const texts = {
        'bad-password': ['Mot de passe incorrect', 'C’est celui que vous avez choisi au moment de générer ACCESS_PASSWORD_HASH.'],
        'login-limit': ['Trop de tentatives', `Réessayez dans ${formatWait(err.retryAfter || 600)}.`],
        config: ['Serveur non configuré', 'Il manque des variables d’environnement : suivez le guide ci-dessous.'],
        'no-server': ['Serveur introuvable', 'La fonction /api n’est pas déployée sur ce site.'],
        network: ['Serveur injoignable', 'Vérifiez votre connexion Internet.'],
      };
      const [title, text] = texts[err.kind] || ['Connexion impossible', err.message || ''];
      if (err.kind === 'bad-password') { pass.setAttribute('aria-invalid', 'true'); pass.select(); }
      status.dataset.kind = 'error';
      status.innerHTML = `${icon('alert')}<div><b>${esc(title)}</b><p>${esc(text)}</p></div>`;
    }
  }

  function finishServer() {
    if (!session.get()) return;
    settings.set('connection', { mode: 'server', serverModel: st.serverModel || '' });
    settings.set('onboarded', true);
    if (st.serverModels) app.setModels(st.serverModels);
    app.refreshStatus(true);
    d.close();
    toast(`Nour passe par votre serveur Netlify${st.serverModel ? ` · ${shortModel(st.serverModel)}` : ''}.`, { kind: 'ok', timeout: 6000 });
    app.afterConnect();
  }

  /* ---------- Guide et générateur ---------- */
  function guideHTML() {
    const crypto = setupAvailable();
    const sp = providerById(st.srvProvider);
    return `<ol class="cw-steps cw-guide">
      <li>
        <b class="cw-step-title">Publier le site sur Netlify</b>
        <p class="hint">Netlify → <i>Add new project</i> → <i>Import an existing project</i> → ce dépôt, branche <code>assistant</code>. Rien à compiler : la fonction <code>netlify/functions/chat.mjs</code> est déployée automatiquement avec le site.</p>
        <p><a class="btn btn-sm" href="https://app.netlify.com/start" target="_blank" rel="noopener noreferrer">Ouvrir Netlify${icon('external')}</a></p>
      </li>
      <li>
        <label class="cw-step-title" for="cw-srv-prov">Choisir le fournisseur cloud du serveur</label>
        <div class="cw-inline">
          <select id="cw-srv-prov" class="input">${CLOUD_PROVIDERS.map((p) => `<option value="${p.id}" ${p.id === sp.id ? 'selected' : ''}>${esc(p.name)} — ${esc(p.price.label)}</option>`).join('')}</select>
          <a class="btn btn-sm" data-cw-srv-keylink href="${esc(sp.keyUrl)}" target="_blank" rel="noopener noreferrer">Créer une clé ${esc(sp.name)}${icon('external')}</a>
        </div>
        <p class="hint">La clé ira dans Netlify (variable <code>PROVIDER_API_KEY</code>), jamais dans ce navigateur.</p>
        <label class="cw-sub-label" for="cw-srv-model">Modèle par défaut <span class="hint-inline">(facultatif)</span></label>
        <input type="text" id="cw-srv-model" class="input mono" placeholder="ex. ${esc(sp.id === 'mistral' ? 'mistral-small-latest' : sp.id === 'cerebras' ? 'gpt-oss-120b' : 'openai/gpt-oss-120b')}" value="${esc(st.srvModelDraft || '')}" autocomplete="off" spellcheck="false">
      </li>
      <li>
        <label class="cw-step-title" for="cw-newpass">Choisir le mot de passe d’accès</label>
        ${crypto ? `<div class="input-row">
          <div class="input-wrap"><input type="text" id="cw-newpass" class="input mono" value="${esc(st.newPass || '')}" autocomplete="off" spellcheck="false" minlength="${MIN_PASSWORD}" placeholder="${MIN_PASSWORD} caractères minimum"></div>
          <button type="button" class="btn" data-cw-genpass>${icon('dice')}Proposer</button>
        </div>
        <div class="cw-strength" data-cw-strength aria-live="polite"><span class="bar"><i></i></span><span class="txt"></span></div>
        <p class="hint">Notez-le dans votre gestionnaire de mots de passe : Nour ne le garde nulle part. Seule son empreinte ira sur le serveur.</p>
        <p><button type="button" class="btn btn-primary" data-cw-generate>${icon('key')}Générer les variables</button></p>`
    : `<div class="notice warn">${icon('alert')}<div><p>Le générateur a besoin d’une connexion sécurisée (HTTPS ou localhost). Sinon, depuis le dossier du projet : <code>node scripts/hash-password.mjs "votre mot de passe"</code>.</p></div></div>`}
      </li>
      <li>
        <b class="cw-step-title">Ajouter les variables dans Netlify</b>
        <p class="hint">Projet → <i>Project configuration</i> → <i>Environment variables</i> → <i>Add a variable</i>. Pour la clé, l’empreinte et le secret, cochez « Contains secret values » si l’option est proposée.</p>
        <div class="cw-vars" data-cw-vars></div>
        <p class="cw-vars-actions"><button type="button" class="btn btn-sm" data-cw-copyenv>${icon('copy')}Copier le bloc .env</button><span class="hint">à coller via <i>Import from a .env file</i>, puis remplacez la clé.</span></p>
      </li>
      <li>
        <b class="cw-step-title">Redéployer, puis revenir ici</b>
        <p class="hint"><i>Deploys</i> → <i>Trigger deploy</i> → <i>Deploy project</i>. Nour détecte alors le serveur et propose « Se connecter avec le mot de passe ».</p>
        <p><button type="button" class="btn btn-sm" data-cw-recheck>${icon('refresh')}Vérifier à nouveau</button></p>
      </li>
    </ol>`;
  }

  function drawVars() {
    const box = $('[data-cw-vars]', root);
    if (!box) return;
    const vars = serverVariables({ providerId: st.srvProvider, hash: st.generated?.hash || '', secret: st.generated?.secret || '', model: st.srvModelDraft || '' });
    box.innerHTML = vars.map((v) => {
      const empty = !v.value;
      const shown = v.name === 'PROVIDER_API_KEY' ? `votre clé ${esc(providerById(st.srvProvider).name)}`
        : empty ? (v.optional ? 'vide = choisi dans Nour' : 'générée à l’étape 3') : esc(v.value);
      return `<div class="cw-var${empty ? ' is-empty' : ''}" data-var="${v.name}">
        <div class="cw-var-name"><code>${v.name}</code>${v.secret ? '<span class="pill">secret</span>' : ''}${v.optional ? '<span class="pill">facultatif</span>' : ''}</div>
        <div class="cw-var-value mono" title="${empty ? '' : esc(v.value)}">${shown}</div>
        <div class="cw-var-acts">
          <button type="button" class="act" data-copy="${esc(v.name)}" aria-label="Copier le nom ${v.name}" title="Copier le nom">${icon('copy')}<span>Nom</span></button>
          ${empty ? '' : `<button type="button" class="act" data-copy-value="${esc(v.name)}" aria-label="Copier la valeur de ${v.name}" title="Copier la valeur">${icon('copy')}<span>Valeur</span></button>`}
        </div>
        <p class="cw-var-note">${esc(v.note)}</p>
      </div>`;
    }).join('');
    box._vars = vars;
  }

  function updateStrength() {
    const input = $('#cw-newpass', root);
    const box = $('[data-cw-strength]', root);
    if (!input || !box) return;
    const s = passwordStrength(input.value);
    box.dataset.level = String(s.level);
    box.querySelector('.txt').textContent = s.text;
  }

  async function generate() {
    const input = $('#cw-newpass', root);
    const s = passwordStrength(input.value);
    if (!s.ok) { input.setAttribute('aria-invalid', 'true'); input.focus(); updateStrength(); return; }
    input.removeAttribute('aria-invalid');
    const btn = $('[data-cw-generate]', root);
    btn.disabled = true;
    btn.innerHTML = `<span class="cw-spin" aria-hidden="true"></span>Calcul de l’empreinte…`;
    try {
      st.generated = { hash: await hashAccessPassword(input.value), secret: randomTokenSecret() };
      drawVars();
      const box = $('[data-cw-vars]', root);
      box.classList.add('fresh');
      box.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      toast('Variables générées : copiez-les dans Netlify.', { kind: 'ok' });
    } catch (e) {
      toast(e.message || 'Génération impossible.', { kind: 'error' });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${icon('key')}Régénérer les variables`;
    }
  }

  /* ---------- Événements ---------- */
  d.addEventListener('click', async (e) => {
    const t = e.target;
    const connect = t.closest('[data-connect]');
    if (connect) { go(connect.dataset.connect); return; }
    const goBtn = t.closest('[data-go]');
    if (goBtn) { go(goBtn.dataset.go); return; }
    if (t.closest('[data-cw-back]')) { go('choix'); return; }
    if (t.closest('[data-cw-finish]')) { if (st.step === 'serveur') finishServer(); else finishBrowser(); return; }
    const prov = t.closest('[data-cw-prov]');
    if (prov) {
      const k = $('#cw-key', root);
      if (k) st.keys[current().id] = k.value;
      const b = $('#cw-base', root);
      if (b) st.bases[current().id] = b.value.trim();
      if (st.step === 'local') st.localId = prov.dataset.cwProv; else st.cloudId = prov.dataset.cwProv;
      $$('[data-cw-prov]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === prov)));
      drawDetail();
      updateFoot();
      if (matchMedia('(max-width: 640px)').matches) $('[data-cw-detail]', root)?.scrollIntoView({ block: 'start' });
      return;
    }
    if (t.closest('[data-cw-test]')) { runTest(); return; }
    const sw = t.closest('[data-cw-switch]');
    if (sw) {
      const key = cleanKey($('#cw-key', root).value);
      st.keys[sw.dataset.cwSwitch] = key;
      st.cloudId = sw.dataset.cwSwitch;
      drawProviders();
      updateFoot();
      $('#cw-key', root)?.focus();
      return;
    }
    const reveal = t.closest('[data-cw-reveal]');
    if (reveal) {
      const input = $('#cw-key', root);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      reveal.setAttribute('aria-pressed', String(show));
      reveal.setAttribute('aria-label', show ? 'Masquer la clé' : 'Afficher la clé');
      reveal.innerHTML = icon(show ? 'eye-off' : 'eye');
      return;
    }
    if (t.closest('[data-cw-unlock]')) { if (await app.unlock()) { for (const p of [...CLOUD_PROVIDERS, ...LOCAL_PROVIDERS]) { const k = keystore.get(p.id); if (k) st.keys[p.id] = k; } drawDetail(); } return; }
    if (t.closest('[data-cw-recheck]')) {
      const el = $('[data-cw-srv-status]', root);
      if (el) el.innerHTML = serverStatusHTML(null);
      await refreshServer(true);
      if (st.step === 'serveur') { drawServer(); updateFoot(); go('serveur'); }
      return;
    }
    if (t.closest('[data-cw-logout]')) { session.clear(); st.serverModels = null; app.refreshStatus(); drawServer(); updateFoot(); $('#cw-pass', root)?.focus(); return; }
    if (t.closest('[data-cw-genpass]')) {
      const input = $('#cw-newpass', root);
      input.value = generatePassphrase();
      st.newPass = input.value;
      input.removeAttribute('aria-invalid');
      updateStrength();
      input.focus();
      input.select();
      return;
    }
    if (t.closest('[data-cw-generate]')) { generate(); return; }
    const cp = t.closest('[data-copy], [data-copy-value]');
    if (cp) {
      const vars = $('[data-cw-vars]', root)._vars || [];
      const name = cp.dataset.copy || cp.dataset.copyValue;
      const v = vars.find((x) => x.name === name);
      const text = cp.dataset.copy ? name : (v?.value || '');
      if (text && await copyText(text)) flash(cp);
      return;
    }
    if (t.closest('[data-cw-copyenv]')) {
      const vars = $('[data-cw-vars]', root)._vars || [];
      if (await copyText(envBlock(vars))) flash(t.closest('[data-cw-copyenv]'), 'Copié');
    }
  });

  d.addEventListener('input', (e) => {
    if (e.target.id === 'cw-key') { st.keys[current().id] = e.target.value; checkKey(); }
    else if (e.target.id === 'cw-base') { st.bases[current().id] = e.target.value.trim(); $('[data-cw-host]', root).textContent = host(e.target.value.trim()); }
    else if (e.target.id === 'cw-newpass') { st.newPass = e.target.value; e.target.removeAttribute('aria-invalid'); updateStrength(); }
    else if (e.target.id === 'cw-srv-model') { st.srvModelDraft = e.target.value.trim(); drawVars(); }
  });
  d.addEventListener('change', (e) => {
    if (e.target.name === 'cw-model') choose(e.target.value);
    else if (e.target.matches('[data-cw-free]')) { st.freeOnly = e.target.checked; drawModelsKeepOpen(); }
    else if (e.target.id === 'cw-srv-prov') {
      st.srvProvider = e.target.value;
      const sp = providerById(st.srvProvider);
      const a = $('[data-cw-srv-keylink]', root);
      a.href = sp.keyUrl;
      a.innerHTML = `Créer une clé ${esc(sp.name)}${icon('external')}`;
      drawVars();
    }
  });
  d.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-cw-login-form]');
    if (f) { e.preventDefault(); doLogin(f); }
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target.id === 'cw-key' || e.target.id === 'cw-base')) { e.preventDefault(); runTest(); }
  });

  go(st.step);
  return d;
}

function flash(btn, label = '') {
  const prev = btn.innerHTML;
  btn.classList.add('done');
  btn.innerHTML = `${icon('check')}<span>${esc(label || 'Copié')}</span>`;
  setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = prev; }, 1500);
}
