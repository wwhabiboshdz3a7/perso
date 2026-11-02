// Réglages : connexion, assistant, préférences, données.

import { esc, icon, $, $$, readAsDataURL, formatBytes, formatTime } from '../util.js';
import { settings } from '../settings.js';
import { keystore } from '../keystore.js';
import { cryptoAvailable } from '../crypto.js';
import { PROVIDERS, providerById, localCorsHelp, suggestModel } from '../providers.js';
import { listModels, serverLogin, session, ApiError } from '../client.js';
import { PERSONAS, TONES, personaById, buildSystemPrompt } from '../personas.js';
import { frenchVoices, speak, speechSupported } from '../voice.js';
import { openDialog, toast, confirmDialog } from './dialogs.js';
import { mountModelPicker } from './model-picker.js';
import { describeError } from './errors.js';
import { avatarHTML, AVATAR_GLYPHS } from './avatar.js';

const TABS = [
  ['connexion', 'Connexion'],
  ['assistant', 'Assistant'],
  ['preferences', 'Préférences'],
  ['donnees', 'Données'],
];

export function openSettings(app, { tab = 'connexion', provider = null } = {}) {
  const tabsHTML = `<div class="tabs" role="tablist" aria-label="Sections des réglages">${TABS.map(([id, label]) => `<button class="tab" role="tab" type="button" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${id === tab}" tabindex="${id === tab ? 0 : -1}" data-tab="${id}">${label}</button>`).join('')}</div>`;
  const body = TABS.map(([id]) => `<section class="tab-panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" ${id === tab ? '' : 'hidden'} tabindex="0"></section>`).join('');
  const d = openDialog({
    id: 'dlg-settings', title: 'Réglages', tabs: tabsHTML, body,
    foot: '<span class="hint" style="flex:1">Les modifications sont enregistrées automatiquement.</span><button class="btn btn-primary" type="button" data-close>Terminé</button>',
    onClose: () => app.refreshChrome(),
  });

  if (provider && (settings.get().connection.provider !== provider || settings.get().connection.mode !== 'browser')) {
    settings.set('connection', { mode: 'browser', provider, baseUrl: '', model: '' });
    app.refreshStatus();
  }

  const panels = {
    connexion: $('#panel-connexion', d),
    assistant: $('#panel-assistant', d),
    preferences: $('#panel-preferences', d),
    donnees: $('#panel-donnees', d),
  };
  renderConnection(panels.connexion, app);
  renderAssistant(panels.assistant, app);
  renderPreferences(panels.preferences, app);
  renderData(panels.donnees, app);

  const tablist = $('.tabs', d);
  const select = (id, focus = false) => {
    $$('.tab', d).forEach((t) => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    Object.entries(panels).forEach(([k, p]) => { p.hidden = k !== id; });
    $('.modal-body', d).scrollTop = 0;
  };
  tablist.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) select(t.dataset.tab); });
  tablist.addEventListener('keydown', (e) => {
    const ids = TABS.map(([id]) => id);
    const cur = ids.indexOf($('.tab[aria-selected="true"]', d).dataset.tab);
    if (e.key === 'ArrowRight') { e.preventDefault(); select(ids[(cur + 1) % ids.length], true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select(ids[(cur - 1 + ids.length) % ids.length], true); }
    if (e.key === 'Home') { e.preventDefault(); select(ids[0], true); }
    if (e.key === 'End') { e.preventDefault(); select(ids[ids.length - 1], true); }
  });
  return d;
}

/* =====================================================================
   Connexion
   ===================================================================== */
function renderConnection(root, app) {
  const c = settings.get().connection;
  root.innerHTML = `
    <div class="field">
      <span class="field-label" id="mode-label">Mode de connexion</span>
      <p class="hint" style="margin-bottom:4px">« Clé locale » : votre clé reste dans ce navigateur. « Serveur sécurisé » : la clé reste sur votre fonction Netlify.</p>
      <div class="seg" role="radiogroup" aria-labelledby="mode-label">
        <label><input type="radio" name="conn-mode" value="browser" ${c.mode !== 'server' ? 'checked' : ''}><span>${icon('key')}Clé locale</span></label>
        <label><input type="radio" name="conn-mode" value="server" ${c.mode === 'server' ? 'checked' : ''}><span>${icon('server')}Serveur sécurisé</span></label>
      </div>
    </div>
    <div data-mode-panel></div>`;
  const panel = $('[data-mode-panel]', root);
  const draw = () => (settings.get().connection.mode === 'server' ? drawServer(panel, app) : drawBrowser(panel, app));
  $$('input[name="conn-mode"]', root).forEach((r) => r.addEventListener('change', () => {
    settings.set('connection', { mode: r.value });
    app.refreshStatus();
    draw();
  }));
  draw();
}

