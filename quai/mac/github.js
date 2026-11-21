'use strict';
// Client GitHub de Quai pour Mac : fetch natif, aucune dépendance.
//
// La base de l'API et celle des Pages sont configurables (options apiBase / pagesOrigin,
// variables QUAI_GITHUB_API / QUAI_PAGES_ORIGIN côté serveur) pour tester avec un faux GitHub.
// Le jeton n'apparaît que dans l'en-tête Authorization : jamais dans une URL, un message ou un journal.

const crypto = require('node:crypto');
const { HttpError } = require('../lib/store');

const WORKFLOW_FILE = 'quai-pages.yml';
const WORKFLOW_PATH = '.github/workflows/' + WORKFLOW_FILE;

const BLOB_PARALLEL = 5; // envois simultanés
const BLOB_BUDGET = 48 * 1024 * 1024; // octets de fichiers gardés en mémoire en même temps
const TREE_BATCH = 500; // entrées d'arbre par requête

const DEFAULT_TIMING = {
  requestTimeoutMs: 30 * 1000,
  retries: 5, // nouveaux essais par requête
  retryBaseMs: 1000, // attente après une erreur réseau ou 5xx, doublée à chaque essai
  secondaryWaitMs: 60 * 1000, // attente quand GitHub freine sans dire combien de temps
  maxWaitMs: 5 * 60 * 1000, // au-delà, on abandonne plutôt que de faire patienter
  pollMs: 4000, // intervalle entre deux interrogations (exécution du workflow, site)
  findRunMs: 45 * 1000, // délai pour voir apparaître l'exécution déclenchée
  runTimeoutMs: 6 * 60 * 1000, // durée maximale de suivi d'une exécution
  siteTimeoutMs: 4 * 60 * 1000, // attente maximale du lien public
};

// Erreur venue de GitHub. `status` sert de code HTTP pour la réponse de Quai,
// `upstream` est le code renvoyé par GitHub (0 : GitHub injoignable).
class GitHubError extends HttpError {
  constructor(status, message, extra = {}) {
    super(status, message);
    this.upstream = extra.upstream ?? status;
    if (extra.details) this.details = extra.details;
    if (extra.runUrl) this.runUrl = extra.runUrl;
  }
}

// Empreinte Git d'un fichier : celle que GitHub calcule pour le même contenu.
function gitBlobSha(buffer) {
  return crypto
    .createHash('sha1')
    .update(`blob ${buffer.length}\0`)
    .update(buffer)
    .digest('hex');
}

// Même règle que quai/pages/build.js : le nom d'une branche devient le dossier du site.
function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/, '');
}

