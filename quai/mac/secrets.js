'use strict';
// Rangement du jeton GitHub.
//   macOS   : Trousseau, via /usr/bin/security (le jeton n'est écrit dans aucun fichier).
//   ailleurs: ~/.quai/config.json, lisible par son seul propriétaire (mode 600).
// Le dépôt choisi (qui n'est pas un secret) est toujours dans ~/.quai/config.json.

const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
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