function drawBrowser(panel, app) {
  const c = settings.get().connection;
  const p = providerById(c.provider);
  const base = c.baseUrl || p.baseUrl;
  const locked = keystore.isLocked();
  const encrypted = keystore.isEncrypted();
  const key = keystore.get(p.id);

  panel.innerHTML = `
    <h3 class="section-title">Fournisseur</h3>
    <div class="provider-select" role="group" aria-label="Fournisseur d'IA">
      ${PROVIDERS.map((pr) => `<button type="button" class="provider-card" aria-pressed="${pr.id === p.id}" data-provider="${pr.id}">
        ${pr.tag ? `<span class="tag">${esc(pr.tag)}</span>` : ''}<b>${esc(pr.name)}</b><span>${esc(pr.blurb)}</span></button>`).join('')}
    </div>
    ${p.local ? `<div class="notice warn">${icon('info')}<div><p>${localCorsHelp(p)}</p></div></div>` : ''}
    <div class="field">
      <label for="base-url">URL de base de l'API</label>
      <input type="url" id="base-url" class="mono" value="${esc(base)}" placeholder="https://exemple.com/v1" spellcheck="false" autocomplete="off" ${p.custom ? 'required' : ''}>
      <p class="hint">Point d'accès compatible OpenAI (terminé par <code>/v1</code> en général). ${p.custom ? '' : 'Pré-rempli pour ce fournisseur.'}</p>
    </div>
    <div class="field">
      <label for="api-key">Clé API ${p.keyOptional ? '<span class="hint" style="display:inline">(facultative)</span>' : ''}</label>
      ${locked ? `<div class="notice warn">${icon('lock')}<div><p>Le coffre des clés est chiffré et verrouillé.</p><p><button class="btn btn-sm" type="button" data-unlock>${icon('lock')}Déverrouiller</button></p></div></div>` : `
      <div class="input-row">
        <div class="input-wrap">
          <input type="password" id="api-key" class="mono" value="${esc(key)}" placeholder="${p.keyOptional ? 'Laisser vide si le serveur n’en demande pas' : 'Collez votre clé ici'}" autocomplete="off" spellcheck="false">
          <button type="button" class="reveal" data-reveal aria-label="Afficher la clé" aria-pressed="false">${icon('eye')}</button>
        </div>
        ${p.keyUrl ? `<a class="btn" href="${esc(p.keyUrl)}" target="_blank" rel="noopener noreferrer">${p.local ? 'Télécharger' : 'Obtenir une clé'}${icon('external')}</a>` : ''}
      </div>
      <p class="hint">${p.keyHint ? esc(p.keyHint) + ' ' : ''}La clé n'est envoyée qu'au fournisseur choisi.</p>`}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">
      <button class="btn btn-primary" type="button" data-test>${icon('refresh')}Tester et charger les modèles</button>
    </div>
    <p class="status-line" role="status" data-status></p>
    <div data-picker></div>

    <h3 class="section-title">Sécurité de la clé</h3>
    <div class="notice warn">${icon('alert')}<div>
      <p><b>La clé est enregistrée dans ce navigateur</b> (stockage local de ce site). Une extension malveillante ou une faille sur ce domaine pourrait la lire ; n'utilisez pas ce mode sur un ordinateur partagé.</p>
      <p>Pour plus de sécurité : chiffrez-la avec une phrase secrète, ou passez en mode <b>Serveur sécurisé</b> (la clé reste côté serveur).</p>
    </div></div>
    <div data-crypto></div>
    <button class="btn btn-sm btn-danger" type="button" data-forget>${icon('trash')}Oublier toutes les clés de ce navigateur</button>`;

  // Fournisseur
  $$('[data-provider]', panel).forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.provider === settings.get().connection.provider) return;
    settings.set('connection', { provider: b.dataset.provider, baseUrl: '', model: '' });
    app.refreshStatus();
    drawBrowser(panel, app);
    $(`[data-provider="${b.dataset.provider}"]`, panel)?.focus();
  }));

  const baseInput = $('#base-url', panel);
  baseInput.addEventListener('change', () => {
    const v = baseInput.value.trim().replace(/\/+$/, '');
    settings.set('connection', { baseUrl: v === p.baseUrl ? '' : v });
    app.refreshStatus();
  });

  const keyInput = $('#api-key', panel);
  if (keyInput) {
    keyInput.addEventListener('change', async () => {
      try {
        await keystore.set(p.id, keyInput.value);
        setStatus(keyInput.value.trim() ? 'Clé enregistrée.' : 'Clé effacée.', 'ok');
        app.refreshStatus();
      } catch (e) { setStatus(e.message, 'error'); }
    });
    $('[data-reveal]', panel).addEventListener('click', (e) => {
      const b = e.currentTarget;
      const show = keyInput.type === 'password';
      keyInput.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? 'Masquer la clé' : 'Afficher la clé');
      b.innerHTML = icon(show ? 'eye-off' : 'eye');
    });
  }
  $('[data-unlock]', panel)?.addEventListener('click', async () => {
    const ok = await app.unlock();
    if (ok) drawBrowser(panel, app);
  });

  const statusEl = $('[data-status]', panel);
  function setStatus(text, kind = '') {
    statusEl.dataset.kind = kind;
    statusEl.innerHTML = text ? `${icon(kind === 'error' ? 'alert' : kind === 'ok' ? 'check' : 'info')}<span>${esc(text)}</span>` : '';
  }

  const picker = mountModelPicker($('[data-picker]', panel), {
    models: app.getModels(),
    value: c.model,
    freeFilter: !!p.freeFilter,
    freeOnly: c.freeOnly,
    showAll: c.showAll,
    onChange: (id) => { settings.set('connection', { model: id }); app.refreshStatus(); },
    onPrefs: (prefs) => settings.set('connection', prefs),
  });

  $('[data-test]', panel).addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (keyInput && keyInput.value.trim() !== keystore.get(p.id)) {
      try { await keystore.set(p.id, keyInput.value); } catch (err) { setStatus(err.message, 'error'); return; }
    }
    if (baseInput.value.trim()) settings.set('connection', { baseUrl: baseInput.value.trim().replace(/\/+$/, '') === p.baseUrl ? '' : baseInput.value.trim().replace(/\/+$/, '') });
    btn.disabled = true;
    setStatus('Connexion au fournisseur…');
    try {
      const models = await listModels();
      app.setModels(models);
      picker.setModels(models);
      const cur = settings.get().connection;
      if (!cur.model || !models.some((m) => m.id === cur.model)) {
        const pick = suggestModel(models, { freeOnly: cur.freeOnly });
        if (pick) { settings.set('connection', { model: pick }); picker.setValue(pick); }
      }
      settings.set('onboarded', true);
      const chat = models.filter((m) => m.chat).length;
      setStatus(`Connexion réussie : ${chat} modèle${chat > 1 ? 's' : ''} de discussion disponible${chat > 1 ? 's' : ''}.`, 'ok');
      app.refreshStatus(true);
    } catch (err) {
      const info = describeError(err);
      setStatus(`${info.title}. ${info.text}`, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Chiffrement
  const cryptoBox = $('[data-crypto]', panel);
  function drawCrypto() {
    if (!cryptoAvailable()) {
      cryptoBox.innerHTML = `<p class="hint" style="margin-bottom:14px">Le chiffrement nécessite une connexion sécurisée (HTTPS).</p>`;
      return;
    }
    if (keystore.isEncrypted()) {
      cryptoBox.innerHTML = `<div class="notice">${icon('lock')}<div><p><b>Clés chiffrées</b> (AES-GCM, clé dérivée PBKDF2). La phrase secrète est demandée à chaque ouverture de l'application.</p>
        <p style="display:flex;gap:8px;flex-wrap:wrap">${keystore.isLocked() ? '' : '<button class="btn btn-sm" type="button" data-lock>Verrouiller maintenant</button><button class="btn btn-sm btn-ghost" type="button" data-decrypt>Retirer le chiffrement</button>'}</p></div></div>`;
      $('[data-lock]', cryptoBox)?.addEventListener('click', () => { keystore.lock(); app.refreshStatus(); drawBrowser(panel, app); });
      $('[data-decrypt]', cryptoBox)?.addEventListener('click', async () => {
        if (!await confirmDialog('Retirer le chiffrement ? Les clés seront stockées en clair dans ce navigateur.', { confirm: 'Retirer', danger: true })) return;
        keystore.disableEncryption();
        toast('Chiffrement retiré.');
        drawBrowser(panel, app);
      });
      return;
    }
    cryptoBox.innerHTML = `
      <label class="switch"><span class="label"><b>Chiffrer les clés avec une phrase secrète</b><small>Elle sera demandée à chaque ouverture. Si vous l'oubliez, il faudra ressaisir vos clés.</small></span><input type="checkbox" role="switch" data-enc-toggle></label>
      <div data-enc-form hidden style="padding-top:12px">
        <div class="grid-2">
          <div class="field"><label for="pass-1">Phrase secrète</label><input type="password" id="pass-1" autocomplete="new-password" minlength="8"></div>
          <div class="field"><label for="pass-2">Confirmation</label><input type="password" id="pass-2" autocomplete="new-password" minlength="8"></div>
        </div>
        <button class="btn btn-sm btn-primary" type="button" data-enc-go>${icon('lock')}Chiffrer maintenant</button>
        <p class="status-line" data-enc-status role="status" style="margin-top:10px"></p>
      </div>`;
    const t = $('[data-enc-toggle]', cryptoBox);
    const f = $('[data-enc-form]', cryptoBox);
    t.addEventListener('change', () => { f.hidden = !t.checked; if (t.checked) $('#pass-1', cryptoBox).focus(); });
    $('[data-enc-go]', cryptoBox).addEventListener('click', async () => {
      const a = $('#pass-1', cryptoBox).value;
      const b = $('#pass-2', cryptoBox).value;
      const st = $('[data-enc-status]', cryptoBox);
      if (a !== b) { st.dataset.kind = 'error'; st.textContent = 'Les deux phrases ne correspondent pas.'; return; }
      try {
        if (keyInput && keyInput.value.trim() !== keystore.get(p.id)) await keystore.set(p.id, keyInput.value);
        await keystore.enableEncryption(a);
        toast('Clés chiffrées.', { kind: 'ok' });
        app.refreshStatus();
        drawBrowser(panel, app);
      } catch (e) { st.dataset.kind = 'error'; st.textContent = e.message; }
    });
  }
  drawCrypto();

  $('[data-forget]', panel).addEventListener('click', async () => {
    if (!await confirmDialog('Effacer toutes les clés API enregistrées dans ce navigateur ?', { confirm: 'Effacer', danger: true })) return;
    keystore.forgetAll();
    toast('Clés effacées.');
    app.refreshStatus();
    drawBrowser(panel, app);
  });

  if (encrypted && locked) setStatus('Déverrouillez le coffre pour utiliser ou modifier la clé.', '');
}

function drawServer(panel, app, { autoload = false } = {}) {
  const c = settings.get().connection;
  const s = session.get();
  panel.innerHTML = `
    <div class="notice">${icon('server')}<div>
      <p><b>La clé API reste sur le serveur.</b> Les requêtes passent par la fonction Netlify <code>/api/chat</code>, protégée par mot de passe et limitée en débit.</p>
      <p>Configuration : variables d'environnement <code>PROVIDER_BASE_URL</code>, <code>PROVIDER_API_KEY</code>, <code>ACCESS_PASSWORD_HASH</code> et <code>TOKEN_SECRET</code> (voir le README).</p>
    </div></div>
    <div data-auth></div>
    <p class="status-line" role="status" data-status></p>
    <div data-server-models ${s ? '' : 'hidden'}>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><button class="btn" type="button" data-load>${icon('refresh')}Charger les modèles du serveur</button></div>
      <div data-picker></div>
      <p class="hint" style="margin-top:8px">Laissez vide pour utiliser le modèle par défaut du serveur (<code>PROVIDER_DEFAULT_MODEL</code>).</p>
    </div>`;
  const statusEl = $('[data-status]', panel);
  const setStatus = (text, kind = '') => {
    statusEl.dataset.kind = kind;
    statusEl.innerHTML = text ? `${icon(kind === 'error' ? 'alert' : kind === 'ok' ? 'check' : 'info')}<span>${esc(text)}</span>` : '';
  };
  const auth = $('[data-auth]', panel);
  if (s) {
    auth.innerHTML = `<div class="row-item" style="margin-bottom:12px"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--ok)"></span><div class="grow"><b>Connecté</b><div class="hint">Session valable jusqu'à ${formatTime(s.expiresAt)}</div></div><button class="btn btn-sm" type="button" data-logout>${icon('logout')}Se déconnecter</button></div>`;
    $('[data-logout]', auth).addEventListener('click', () => { session.clear(); app.refreshStatus(); drawServer(panel, app); });
  } else {
    auth.innerHTML = `<form class="field" data-login-form>
      <label for="srv-pass">Mot de passe d'accès</label>
      <div class="input-row"><div class="input-wrap"><input type="password" id="srv-pass" autocomplete="current-password" required></div><button class="btn btn-primary" type="submit">${icon('lock')}Se connecter</button></div>
    </form>`;
    $('[data-login-form]', auth).addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = $('#srv-pass', auth);
      const btn = e.currentTarget.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus('Connexion…');
      try {
        await serverLogin(pass.value);
        settings.set('onboarded', true);
        app.refreshStatus(true);
        drawServer(panel, app, { autoload: true });
      } catch (err) {
        pass.setAttribute('aria-invalid', 'true');
        const info = describeError(err);
        setStatus(`${info.title}. ${info.text}`, 'error');
        btn.disabled = false;
      }
    });
  }
  let picker = null;
  if (s) {
    picker = mountModelPicker($('[data-picker]', panel), {
      models: app.getModels(), value: c.serverModel, freeFilter: true, freeOnly: c.freeOnly, showAll: c.showAll,
      onChange: (id) => { settings.set('connection', { serverModel: id }); app.refreshStatus(); },
      onPrefs: (prefs) => settings.set('connection', prefs),
    });
    $('[data-load]', panel).addEventListener('click', () => loadServerModels());
    if (autoload) { setStatus('Connecté au serveur. Chargement des modèles…', 'ok'); loadServerModels(); }
  }
  async function loadServerModels() {
    const pk = picker;
    try {
      const models = await listModels();
      app.setModels(models);
      pk?.setModels(models);
      setStatus(`Connecté : ${models.filter((m) => m.chat).length} modèles disponibles sur le serveur.`, 'ok');
    } catch (err) {
      const info = describeError(err);
      setStatus(`${info.title}. ${info.text}`, 'error');
    }
  }
}

