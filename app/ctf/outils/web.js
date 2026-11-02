// Navigateur simulé : des mini-sites définis en données, servis dans une iframe isolée (sandbox sans
// même origine). Barre d'adresse, historique, code source, cookies modifiables, en-têtes de réponse.
import { $, $$, esc } from '../commun.js';

const PONT = `(function(){
  function envoyer(m){ parent.postMessage(Object.assign({ lumioWeb: true }, m), '*'); }
  window.lumioNaviguer = function(h){ envoyer({ type: 'nav', href: String(h) }); };
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
    var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^javascript:/i.test(h)) return;
    e.preventDefault(); envoyer({ type: 'nav', href: h });
  });
  document.addEventListener('submit', function(e){
    if (e.defaultPrevented) return;
    e.preventDefault(); var f = e.target, d = {};
    new FormData(f).forEach(function(v, k){ d[k] = String(v); });
    envoyer({ type: 'form', action: f.getAttribute('action') || '', methode: (f.getAttribute('method') || 'get').toLowerCase(), donnees: d });
  });
})();`;

const correspond = (cond, contexte) => !cond || Object.entries(cond).every(([groupe, regles]) => {
  const src = contexte[groupe] || {};
  return Object.entries(regles).every(([k, v]) => {
    const val = src[k];
    if (v && typeof v === 'object' && 're' in v) return val !== undefined && new RegExp(v.re, 'i').test(val);
    if (v === null) return val === undefined;
    return String(val ?? '').trim() === String(v);
  });
});
const choisir = (variantes, contexte) => (Array.isArray(variantes) ? variantes : [variantes]).find(p => correspond(p.si, contexte));

