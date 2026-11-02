// Nour — orchestration de l'interface.

import { $, $$, esc, icon, html, uid, debounce, copyText, download, slugify, formatNumber, formatBytes, modKey } from './util.js';
import { db } from './db.js';
import { settings } from './settings.js';
import { keystore } from './keystore.js';
import { providerById } from './providers.js';
import { connection, streamChat, listModels, session } from './client.js';
import { buildSystemPrompt, PERSONAS, personaById } from './personas.js';
import { memory, extractionMessages, parseFacts } from './memory.js';
import { templates, applyTemplate } from './templates.js';
import { processFiles, toApiContent } from './attachments.js';
import { startDictation, stopDictation, dictationSupported, speak, stopSpeaking, speechSupported } from './voice.js';
import { estimateMessages, conversationToMarkdown, buildExport, parseImport } from './exporter.js';
import { onMathReady, splitThink } from './markdown.js';
import { openDialog, confirmDialog, promptDialog, toast, toggleMenu, floatingMenu, closeMenus } from './ui/dialogs.js';
import { openSettings } from './ui/settings-dialog.js';
import { openMemory, openMemoryReview, openLibrary, openShortcuts, openUnlock } from './ui/panels.js';
import { userMessageEl, assistantMessageEl, fillAssistant, editBoxEl, welcomeEl, reasoningOpen } from './ui/thread.js';
import { mountModelPicker } from './ui/model-picker.js';
import { describeError } from './ui/errors.js';
import { avatarHTML } from './ui/avatar.js';

/* ---------- État ---------- */
const state = {
  conversations: [],
  current: null,
  draftPersona: settings.get().assistant.defaultPersona,
  attachments: [],
  gen: null,
  models: [],
  search: '',
  slash: { open: false, items: [], index: 0 },
  speakingId: null,
  dictation: null,
  suggestCtl: null,
  stick: true,
};

const els = {
  app: $('#app'),
  main: $('#main'),
  sidebar: $('#sidebar'),
  scrim: $('.scrim'),
  list: $('#conv-list'),
  search: $('#search-input'),
  thread: $('#thread'),
  messages: $('#messages'),
  title: $('#conv-title'),
  persona: $('#persona-select'),
  modelChip: $('#model-chip'),
  modelLabel: $('#model-chip-label'),
  status: $('#conn-status'),
  composer: $('#composer'),
  box: $('#composer-box'),
  input: $('#composer-input'),
  send: $('#send-btn'),
  attachments: $('#attachments'),
  fileInput: $('#file-input'),
  mic: $('#mic-btn'),
  tokens: $('#token-est'),
  slash: $('#slash'),
  toBottom: $('#to-bottom'),
  offline: $('#offline-bar'),
  drop: $('#drop-zone'),
  live: $('#live'),
  themeBtn: $('#theme-btn'),
  convMenuBtn: $('#conv-menu-btn'),
  convMenu: $('#conv-menu'),
  sidebarToggle: $('#sidebar-toggle'),
  memoryCount: $('#memory-count'),
  note: $('#composer-note'),
};

const mobileMQ = window.matchMedia('(max-width: 900px)');
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

/* ---------- Façade passée aux panneaux ---------- */
const app = {
  refreshStatus: (fresh) => refreshStatus(fresh),
  refreshChrome: () => { refreshStatus(); renderHeader(); renderThread(); updateComposerState(); },
  setModels: (models) => setModels(models),
  getModels: () => state.models,
  applyPrefs: () => applyPrefs(),
  updateTokens: () => updateTokens(),
  memoryFacts: () => memory.all(),
  currentConversation: () => state.current,
  suggestMemories: () => suggestMemories(),
  cancelSuggest: () => { state.suggestCtl?.abort(); state.suggestCtl = null; },
  insertTemplate: (t) => insertTemplate(t),
  exportAll: (fmt) => exportAll(fmt),
  importFile: (f) => importFile(f),
  deleteAll: () => deleteAll(),
  resetApp: () => resetApp(),
  conversationCount: () => state.conversations.length,
  unlock: () => unlock(),
};