/* =====================================================================
   Assistant
   ===================================================================== */
function renderAssistant(root, app) {
  const s = settings.get();
  const a = s.assistant;
  root.innerHTML = `
    <h3 class="section-title">Identité</h3>
    <div class="grid-2">
      <div class="field"><label for="as-name">Nom de l'assistant</label><input type="text" id="as-name" value="${esc(a.name)}" maxlength="40" autocomplete="off"><p class="hint">« Nour » signifie « lumière ».</p></div>
      <div class="field"><label for="as-tone">Ton</label><select id="as-tone">${TONES.map((t) => `<option value="${t.id}" ${t.id === a.tone ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select><p class="hint" data-tone-hint></p></div>
    </div>
    <div class="field">
      <span class="field-label" id="avatar-label">Avatar</span>
      <div class="avatar-pick" role="group" aria-labelledby="avatar-label" data-avatars></div>
      <input type="file" accept="image/png,image/jpeg,image/webp" id="avatar-file" hidden>
    </div>

    <h3 class="section-title">Vous</h3>
    <div class="field"><label for="pf-name">Votre prénom</label><input type="text" id="pf-name" value="${esc(s.profile.name)}" maxlength="40" autocomplete="given-name"></div>
    <div class="field"><label for="pf-about">À propos de vous</label><textarea id="pf-about" class="short" rows="2" maxlength="600">${esc(s.profile.about)}</textarea><p class="hint">Contexte transmis à chaque conversation : métier, projets, préférences.</p></div>

    <h3 class="section-title">Mode par défaut des nouvelles conversations</h3>
    <div class="persona-list" role="group" aria-label="Mode par défaut" data-personas></div>

    <h3 class="section-title">Invites système</h3>
    <div class="field">
      <label for="pr-pick">Mode à personnaliser</label>
      <select id="pr-pick">${PERSONAS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
    </div>
    <div class="field">
      <label for="pr-text">Invite système de ce mode</label>
      <textarea id="pr-text" rows="7" class="mono"></textarea>
      <p class="hint">Variables : <code>{nom}</code> (nom de l'assistant) et <code>{prenom}</code> (votre prénom). Le ton, votre profil, la mémoire et la date sont ajoutés automatiquement.</p>
      <div><button class="btn btn-sm btn-ghost" type="button" data-pr-reset>${icon('refresh')}Rétablir l'invite d'origine</button></div>
    </div>
    <div class="field">
      <label for="as-custom">Consignes personnelles (ajoutées à chaque conversation)</label>
      <textarea id="as-custom" rows="3" placeholder="ex. Donne toujours un exemple concret. Utilise les unités métriques.">${esc(a.customInstructions)}</textarea>
    </div>
    <details class="reasoning" style="margin-top:4px"><summary>${icon('chevron-down')}Aperçu de l'invite complète</summary><pre class="mono" data-preview style="white-space:pre-wrap;font-size:.78rem;margin:8px 0 0;color:var(--text-2)"></pre></details>`;

  const preview = $('[data-preview]', root);
  const refreshPreview = () => { preview.textContent = buildSystemPrompt(settings.get(), $('#pr-pick', root).value, app.memoryFacts()); };

  $('#as-name', root).addEventListener('input', (e) => { settings.set('assistant', { name: e.target.value.trim() || 'Nour' }); app.refreshChrome(); refreshPreview(); drawAvatars(); });
  const toneHint = $('[data-tone-hint]', root);
  const setToneHint = () => { toneHint.textContent = (TONES.find((t) => t.id === settings.get().assistant.tone) || TONES[0]).text; };
  setToneHint();
  $('#as-tone', root).addEventListener('change', (e) => { settings.set('assistant', { tone: e.target.value }); setToneHint(); refreshPreview(); app.refreshChrome(); });
  $('#pf-name', root).addEventListener('input', (e) => { settings.set('profile', { name: e.target.value.trim() }); app.refreshChrome(); refreshPreview(); });
  $('#pf-about', root).addEventListener('input', (e) => { settings.set('profile', { about: e.target.value }); refreshPreview(); });
  $('#as-custom', root).addEventListener('input', (e) => { settings.set('assistant', { customInstructions: e.target.value }); refreshPreview(); });

  // Avatars
  const avBox = $('[data-avatars]', root);
  function drawAvatars() {
    const cur = settings.get().assistant.avatar || {};
    const name = settings.get().assistant.name;
    const opts = [
      ...AVATAR_GLYPHS.map((g) => ({ type: 'glyph', value: g.id, label: g.label })),
      { type: 'initial', value: '', label: 'Initiale' },
    ];
    if (cur.type === 'image') opts.push({ type: 'image', value: cur.value, label: 'Image personnalisée' });
    avBox.innerHTML = opts.map((o, i) => `<button type="button" class="avatar-opt" data-av="${i}" aria-pressed="${cur.type === o.type && (o.type !== 'glyph' || cur.value === o.value)}" aria-label="${esc(o.label)}" title="${esc(o.label)}">${avatarHTML(o, name)}</button>`).join('')
      + `<button type="button" class="avatar-opt upload" data-av-upload aria-label="Importer une image" title="Importer une image">${icon('upload')}</button>`;
    $$('[data-av]', avBox).forEach((b) => b.addEventListener('click', () => {
      const o = opts[Number(b.dataset.av)];
      settings.set('assistant', { avatar: { type: o.type, value: o.value } });
      drawAvatars();
      app.refreshChrome();
    }));
    $('[data-av-upload]', avBox).addEventListener('click', () => $('#avatar-file', root).click());
  }
  drawAvatars();
  $('#avatar-file', root).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = await readAsDataURL(f);
      const small = await downscale(url, 160);
      settings.set('assistant', { avatar: { type: 'image', value: small } });
      drawAvatars();
      app.refreshChrome();
    } catch { toast('Image illisible.', { kind: 'error' }); }
  });

  // Mode par défaut
  const pBox = $('[data-personas]', root);
  function drawPersonas() {
    const cur = settings.get().assistant.defaultPersona;
    pBox.innerHTML = PERSONAS.map((p) => `<button type="button" class="persona-card" aria-pressed="${p.id === cur}" data-persona="${p.id}">${icon(p.icon)}<div><b>${esc(p.name)}</b><span>${esc(p.desc)}</span></div></button>`).join('');
    $$('[data-persona]', pBox).forEach((b) => b.addEventListener('click', () => {
      settings.set('assistant', { defaultPersona: b.dataset.persona });
      drawPersonas();
      app.refreshChrome();
    }));
  }
  drawPersonas();

  // Invites système
  const pick = $('#pr-pick', root);
  const text = $('#pr-text', root);
  const load = () => {
    const o = settings.get().assistant.promptOverrides || {};
    text.value = o[pick.value] || personaById(pick.value).prompt;
    refreshPreview();
  };
  pick.value = settings.get().assistant.defaultPersona;
  pick.addEventListener('change', load);
  text.addEventListener('input', () => {
    const o = { ...(settings.get().assistant.promptOverrides || {}) };
    if (text.value.trim() === personaById(pick.value).prompt.trim()) delete o[pick.value];
    else o[pick.value] = text.value;
    settings.set('assistant', { promptOverrides: o });
    refreshPreview();
  });
  $('[data-pr-reset]', root).addEventListener('click', () => {
    const o = { ...(settings.get().assistant.promptOverrides || {}) };
    delete o[pick.value];
    settings.set('assistant', { promptOverrides: o });
    load();
    toast('Invite d’origine rétablie.');
  });
  load();
}