export async function monter(el, opts) {
  const sites = opts.sites || {};
  const jar = Object.fromEntries(Object.entries(sites).map(([d, s]) => [d, { ...(s.cookies || {}) }]));
  el.innerHTML = `<div class="wb">
    <div class="wb-barre">
      <button type="button" class="wb-b" data-a="prec" aria-label="Page précédente" disabled>←</button><button type="button" class="wb-b" data-a="suiv" aria-label="Page suivante" disabled>→</button><button type="button" class="wb-b" data-a="rech" aria-label="Recharger">⟳</button>
      <form class="wb-adr"><label class="sr" for="wbUrl">Adresse</label><span class="wb-cadenas" aria-hidden="true">🔒</span><input id="wbUrl" spellcheck="false" autocomplete="off" autocapitalize="off"></form>
    </div>
    <div class="wb-onglets" role="tablist" aria-label="Vue du navigateur">
      <button type="button" role="tab" aria-selected="true" data-o="page">Page</button><button type="button" role="tab" aria-selected="false" data-o="source">Code source</button><button type="button" role="tab" aria-selected="false" data-o="cookies">Cookies</button><button type="button" role="tab" aria-selected="false" data-o="reseau">Réseau</button>
    </div>
    <div class="wb-vues">
      <iframe class="wb-frame" title="Page du site simulé" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer"></iframe>
      <pre class="wb-source" hidden tabindex="0"></pre>
      <div class="wb-cookies" hidden></div>
      <div class="wb-reseau" hidden></div>
    </div></div>`;
  const frame = $('.wb-frame', el), adr = $('#wbUrl', el);
  const hist = []; let pos = -1, courant = null;

  function servir(u, methode = 'get', donnees = {}) {
    let x; try { x = new URL(u); } catch { return { statut: 400, titre: 'Adresse invalide', html: `<main class="wb-erreur"><h1>Adresse invalide</h1><p>${esc(u)}</p></main>` }; }
    const site = sites[x.hostname];
    if (!site) return { statut: 0, titre: 'Site introuvable', html: `<main style="font-family:system-ui;padding:40px;color:#334"><h1>Ce site est introuvable</h1><p>Dans cette simulation, seuls ces sites existent : ${Object.keys(sites).map(d => `<a href="https://${d}/">${d}</a>`).join(', ')}.</p></main>` };
    const chemin = decodeURIComponent(x.pathname) || '/';
    const params = Object.fromEntries(x.searchParams);
    const ctx = { cookie: jar[x.hostname], champ: { ...params, ...donnees }, requete: params };
    let page = null;
    if ((methode === 'post' || Object.keys(donnees).length || Object.keys(params).length) && site.formulaires && site.formulaires[chemin]) page = choisir(site.formulaires[chemin], ctx);
    if (!page && site.pages[chemin]) page = choisir(site.pages[chemin], ctx);
    if (!page && site.pages[chemin.replace(/\/$/, '')]) page = choisir(site.pages[chemin.replace(/\/$/, '')], ctx);
    if (!page && site.pages[chemin + '/']) page = choisir(site.pages[chemin + '/'], ctx);
    if (!page) return { statut: 404, titre: '404 — Introuvable', html: site.page404 || `<main style="font-family:system-ui;padding:40px"><h1>404</h1><p>La page <code>${esc(chemin)}</code> n'existe pas sur ${esc(x.hostname)}.</p><p><a href="/">Retour à l'accueil</a></p></main>`, site };
    if (page.cookies) Object.assign(jar[x.hostname], page.cookies);
    return { statut: page.statut || 200, ...page, site };
  }
  // Dans la vue « Page », les scripts externes du site simulé sont servis par le serveur simulé et intégrés
  // à la page (l'iframe isolée ne peut rien charger d'autre). La vue « Code source » garde la balise d'origine.
  const integrerScripts = (html, base) => String(html || '').replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (m, src) => {
    let cible; try { cible = new URL(src, base).href; } catch { return ''; }
    const r = servir(cible);
    return r.statut === 200 && r.type === 'text/plain' ? `<script data-src="${esc(src)}">${String(r.corps || '').replace(/<\/script/gi, '<\\/script')}</script>` : `<!-- ${esc(src)} : ${r.statut} -->`;
  });
  function documentHTML(r, avecPont, base) {
    if (avecPont && base && r.html) r = { ...r, html: integrerScripts(r.html, base) };
    if (r.type === 'text/plain') return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:14px;font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;color:#111;background:#fff}</style></head><body>${esc(r.corps || '')}</body></html>`;
    return `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>${esc(r.titre || '')}</title>\n${r.site && r.site.style ? `<style>${r.site.style}</style>\n` : ''}</head>\n<body>\n${r.html || ''}\n${avecPont ? `<script>${PONT}</script>` : ''}</body>\n</html>`;
  }
  function afficher(u, methode, donnees, ajouter = true) {
    const r = servir(u, methode, donnees);
    courant = { url: u, r, methode };
    if (ajouter) { hist.splice(pos + 1); hist.push(u); pos = hist.length - 1; }
    adr.value = u;
    $('[data-a="prec"]', el).disabled = pos <= 0;
    $('[data-a="suiv"]', el).disabled = pos >= hist.length - 1;
    frame.srcdoc = documentHTML(r, true, u);
    $('.wb-source', el).textContent = r.type === 'text/plain' ? (r.corps || '') : documentHTML(r, false).replace(r.site && r.site.style ? `<style>${r.site.style}</style>\n` : '\0', '<link rel="stylesheet" href="/style.css">\n');
    rendreCookies(); rendreReseau(donnees);
  }
  function rendreCookies() {
    const d = courant ? new URL(courant.url).hostname : '';
    const c = jar[d] || {};
    $('.wb-cookies', el).innerHTML = `<p class="muted">Cookies de <b>${esc(d)}</b>. Le serveur fait confiance à ce que le navigateur lui envoie : modifie une valeur puis recharge la page.</p>
      <table class="ctf-table"><caption class="sr">Cookies</caption><thead><tr><th scope="col">Nom</th><th scope="col">Valeur</th></tr></thead><tbody>
      ${Object.entries(c).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td><label class="sr" for="ck-${esc(k)}">Valeur du cookie ${esc(k)}</label><input id="ck-${esc(k)}" data-ck="${esc(k)}" value="${esc(v)}" spellcheck="false" autocomplete="off"></td></tr>`).join('') || '<tr><td colspan="2" class="muted">Aucun cookie.</td></tr>'}
      </tbody></table><div class="row"><button type="button" class="btn small primary" data-ckok>Enregistrer et recharger</button></div>`;
    $('[data-ckok]', el).addEventListener('click', () => { $$('[data-ck]', el).forEach(i => { jar[d][i.dataset.ck] = i.value; }); onglet('page'); afficher(courant.url, 'get', {}, false); });
  }
  function rendreReseau(donnees = {}) {
    const r = courant.r, x = new URL(courant.url);
    const cookies = Object.entries(jar[x.hostname] || {}).map(([k, v]) => `${k}=${v}`).join('; ');
    const entetes = { 'Content-Type': r.type === 'text/plain' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8', Server: (r.site && r.site.serveur) || 'nginx', ...(r.site && r.site.entetes), ...(r.entetes || {}) };
    $('.wb-reseau', el).innerHTML = `<h4>Requête</h4><pre class="ctf-pre">${esc(`${(courant.methode || 'get').toUpperCase()} ${x.pathname}${x.search} HTTP/1.1\nHost: ${x.hostname}\nUser-Agent: LumioNavigateur/1.0\n${cookies ? 'Cookie: ' + cookies + '\n' : ''}${Object.keys(donnees).length ? '\n' + new URLSearchParams(donnees).toString() : ''}`)}</pre>
      <h4>Réponse</h4><pre class="ctf-pre">${esc(`HTTP/1.1 ${r.statut || 200} ${r.statut === 404 ? 'Not Found' : r.statut === 403 ? 'Forbidden' : 'OK'}\n` + Object.entries(entetes).map(([k, v]) => `${k}: ${v}`).join('\n'))}</pre>`;
  }
  const naviguer = (h, methode = 'get', donnees = {}) => {
    let u;
    try { u = new URL(h, courant ? courant.url : opts.depart).href; } catch { u = h; }
    if (methode === 'get' && Object.keys(donnees).length) { const x = new URL(u); Object.entries(donnees).forEach(([k, v]) => x.searchParams.set(k, v)); u = x.href; afficher(u, 'get', {}); return; }
    afficher(u, methode, donnees);
  };
  const ecoute = e => {
    if (!el.isConnected) { window.removeEventListener('message', ecoute); return; }
    if (e.source !== frame.contentWindow || !e.data || !e.data.lumioWeb) return;
    if (e.data.type === 'nav') naviguer(e.data.href);
    if (e.data.type === 'form') naviguer(e.data.action || courant.url, e.data.methode, e.data.donnees || {});
  };
  window.addEventListener('message', ecoute);
  const onglet = o => {
    $$('[data-o]', el).forEach(b => b.setAttribute('aria-selected', b.dataset.o === o));
    frame.hidden = o !== 'page';
    $('.wb-source', el).hidden = o !== 'source'; $('.wb-cookies', el).hidden = o !== 'cookies'; $('.wb-reseau', el).hidden = o !== 'reseau';
  };
  $$('[data-o]', el).forEach(b => b.addEventListener('click', () => onglet(b.dataset.o)));
  $('.wb-adr', el).addEventListener('submit', e => { e.preventDefault(); let v = adr.value.trim(); if (!/^https?:\/\//.test(v)) v = 'https://' + v.replace(/^\/+/, ''); naviguer(v); onglet('page'); });
  $('[data-a="prec"]', el).addEventListener('click', () => { if (pos > 0) { pos--; afficher(hist[pos], 'get', {}, false); } });
  $('[data-a="suiv"]', el).addEventListener('click', () => { if (pos < hist.length - 1) { pos++; afficher(hist[pos], 'get', {}, false); } });
  $('[data-a="rech"]', el).addEventListener('click', () => afficher(courant.url, 'get', {}, false));
  naviguer(opts.depart);
  return { naviguer, onglet, cookies: jar, courant: () => courant, frame };
}