/* ---------- Préférences d'affichage ---------- */
function applyPrefs() {
  const p = settings.get().prefs;
  const dark = p.theme === 'dark' || (p.theme === 'system' && darkMQ.matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.size = p.textSize || 'm';
  root.dataset.font = p.readingFont || 'sans';
  els.themeBtn.innerHTML = icon(dark ? 'sun' : 'moon');
  els.themeBtn.setAttribute('aria-label', dark ? 'Passer au thème clair' : 'Passer au thème sombre');
  els.themeBtn.title = els.themeBtn.getAttribute('aria-label');
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0E0F13' : '#F5F1E8'));
  els.note.textContent = `${p.enterToSend ? 'Entrée pour envoyer · Maj+Entrée pour aller à la ligne' : `${modKey()}+Entrée pour envoyer`} · ${settings.get().assistant.name} peut se tromper, vérifiez les informations importantes.`;
}
darkMQ.addEventListener('change', () => { if (settings.get().prefs.theme === 'system') applyPrefs(); });

/* ---------- Modèles en cache ---------- */
function modelsCacheKey() {
  const c = connection();
  return `nour.models:${c.mode}:${c.mode === 'server' ? 'srv' : `${c.provider.id}:${c.base}`}`;
}
function setModels(models) {
  state.models = models || [];
  if (!state.models.length) return;
  try { localStorage.setItem(modelsCacheKey(), JSON.stringify(state.models.slice(0, 600))); } catch { /* stockage plein */ }
}
function loadCachedModels() {
  try { state.models = JSON.parse(localStorage.getItem(modelsCacheKey()) || '[]'); } catch { state.models = []; }
}

/* ---------- Statut de connexion ---------- */
function refreshStatus(fresh = false) {
  if (fresh !== true) loadCachedModels();
  const c = connection();
  const s = settings.get();
  let stateName = 'none';
  let line1 = 'Non connecté';
  let line2 = 'Choisir un fournisseur';
  if (c.mode === 'server') {
    line1 = 'Serveur sécurisé';
    line2 = c.ready ? (c.model || 'Modèle par défaut du serveur') : 'Connexion requise';
    stateName = c.ready ? 'ok' : 'none';
  } else if (keystore.isLocked()) {
    line1 = c.provider.name; line2 = 'Coffre verrouillé'; stateName = 'locked';
  } else if (c.ready) {
    line1 = c.provider.name; line2 = c.model || 'Choisir un modèle'; stateName = c.model ? 'ok' : 'none';
  } else if (s.onboarded || c.provider) {
    line1 = c.provider.name; line2 = c.provider.keyOptional ? 'Adresse à vérifier' : 'Clé API manquante';
  }
  els.status.dataset.state = stateName;
  els.status.querySelector('.conn-provider').textContent = line1;
  els.status.querySelector('.conn-model').textContent = line2;
  els.status.setAttribute('aria-label', `Connexion : ${line1}, ${line2}. Ouvrir les réglages de connexion`);
  const model = c.model || (c.mode === 'server' && c.ready ? 'défaut serveur' : '');
  els.modelLabel.textContent = model ? model.split('/').pop() : 'Choisir un modèle';
  els.modelChip.title = model ? `Modèle : ${model}` : 'Choisir un modèle';
  els.modelChip.setAttribute('aria-label', model ? `Modèle : ${model}. Changer de modèle` : 'Choisir un modèle');
}

function isConfigured() {
  const c = connection();
  if (c.mode === 'server') return c.ready;
  if (keystore.isLocked()) return true; // configuré, simplement verrouillé
  return c.ready && !!c.model;
}

/* ---------- Barre latérale ---------- */
function dayStart(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

function highlight(text, q) {
  const s = String(text);
  if (!q) return esc(s);
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return esc(s);
  return `${esc(s.slice(0, i))}<mark>${esc(s.slice(i, i + q.length))}</mark>${esc(s.slice(i + q.length))}`;
}

function snippetFor(conv, q) {
  const lower = q.toLowerCase();
  for (const m of conv.messages) {
    const t = m.content || '';
    const i = t.toLowerCase().indexOf(lower);
    if (i !== -1) {
      const start = Math.max(0, i - 24);
      return `${start > 0 ? '…' : ''}${t.slice(start, i + q.length + 40).replace(/\s+/g, ' ')}`;
    }
  }
  return '';
}

function renderSidebar() {
  const q = state.search.trim();
  const items = state.conversations;
  const curId = state.current?.id;
  const itemHTML = (c, snippet = '') => `<li class="conv-item" data-id="${esc(c.id)}">
      <a href="#/c/${encodeURIComponent(c.id)}" ${c.id === curId ? 'aria-current="page"' : ''}>
        ${c.pinned ? `<svg class="ico pin" role="img" aria-label="Épinglée"><use href="#i-pin"/></svg>` : ''}
        ${snippet ? `<span class="stack"><span class="t">${highlight(c.title, q)}</span><span class="snippet">${highlight(snippet, q)}</span></span>` : `<span class="t">${q ? highlight(c.title, q) : esc(c.title)}</span>`}
      </a>
      <button class="item-menu-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Actions pour « ${esc(c.title)} »">${icon('dots')}</button>
    </li>`;

  if (q) {
    const ql = q.toLowerCase();
    const found = items.filter((c) => c.title.toLowerCase().includes(ql) || c.messages.some((m) => (m.content || '').toLowerCase().includes(ql)));
    els.list.innerHTML = found.length
      ? `<p class="conv-group">${found.length} résultat${found.length > 1 ? 's' : ''}</p><ul>${found.map((c) => itemHTML(c, c.title.toLowerCase().includes(ql) ? '' : snippetFor(c, q))).join('')}</ul>`
      : `<p class="conv-empty">Aucune conversation ne contient « ${esc(q)} ».</p>`;
    return;
  }
  if (!items.length) {
    els.list.innerHTML = '<p class="conv-empty">Vos conversations apparaîtront ici. Elles restent enregistrées dans ce navigateur.</p>';
    return;
  }
  const groups = [
    ['Épinglées', (c) => c.pinned],
    ["Aujourd'hui", (c) => c.updatedAt >= dayStart(0)],
    ['Hier', (c) => c.updatedAt >= dayStart(1)],
    ['7 derniers jours', (c) => c.updatedAt >= dayStart(7)],
    ['30 derniers jours', (c) => c.updatedAt >= dayStart(30)],
    ['Plus ancien', () => true],
  ];
  const used = new Set();
  let out = '';
  for (const [label, test] of groups) {
    const g = items.filter((c) => !used.has(c.id) && test(c));
    if (!g.length) continue;
    g.forEach((c) => used.add(c.id));
    out += `<p class="conv-group">${label}</p><ul>${g.map((c) => itemHTML(c)).join('')}</ul>`;
  }
  els.list.innerHTML = out;
}

/* ---------- En-tête ---------- */
function renderHeader() {
  const conv = state.current;
  const title = conv ? conv.title : 'Nouvelle conversation';
  els.title.textContent = title;
  document.title = conv ? `${title} — ${settings.get().assistant.name}` : `${settings.get().assistant.name} — assistant personnel`;
  const personaId = conv ? conv.persona : state.draftPersona;
  if (!els.persona.options.length) {
    els.persona.innerHTML = PERSONAS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  }
  els.persona.value = personaById(personaId).id;
  const pinBtn = els.convMenu.querySelector('[data-action="pin-current"] [data-label]');
  pinBtn.textContent = conv?.pinned ? 'Désépingler' : 'Épingler';
  $$('[data-action="rename-current"], [data-action="pin-current"], [data-action="export-md"], [data-action="export-json-current"], [data-action="delete-current"], [data-action="suggest-memories"]', els.convMenu)
    .forEach((b) => { b.disabled = !conv; });
  const n = memory.active().length;
  els.memoryCount.hidden = !n;
  els.memoryCount.textContent = n;
}

/* ---------- Fil ---------- */
function ctxFor(msg, conv) {
  const s = settings.get();
  const last = conv.messages[conv.messages.length - 1];
  return {
    name: s.assistant.name,
    avatar: s.assistant.avatar,
    isLast: last && last.id === msg.id,
    speakingId: state.speakingId,
    canSpeak: speechSupported(),
  };
}

const seenMessages = new Set();
function markEnter(el, id) {
  if (!seenMessages.has(id)) { el.classList.add('enter'); seenMessages.add(id); }
  return el;
}

function renderThread() {
  const conv = state.current;
  els.messages.innerHTML = '';
  if (!conv || !conv.messages.length) {
    const s = settings.get();
    els.messages.appendChild(welcomeEl({
      name: s.assistant.name,
      userName: s.profile.name,
      persona: conv ? conv.persona : state.draftPersona,
      tone: s.assistant.tone,
      configured: isConfigured(),
    }));
    els.toBottom.hidden = true;
    return;
  }
  const frag = document.createDocumentFragment();
  const lastUser = [...conv.messages].reverse().find((m) => m.role === 'user');
  for (const m of conv.messages) {
    if (m.role === 'user') frag.appendChild(markEnter(userMessageEl(m, { isLast: m === lastUser }), m.id));
    else frag.appendChild(markEnter(assistantMessageEl(m, ctxFor(m, conv)), m.id));
  }
  els.messages.appendChild(frag);
}

function messageEl(id) { return els.messages.querySelector(`[data-id="${CSS.escape(id)}"]`); }

function updateMessage(msg) {
  const el = messageEl(msg.id);
  if (el) fillAssistant(el, msg, ctxFor(msg, state.current));
}

function nearBottom() {
  const t = els.thread;
  return t.scrollHeight - t.scrollTop - t.clientHeight < 90;
}
function scrollToBottom(force = false) {
  if (force || state.stick) els.thread.scrollTop = els.thread.scrollHeight;
}
els.thread.addEventListener('scroll', () => {
  state.stick = nearBottom();
  els.toBottom.hidden = state.stick || !state.current?.messages?.length;
  if (els.thread.scrollTop > 4) els.main.dataset.scrolled = ''; else delete els.main.dataset.scrolled;
}, { passive: true });

/* ---------- Conversations ---------- */
function autoTitle(text, atts = []) {
  const clean = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`~[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return atts.length ? (atts[0].kind === 'image' ? 'Image' : `Fichier : ${atts[0].name}`) : 'Nouvelle conversation';
  let t = clean.slice(0, 64);
  if (clean.length > 64) t = `${t.slice(0, t.lastIndexOf(' ') > 30 ? t.lastIndexOf(' ') : 64)}…`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function saveConversation(conv) {
  // Une conversation supprimée entre-temps (génération interrompue) n'est pas recréée.
  if (!state.conversations.includes(conv)) return;
  try { await db.putConversation(conv); } catch (e) { toast('Enregistrement impossible : stockage plein ou indisponible.', { kind: 'error' }); }
}

function sortConversations() { state.conversations.sort((a, b) => b.updatedAt - a.updatedAt); }

function newChat({ focus = true } = {}) {
  state.current = null;
  state.draftPersona = settings.get().assistant.defaultPersona;
  state.attachments = [];
  history.replaceState(null, '', location.pathname + location.search);
  renderAttachments();
  renderSidebar();
  renderHeader();
  renderThread();
  updateComposerState();
  updateTokens();
  closeMobileSidebar();
  if (focus) els.input.focus();
}

function selectConversation(id, { focus = false } = {}) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) { newChat({ focus }); return; }
  if (state.current && state.current.id === id) { closeMobileSidebar(); return; }
  state.current = conv;
  state.stick = true;
  if (location.hash !== `#/c/${encodeURIComponent(id)}`) history.replaceState(null, '', `#/c/${encodeURIComponent(id)}`);
  renderSidebar();
  renderHeader();
  renderThread();
  updateComposerState();
  updateTokens();
  requestAnimationFrame(() => scrollToBottom(true));
  closeMobileSidebar();
  if (focus) els.input.focus();
}

async function deleteConversation(id) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) return;
  if (!await confirmDialog(`Supprimer « ${conv.title} » ? Cette action est définitive.`, { title: 'Supprimer la conversation', confirm: 'Supprimer', danger: true })) return;
  if (state.gen && state.gen.convId === id) stopGeneration();
  await db.deleteConversation(id);
  state.conversations = state.conversations.filter((c) => c.id !== id);
  if (state.current?.id === id) newChat({ focus: false });
  else renderSidebar();
  toast('Conversation supprimée.');
}