function createGitHub(options = {}) {
  const apiBase = String(options.apiBase || 'https://api.github.com').replace(/\/+$/, '');
  const webBase = String(options.webBase || 'https://github.com').replace(/\/+$/, '');
  const pagesOrigin = String(options.pagesOrigin || '').replace(/\/+$/, '');
  const timing = { ...DEFAULT_TIMING, ...(options.timing || {}) };
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const fetchImpl = options.fetch || globalThis.fetch;

  // ---------- requêtes ----------

  const githubMessage = (data) =>
    data && typeof data.message === 'string' ? data.message.slice(0, 200).replace(/\.+$/, '') : '';

  // GitHub freine-t-il (limite de débit) ? À ne pas confondre avec un 403 « droits insuffisants ».
  function isThrottled(response, data) {
    if (response.status === 429) return true;
    if (response.status !== 403) return false;
    return (
      response.headers.get('retry-after') !== null ||
      response.headers.get('x-ratelimit-remaining') === '0' ||
      /rate limit|abuse detection/i.test(githubMessage(data))
    );
  }

  // Attente avant un nouvel essai, ou null s'il ne sert à rien de réessayer.
  function retryDelay(response, data, attempt) {
    const backoff = timing.retryBaseMs * 2 ** attempt;
    if (!response || response.status >= 500) return backoff;
    if (!isThrottled(response, data)) return null;
    const retryAfter = Number(response.headers.get('retry-after'));
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    let wait;
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      wait = retryAfter * 1000;
    } else if (response.headers.get('x-ratelimit-remaining') === '0' && reset > 0) {
      wait = Math.max(0, reset * 1000 - Date.now()) + 1000;
    } else {
      wait = timing.secondaryWaitMs * (attempt + 1);
    }
    return wait <= timing.maxWaitMs ? wait : null;
  }

  function failure(response, data, what) {
    const upstream = response.status;
    const detail = githubMessage(data);
    if (isThrottled(response, data)) {
      return new GitHubError(
        429,
        'GitHub limite le nombre de requêtes pour le moment. Patiente quelques minutes, puis réessaie.',
        { upstream }
      );
    }
    if (upstream === 401) {
      return new GitHubError(401, "GitHub a refusé le jeton d'accès : il est incorrect, expiré ou révoqué.");
    }
    if (upstream === 403) {
      return new GitHubError(403, `GitHub a refusé ${what} : le jeton n'a pas les droits nécessaires.`);
    }
    if (upstream === 404) {
      return new GitHubError(
        404,
        `GitHub ne trouve pas ce qu'il faut pour ${what} : le dépôt ou la branche n'existe pas, ou le jeton n'y a pas accès.`
      );
    }
    if (upstream >= 500) {
      return new GitHubError(
        502,
        `GitHub rencontre un problème (erreur ${upstream}) pendant ${what}. Réessaie dans quelques minutes.`,
        { upstream }
      );
    }
    return new GitHubError(409, `GitHub a refusé ${what}${detail ? ` : ${detail}` : ''}.`, { upstream });
  }

  // Appelle l'API. Réessaie sur erreur réseau, 5xx, 429 et 403 « limite de débit ».
  // `what` complète les messages d'erreur (« … a refusé l'envoi d'un fichier »).
  async function request(token, method, route, options = {}) {
    const { body, query, what = 'la requête', timeoutMs = timing.requestTimeoutMs, onWait } = options;
    const url = apiBase + route + (query ? '?' + new URLSearchParams(query) : '');
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'quai-mac',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload;
    if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    for (let attempt = 0; ; attempt++) {
      let response = null;
      let data = null;
      try {
        response = await fetchImpl(url, {
          method,
          headers,
          body: payload,
          signal: AbortSignal.timeout(timeoutMs),
        });
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }
        }
      } catch {
        response = null; // GitHub injoignable, ou réponse interrompue
      }
      if (response && response.status < 400) return { status: response.status, data };

      const wait = attempt < timing.retries ? retryDelay(response, data, attempt) : null;
      if (wait === null) {
        if (!response) {
          throw new GitHubError(502, 'Impossible de joindre GitHub. Vérifie ta connexion internet, puis réessaie.', {
            upstream: 0,
          });
        }
        throw failure(response, data, what);
      }
      if (onWait) onWait(wait);
      await sleep(wait);
    }
  }

  // ---------- un dépôt ----------

  function siteBase(fullName) {
    const [owner, repo] = fullName.split('/');
    const origin = pagesOrigin || `https://${owner.toLowerCase()}.github.io`;
    const userSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
    return origin + (userSite ? '' : '/' + repo);
  }

  function forRepo(token, fullName) {
    const [owner, name] = fullName.split('/');
    const root = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
    const base = siteBase(fullName);
    const call = (method, route, opts) => request(token, method, root + route, opts);
    const refPath = (branch) => branch.split('/').map(encodeURIComponent).join('/');

    async function publicFetch(url) {
      // Site public : aucun jeton n'est envoyé.
      try {
        return await fetchImpl(`${url}?t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'quai-mac' },
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        return null;
      }
    }

    return {
      fullName,
      siteBase: base,
      webUrl: `${webBase}/${fullName}`,
      pagesSettingsUrl: `${webBase}/${fullName}/settings/pages`,
      siteUrl: (slug) => `${base}/${slug}/`,

      async info() {
        const { data } = await call('GET', '', { what: 'la lecture du dépôt' });
        return data || {};
      },

      // Le workflow de publication est-il sur cette branche ? (null : impossible à vérifier)
      async hasWorkflow(branch) {
        try {
          await call('GET', `/contents/${WORKFLOW_PATH}`, { query: { ref: branch }, what: 'la lecture du dépôt' });
          return true;
        } catch (err) {
          if (err.upstream === 404) return false;
          if (err.upstream === 403) return null;
          throw err;
        }
      },

      // 'active' (source : GitHub Actions), 'legacy' (autre source), 'absent', ou 'unknown'.
      async pages() {
        try {
          const { data } = await call('GET', '/pages', { what: "la lecture de l'état de GitHub Pages" });
          return data && data.build_type === 'workflow' ? 'active' : 'legacy';
        } catch (err) {
          if (err.upstream === 404) return 'absent';
          if (err.upstream === 403) return 'unknown';
          throw err;
        }
      },

      async enablePages() {
        const what = "l'activation de GitHub Pages";
        const body = { build_type: 'workflow' };
        const state = await this.pages();
        if (state === 'active') return;
        if (state === 'legacy') {
          await call('PUT', '/pages', { body, what });
          return;
        }
        try {
          await call('POST', '/pages', { body, what });
        } catch (err) {
          if (err.upstream !== 409) throw err;
          await call('PUT', '/pages', { body, what }); // Pages existait déjà
        }
      },

      async branches() {
        const names = [];
        for (let page = 1; page <= 20; page++) {
          const { data } = await call('GET', '/branches', {
            query: { per_page: '100', page: String(page) },
            what: 'la lecture des projets',
          });
          const list = Array.isArray(data) ? data : [];
          for (const branch of list) {
            if (branch && typeof branch.name === 'string') names.push(branch.name);
          }
          if (list.length < 100) break;
        }
        return names;
      },

      // Dernier commit de la branche, ou null si elle n'existe pas.
      async head(branch) {
        try {
          const { data } = await call('GET', `/git/ref/heads/${refPath(branch)}`, { what: 'la lecture du projet' });
          return (data && data.object && data.object.sha) || null;
        } catch (err) {
          if (err.upstream === 404) return null;
          throw err;
        }
      },

      // Empreintes des fichiers déjà présents dans un commit (pour ne pas les renvoyer).
      async blobShas(commit) {
        const known = new Set();
        try {
          const { data } = await call('GET', `/git/trees/${commit}`, {
            query: { recursive: '1' },
            what: 'la lecture du projet',
          });
          for (const entry of (data && data.tree) || []) {
            if (entry && entry.type === 'blob' && typeof entry.sha === 'string') known.add(entry.sha);
          }
        } catch (err) {
          if (err.upstream === 401) throw err;
          // Tant pis : tous les fichiers seront envoyés.
        }
        return known;
      },

      async createBlob(buffer, onWait) {
        const { data } = await call('POST', '/git/blobs', {
          body: { content: buffer.toString('base64'), encoding: 'base64' },
          what: "l'envoi d'un fichier",
          // Les gros fichiers ont droit à plus de temps (au moins 64 Ko/s).
          timeoutMs: timing.requestTimeoutMs * 2 + Math.ceil(buffer.length / 64),
          onWait,
        });
        return data.sha;
      },

      async createTree(entries, baseTree, onWait) {
        const body = { tree: entries };
        if (baseTree) body.base_tree = baseTree;
        const { data } = await call('POST', '/git/trees', {
          body,
          what: "l'enregistrement de la liste des fichiers",
          timeoutMs: timing.requestTimeoutMs * 4,
          onWait,
        });
        return data.sha;
      },

      async createCommit(message, tree, parents) {
        const { data } = await call('POST', '/git/commits', {
          body: { message, tree, parents },
          what: "l'enregistrement de la version",
        });
        const date = Date.parse(data.committer && data.committer.date);
        // Sans date fournie par GitHub : l'heure d'ici, avec deux minutes de marge pour l'écart d'horloge.
        return { sha: data.sha, date: Number.isFinite(date) ? date : Date.now() - 2 * 60 * 1000 };
      },

      async createBranch(branch, sha) {
        await call('POST', '/git/refs', { body: { ref: `refs/heads/${branch}`, sha }, what: 'la création du projet' });
      },

      async updateBranch(branch, sha) {
        await call('PATCH', `/git/refs/heads/${refPath(branch)}`, {
          body: { sha, force: false },
          what: 'la mise à jour du projet',
        });
      },

      async deleteBranch(branch) {
        await call('DELETE', `/git/refs/heads/${refPath(branch)}`, { what: 'la suppression du projet' });
      },

      async dispatch(ref) {
        try {
          await call('POST', `/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            body: { ref },
            what: 'le lancement de la publication',
          });
        } catch (err) {
          if (err.upstream === 404) {
            throw new GitHubError(
              404,
              `Impossible de lancer la publication : le fichier ${WORKFLOW_PATH} est introuvable sur la branche ${ref}, ou le jeton n'a pas accès aux Actions du dépôt.`
            );
          }
          if (err.upstream === 403) {
            throw new GitHubError(
              403,
              "Impossible de lancer la publication : le jeton n'a pas le droit de déclencher les Actions du dépôt."
            );
          }
          throw err;
        }
      },

      // Exécutions du workflow lancées à la main sur cette branche, les plus récentes d'abord.
      async runs(branch) {
        const { data } = await call('GET', `/actions/workflows/${WORKFLOW_FILE}/runs`, {
          query: { branch, event: 'workflow_dispatch', per_page: '10' },
          what: 'le suivi de la publication',
        });
        return ((data && data.workflow_runs) || [])
          .filter((run) => run && Number.isFinite(run.id))
          .sort((a, b) => b.id - a.id);
      },

      async run(id) {
        const { data } = await call('GET', `/actions/runs/${id}`, { what: 'le suivi de la publication' });
        return data || {};
      },

      // Liste des projets en ligne (quai.json), ou null si le site n'est pas encore publié.
      async manifest() {
        const response = await publicFetch(`${base}/quai.json`);
        if (!response || !response.ok) return null;
        try {
          const data = await response.json();
          return data && Array.isArray(data.projects) ? data : null;
        } catch {
          return null;
        }
      },

      async pageOk(slug) {
        const response = await publicFetch(`${base}/${slug}/`);
        if (response) await response.arrayBuffer().catch(() => {});
        return Boolean(response && response.status === 200);
      },
    };
  }

  // ---------- connexion ----------

  // Vérifie le jeton et le dépôt, puis ce dont la publication a besoin.
  async function inspect(token, fullName) {
    const { data: user } = await request(token, 'GET', '/user', { what: 'la vérification du jeton' });
    const repo = forRepo(token, fullName);
    let info;
    try {
      info = await repo.info();
    } catch (err) {
      if (err.upstream === 404 || err.upstream === 403) {
        throw new GitHubError(err.upstream, `Dépôt « ${fullName} » introuvable, ou ce jeton n'y a pas accès.`);
      }
      throw err;
    }
    const canonical = typeof info.full_name === 'string' && info.full_name.includes('/') ? info.full_name : fullName;
    const defaultBranch = info.default_branch || 'main';
    const client = canonical === fullName ? repo : forRepo(token, canonical);
    const [workflow, pages] = await Promise.all([client.hasWorkflow(defaultBranch), client.pages()]);
    return {
      login: String((user && user.login) || ''),
      fullName: canonical,
      defaultBranch,
      canPush: Boolean(info.permissions && info.permissions.push),
      workflow,
      pages,
      client,
    };
  }

  // ---------- envoi d'un site ----------

  // Envoie les fichiers et fait pointer la branche dessus.
  //   files : [{ path: 'dossier/fichier.html', size, read: () => Promise<Buffer> }]
  // Renvoie { sha, date, existed, reused }.
  async function pushSite(repo, { branch, files, message, onProgress = () => {}, onWait }) {
    const head = await repo.head(branch);
    const known = head ? await repo.blobShas(head) : new Set();
    onProgress({ existed: Boolean(head), done: 0, reused: 0 });

    // 1. Un blob par fichier, BLOB_PARALLEL à la fois, sans garder trop d'octets en mémoire.
    const shas = new Array(files.length);
    const sending = new Map(); // empreinte → envoi en cours ou terminé
    const waiters = [];
    let inMemory = 0;
    let next = 0;
    let done = 0;
    let reused = 0;
    let failed = null;

    async function acquire(size) {
      while (inMemory > 0 && inMemory + size > BLOB_BUDGET) {
        await new Promise((resolve) => waiters.push(resolve));
      }
      inMemory += size;
    }
    function release(size) {
      inMemory -= size;
      for (const wake of waiters.splice(0)) wake();
    }

    async function worker() {
      while (!failed && next < files.length) {
        const index = next++;
        const file = files[index];
        await acquire(file.size);
        try {
          const buffer = await file.read();
          const sha = gitBlobSha(buffer);
          if (known.has(sha)) {
            shas[index] = sha;
            reused += 1;
          } else {
            if (!sending.has(sha)) sending.set(sha, repo.createBlob(buffer, onWait));
            shas[index] = await sending.get(sha);
          }
          done += 1;
          onProgress({ existed: Boolean(head), done, reused });
        } catch (err) {
          failed = failed || err;
        } finally {
          release(file.size);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(BLOB_PARALLEL, files.length) }, worker));
    if (failed) throw failed;

    // 2. L'arbre complet, par lots : chaque lot s'ajoute à l'arbre du lot précédent.
    const entries = files
      .map((file, index) => ({ path: file.path, mode: '100644', type: 'blob', sha: shas[index] }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    let tree = null;
    for (let i = 0; i < entries.length; i += TREE_BATCH) {
      tree = await repo.createTree(entries.slice(i, i + TREE_BATCH), tree, onWait);
    }

    // 3. Le commit, puis la branche.
    const commit = await repo.createCommit(message, tree, head ? [head] : []);
    if (head) await repo.updateBranch(branch, commit.sha);
    else await repo.createBranch(branch, commit.sha);
    return { sha: commit.sha, date: commit.date, existed: Boolean(head), reused };
  }

  // ---------- publication ----------

  // Lance le workflow. Renvoie l'identifiant de l'exécution la plus récente avant le lancement
  // (0 s'il n'y en avait pas), ou null si le jeton ne permet pas de suivre les exécutions.
  async function triggerPublication(repo, defaultBranch) {
    let before = null;
    try {
      const runs = await repo.runs(defaultBranch);
      before = runs.length ? runs[0].id : 0;
    } catch (err) {
      if (err.upstream === 401) throw err;
    }
    await repo.dispatch(defaultBranch);
    return before;
  }

  // Suit l'exécution déclenchée. Renvoie { conclusion: 'success' | 'unknown', url }.
  // Une exécution annulée a été remplacée par une plus récente : on suit celle-là.
  async function followRun(repo, defaultBranch, before, { onStatus = () => {} } = {}) {
    if (before === null) return { conclusion: 'unknown', url: null };
    let after = before;
    let run = null;
    let url = null;
    let elapsed = 0;
    let searching = 0;
    for (;;) {
      try {
        if (run) run = await repo.run(run.id);
        else run = (await repo.runs(defaultBranch)).find((candidate) => candidate.id > after) || null;
      } catch (err) {
        if (err.upstream === 401) throw err;
        return { conclusion: 'unknown', url };
      }
      if (run) {
        // Ce lien sera cliquable dans la page : seule une adresse https est acceptée.
        if (typeof run.html_url === 'string' && /^https:\/\//.test(run.html_url)) url = run.html_url;
        onStatus({ status: run.status === 'completed' ? 'completed' : run.status === 'in_progress' ? 'in_progress' : 'queued', url });
        if (run.status === 'completed') {
          if (run.conclusion === 'success') return { conclusion: 'success', url };
          if (run.conclusion !== 'cancelled' && run.conclusion !== 'skipped') {
            throw new GitHubError(502, 'La publication a échoué chez GitHub : son journal indique ce qui a bloqué.', {
              upstream: 0,
              runUrl: url,
            });
          }
          after = run.id;
          run = null;
          searching = 0;
        }
      } else if (searching >= timing.findRunMs) {
        return { conclusion: 'unknown', url };
      }
      if (elapsed >= timing.runTimeoutMs) return { conclusion: 'unknown', url };
      await sleep(timing.pollMs);
      elapsed += timing.pollMs;
      if (!run) searching += timing.pollMs;
    }
  }

  // Attend que le site publié contienne la version du commit `since`, puis que le lien réponde.
  async function waitOnline(repo, { slug, branch, since, built }) {
    let elapsed = 0;
    for (;;) {
      const manifest = await repo.manifest();
      if (manifest) {
        const project = manifest.projects.find((p) => p && p.slug === slug);
        if (project && Number(project.updatedAt) >= since) {
          if (await repo.pageOk(slug)) return;
        } else if (!project && built && Number(manifest.generatedAt) >= since) {
          const prefix = `branche ${branch} : `;
          const skipped = (Array.isArray(manifest.skipped) ? manifest.skipped : []).find(
            (line) => typeof line === 'string' && line.startsWith(prefix)
          );
          if (skipped) {
            const reason = skipped.slice(prefix.length, prefix.length + 200);
            const advice = /index\.html/.test(reason)
              ? ' Ajoute un fichier index.html à la racine du projet, puis publie une nouvelle version.'
              : '';
            throw new GitHubError(409, `Les fichiers sont bien envoyés, mais GitHub n'a pas publié ce projet (${reason}).${advice}`, {
              upstream: 0,
            });
          }
        }
      }
      if (elapsed >= timing.siteTimeoutMs) {
        throw new GitHubError(
          504,
          "Les fichiers sont bien envoyés, mais le lien ne répond pas encore. GitHub met parfois plus de temps : réessaie le lien dans quelques minutes.",
          { upstream: 0 }
        );
      }
      await sleep(timing.pollMs);
      elapsed += timing.pollMs;
    }
  }

  return { apiBase, webBase, timing, request, forRepo, siteBase, inspect, pushSite, triggerPublication, followRun, waitOnline };
}

module.exports = { createGitHub, GitHubError, gitBlobSha, slugify, WORKFLOW_FILE, WORKFLOW_PATH };
