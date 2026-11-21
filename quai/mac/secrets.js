'use strict';
// Rangement du jeton GitHub.
//   macOS   : Trousseau, via /usr/bin/security (le jeton n'est écrit dans aucun fichier).
//   ailleurs: ~/.quai/config.json, lisible par son seul propriétaire (mode 600).
// Le dépôt choisi (qui n'est pas un secret) est toujours dans ~/.quai/config.json.

const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile, spawn } = require('node:child_process');
const { HttpError } = require('../lib/store');

const SERVICE = 'fr.quai.mac';
const ACCOUNT = 'jeton-github';
const NOT_FOUND = 44; // code de sortie de security quand l'élément n'existe pas

// Lance une commande sans shell. Ne rejette jamais : l'erreur d'execFile contient la ligne
// de commande complète (donc le jeton), elle ne doit pas remonter jusqu'à un journal.
function run(bin, args) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: 15000, maxBuffer: 64 * 1024, windowsHide: true }, (err, stdout) => {
      const code = !err ? 0 : typeof err.code === 'number' ? err.code : -1;
      resolve({ code, stdout: String(stdout || '') });
    });
  });
}

// Même chose, en passant du texte sur l'entrée standard (rien de sensible dans les arguments).
function runWithInput(bin, args, input) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, args, { stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true });
    } catch {
      return resolve({ code: -1 });
    }
    const timer = setTimeout(() => child.kill(), 15000);
    child.on('error', () => {
      clearTimeout(timer);
      resolve({ code: -1 });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: typeof code === 'number' ? code : -1 });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

function createSecrets({ kind, configDir, securityBin = '/usr/bin/security' }) {
  const file = path.join(configDir, 'config.json');

  async function readConfig() {
    try {
      const data = JSON.parse(await fsp.readFile(file, 'utf8'));
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch {
      return {};
    }
  }

  async function writeConfig(data) {
    await fsp.mkdir(configDir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
    await fsp.chmod(tmp, 0o600); // le mode demandé à la création dépend de l'umask
    await fsp.rename(tmp, file);
  }

  async function update(changes) {
    const config = await readConfig();
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) delete config[key];
      else config[key] = value;
    }
    await writeConfig(config);
  }

  const keychain = {
    async get() {
      const { code, stdout } = await run(securityBin, ['find-generic-password', '-s', SERVICE, '-a', ACCOUNT, '-w']);
      if (code === NOT_FOUND) return null;
      if (code !== 0) throw new HttpError(503, "Le Trousseau du Mac n'a pas pu être lu. Déverrouille ta session, puis réessaie.");
      return stdout.replace(/\r?\n$/, '') || null;
    },
    async set(token) {
      // D'abord par l'entrée standard (mode interactif de security) : le jeton n'apparaît alors pas
      // dans la liste des processus du Mac. On relit pour vérifier ; à défaut, on passe par un argument.
      if (/^[A-Za-z0-9_.~+/=-]+$/.test(token)) {
        await runWithInput(securityBin, ['-i'], `add-generic-password -U -s ${SERVICE} -a ${ACCOUNT} -l Quai-jeton-GitHub -w ${token}\n`);
        const stored = await keychain.get().catch(() => null);
        if (stored === token) return;
      }
      const { code } = await run(securityBin, [
        'add-generic-password', '-U', '-s', SERVICE, '-a', ACCOUNT, '-l', 'Quai (jeton GitHub)', '-w', token,
      ]);
      if (code !== 0) throw new HttpError(503, "Le jeton n'a pas pu être enregistré dans le Trousseau du Mac.");
    },
    async clear() {
      await run(securityBin, ['delete-generic-password', '-s', SERVICE, '-a', ACCOUNT]);
    },
  };

  const plainFile = {
    async get() {
      const { token } = await readConfig();
      return typeof token === 'string' && token ? token : null;
    },
    set: (token) => update({ token }),
    clear: () => update({ token: null }),
  };

  const tokens = kind === 'keychain' ? keychain : plainFile;

  return {
    kind: kind === 'keychain' ? 'keychain' : 'file',
    file,
    getToken: () => tokens.get(),
    setToken: (token) => tokens.set(token),
    clearToken: () => tokens.clear(),
    async getRepo() {
      const { repo } = await readConfig();
      return typeof repo === 'string' ? repo : null;
    },
    setRepo: (repo) => update({ repo }),
  };
}

module.exports = { createSecrets, SERVICE, ACCOUNT };