async function renameConversation(id) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) return;
  const name = await promptDialog({ title: 'Renommer', label: 'Titre de la conversation', value: conv.title, maxLength: 120 });
  if (!name) return;
  conv.title = name;
  await saveConversation(conv);
  renderSidebar();
  renderHeader();
}

async function togglePin(id) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) return;
  conv.pinned = !conv.pinned;
  await saveConversation(conv);
  renderSidebar();
  renderHeader();
  toast(conv.pinned ? 'Conversation épinglée.' : 'Conversation désépinglée.');
}

/* ---------- Construction des messages envoyés ---------- */
function apiMessagesFor(conv, uptoIndex, extraUser = null) {
  const system = buildSystemPrompt(settings.get(), conv ? conv.persona : state.draftPersona, memory.all());
  const src = conv ? conv.messages.slice(0, uptoIndex) : [];
  let hist = [];
  for (const m of src) {
    if (m.role === 'user') hist.push({ role: 'user', content: toApiContent(m.content, m.attachments) });
    else if (m.role === 'assistant' && m.content && m.status !== 'error' && m.status !== 'streaming') {
      hist.push({ role: 'assistant', content: splitThink(m.content).answer || m.content });
    }
  }
  if (extraUser) hist.push(extraUser);
  // Fusion de messages consécutifs du même rôle (certains fournisseurs exigent l'alternance).
  const merged = [];
  for (const m of hist) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === m.role) {
      const toParts = (c) => (Array.isArray(c) ? c : [{ type: 'text', text: c }]);
      if (typeof prev.content === 'string' && typeof m.content === 'string') prev.content = `${prev.content}\n\n${m.content}`;
      else prev.content = [...toParts(prev.content), ...toParts(m.content)];
    } else merged.push({ ...m });
  }
  hist = merged;
  // Limite de contexte : on retire les plus anciens échanges.
  const budget = Number(settings.get().prefs.contextTokens) || 16000;
  const sys = { role: 'system', content: system };
  while (hist.length > 1 && estimateMessages([sys, ...hist]) > budget) {
    hist.shift();
    while (hist.length > 1 && hist[0].role !== 'user') hist.shift();
  }
  return [sys, ...hist];
}

/* ---------- Envoi et génération ---------- */
async function send() {
  if (state.gen) return;
  const text = els.input.value.trim();
  const atts = state.attachments;
  if (!text && !atts.length) return;
  closeSlash();
  if (state.dictation) stopDictation();
  if (keystore.isLocked() && connection().mode === 'browser') {
    const ok = await unlock();
    if (!ok) return;
  }
  if (!isConfigured()) {
    toast('Connectez d’abord une IA et choisissez un modèle.', { kind: 'error' });
    openSettings(app, { tab: 'connexion' });
    return;
  }
  let conv = state.current;
  const now = Date.now();
  if (!conv) {
    conv = { id: uid('c_'), title: autoTitle(text, atts), createdAt: now, updatedAt: now, pinned: false, persona: state.draftPersona, model: '', messages: [] };
    state.conversations.unshift(conv);
    state.current = conv;
    history.replaceState(null, '', `#/c/${encodeURIComponent(conv.id)}`);
  }
  conv.messages.push({ id: uid('msg_'), role: 'user', content: text, attachments: atts.length ? atts : undefined, createdAt: now });
  els.input.value = '';
  state.attachments = [];
  renderAttachments();
  autoGrow();
  const reply = { id: uid('msg_'), role: 'assistant', content: '', reasoning: '', status: 'streaming', createdAt: now };
  conv.messages.push(reply);
  state.stick = true;
  await generate(conv, reply);
}

let renderTimer = 0;
let lastRender = 0;
function scheduleStreamRender(msg) {
  if (renderTimer) return;
  const wait = Math.max(0, 50 - (performance.now() - lastRender));
  renderTimer = setTimeout(() => {
    renderTimer = 0;
    requestAnimationFrame(() => {
      lastRender = performance.now();
      if (state.current && state.current.messages.includes(msg)) {
        updateMessage(msg);
        scrollToBottom();
      }
    });
  }, wait);
}

function snapshot(msg) {
  return { content: msg.content, reasoning: msg.reasoning || '', model: msg.model || '', status: msg.status, createdAt: msg.createdAt, finish: msg.finish || null, usage: msg.usage || null, error: msg.error || null };
}

