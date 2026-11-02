// Panneaux secondaires : mémoire, souvenirs proposés, bibliothèque, raccourcis, déverrouillage.

import { esc, icon, $, $$, modKey } from '../util.js';
import { memory } from '../memory.js';
import { templates, cleanCmd } from '../templates.js';
import { settings } from '../settings.js';
import { keystore } from '../keystore.js';
import { openDialog, toast, confirmDialog } from './dialogs.js';

/* ---------- Mémoire ---------- */
export function openMemory(app) {
  const d = openDialog({
    id: 'dlg-memory', title: 'Mémoire',
    sub: `Ce que ${esc(settings.get().assistant.name)} retient de vous. Ces faits sont ajoutés discrètement à chaque conversation, et vous gardez la main sur chacun.`,
    body: `
      <label class="switch" style="padding-top:0"><span class="label"><b>Utiliser la mémoire</b><small>Désactivez-la pour une conversation « vierge ».</small></span><input type="checkbox" role="switch" data-use ${settings.get().prefs.useMemory ? 'checked' : ''}></label>
      <form class="field" data-add style="margin-top:16px">
        <label for="mem-new">Ajouter un souvenir</label>
        <div class="input-row"><input type="text" id="mem-new" maxlength="280" placeholder="ex. Préfère des réponses avec un exemple concret." autocomplete="off"><button class="btn" type="submit">${icon('plus')}Ajouter</button></div>
      </form>
      <div class="list-rows" data-list></div>`,
    foot: `<button class="btn foot-wide" type="button" data-suggest ${app.currentConversation()?.messages?.length ? '' : 'disabled'}>${icon('sparkle')}Proposer des souvenirs depuis cette conversation</button><span class="spacer"></span><button class="btn btn-primary" type="button" data-close>Fermer</button>`,
    onClose: () => app.refreshChrome(),
  });
  const list = $('[data-list]', d);
  const draw = () => {
    const facts = memory.all();
    if (!facts.length) {
      list.innerHTML = `<div class="empty-note">Aucun souvenir pour l’instant. Ajoutez-en un, ou laissez ${esc(settings.get().assistant.name)} vous en proposer à partir d’une conversation.</div>`;
      return;
    }
    list.innerHTML = facts.map((f) => `<div class="row-item ${f.enabled === false ? 'off' : ''}" data-id="${esc(f.id)}">
      <input type="checkbox" data-toggle ${f.enabled === false ? '' : 'checked'} aria-label="Utiliser ce souvenir" style="accent-color:var(--accent);width:16px;height:16px">
      <div class="grow"><input type="text" value="${esc(f.text)}" maxlength="280" data-text aria-label="Texte du souvenir"></div>
      <button class="icon-btn" type="button" data-del aria-label="Supprimer ce souvenir">${icon('trash')}</button>
    </div>`).join('');
  };
  draw();
  list.addEventListener('change', async (e) => {
    const row = e.target.closest('.row-item');
    if (!row) return;
    if (e.target.matches('[data-toggle]')) { await memory.update(row.dataset.id, { enabled: e.target.checked }); row.classList.toggle('off', !e.target.checked); }
    if (e.target.matches('[data-text]')) {
      const v = e.target.value.trim();
      if (!v) { await memory.remove(row.dataset.id); draw(); } else await memory.update(row.dataset.id, { text: v });
    }
  });
  list.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    await memory.remove(b.closest('.row-item').dataset.id);
    draw();
    $('#mem-new', d).focus();
  });
  $('[data-add]', d).addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#mem-new', d);
    const f = await memory.add(input.value);
    if (!f && input.value.trim()) toast('Ce souvenir existe déjà.');
    input.value = '';
    draw();
  });
  $('[data-use]', d).addEventListener('change', (e) => { settings.set('prefs', { useMemory: e.target.checked }); });
  $('[data-suggest]', d).addEventListener('click', () => { d.close(); app.suggestMemories(); });
}

