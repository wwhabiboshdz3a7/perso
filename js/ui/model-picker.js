// Sélecteur de modèle : recherche, familles ouvertes, filtre « gratuits », saisie manuelle.

import { esc, icon } from '../util.js';
import { FAMILIES } from '../providers.js';

let counter = 0;

/**
 * Monte le sélecteur dans `root`.
 * opts : { models, value, freeFilter, freeOnly, showAll, onChange(id), onPrefs({ freeOnly, showAll }) }
 */
export function mountModelPicker(root, opts) {
  const uidp = `mp${++counter}`;
  const st = { q: '', family: '', freeOnly: !!opts.freeOnly, showAll: !!opts.showAll, value: opts.value || '', models: opts.models || [] };

  root.innerHTML = `
    <div class="field" style="margin-bottom:10px">
      <label for="${uidp}-q">Modèle</label>
      <input type="search" id="${uidp}-q" placeholder="Filtrer les modèles…" autocomplete="off" spellcheck="false">
    </div>
    <div class="chips" role="group" aria-label="Familles de modèles ouverts" data-fams></div>
    <div class="mp-toggles" style="display:flex;gap:16px;flex-wrap:wrap;margin:0 0 10px">
      ${opts.freeFilter ? `<label class="check" style="margin:0"><input type="checkbox" data-free ${st.freeOnly ? 'checked' : ''}><span>Modèles gratuits uniquement</span></label>` : ''}
      <label class="check" style="margin:0"><input type="checkbox" data-all ${st.showAll ? 'checked' : ''}><span>Afficher aussi les modèles non conversationnels</span></label>
    </div>
    <div class="model-list" role="radiogroup" aria-label="Modèles disponibles" data-list></div>
    <div class="field" style="margin:12px 0 0">
      <label for="${uidp}-manual">Ou saisissez l'identifiant exact</label>
      <input type="text" id="${uidp}-manual" class="mono" placeholder="ex. famille/nom-du-modele" autocomplete="off" spellcheck="false">
      <p class="hint">Les identifiants changent souvent : la liste ci-dessus est récupérée en direct chez le fournisseur.</p>
    </div>`;

  const q = root.querySelector(`#${uidp}-q`);
  const list = root.querySelector('[data-list]');
  const fams = root.querySelector('[data-fams]');
  const manual = root.querySelector(`#${uidp}-manual`);
  manual.value = st.value;

  function renderFamilies() {
    const present = new Set(st.models.map((m) => m.family).filter(Boolean));
    const shown = FAMILIES.filter((f) => present.has(f.id) || !st.models.length);
    fams.innerHTML = shown.map((f) => `<button type="button" class="chip" data-fam="${f.id}" aria-pressed="${st.family === f.id}" title="${esc(f.note)}">${esc(f.label)}</button>`).join('');
  }

  function filtered() {
    const needle = st.q.toLowerCase();
    return st.models.filter((m) => (st.showAll || m.chat)
      && (!st.freeOnly || m.free)
      && (!st.family || m.family === st.family)
      && (!needle || m.id.toLowerCase().includes(needle) || (m.name || '').toLowerCase().includes(needle)));
  }

  function renderList() {
    if (!st.models.length) {
      list.innerHTML = `<div class="empty-note" style="border:0">${icon('info')} Testez la connexion pour charger la liste des modèles.</div>`;
      return;
    }
    const items = filtered();
    if (!items.length) {
      list.innerHTML = '<div class="empty-note" style="border:0">Aucun modèle ne correspond à ces filtres.</div>';
      return;
    }
    const famLabel = (id) => FAMILIES.find((f) => f.id === id)?.label || '';
    list.innerHTML = items.slice(0, 400).map((m) => `
      <label class="model-opt" aria-selected="${m.id === st.value}">
        <input type="radio" name="${uidp}-model" value="${esc(m.id)}" ${m.id === st.value ? 'checked' : ''} class="sr-only">
        <span class="id">${esc(m.id)}</span>
        <span class="tags">
          ${m.family ? `<span class="pill fam">${esc(famLabel(m.family))}</span>` : ''}
          ${m.free ? '<span class="pill free">Gratuit</span>' : ''}
          ${m.vision ? '<span class="pill vision">Vision</span>' : ''}
          ${m.context ? `<span class="pill">${Math.round(m.context / 1000)} k</span>` : ''}
        </span>
      </label>`).join('');
  }

  function select(id) {
    st.value = id;
    manual.value = id;
    list.querySelectorAll('.model-opt').forEach((o) => o.setAttribute('aria-selected', String(o.querySelector('input').value === id)));
    opts.onChange?.(id);
  }

  q.addEventListener('input', () => { st.q = q.value.trim(); renderList(); });
  fams.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fam]');
    if (!b) return;
    st.family = st.family === b.dataset.fam ? '' : b.dataset.fam;
    renderFamilies();
    renderList();
  });
  root.querySelector('[data-free]')?.addEventListener('change', (e) => { st.freeOnly = e.target.checked; renderList(); opts.onPrefs?.({ freeOnly: st.freeOnly, showAll: st.showAll }); });
  root.querySelector('[data-all]').addEventListener('change', (e) => { st.showAll = e.target.checked; renderList(); opts.onPrefs?.({ freeOnly: st.freeOnly, showAll: st.showAll }); });
  list.addEventListener('change', (e) => { if (e.target.name === `${uidp}-model`) select(e.target.value); });
  manual.addEventListener('change', () => select(manual.value.trim()));

  renderFamilies();
  renderList();

  return {
    setModels(models) { st.models = models || []; renderFamilies(); renderList(); },
    setValue(id) { st.value = id || ''; manual.value = st.value; renderList(); },
    get value() { return st.value; },
    focusSearch() { q.focus(); },
  };
}