async function generate(conv, msg) {
  const idx = conv.messages.indexOf(msg);
  const conn = connection();
  const model = conn.model;
  const prefs = settings.get().prefs;
  const messages = apiMessagesFor(conv, idx);
  Object.assign(msg, { content: '', reasoning: '', status: 'streaming', error: null, finish: null, usage: null, model: model || (conn.mode === 'server' ? 'serveur' : ''), createdAt: Date.now() });
  conv.model = model;
  conv.updatedAt = Date.now();
  const controller = new AbortController();
  state.gen = { convId: conv.id, msgId: msg.id, controller };
  sortConversations();
  renderSidebar();
  renderHeader();
  renderThread();
  updateComposerState();
  scrollToBottom(true);
  saveConversation(conv);
  let lastSave = Date.now();

  try {
    const out = await streamChat({
      messages, model, temperature: Number(prefs.temperature), maxTokens: prefs.maxTokens, signal: controller.signal,
      onDelta: (o) => {
        msg.content = o.content;
        msg.reasoning = o.reasoning;
        scheduleStreamRender(msg);
        if (Date.now() - lastSave > 1500) { lastSave = Date.now(); saveConversation(conv); }
      },
    });
    msg.content = out.content;
    msg.reasoning = out.reasoning;
    msg.status = 'done';
    msg.finish = out.finish;
    msg.usage = out.usage;
    if (out.model) msg.model = out.model;
    if (!out.content && !out.reasoning) {
      msg.status = 'error';
      msg.error = { kind: 'stream', message: 'Réponse vide', detail: 'Le modèle n’a renvoyé aucun texte.' };
    }
    announce(msg.status === 'done' ? 'Réponse terminée.' : 'Réponse vide.');
  } catch (e) {
    if (e && e.name === 'AbortError') {
      msg.status = 'stopped';
      announce('Génération interrompue.');
    } else {
      msg.status = 'error';
      msg.error = { kind: e.kind || 'unknown', message: e.message || '', detail: e.detail || '', status: e.status || 0, retryAfter: e.retryAfter || 0 };
      announce(describeError(msg.error).title);
    }
  } finally {
    clearTimeout(renderTimer);
    renderTimer = 0;
    if (msg.versions) msg.versions[msg.current] = snapshot(msg);
    state.gen = null;
    conv.updatedAt = Date.now();
    await saveConversation(conv);
    if (state.current === conv) {
      renderThread();
      scrollToBottom();
    }
    renderSidebar();
    updateComposerState();
    updateTokens();
  }
}

function stopGeneration() {
  if (state.gen) state.gen.controller.abort();
}

async function regenerate(msgId) {
  if (state.gen) return;
  const conv = state.current;
  if (!conv) return;
  const msg = conv.messages.find((m) => m.id === msgId);
  if (!msg || msg.role !== 'assistant') return;
  if (conv.messages[conv.messages.length - 1] !== msg) return;
  if (keystore.isLocked() && connection().mode === 'browser' && !await unlock()) return;
  if (!isConfigured()) { openSettings(app, { tab: 'connexion' }); return; }
  const failedEmpty = (msg.status === 'error' || msg.status === 'stopped') && !msg.content;
  if (!failedEmpty) {
    if (!msg.versions || !msg.versions.length) { msg.versions = [snapshot(msg)]; msg.current = 0; }
    msg.versions.push({ content: '', reasoning: '', model: '', status: 'streaming', createdAt: Date.now() });
    msg.current = msg.versions.length - 1;
  }
  reasoningOpen.delete(msg.id);
  state.stick = true;
  await generate(conv, msg);
}

async function switchVersion(msgId, delta) {
  const conv = state.current;
  const msg = conv?.messages.find((m) => m.id === msgId);
  if (!msg || !msg.versions || state.gen) return;
  const next = Math.min(Math.max(0, (msg.current ?? 0) + delta), msg.versions.length - 1);
  msg.current = next;
  Object.assign(msg, msg.versions[next]);
  updateMessage(msg);
  messageEl(msg.id)?.querySelector(`[data-act="${delta < 0 ? 'prev' : 'next'}"]:not([disabled])`)?.focus();
  await saveConversation(conv);
}

function startEdit(msgId) {
  if (state.gen) return;
  const conv = state.current;
  const msg = conv?.messages.find((m) => m.id === msgId);
  const el = msg && messageEl(msgId);
  if (!el) return;
  const box = editBoxEl(msg);
  el.querySelector('.bubble')?.replaceWith(box);
  if (!el.querySelector('.edit-box')) el.appendChild(box);
  el.querySelector('.msg-actions').hidden = true;
  const ta = box.querySelector('textarea');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  const autosize = () => { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight + 2, window.innerHeight * 0.5)}px`; };
  autosize();
  ta.addEventListener('input', autosize);
  const commit = async () => {
    const text = ta.value.trim();
    if (!text && !(msg.attachments && msg.attachments.length)) return;
    if (keystore.isLocked() && connection().mode === 'browser' && !await unlock()) return;
    if (!isConfigured()) { openSettings(app, { tab: 'connexion' }); return; }
    const idx = conv.messages.indexOf(msg);
    msg.content = text;
    msg.editedAt = Date.now();
    conv.messages = conv.messages.slice(0, idx + 1);
    if (idx === 0) conv.title = autoTitle(text, msg.attachments || []);
    const reply = { id: uid('msg_'), role: 'assistant', content: '', reasoning: '', status: 'streaming', createdAt: Date.now() };
    conv.messages.push(reply);
    state.stick = true;
    await generate(conv, reply);
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]');
    if (!b) return;
    if (b.dataset.edit === 'cancel') renderThread(); else commit();
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); renderThread(); }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && (settings.get().prefs.enterToSend || e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
  });
}

function announce(text) {
  els.live.textContent = '';
  setTimeout(() => { els.live.textContent = text; }, 30);
}

/* ---------- Actions sur les messages ---------- */
els.messages.addEventListener('click', async (e) => {
  const codeBtn = e.target.closest('[data-copy-code]');
  if (codeBtn) {
    const code = codeBtn.closest('.code-block')?.querySelector('pre code')?.textContent || '';
    if (await copyText(code)) flash(codeBtn, 'Copié');
    return;
  }
  const summary = e.target.closest('details.reasoning > summary');
  if (summary) {
    const art = summary.closest('.msg');
    if (art) reasoningOpen.set(art.dataset.id, !summary.parentElement.open);
    return;
  }
  const chip = e.target.closest('[data-persona]');
  if (chip) { setPersona(chip.dataset.persona); return; }
  const sugg = e.target.closest('[data-prompt]');
  if (sugg) {
    els.input.value = sugg.dataset.prompt;
    autoGrow();
    updateComposerState();
    updateTokens();
    els.input.focus();
    return;
  }
  const prov = e.target.closest('[data-setup-provider]');
  if (prov) { openSettings(app, { tab: 'connexion', provider: prov.dataset.setupProvider }); return; }
  if (e.target.closest('[data-setup-server]')) { settings.set('connection', { mode: 'server' }); openSettings(app, { tab: 'connexion' }); return; }

  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const art = btn.closest('.msg');
  const conv = state.current;
  const msg = conv?.messages.find((m) => m.id === art?.dataset.id);
  const act = btn.dataset.act;
  if (act === 'settings') { openSettings(app, { tab: 'connexion' }); return; }
  if (act === 'unlock') { await unlock(); return; }
  if (!msg) return;
  if (act === 'copy') { if (await copyText(msg.content)) flash(btn); }
  else if (act === 'edit') startEdit(msg.id);
  else if (act === 'regenerate' || act === 'retry') regenerate(msg.id);
  else if (act === 'prev') switchVersion(msg.id, -1);
  else if (act === 'next') switchVersion(msg.id, 1);
  else if (act === 'speak') toggleSpeak(msg);
});

function flash(btn, label = '') {
  btn.classList.add('done');
  const prev = btn.innerHTML;
  btn.innerHTML = `${icon('check')}${label ? `<span>${esc(label)}</span>` : ''}`;
  setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = prev; }, 1600);
}

function toggleSpeak(msg) {
  if (state.speakingId === msg.id) {
    stopSpeaking();
    state.speakingId = null;
    updateMessage(msg);
    return;
  }
  const prev = state.speakingId;
  const p = settings.get().prefs;
  const ok = speak(splitThink(msg.content).answer, {
    voiceURI: p.voiceURI, rate: p.speechRate, id: msg.id,
    onEnd: () => {
      if (state.speakingId === msg.id) { state.speakingId = null; updateMessage(msg); }
    },
  });
  if (!ok) { toast('Lecture à voix haute indisponible.', { kind: 'error' }); return; }
  state.speakingId = msg.id;
  if (prev) { const pm = state.current?.messages.find((m) => m.id === prev); if (pm) updateMessage(pm); }
  updateMessage(msg);
}

function setPersona(id) {
  const p = personaById(id);
  if (state.current) {
    state.current.persona = p.id;
    saveConversation(state.current);
  } else {
    state.draftPersona = p.id;
  }
  renderHeader();
  if (!state.current || !state.current.messages.length) renderThread();
  updateTokens();
  toast(`Mode « ${p.name} »`);
}

/* ---------- Zone de saisie ---------- */
function autoGrow() {
  const ta = els.input;
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight, Math.round(window.innerHeight * 0.4))}px`;
}

