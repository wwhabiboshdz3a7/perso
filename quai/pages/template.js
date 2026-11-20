'use strict';
// Pages générées pour GitHub Pages : l'accueil qui liste les projets, et la page 404.

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function formatBytes(n) {
  const fmt = (v) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  if (n < 1024) return n + ' o';
  if (n < 1024 * 1024) return fmt(n / 1024) + ' Ko';
  return fmt(n / 1024 / 1024) + ' Mo';
}

const formatDate = (ms) =>
  new Date(ms).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' });

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230d5c63'/%3E%3Cpath d='M9 8h14v4H9zM12 12h8v7h-8zM6 23c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const STYLE = `
  :root {
    --bg: #f4f1ea; --surface: #fffdf8; --ink: #17232b; --muted: #5d6a72; --line: #dcd6c8;
    --accent: #0d5c63; --accent-ink: #ffffff; --accent-soft: #e2efee; --signal: #b4500f;
    --mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f171c; --surface: #16212a; --ink: #e9eef0; --muted: #94a3ab; --line: #2a3943;
      --accent: #4fc1c4; --accent-ink: #062427; --accent-soft: #173238; --signal: #ffab7a;
    }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 0 16px 72px; }
  header { display: flex; align-items: center; gap: 10px; padding: 22px 0 18px; font-weight: 700; font-size: 20px; }
  header img { width: 30px; height: 30px; }
  header small { font-weight: 500; color: var(--muted); font-size: 13px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 20px; }
  .add h1 { margin: 0 0 6px; font-size: 20px; letter-spacing: -0.01em; }
  .add p { margin: 0 0 14px; color: var(--muted); font-size: 14px; }
  .add ol { margin: 0 0 16px; padding-left: 20px; font-size: 14px; }
  .add li { margin-bottom: 4px; }
  .btn, button {
    font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; min-height: 38px; padding: 8px 14px;
    border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink);
  }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  .btn:hover, button:hover { border-color: var(--accent); }
  .btn:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 34px 0 12px; }
  .projects { display: grid; gap: 12px; }
  .name { font-weight: 700; font-size: 17px; margin: 0; overflow-wrap: anywhere; }
  .meta { font-size: 13px; color: var(--muted); margin: 2px 0 10px; }
  .linkrow { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .link { font-family: var(--mono); font-size: 14px; color: var(--accent); overflow-wrap: anywhere; text-decoration: none; flex: 1 1 220px; min-width: 0; }
  .link:hover { text-decoration: underline; }
  .note { font-size: 13px; color: var(--signal); margin: 10px 0 0; }
  .empty { text-align: center; color: var(--muted); }
  footer { margin-top: 28px; font-size: 13px; color: var(--muted); }
  footer ul { margin: 6px 0 0; padding-left: 18px; }
  .center { display: grid; place-items: center; min-height: 80vh; text-align: center; }
  .center p.big { font-size: 56px; font-weight: 700; margin: 0; }
`;

function page(title, body) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="icon" href="${ICON}">
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>
`;
}

function projectCard(project) {
  const meta = `${project.label} · mis à jour le ${formatDate(project.updatedAt)} · ${plural(project.files, 'fichier')} · ${formatBytes(project.bytes)}`;
  return `<article class="card">
  <p class="name">${esc(project.slug)}</p>
  <p class="meta">${esc(meta)}</p>
  <div class="linkrow">
    <a class="link" href="${esc(project.url)}">${esc(project.url)}</a>
    <button type="button" data-copy="${esc(project.url)}">Copier le lien</button>
  </div>
${project.notes.map((note) => `  <p class="note">${esc(note)}</p>`).join('\n')}
</article>`;
}

function renderIndex(manifest, { uploadUrl }) {
  const projects = manifest.projects.length
    ? manifest.projects.map(projectCard).join('\n')
    : `<div class="card empty">Aucun projet pour l'instant. Dépose ton premier site ci-dessus.</div>`;
  const skipped = manifest.skipped.length
    ? `<p>Non publiés :</p><ul>${manifest.skipped.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul>`
    : '';
  return page(
    'Quai',
    `<header><img src="${ICON}" alt=""><span>Quai <small>· tes projets en ligne</small></span></header>

<section class="card add">
  <h1>Ajouter un projet</h1>
  <p>Chaque projet reçoit un lien public, accessible depuis n'importe quel appareil.</p>
  <ol>
    <li>Ouvre la page de dépôt et glisse ton dossier ou ton fichier .zip.</li>
    <li>Valide avec le bouton vert « Commit changes ».</li>
    <li>Le lien apparaît sur cette page une à deux minutes plus tard.</li>
  </ol>
  <a class="btn primary" href="${esc(uploadUrl)}">Déposer un projet</a>
</section>

<h2>Mes projets</h2>
<div class="projects">
${projects}
</div>

<footer>
  <p>Dernière publication : ${esc(formatDate(manifest.generatedAt))}. Les branches du dépôt ${esc(manifest.repository)} qui contiennent un site sont publiées automatiquement.</p>
  ${skipped}
</footer>

<script>
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const url = button.getAttribute('data-copy');
  try {
    await navigator.clipboard.writeText(url);
    const label = button.textContent;
    button.textContent = 'Copié';
    setTimeout(() => { button.textContent = label; }, 1500);
  } catch {
    window.prompt('Copie ce lien :', url);
  }
});
</script>`
  );
}

function renderNotFound(manifest) {
  const projects = JSON.stringify(
    manifest.projects.map((p) => ({ slug: p.slug, path: new URL(p.url).pathname }))
  ).replace(/</g, '\\u003c');
  return page(
    'Page introuvable',
    `<div class="center"><div>
  <p class="big">404</p>
  <p>Cette page n'existe pas.</p>
  <p><a class="btn primary" id="back" href="${esc(manifest.url)}">Voir tous les projets</a></p>
</div></div>
<script>
(() => {
  const projects = ${projects};
  const match = projects.find((p) => location.pathname.startsWith(p.path));
  if (match) {
    const back = document.getElementById('back');
    back.href = match.path;
    back.textContent = 'Retour à ' + match.slug;
  }
})();
</script>`
  );
}

module.exports = { renderIndex, renderNotFound };
