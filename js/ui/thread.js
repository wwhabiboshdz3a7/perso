// Rendu du fil : messages, accueil, cartes d'erreur.

import { esc, icon, html, formatNumber } from '../util.js';
import { renderDocument, renderStreaming, splitThink, enhance } from '../markdown.js';
import { avatarHTML } from './avatar.js';
import { describeError } from './errors.js';
import { PERSONAS, personaById } from '../personas.js';
import { PROVIDERS } from '../providers.js';

function attachmentsHTML(atts) {
  if (!atts || !atts.length) return '';
  return `<div class="msg-attachments">${atts.map((a) => (a.kind === 'image'
    ? `<button type="button" class="att-thumb" data-act="view-image" data-att="${esc(a.id)}" aria-label="Agrandir l’image ${esc(a.name)}" title="${esc(a.name)}"><img src="${esc(a.dataUrl)}" alt=""></button>`
    : `<span class="att-file" title="${esc(a.name)}">${icon('file')}<span>${esc(a.name)}</span></span>`)).join('')}</div>`;
}

export function userMessageEl(msg, { isLast }) {
  const el = html(`<article class="msg msg-user${isLast ? ' is-last' : ''}" data-id="${esc(msg.id)}" aria-label="Votre message">
    ${attachmentsHTML(msg.attachments)}
    ${msg.content ? `<div class="bubble" dir="auto">${esc(msg.content)}</div>` : ''}
    <div class="msg-actions">
      <button class="act" type="button" data-act="copy" aria-label="Copier le message" title="Copier">${icon('copy')}</button>
      <button class="act" type="button" data-act="edit" aria-label="Modifier et renvoyer" title="Modifier et renvoyer">${icon('edit')}</button>
    </div>
  </article>`);
  return el;
}

export function editBoxEl(msg) {
  return html(`<div class="edit-box">
    <label class="sr-only" for="edit-${esc(msg.id)}">Modifier le message</label>
    <textarea id="edit-${esc(msg.id)}" dir="auto">${esc(msg.content)}</textarea>
    <div class="row">
      <button class="btn btn-sm btn-ghost" type="button" data-edit="cancel">Annuler</button>
      <button class="btn btn-sm btn-primary" type="button" data-edit="send">Envoyer</button>
    </div>
  </div>`);
}

/** Choix explicites de l'utilisateur sur l'ouverture des blocs « Réflexion » (par message). */
export const reasoningOpen = new Map();

function wordCount(s) { return (String(s).match(/\S+/g) || []).length; }

export function assistantMessageEl(msg, ctx) {
  const streaming = msg.status === 'streaming';
  const el = html(`<article class="msg msg-assistant${ctx.isLast ? ' is-last' : ''}${streaming ? ' streaming' : ''}" data-id="${esc(msg.id)}" aria-label="Réponse de ${esc(ctx.name)}" ${streaming ? 'aria-busy="true"' : ''}>
    <div class="avatar" aria-hidden="true">${avatarHTML(ctx.avatar, ctx.name)}</div>
    <div class="msg-body">
      <div class="msg-meta"><span class="who">${esc(ctx.name)}</span>${msg.model ? `<span class="model" title="${esc(msg.model)}">${esc(msg.model)}</span>` : ''}<span class="state" data-state></span></div>
      <div data-content></div>
      <div class="msg-actions" data-actions></div>
    </div>
  </article>`);
  fillAssistant(el, msg, ctx);
  return el;
}

/* Rendu pendant le streaming : la structure est créée une fois, puis seuls les morceaux
   nouveaux sont rendus (voir renderStreaming). */
const live = new WeakMap();