function updateComposerState() {
  const busy = !!state.gen;
  const has = els.input.value.trim().length > 0 || state.attachments.length > 0;
  els.send.classList.toggle('is-stop', busy);
  els.send.innerHTML = icon(busy ? 'stop' : 'send');
  els.send.setAttribute('aria-label', busy ? 'Arrêter la génération' : 'Envoyer');
  els.send.title = busy ? 'Arrêter (Échap)' : 'Envoyer';
  els.send.disabled = !busy && !has;
  const name = settings.get().assistant.name;
  els.input.placeholder = mobileMQ.matches ? `Écrivez à ${name}…` : `Écrivez à ${name}… (/ pour les modèles de requêtes)`;
}

const updateTokens = debounce(() => {
  const draft = els.input.value.trim();
  const extra = draft || state.attachments.length ? { role: 'user', content: toApiContent(draft, state.attachments) } : null;
  const conv = state.current;
  const msgs = apiMessagesFor(conv, conv ? conv.messages.length : 0, extra);
  const n = estimateMessages(msgs);
  const budget = Number(settings.get().prefs.contextTokens) || 16000;
  els.tokens.textContent = `≈ ${n >= 10000 ? `${formatNumber(Math.round(n / 100) / 10)} k` : formatNumber(n)} jetons`;
  els.tokens.style.color = n > budget ? 'var(--danger)' : '';
  els.tokens.title = `Estimation des jetons envoyés (invite système, historique et message) — limite de contexte : ${formatNumber(budget)}`;
}, 120);

els.input.addEventListener('input', () => {
  autoGrow();
  updateComposerState();
  updateTokens();
  updateSlash();
});

els.input.addEventListener('keydown', (e) => {
  if (state.slash.open) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSlash(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSlash(-1); return; }
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
      if (state.slash.items.length) { e.preventDefault(); chooseSlash(state.slash.index); return; }
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSlash(); return; }
  }
  if (e.key === 'Enter' && !e.isComposing) {
    const p = settings.get().prefs;
    if ((p.enterToSend && !e.shiftKey) || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!state.gen) send();
      return;
    }
  }
  if (e.key === 'ArrowUp' && !els.input.value && state.current && !state.gen) {
    const lastUser = [...state.current.messages].reverse().find((m) => m.role === 'user');
    if (lastUser) { e.preventDefault(); startEdit(lastUser.id); }
  }
});

els.composer.addEventListener('submit', (e) => {
  e.preventDefault();
  if (state.gen) stopGeneration(); else send();
});

els.input.addEventListener('paste', async (e) => {
  const files = Array.from(e.clipboardData?.files || []);
  if (!files.length) return;
  e.preventDefault();
  await addFiles(files);
});

/* Pièces jointes */
async function addFiles(files) {
  const { items, errors } = await processFiles(files);
  errors.forEach((m) => toast(m, { kind: 'error', timeout: 6000 }));
  if (!items.length) return;
  state.attachments = [...state.attachments, ...items].slice(0, 10);
  renderAttachments();
  updateComposerState();
  updateTokens();
  const imgs = items.filter((i) => i.kind === 'image').length;
  if (imgs && !looksVision()) toast('Image ajoutée : choisissez un modèle « vision » pour qu’elle soit comprise.', { timeout: 6000 });
  els.input.focus();
}

function looksVision() {
  const id = connection().model || '';
  const known = state.models.find((m) => m.id === id);
  if (known) return known.vision;
  return /vision|vl|pixtral|llava|gemma-3|llama-4|scout|maverick|gpt-4o|gemini/i.test(id);
}

function renderAttachments() {
  const list = state.attachments;
  els.attachments.hidden = !list.length;
  els.attachments.innerHTML = list.map((a) => `<span class="chip-att" data-id="${esc(a.id)}">
    ${a.kind === 'image' ? `<img src="${esc(a.dataUrl)}" alt="">` : icon('file')}
    <span class="meta"><b title="${esc(a.name)}">${esc(a.name)}</b><span>${a.kind === 'image' ? `${a.width}×${a.height} · ${formatBytes(a.size)}` : `${formatNumber(a.lines || 0)} lignes${a.truncated ? ' · tronqué' : ''}`}</span></span>
    <button class="rm" type="button" data-rm aria-label="Retirer ${esc(a.name)}">${icon('x')}</button>
  </span>`).join('');
}
els.attachments.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm]');
  if (!b) return;
  const id = b.closest('.chip-att').dataset.id;
  state.attachments = state.attachments.filter((a) => a.id !== id);
  renderAttachments();
  updateComposerState();
  updateTokens();
  els.input.focus();
});
els.fileInput.addEventListener('change', async () => {
  const files = Array.from(els.fileInput.files || []);
  els.fileInput.value = '';
  if (files.length) await addFiles(files);
});