/** Revue des souvenirs proposés : chaque fait est gardé ou ignoré individuellement. */
export function openMemoryReview(app, { loading = true } = {}) {
  const d = openDialog({
    id: 'dlg-review', title: 'Souvenirs proposés',
    sub: 'Validez un par un ce qui mérite d’être retenu. Vous pouvez reformuler avant de garder.',
    body: `<div data-review>${loading ? `<div class="thinking"><span class="orb"></span>Analyse de la conversation…</div>` : ''}</div>`,
    foot: '<button class="btn btn-primary" type="button" data-close>Terminer</button>',
    onClose: () => { app.cancelSuggest?.(); app.refreshChrome(); },
  });
  const box = $('[data-review]', d);
  return {
    dialog: d,
    show(facts) {
      if (!facts.length) {
        box.innerHTML = '<div class="empty-note">Rien de nouveau à retenir dans cette conversation.</div>';
        return;
      }
      box.innerHTML = `<div class="list-rows">${facts.map((f, i) => `<div class="row-item" data-i="${i}">
        <div class="grow"><input type="text" value="${esc(f)}" maxlength="280" aria-label="Souvenir proposé ${i + 1}"></div>
        <button class="btn btn-sm" type="button" data-keep>${icon('check')}Garder</button>
        <button class="btn btn-sm btn-ghost" type="button" data-skip aria-label="Ignorer ce souvenir">${icon('x')}Ignorer</button>
      </div>`).join('')}</div>`;
      box.addEventListener('click', async (e) => {
        const row = e.target.closest('.row-item');
        if (!row || row.dataset.done) return;
        if (e.target.closest('[data-keep]')) {
          const text = row.querySelector('input').value;
          row.dataset.done = '1';
          row.classList.add('accepted');
          row.querySelector('input').readOnly = true;
          row.querySelectorAll('button').forEach((b) => b.remove());
          row.insertAdjacentHTML('beforeend', `<span class="tag-done">${icon('check')}Gardé</span>`);
          memory.add(text, 'proposé');
        } else if (e.target.closest('[data-skip]')) {
          row.dataset.done = '1';
          row.classList.add('rejected');
          row.querySelector('input').readOnly = true;
          row.querySelectorAll('button').forEach((b) => b.remove());
          row.insertAdjacentHTML('beforeend', '<span class="hint">Ignoré</span>');
        }
        const next = box.querySelector('.row-item:not([data-done]) [data-keep]');
        if (next) next.focus(); else d.querySelector('.modal-foot [data-close]').focus();
      });
      box.querySelector('[data-keep]')?.focus();
    },
    error(info) {
      box.innerHTML = `<div class="err-card">${icon('alert')}<strong>${esc(info.title)}</strong><p>${esc(info.text)}</p>${info.detail ? `<p class="err-detail">${esc(info.detail)}</p>` : ''}</div>`;
    },
  };
}

/* ---------- Bibliothèque ---------- */
export function openLibrary(app) {
  const d = openDialog({
    id: 'dlg-library', title: 'Bibliothèque',
    sub: 'Vos modèles de requêtes. Tapez <kbd>/</kbd> au début d’un message pour les utiliser.',
    body: '<div data-form></div><div class="list-rows" data-list></div>',
    foot: `<button class="btn btn-ghost foot-wide" type="button" data-reset>${icon('refresh')}Rétablir les modèles d’origine</button><span class="spacer"></span><button class="btn" type="button" data-new>${icon('plus')}Nouveau modèle</button><button class="btn btn-primary" type="button" data-close>Fermer</button>`,
  });
  const list = $('[data-list]', d);
  const formBox = $('[data-form]', d);
  const draw = () => {
    const all = templates.all();
    list.innerHTML = all.length ? all.map((t) => `<div class="tpl-item" data-id="${esc(t.id)}">
      <div><code>/${esc(t.cmd)}</code><b>${esc(t.title)}</b></div>
      <div class="acts">
        <button class="btn btn-sm" type="button" data-use>Utiliser</button>
        <button class="icon-btn" type="button" data-edit aria-label="Modifier /${esc(t.cmd)}">${icon('edit')}</button>
        <button class="icon-btn" type="button" data-del aria-label="Supprimer /${esc(t.cmd)}">${icon('trash')}</button>
      </div>
      <p>${esc(t.body)}</p>
    </div>`).join('') : '<div class="empty-note">La bibliothèque est vide.</div>';
  };
  const showForm = (t = null) => {
    formBox.innerHTML = `<form class="tpl-form" data-tpl-form>
      <div class="grid-2">
        <div class="field"><label for="tpl-cmd">Commande</label><input type="text" id="tpl-cmd" required maxlength="24" value="${esc(t ? t.cmd : '')}" placeholder="ex. resume-reunion" autocomplete="off" spellcheck="false"></div>
        <div class="field"><label for="tpl-title">Titre</label><input type="text" id="tpl-title" maxlength="60" value="${esc(t ? t.title : '')}" placeholder="ex. Compte rendu de réunion" autocomplete="off"></div>
      </div>
      <div class="field"><label for="tpl-body">Texte du modèle</label><textarea id="tpl-body" rows="5" required>${esc(t ? t.body : '')}</textarea><p class="hint">Écrivez <code>{{champ}}</code> là où le curseur doit se placer pour compléter.</p></div>
      <p class="status-line" data-kind="error" data-err></p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-ghost" type="button" data-cancel>Annuler</button><button class="btn btn-primary" type="submit">Enregistrer</button></div>
    </form>`;
    const f = $('[data-tpl-form]', formBox);
    $('#tpl-cmd', f).focus();
    $('[data-cancel]', f).addEventListener('click', () => { formBox.innerHTML = ''; });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await templates.upsert({ id: t ? t.id : null, cmd: cleanCmd($('#tpl-cmd', f).value), title: $('#tpl-title', f).value, body: $('#tpl-body', f).value });
        formBox.innerHTML = '';
        draw();
        toast('Modèle enregistré.', { kind: 'ok' });
      } catch (err) { $('[data-err]', f).textContent = err.message; }
    });
  };
  draw();
  list.addEventListener('click', async (e) => {
    const item = e.target.closest('.tpl-item');
    if (!item) return;
    const t = templates.all().find((x) => x.id === item.dataset.id);
    if (!t) return;
    if (e.target.closest('[data-use]')) { d.close(); app.insertTemplate(t); }
    if (e.target.closest('[data-edit]')) showForm(t);
    if (e.target.closest('[data-del]')) {
      if (!await confirmDialog(`Supprimer le modèle /${t.cmd} ?`, { confirm: 'Supprimer', danger: true })) return;
      await templates.remove(t.id);
      draw();
    }
  });
  $('[data-new]', d).addEventListener('click', () => showForm());
  $('[data-reset]', d).addEventListener('click', async () => {
    if (!await confirmDialog('Remplacer votre bibliothèque par les modèles d’origine ?', { confirm: 'Rétablir', danger: true })) return;
    await templates.reset();
    draw();
  });
}