function fillStreaming(el, msg, ctx) {
  const box = el.querySelector('[data-content]');
  const { reasoning: inlineThink, answer, open } = splitThink(msg.content);
  const reasoning = [msg.reasoning, inlineThink].filter(Boolean).join('\n\n');
  const thinkingNow = (open && !answer) || (!!msg.reasoning && !msg.content);
  const shape = `${reasoning ? 'r' : ''}${!answer && !reasoning ? 't' : 'a'}`;
  let st = live.get(el);
  if (!st || st.shape !== shape || st.box !== box) {
    let out = '';
    if (reasoning) out += `<details class="reasoning"><summary>${icon('chevron-down')}<span data-sum></span></summary><div class="md" data-r></div></details>`;
    if (shape.endsWith('t')) out += `<div class="thinking"><span class="orb" aria-hidden="true"></span>${esc(ctx.name)} réfléchit…</div>`;
    else out += '<div class="md streaming" data-a></div>';
    box.innerHTML = out;
    st = { shape, box, details: box.querySelector('details'), sum: box.querySelector('[data-sum]'), r: box.querySelector('[data-r]'), a: box.querySelector('[data-a]'), thinking: null };
    live.set(el, st);
    el.querySelector('[data-state]').textContent = '';
    el.querySelector('[data-actions]').innerHTML = '';
  }
  if (st.details) {
    if (st.thinking !== thinkingNow) {
      st.thinking = thinkingNow;
      st.sum.textContent = thinkingNow ? 'Réflexion en cours…' : `Réflexion · ${formatNumber(wordCount(reasoning))} mots`;
      st.details.open = reasoningOpen.has(msg.id) ? reasoningOpen.get(msg.id) : thinkingNow;
    }
    renderStreaming(st.r, reasoning);
  }
  if (st.a) renderStreaming(st.a, answer);
}

/** Met à jour le contenu d'un message de l'assistant (appelé à chaque morceau du flux). */
export function fillAssistant(el, msg, ctx) {
  const streaming = msg.status === 'streaming';
  el.classList.toggle('streaming', streaming);
  if (streaming) el.setAttribute('aria-busy', 'true'); else el.removeAttribute('aria-busy');
  if (streaming) { fillStreaming(el, msg, ctx); return; }
  live.delete(el);
  const box = el.querySelector('[data-content]');
  const { reasoning: inlineThink, answer } = splitThink(msg.content);
  const reasoning = [msg.reasoning, inlineThink].filter(Boolean).join('\n\n');

  let out = '';
  if (reasoning) {
    const isOpen = reasoningOpen.has(msg.id) ? reasoningOpen.get(msg.id) : false;
    out += `<details class="reasoning"${isOpen ? ' open' : ''}><summary>${icon('chevron-down')}Réflexion · ${formatNumber(wordCount(reasoning))} mots</summary><div class="md">${renderDocument(reasoning)}</div></details>`;
  }
  if (answer) out += `<div class="md">${renderDocument(answer)}</div>`;
  if (msg.status === 'error' && msg.error) {
    const info = describeError(msg.error);
    out += `<div class="err-card" role="alert">${icon('alert')}<strong>${esc(info.title)}</strong><p>${esc(info.text)}</p>${info.detail ? `<p class="err-detail">Détail : ${esc(info.detail)}</p>` : ''}
      <div class="row">${info.action === 'settings' ? `<button class="btn btn-sm btn-primary" type="button" data-act="settings">${icon('settings')}Ouvrir les réglages</button>` : ''}${info.action === 'unlock' ? `<button class="btn btn-sm btn-primary" type="button" data-act="unlock">${icon('lock')}Déverrouiller</button>` : ''}${ctx.isLast ? `<button class="btn btn-sm" type="button" data-act="retry">${icon('refresh')}Réessayer</button>` : ''}${ctx.isLast && answer && info.continuable ? `<button class="btn btn-sm" type="button" data-act="continue">${icon('chevron-right')}Continuer</button>` : ''}</div></div>`;
  }
  if (msg.status === 'stopped' && !answer && !reasoning) {
    out += `<div class="cut-note" role="note">${icon('info')}<span>Génération arrêtée avant le premier mot.${ctx.isLast ? ' Utilisez « Régénérer » pour relancer la demande.' : ''}</span></div>`;
  }
  const incomplete = msg.status === 'done' && (msg.finish === 'incomplete' || msg.finish === 'length');
  if (incomplete && ctx.isLast && answer) {
    out += `<div class="cut-note" role="note">${icon('info')}<span>${msg.finish === 'length' ? 'La réponse a atteint la longueur maximale.' : 'Le flux s’est arrêté avant la fin : la réponse est peut-être incomplète.'}</span><button class="btn btn-sm" type="button" data-act="continue">${icon('chevron-right')}Continuer</button><button class="btn btn-sm btn-ghost" type="button" data-act="retry">${icon('refresh')}Réessayer</button></div>`;
  }
  // Conserver la position de défilement interne des blocs de code.
  const scrolls = Array.from(box.querySelectorAll('pre')).map((p) => p.scrollLeft);
  box.innerHTML = out;
  if (scrolls.length) box.querySelectorAll('pre').forEach((p, i) => { if (scrolls[i]) p.scrollLeft = scrolls[i]; });
  enhance(box);

  const state = el.querySelector('[data-state]');
  state.textContent = msg.status === 'stopped' ? '· interrompu'
    : msg.finish === 'length' ? '· tronqué (longueur max)'
      : msg.finish === 'incomplete' ? '· réponse incomplète' : '';

  const actions = el.querySelector('[data-actions]');
  const versions = msg.versions && msg.versions.length > 1 ? msg.versions.length : 0;
  const cur = (msg.current ?? 0) + 1;
  const speaking = ctx.speakingId === msg.id;
  const usage = msg.usage && (msg.usage.completion_tokens || msg.usage.total_tokens);
  // En cas d'erreur, la carte porte déjà « Réessayer » : pas de second bouton.
  const canRegen = ctx.isLast && msg.status !== 'error' && !(incomplete && answer);
  actions.innerHTML = `
    ${versions ? `<span class="pager" role="group" aria-label="Versions de la réponse"><button class="act" type="button" data-act="prev" aria-label="Version précédente" ${cur <= 1 ? 'disabled' : ''}>${icon('chevron-left')}</button><span aria-live="polite">${cur}/${versions}</span><button class="act" type="button" data-act="next" aria-label="Version suivante" ${cur >= versions ? 'disabled' : ''}>${icon('chevron-right')}</button></span>` : ''}
    ${msg.content ? `<button class="act" type="button" data-act="copy" aria-label="Copier la réponse" title="Copier">${icon('copy')}</button>` : ''}
    ${msg.content && ctx.canSpeak ? `<button class="act" type="button" data-act="speak" aria-pressed="${speaking}" aria-label="${speaking ? 'Arrêter la lecture' : 'Lire à voix haute'}" title="${speaking ? 'Arrêter la lecture' : 'Lire à voix haute'}">${icon('volume')}</button>` : ''}
    ${canRegen ? `<button class="act" type="button" data-act="regenerate" aria-label="Régénérer la réponse" title="Régénérer">${icon('refresh')}</button>` : ''}
    ${usage ? `<span class="usage" title="Jetons générés">${formatNumber(msg.usage.completion_tokens || 0)} jetons</span>` : ''}`;
  actions.hidden = !actions.querySelector('button, .usage');
}