let dragDepth = 0;
const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; dragDepth++; els.drop.hidden = false; });
window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) els.drop.hidden = true; });
window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('drop', async (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  els.drop.hidden = true;
  await addFiles(Array.from(e.dataTransfer.files));
});

/* Dictée */
function toggleDictation() {
  if (!dictationSupported()) { toast('La dictée vocale n’est pas disponible dans ce navigateur (essayez Chrome ou Edge).', { kind: 'error', timeout: 5000 }); return; }
  if (state.dictation) { stopDictation(); return; }
  const base = els.input.value;
  const sep = base && !/\s$/.test(base) ? ' ' : '';
  state.dictation = true;
  els.mic.setAttribute('aria-pressed', 'true');
  els.mic.setAttribute('aria-label', 'Arrêter la dictée');
  startDictation({
    onText: (finalText, interim) => {
      els.input.value = base + sep + finalText + interim;
      autoGrow();
      updateComposerState();
      updateTokens();
    },
    onEnd: () => {
      state.dictation = null;
      els.mic.setAttribute('aria-pressed', 'false');
      els.mic.setAttribute('aria-label', 'Dicter un message');
      els.input.focus();
    },
    onError: (err) => {
      if (err === 'not-allowed' || err === 'service-not-allowed') toast('Accès au micro refusé.', { kind: 'error' });
      else if (err === 'no-speech') toast('Aucune parole détectée.');
      else if (err !== 'aborted') toast('La dictée a été interrompue.', { kind: 'error' });
    },
  });
}

/* Modèles de requêtes « / » */
function updateSlash() {
  const v = els.input.value;
  const caret = els.input.selectionStart;
  const m = /^\/([\w-]*)$/.exec(v);
  if (!m || caret !== v.length) { closeSlash(); return; }
  state.slash.items = templates.search(m[1]);
  state.slash.index = 0;
  state.slash.open = true;
  renderSlash();
}

function renderSlash() {
  const { items, index } = state.slash;
  els.slash.hidden = false;
  els.slash.innerHTML = `<div class="slash-head" aria-hidden="true"><span>Modèles de requêtes</span><span>↑↓ · Entrée</span></div>`
    + (items.length ? items.map((t, i) => `<div class="slash-item" role="option" id="slash-opt-${i}" data-i="${i}" aria-selected="${i === index}"><code>/${esc(t.cmd)}</code><b>${esc(t.title)}</b><span>${esc(t.body.replace(/\s+/g, ' '))}</span></div>`).join('')
      : '<div class="slash-empty">Aucun modèle. Créez-en dans la Bibliothèque.</div>');
  if (items.length) els.input.setAttribute('aria-activedescendant', `slash-opt-${index}`);
  else els.input.removeAttribute('aria-activedescendant');
  els.slash.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

function moveSlash(d) {
  const n = state.slash.items.length;
  if (!n) return;
  state.slash.index = (state.slash.index + d + n) % n;
  renderSlash();
}

function chooseSlash(i) {
  const t = state.slash.items[i];
  closeSlash();
  if (t) insertTemplate(t);
}

function closeSlash() {
  if (!state.slash.open && els.slash.hidden) return;
  state.slash.open = false;
  els.slash.hidden = true;
  els.input.removeAttribute('aria-activedescendant');
}

els.slash.addEventListener('mousedown', (e) => {
  const it = e.target.closest('.slash-item');
  if (!it) return;
  e.preventDefault();
  chooseSlash(Number(it.dataset.i));
});

function insertTemplate(t) {
  const { text, selStart, selEnd } = applyTemplate(t);
  els.input.value = text;
  autoGrow();
  updateComposerState();
  updateTokens();
  els.input.focus();
  els.input.setSelectionRange(selStart, selEnd);
}

/* ---------- Souvenirs proposés ---------- */
async function suggestMemories() {
  const conv = state.current;
  if (!conv || !conv.messages.some((m) => m.role === 'user')) { toast('Ouvrez une conversation pour proposer des souvenirs.'); return; }
  if (keystore.isLocked() && connection().mode === 'browser' && !await unlock()) return;
  if (!isConfigured()) { openSettings(app, { tab: 'connexion' }); return; }
  const review = openMemoryReview(app);
  const controller = new AbortController();
  state.suggestCtl = controller;
  try {
    const out = await streamChat({
      messages: extractionMessages(conv, memory.all(), settings.get().profile.name || "l'utilisateur"),
      temperature: 0.2,
      maxTokens: 700,
      signal: controller.signal,
    });
    review.show(parseFacts(out.content, memory.all()));
  } catch (e) {
    if (e.name !== 'AbortError') review.error(describeError(e));
  } finally {
    if (state.suggestCtl === controller) state.suggestCtl = null;
  }
}

/* ---------- Export / import ---------- */
function exportConversation(id, fmt) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) return;
  const s = settings.get();
  if (fmt === 'md') {
    download(`${slugify(conv.title)}.md`, conversationToMarkdown(conv, s.assistant.name, s.profile.name || 'Vous'), 'text/markdown;charset=utf-8');
  } else {
    download(`${slugify(conv.title)}.json`, JSON.stringify(buildExport({ conversations: [conv] }), null, 2), 'application/json');
  }
  toast('Export prêt.', { kind: 'ok' });
}