function downscale(dataUrl, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/* =====================================================================
   Préférences
   ===================================================================== */
function renderPreferences(root, app) {
  const p = settings.get().prefs;
  const seg = (name, value, options, label) => `<div class="seg" role="radiogroup" aria-label="${esc(label)}">${options.map(([v, label, ico]) => `<label><input type="radio" name="${name}" value="${v}" ${v === value ? 'checked' : ''}><span>${ico ? icon(ico) : ''}${esc(label)}</span></label>`).join('')}</div>`;
  root.innerHTML = `
    <h3 class="section-title">Apparence</h3>
    <div class="field"><span class="field-label">Thème</span>${seg('theme', p.theme, [['system', 'Système', 'monitor'], ['light', 'Clair', 'sun'], ['dark', 'Sombre', 'moon']], 'Thème')}</div>
    <div class="grid-2">
      <div class="field"><span class="field-label">Police des réponses</span>${seg('readingFont', p.readingFont, [['sans', 'Sans empattement'], ['serif', 'Serif (lecture)']], 'Police des réponses')}</div>
      <div class="field"><span class="field-label">Taille du texte</span>${seg('textSize', p.textSize, [['s', 'Petite'], ['m', 'Normale'], ['l', 'Grande']], 'Taille du texte')}</div>
    </div>

    <h3 class="section-title">Génération</h3>
    <div class="field">
      <label for="pf-temp">Température <span class="hint" style="display:inline">— créativité des réponses</span></label>
      <div class="range-row"><input type="range" id="pf-temp" min="0" max="2" step="0.1" value="${p.temperature}"><output for="pf-temp" data-temp>${Number(p.temperature).toFixed(1)}</output></div>
      <p class="hint">0 = précis et constant · 0,7 = équilibré · au-delà de 1,2 = très créatif, parfois incohérent.</p>
    </div>
    <div class="grid-2">
      <div class="field"><label for="pf-max">Longueur maximale de réponse (jetons)</label><input type="number" id="pf-max" min="16" max="200000" step="16" value="${esc(p.maxTokens)}" placeholder="Défaut du fournisseur"></div>
      <div class="field"><label for="pf-ctx">Contexte envoyé au maximum (jetons)</label><input type="number" id="pf-ctx" min="1000" max="1000000" step="1000" value="${esc(p.contextTokens)}"><p class="hint">Les plus anciens messages sont retirés au-delà.</p></div>
    </div>

    <h3 class="section-title">Saisie et mémoire</h3>
    <label class="switch"><span class="label"><b>Entrée envoie le message</b><small>Sinon, utilisez Ctrl + Entrée (⌘ + Entrée sur Mac).</small></span><input type="checkbox" role="switch" data-pref="enterToSend" ${p.enterToSend ? 'checked' : ''}></label>
    <label class="switch"><span class="label"><b>Utiliser la mémoire</b><small>Les faits enregistrés dans « Mémoire » sont ajoutés à l'invite système.</small></span><input type="checkbox" role="switch" data-pref="useMemory" ${p.useMemory ? 'checked' : ''}></label>

    <h3 class="section-title">Voix</h3>
    ${speechSupported() ? `
    <div class="grid-2">
      <div class="field"><label for="pf-voice">Voix de lecture</label><select id="pf-voice"><option value="">Automatique (français)</option></select></div>
      <div class="field"><label for="pf-rate">Vitesse</label><div class="range-row"><input type="range" id="pf-rate" min="0.6" max="1.6" step="0.1" value="${p.speechRate}"><output data-rate>${Number(p.speechRate).toFixed(1)}×</output></div></div>
    </div>
    <button class="btn btn-sm" type="button" data-voice-test>${icon('volume')}Écouter un exemple</button>` : '<p class="hint">La lecture à voix haute n’est pas disponible dans ce navigateur.</p>'}`;

  $$('input[type="radio"]', root).forEach((r) => r.addEventListener('change', () => {
    settings.set('prefs', { [r.name]: r.value });
    app.applyPrefs();
  }));
  const temp = $('#pf-temp', root);
  temp.addEventListener('input', () => { $('[data-temp]', root).textContent = Number(temp.value).toFixed(1); settings.set('prefs', { temperature: Number(temp.value) }); });
  $('#pf-max', root).addEventListener('change', (e) => { const v = Number(e.target.value); settings.set('prefs', { maxTokens: v > 0 ? Math.round(v) : '' }); });
  $('#pf-ctx', root).addEventListener('change', (e) => { const v = Math.max(1000, Number(e.target.value) || 16000); e.target.value = v; settings.set('prefs', { contextTokens: v }); app.updateTokens(); });
  $$('[data-pref]', root).forEach((c) => c.addEventListener('change', () => { settings.set('prefs', { [c.dataset.pref]: c.checked }); app.refreshChrome(); }));

  const voiceSel = $('#pf-voice', root);
  if (voiceSel) {
    const fill = () => {
      const voices = frenchVoices();
      voiceSel.innerHTML = '<option value="">Automatique (français)</option>' + voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === settings.get().prefs.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
    };
    fill();
    speechSynthesis.addEventListener?.('voiceschanged', fill, { once: true });
    voiceSel.addEventListener('change', () => settings.set('prefs', { voiceURI: voiceSel.value }));
    const rate = $('#pf-rate', root);
    rate.addEventListener('input', () => { $('[data-rate]', root).textContent = `${Number(rate.value).toFixed(1)}×`; settings.set('prefs', { speechRate: Number(rate.value) }); });
    $('[data-voice-test]', root).addEventListener('click', () => {
      const pr = settings.get().prefs;
      speak(`Bonjour ${settings.get().profile.name || ''}, je suis ${settings.get().assistant.name}. Voici ma voix.`, { voiceURI: pr.voiceURI, rate: pr.speechRate });
    });
  }
}

/* =====================================================================
   Données
   ===================================================================== */
function renderData(root, app) {
  root.innerHTML = `
    <h3 class="section-title">Exporter</h3>
    <div class="data-actions">
      <button class="btn" type="button" data-export="json">${icon('download')}Tout exporter (JSON)</button>
      <button class="btn" type="button" data-export="md">${icon('download')}Tout exporter (Markdown)</button>
    </div>
    <p class="hint" style="margin:-8px 0 18px">Le JSON contient conversations, mémoire, bibliothèque et réglages — jamais les clés API.</p>
    <h3 class="section-title">Importer</h3>
    <div class="data-actions">
      <button class="btn" type="button" data-import>${icon('upload')}Importer un fichier JSON</button>
      <input type="file" accept="application/json,.json" data-import-file hidden>
    </div>
    <h3 class="section-title">Stockage</h3>
    <p class="hint" data-storage style="margin-bottom:18px">Calcul…</p>
    <div class="notice">${icon('info')}<div><p>Vos conversations restent dans ce navigateur (IndexedDB). Rien n'est envoyé ailleurs qu'au fournisseur d'IA choisi, au moment où vous envoyez un message.</p></div></div>
    <h3 class="section-title">Zone sensible</h3>
    <div class="data-actions">
      <button class="btn btn-danger" type="button" data-wipe>${icon('trash')}Supprimer toutes les conversations</button>
      <button class="btn btn-danger" type="button" data-reset>${icon('refresh')}Réinitialiser l'application</button>
    </div>`;
  $$('[data-export]', root).forEach((b) => b.addEventListener('click', () => app.exportAll(b.dataset.export)));
  const file = $('[data-import-file]', root);
  $('[data-import]', root).addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (f) { await app.importFile(f); drawStorage(); }
  });
  $('[data-wipe]', root).addEventListener('click', async () => { if (await app.deleteAll()) drawStorage(); });
  $('[data-reset]', root).addEventListener('click', () => app.resetApp());
  const storage = $('[data-storage]', root);
  async function drawStorage() {
    const n = app.conversationCount();
    let used = '';
    try {
      const est = await navigator.storage?.estimate?.();
      if (est && est.usage != null) used = ` · environ ${formatBytes(est.usage)} utilisés`;
    } catch { /* indisponible */ }
    storage.textContent = `${n} conversation${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}${used}.`;
  }
  drawStorage();
}

export { ApiError };