/* ---------- Accueil ---------- */
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function welcomeEl(ctx) {
  const persona = personaById(ctx.persona);
  const first = (ctx.userName || '').trim();
  const el = html(`<div class="welcome${ctx.configured ? '' : ' is-setup'}">
    <svg class="welcome-mark" aria-hidden="true"><use href="#av-arche"/></svg>
    <span class="eyebrow">${esc(ctx.name)} · assistant personnel</span>
    <h2>${greeting()}${first ? `, <span class="name">${esc(first)}</span>` : ''}.</h2>
    <p class="lead">${ctx.configured
      ? 'Que puis-je éclairer pour vous aujourd’hui ?'
      : 'Connectez une IA open source de votre choix pour commencer. Votre clé reste sur cet appareil, ou sur votre propre serveur.'}</p>
    ${ctx.configured ? `
      <div class="personas" role="group" aria-label="Mode de l'assistant">${PERSONAS.map((p) => `<button type="button" class="persona-chip" data-persona="${p.id}" aria-pressed="${p.id === persona.id}">${icon(p.icon)}${esc(p.name)}</button>`).join('')}</div>
      <div class="suggestions">${persona.suggestions.map(([t, prompt]) => `<button type="button" class="suggestion" data-prompt="${esc(prompt)}"><b>${esc(t)}</b><span>${esc(prompt)}</span></button>`).join('')}</div>`
    : `
      <div class="setup">
        <div class="setup-head"><h3>Choisissez un fournisseur</h3><p>Compatible OpenAI · modèles ouverts (Llama, Qwen, Mistral, DeepSeek, Gemma, gpt-oss…)</p></div>
        <div class="provider-grid">${PROVIDERS.map((p) => `<button type="button" class="provider-card" data-setup-provider="${p.id}">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}<b>${esc(p.name)}</b><span>${esc(p.blurb)}</span></button>`).join('')}</div>
        <p class="hint setup-server">Vous avez déployé la fonction serveur sur Netlify ? <button type="button" class="btn btn-sm btn-ghost" data-setup-server>${icon('server')}Utiliser le serveur sécurisé</button></p>
      </div>`}
  </div>`);
  return el;
}