function exportAll(fmt) {
  const s = settings.get();
  const stamp = new Date().toISOString().slice(0, 10);
  if (!state.conversations.length && fmt === 'md') { toast('Aucune conversation à exporter.'); return; }
  if (fmt === 'md') {
    const body = state.conversations.map((c) => conversationToMarkdown(c, s.assistant.name, s.profile.name || 'Vous')).join('\n\n\n');
    download(`nour-conversations-${stamp}.md`, body, 'text/markdown;charset=utf-8');
  } else {
    const data = buildExport({ conversations: state.conversations, memory: memory.all(), templates: templates.all(), settings: s });
    download(`nour-sauvegarde-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  }
  toast('Export prêt.', { kind: 'ok' });
}

async function importFile(file) {
  try {
    const text = await file.text();
    const { conversations, memory: mem, templates: tpl } = parseImport(text);
    let added = 0;
    let updated = 0;
    for (const c of conversations) {
      const existing = state.conversations.find((x) => x.id === c.id);
      if (existing) {
        if (c.updatedAt > existing.updatedAt) { Object.assign(existing, c); await saveConversation(existing); updated++; }
      } else {
        state.conversations.push(c);
        await saveConversation(c);
        added++;
      }
    }
    let memAdded = 0;
    if (mem) for (const f of mem) { if (f && f.text && await memory.add(f.text, 'import')) memAdded++; }
    if (tpl && tpl.length) {
      for (const t of tpl) {
        if (!templates.all().some((x) => x.cmd === t.cmd)) { try { await templates.upsert({ cmd: t.cmd, title: t.title, body: t.body }); } catch { /* commande invalide */ } }
      }
    }
    sortConversations();
    renderSidebar();
    renderHeader();
    toast(`Import terminé : ${added} conversation${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''}${updated ? `, ${updated} mise${updated > 1 ? 's' : ''} à jour` : ''}${memAdded ? `, ${memAdded} souvenir${memAdded > 1 ? 's' : ''}` : ''}.`, { kind: 'ok', timeout: 6000 });
  } catch (e) {
    toast(e.message || 'Import impossible.', { kind: 'error', timeout: 6000 });
  }
}

async function deleteAll() {
  if (!state.conversations.length) { toast('Aucune conversation à supprimer.'); return false; }
  if (!await confirmDialog(`Supprimer définitivement les ${state.conversations.length} conversations ?`, { title: 'Tout supprimer', confirm: 'Tout supprimer', danger: true, detail: 'Pensez à exporter une sauvegarde avant.' })) return false;
  stopGeneration();
  await db.clearConversations();
  state.conversations = [];
  newChat({ focus: false });
  toast('Toutes les conversations ont été supprimées.');
  return true;
}

async function resetApp() {
  if (!await confirmDialog('Réinitialiser Nour ? Conversations, mémoire, bibliothèque, réglages et clés de ce navigateur seront effacés.', { title: 'Réinitialiser', confirm: 'Tout effacer', danger: true })) return;
  stopGeneration();
  await db.clearConversations();
  await db.kvDelete('memory');
  await db.kvDelete('templates');
  keystore.forgetAll();
  session.clear();
  Object.keys(localStorage).filter((k) => k.startsWith('nour.')).forEach((k) => localStorage.removeItem(k));
  location.replace(location.pathname);
}

/* ---------- Coffre ---------- */
async function unlock() {
  const ok = await openUnlock();
  refreshStatus();
  if (ok) {
    toast('Clés déverrouillées.', { kind: 'ok' });
    if (!state.current || !state.current.messages.length) renderThread();
  }
  return ok;
}

/* ---------- Choix rapide du modèle ---------- */
async function openModelQuick() {
  const conn = connection();
  if (!conn.ready && !(conn.mode === 'browser' && keystore.isLocked())) { openSettings(app, { tab: 'connexion' }); return; }
  const d = openDialog({
    id: 'dlg-model', title: 'Modèle', size: 'sm',
    sub: esc(conn.mode === 'server' ? 'Serveur sécurisé' : `${conn.provider.name} · ${conn.base}`),
    body: '<p class="status-line" role="status" data-status></p><div data-picker></div>',
    foot: `<button class="btn btn-ghost" type="button" data-more>${icon('settings')}Connexion…</button><span class="spacer"></span><button class="btn btn-primary" type="button" data-close>Terminé</button>`,
    onClose: () => refreshStatus(),
  });
  const key = conn.mode === 'server' ? 'serverModel' : 'model';
  const c = settings.get().connection;
  const picker = mountModelPicker($('[data-picker]', d), {
    models: state.models, value: c[key], freeFilter: conn.mode === 'server' || !!conn.provider?.freeFilter, freeOnly: c.freeOnly, showAll: c.showAll,
    onChange: (id) => { settings.set('connection', { [key]: id }); refreshStatus(true); updateTokens(); },
    onPrefs: (p) => settings.set('connection', p),
  });
  $('[data-more]', d).addEventListener('click', () => { d.close(); openSettings(app, { tab: 'connexion' }); });
  picker.focusSearch();
  const status = $('[data-status]', d);
  if (!state.models.length) {
    status.innerHTML = `${icon('refresh')}<span>Chargement des modèles…</span>`;
    if (keystore.isLocked() && conn.mode === 'browser') { status.textContent = 'Déverrouillez le coffre pour charger les modèles.'; return; }
    try {
      const models = await listModels();
      setModels(models);
      picker.setModels(models);
      status.innerHTML = '';
    } catch (e) {
      const info = describeError(e);
      status.dataset.kind = 'error';
      status.innerHTML = `${icon('alert')}<span>${esc(info.title)}. ${esc(info.text)}</span>`;
    }
  }
}

/* ---------- Barre latérale (ouverture) ---------- */
function setSidebar(open) {
  const hadFocus = document.activeElement === els.sidebarToggle;
  if (mobileMQ.matches) {
    els.app.dataset.sidebar = open ? 'open-mobile' : 'closed';
    els.scrim.hidden = !open;
    els.main.inert = open;
    if (open) setTimeout(() => $('.new-chat', els.sidebar).focus(), 30);
  } else {
    els.app.dataset.sidebar = open ? 'open' : 'closed';
    els.scrim.hidden = true;
    els.main.inert = false;
    try { localStorage.setItem('nour.sidebar', open ? 'open' : 'closed'); } catch { /* ignoré */ }
  }
  els.sidebarToggle.setAttribute('aria-expanded', String(open));
  els.sidebarToggle.setAttribute('aria-label', open ? 'Masquer la barre latérale' : 'Afficher la barre latérale');
  els.sidebar.inert = !open;
  // Sur grand écran, le bouton de la barre supérieure disparaît : le focus passe à celui de la barre latérale.
  if (open && hadFocus && !mobileMQ.matches) $('.sidebar-top [data-action="toggle-sidebar"]', els.sidebar)?.focus();
}
function sidebarOpen() { return els.app.dataset.sidebar === 'open' || els.app.dataset.sidebar === 'open-mobile'; }
function closeMobileSidebar() { if (mobileMQ.matches && sidebarOpen()) { setSidebar(false); } }
function initSidebar() {
  let saved = 'open';
  try { saved = localStorage.getItem('nour.sidebar') || 'open'; } catch { /* ignoré */ }
  setSidebar(!mobileMQ.matches && saved !== 'closed');
}
mobileMQ.addEventListener('change', () => { initSidebar(); updateComposerState(); });

/* ---------- Délégation des actions globales ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t || t.disabled) return;
  const a = t.dataset.action;
  const cur = state.current;
  switch (a) {
    case 'new-chat': e.preventDefault(); newChat(); break;
    case 'toggle-sidebar': setSidebar(!sidebarOpen()); if (!sidebarOpen()) els.sidebarToggle.focus(); break;
    case 'close-sidebar': setSidebar(false); els.sidebarToggle.focus(); break;
    case 'open-settings': closeMobileSidebar(); openSettings(app, { tab: t.dataset.tab || 'connexion' }); break;
    case 'open-memory': closeMobileSidebar(); openMemory(app); break;
    case 'open-library': closeMobileSidebar(); openLibrary(app); break;
    case 'open-shortcuts': closeMenus(); openShortcuts(); break;
    case 'toggle-theme': {
      const dark = document.documentElement.dataset.theme === 'dark';
      settings.set('prefs', { theme: dark ? 'light' : 'dark' });
      applyPrefs();
      break;
    }
    case 'attach': els.fileInput.click(); break;
    case 'dictate': toggleDictation(); break;
    case 'open-slash':
      if (!els.input.value) { els.input.value = '/'; }
      els.input.focus();
      els.input.setSelectionRange(els.input.value.length, els.input.value.length);
      if (els.input.value.startsWith('/')) updateSlash(); else openLibrary(app);
      break;
    case 'scroll-bottom': state.stick = true; els.thread.scrollTo({ top: els.thread.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); break;
    case 'rename-current': closeMenus(); if (cur) renameConversation(cur.id); break;
    case 'pin-current': closeMenus(); if (cur) togglePin(cur.id); break;
    case 'delete-current': closeMenus(); if (cur) deleteConversation(cur.id); break;
    case 'export-md': closeMenus(); if (cur) exportConversation(cur.id, 'md'); break;
    case 'export-json-current': closeMenus(); if (cur) exportConversation(cur.id, 'json'); break;
    case 'suggest-memories': closeMenus(); suggestMemories(); break;
    default: break;
  }
});

els.modelChip.addEventListener('click', () => openModelQuick());
els.convMenuBtn.addEventListener('click', () => toggleMenu(els.convMenuBtn, els.convMenu));
els.persona.addEventListener('change', () => setPersona(els.persona.value));

els.list.addEventListener('click', (e) => {
  const menuBtn = e.target.closest('.item-menu-btn');
  const li = e.target.closest('.conv-item');
  if (!li) return;
  const id = li.dataset.id;
  if (menuBtn) {
    e.preventDefault();
    const conv = state.conversations.find((c) => c.id === id);
    floatingMenu(menuBtn, [
      { label: conv?.pinned ? 'Désépingler' : 'Épingler', icon: 'pin', onSelect: () => togglePin(id) },
      { label: 'Renommer', icon: 'edit', onSelect: () => renameConversation(id) },
      { label: 'Exporter en Markdown', icon: 'download', onSelect: () => exportConversation(id, 'md') },
      { sep: true },
      { label: 'Supprimer', icon: 'trash', danger: true, onSelect: () => deleteConversation(id) },
    ]);
    return;
  }
  const a = e.target.closest('a');
  if (a) { e.preventDefault(); selectConversation(id, { focus: !mobileMQ.matches }); }
});

els.search.addEventListener('input', debounce(() => { state.search = els.search.value; renderSidebar(); }, 80));
els.search.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.search.value) { e.stopPropagation(); els.search.value = ''; state.search = ''; renderSidebar(); }
  if (e.key === 'Enter') { const first = els.list.querySelector('.conv-item a'); if (first) { e.preventDefault(); first.click(); } }
});

window.addEventListener('hashchange', () => {
  const m = /^#\/c\/(.+)$/.exec(location.hash);
  if (m) selectConversation(decodeURIComponent(m[1]));
});

/* ---------- Raccourcis clavier ---------- */
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  const inDialog = !!document.querySelector('dialog[open]');
  if (e.key === 'Escape' && !inDialog) {
    if (state.gen) { e.preventDefault(); stopGeneration(); return; }
    if (mobileMQ.matches && sidebarOpen()) { setSidebar(false); els.sidebarToggle.focus(); return; }
    if (state.slash.open) { closeSlash(); return; }
  }
  if (!mod || inDialog) return;
  if (k === 'k' && !e.shiftKey) {
    e.preventDefault();
    const focusSearch = () => { els.search.focus(); els.search.select(); };
    if (sidebarOpen()) focusSearch(); else { setSidebar(true); setTimeout(focusSearch, 40); }
  }
  else if (k === 'o' && e.shiftKey) { e.preventDefault(); newChat(); }
  else if (k === 'b' && !e.shiftKey) { e.preventDefault(); setSidebar(!sidebarOpen()); }
  else if (e.key === ',') { e.preventDefault(); openSettings(app, { tab: 'connexion' }); }
  else if (k === 'm' && e.shiftKey) { e.preventDefault(); openMemory(app); }
  else if (k === 'y' && e.shiftKey) {
    e.preventDefault();
    const last = state.current && [...state.current.messages].reverse().find((m) => m.role === 'assistant' && m.content);
    if (last) copyText(last.content).then((ok) => ok && toast('Dernière réponse copiée.', { kind: 'ok' }));
  } else if (k === 'e' && e.shiftKey) { e.preventDefault(); if (state.current) exportConversation(state.current.id, 'md'); }
  else if (e.key === '/' || e.code === 'Slash') { e.preventDefault(); openShortcuts(); }
});

/* ---------- Réseau ---------- */
function updateOnline() { els.offline.hidden = navigator.onLine !== false; }
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);

/* ---------- Service worker ---------- */
function registerSW() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Une nouvelle version de Nour est disponible.', {
            timeout: 0,
            action: { label: 'Mettre à jour', fn: () => { sessionStorage.setItem('nour.sw-update', '1'); w.postMessage('skip-waiting'); } },
          });
        }
      });
    });
  }).catch(() => { /* hors HTTPS ou navigation privée */ });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !sessionStorage.getItem('nour.sw-update')) return;
    sessionStorage.removeItem('nour.sw-update');
    reloading = true;
    location.reload();
  });
}

/* ---------- Démarrage ---------- */
async function init() {
  applyPrefs();
  initSidebar();
  updateOnline();
  try {
    await Promise.all([memory.load(), templates.load()]);
    const all = await db.listConversations();
    // Une génération interrompue par un rechargement est marquée comme telle.
    for (const c of all) {
      for (const m of c.messages) {
        if (m.status === 'streaming') {
          m.status = m.content ? 'stopped' : 'error';
          if (!m.content) m.error = { kind: 'stream', message: 'Interrompu', detail: 'La page a été fermée pendant la génération.' };
        }
      }
    }
    state.conversations = all;
  } catch {
    toast('Le stockage local est indisponible : les conversations ne seront pas conservées.', { kind: 'error', timeout: 8000 });
  }
  memory.on(() => renderHeader());
  refreshStatus();
  renderHeader();
  const m = /^#\/c\/(.+)$/.exec(location.hash);
  if (m && state.conversations.some((c) => c.id === decodeURIComponent(m[1]))) {
    selectConversation(decodeURIComponent(m[1]));
  } else {
    renderSidebar();
    renderThread();
  }
  updateComposerState();
  updateTokens();
  autoGrow();
  onMathReady(() => { if (state.current) renderThread(); });
  if (!mobileMQ.matches) els.input.focus({ preventScroll: true });
  registerSW();
  if (keystore.isLocked() && settings.get().connection.mode === 'browser') setTimeout(() => unlock(), 200);
  document.documentElement.classList.add('ready');
}

settings.on((s, section) => { if (section === 'connection') updateTokens(); });
window.addEventListener('beforeunload', () => { stopSpeaking(); });

init();

export { html };