/* ---------- Raccourcis ---------- */
export function openShortcuts() {
  const m = modKey();
  const rows = [
    ['Envoyer le message', ['Entrée']],
    ['Nouvelle ligne', ['Maj', 'Entrée']],
    ['Nouvelle conversation', [m, 'Maj', 'O']],
    ['Rechercher une conversation', [m, 'K']],
    ['Afficher / masquer la barre latérale', [m, 'B']],
    ['Réglages', [m, ',']],
    ['Mémoire', [m, 'Maj', 'M']],
    ['Copier la dernière réponse', [m, 'Maj', 'Y']],
    ['Exporter la conversation (Markdown)', [m, 'Maj', 'E']],
    ['Arrêter la génération', ['Échap']],
    ['Modifier votre dernier message', ['↑']],
    ['Modèles de requêtes', ['/']],
    ['Afficher cette aide', [m, '/']],
  ];
  openDialog({
    id: 'dlg-shortcuts', title: 'Raccourcis clavier', size: 'sm',
    body: `<table class="shortcut-table"><tbody>${rows.map(([label, keys]) => `<tr><td>${esc(label)}</td><td>${keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('')}</td></tr>`).join('')}</tbody></table>`,
    foot: '<button class="btn btn-primary" type="button" data-close>Fermer</button>',
  });
}

/* ---------- Déverrouillage ---------- */
export function openUnlock() {
  return new Promise((resolve) => {
    let ok = false;
    const d = openDialog({
      id: 'dlg-unlock', title: 'Déverrouiller', size: 'sm',
      body: `<div class="lock-hero"><svg aria-hidden="true"><use href="#av-arche"/></svg><p class="hint" style="max-width:22rem">Vos clés API sont chiffrées sur cet appareil. Saisissez votre phrase secrète pour les utiliser.</p></div>
        <form class="field" id="unlock-form" style="margin:0"><label for="unlock-pass">Phrase secrète</label><input type="password" id="unlock-pass" autocomplete="current-password" required><p class="status-line" data-kind="error" data-err role="alert" style="margin:6px 0 0"></p></form>`,
      foot: '<button class="btn btn-ghost" type="button" data-close>Plus tard</button><button class="btn btn-primary" type="submit" form="unlock-form">Déverrouiller</button>',
      onClose: () => resolve(ok),
    });
    const input = $('#unlock-pass', d);
    input.focus();
    $('#unlock-form', d).addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = d.querySelector('[form="unlock-form"]');
      btn.disabled = true;
      try {
        await keystore.unlock(input.value);
        ok = true;
        d.close();
      } catch (err) {
        input.setAttribute('aria-invalid', 'true');
        $('[data-err]', d).textContent = err.message || 'Phrase secrète incorrecte.';
        input.select();
      } finally { btn.disabled = false; }
    });
  });
}

export { $$ };
