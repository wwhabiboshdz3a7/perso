// Tests unitaires des fonctions Netlify (node --test). Les appels aux fournisseurs sont simulés.
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { creerJeton, verifierJeton } from '../netlify/lib/jeton.mjs';
import { hacherCode, lireCorrespondances, verifierCle, ErreurFournisseur } from '../netlify/lib/verificateurs.mjs';
import access, { reinitialiserLimites } from '../netlify/functions/access.mjs';
import content from '../netlify/functions/content.mjs';

const SECRET = 'secret-de-test-0123456789-abcdefghijklmnop';
const CODE_PRO = 'LEV-TESTP-RO234-56789';
const CODE_ESS = 'LEV-ESSEN-TIEL2-34567';

const fetchOriginal = globalThis.fetch;
let appels = [];
function simulerFetch(gestionnaire) {
  appels = [];
  globalThis.fetch = async (url, options = {}) => {
    appels.push({ url: String(url), options });
    const r = await gestionnaire(String(url), options);
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r.corps ?? {}), { status: r.statut ?? 200, headers: { 'Content-Type': 'application/json' } });
  };
}

const ENV_DE_BASE = { ...process.env };
function definirEnv(vars) {
  for (const k of ['TOKEN_SECRET', 'ACCESS_CODE_HASHES', 'GUMROAD_PRODUCT_IDS', 'LEMONSQUEEZY_STORE_ID', 'LEMONSQUEEZY_PRODUITS', 'STRIPE_SECRET_KEY', 'STRIPE_LIENS', 'TOKEN_TTL_DAYS']) delete process.env[k];
  Object.assign(process.env, vars);
}

const post = (corps, entetes = {}) => new Request('http://localhost/.netlify/functions/access', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...entetes }, body: JSON.stringify(corps)
});
const get = (query, jeton) => new Request(`http://localhost/.netlify/functions/content?${query}`, {
  headers: jeton ? { Authorization: `Bearer ${jeton}` } : {}
});
const ctx = (ip = '10.0.0.1') => ({ ip });

beforeEach(() => {
  reinitialiserLimites();
  definirEnv({ TOKEN_SECRET: SECRET, ACCESS_CODE_HASHES: `pro:${hacherCode(CODE_PRO)},essentiel:${hacherCode(CODE_ESS)}` });
});
afterEach(() => { globalThis.fetch = fetchOriginal; });
process.on('exit', () => { Object.assign(process.env, ENV_DE_BASE); });

describe('jetons HMAC', () => {
  test('un jeton signé est vérifié et contient l\'offre', () => {
    const { jeton } = creerJeton({ offre: 'pro', source: 'code' }, SECRET, 3600);
    const c = verifierJeton(jeton, SECRET);
    assert.equal(c.o, 'pro');
    assert.equal(c.s, 'code');
  });
  test('signature modifiée, mauvais secret ou jeton expiré : refus', () => {
    const { jeton } = creerJeton({ offre: 'essentiel', source: 'code' }, SECRET, 3600);
    const [corps, sig] = jeton.split('.');
    const falsifie = Buffer.from(JSON.stringify({ v: 1, o: 'vip', s: 'code', r: '', iat: 1, exp: 9999999999 })).toString('base64url');
    assert.equal(verifierJeton(`${falsifie}.${sig}`, SECRET), null);
    assert.equal(verifierJeton(`${corps}.${sig.slice(0, -2)}xx`, SECRET), null);
    assert.equal(verifierJeton(jeton, SECRET + 'x'), null);
    assert.equal(verifierJeton(jeton, SECRET, Date.now() + 3601 * 1000), null);
    assert.equal(verifierJeton('nimportequoi', SECRET), null);
  });
  test('un secret trop court est refusé à la création', () => {
    assert.throws(() => creerJeton({ offre: 'pro', source: 'code' }, 'court', 60));
  });
});

describe('lecture des correspondances', () => {
  test('préfixes d\'offre, valeur par défaut et séparateurs multiples', () => {
    assert.deepEqual(lireCorrespondances('pro:abc, vip:def;123\nessentiel:x'), [
      { offre: 'pro', valeur: 'abc' }, { offre: 'vip', valeur: 'def' }, { offre: 'pro', valeur: '123' }, { offre: 'essentiel', valeur: 'x' }
    ]);
  });
});

describe('fonction access', () => {
  test('GET refusé (405)', async () => {
    const r = await access(new Request('http://localhost/.netlify/functions/access'), ctx());
    assert.equal(r.status, 405);
  });
  test('clé absente (400)', async () => {
    const r = await access(post({}), ctx());
    assert.equal(r.status, 400);
  });
  test('code inconnu (401)', async () => {
    const r = await access(post({ cle: 'LEV-FAUX0-FAUX0-FAUX0' }), ctx());
    assert.equal(r.status, 401);
    assert.match((await r.json()).erreur, /non reconnu/);
  });
  test('code valide : jeton pro, insensible à la casse et aux espaces', async () => {
    const r = await access(post({ cle: '  lev-testp-ro234-56789 ' }), ctx());
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.offre, 'pro');
    assert.equal(d.source, 'code');
    assert.ok(verifierJeton(d.jeton, SECRET));
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
  });
  test('formulaire urlencodé accepté', async () => {
    const r = await access(new Request('http://localhost/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'cle=' + encodeURIComponent(CODE_ESS) }), ctx());
    assert.equal((await r.json()).offre, 'essentiel');
  });
  test('TOKEN_SECRET absent : 500 explicite', async () => {
    delete process.env.TOKEN_SECRET;
    const r = await access(post({ cle: CODE_PRO }), ctx());
    assert.equal(r.status, 500);
  });
  test('limitation : 429 après 10 échecs depuis la même IP', async () => {
    for (let i = 0; i < 10; i++) assert.equal((await access(post({ cle: 'MAUVAIS-' + i }), ctx('1.2.3.4'))).status, 401);
    assert.equal((await access(post({ cle: CODE_PRO }), ctx('1.2.3.4'))).status, 429);
    assert.equal((await access(post({ cle: CODE_PRO }), ctx('5.6.7.8'))).status, 200);
  });
});

describe('licences Gumroad', () => {
  const CLE = 'A1B2C3D4-E5F60718-293A4B5C-6D7E8F90';
  beforeEach(() => { process.env.GUMROAD_PRODUCT_IDS = 'essentiel:prodEss==,pro:prodPro=='; });

  test('licence valide du produit Pro', async () => {
    simulerFetch((url, o) => {
      const p = new URLSearchParams(o.body);
      if (p.get('product_id') === 'prodPro==') return { corps: { success: true, uses: 1, purchase: { product_id: 'prodPro==', sale_id: 'vente1', refunded: false, chargebacked: false, disputed: false } } };
      return { statut: 404, corps: { success: false, message: 'That license does not exist for the provided product.' } };
    });
    const r = await access(post({ cle: CLE }), ctx());
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.offre, 'pro');
    assert.equal(d.source, 'gumroad');
    assert.equal(appels[0].url, 'https://api.gumroad.com/v2/licenses/verify');
    const params = new URLSearchParams(appels[0].options.body);
    assert.equal(params.get('license_key'), CLE);
    assert.equal(params.get('increment_uses_count'), 'false');
  });
  test('licence remboursée : refus', async () => {
    simulerFetch(() => ({ corps: { success: true, purchase: { product_id: 'prodEss==', refunded: true } } }));
    assert.equal((await access(post({ cle: CLE }), ctx())).status, 401);
  });
  test('Gumroad injoignable : 502', async () => {
    simulerFetch(() => new TypeError('fetch failed'));
    assert.equal((await access(post({ cle: CLE }), ctx())).status, 502);
  });
});

describe('licences Lemon Squeezy', () => {
  const CLE = '38b1460a-5104-4067-a91d-77b872934d51';
  beforeEach(() => { process.env.LEMONSQUEEZY_STORE_ID = '1234'; process.env.LEMONSQUEEZY_PRODUITS = 'essentiel:111,vip:333'; });
  const reponse = (meta, status = 'inactive') => ({ corps: { valid: true, error: null, license_key: { id: 1, status, key: CLE }, instance: null, meta } });

  test('licence valide : offre déduite de la variante', async () => {
    simulerFetch(() => reponse({ store_id: 1234, order_id: 9, product_id: 50, variant_id: 333 }));
    const d = await (await access(post({ cle: CLE }), ctx())).json();
    assert.equal(d.offre, 'vip');
    assert.equal(d.source, 'lemonsqueezy');
    assert.equal(appels[0].url, 'https://api.lemonsqueezy.com/v1/licenses/validate');
    assert.equal(new URLSearchParams(appels[0].options.body).get('license_key'), CLE);
  });
  test('licence d\'une autre boutique : refus', async () => {
    simulerFetch(() => reponse({ store_id: 999, product_id: 111, variant_id: 1 }));
    assert.equal((await access(post({ cle: CLE }), ctx())).status, 401);
  });
  test('licence désactivée : refus', async () => {
    simulerFetch(() => ({ corps: { valid: false, error: 'license_key not found', license_key: { status: 'disabled' }, meta: { store_id: 1234, product_id: 111 } } }));
    assert.equal((await access(post({ cle: CLE }), ctx())).status, 401);
  });
});

describe('paiements Stripe (liens de paiement)', () => {
  const SESSION = 'cs_test_a1B2c3D4e5F6g7H8i9J0';
  beforeEach(() => { process.env.STRIPE_SECRET_KEY = 'rk_test_cle'; process.env.STRIPE_LIENS = 'pro:plink_PRO,essentiel:plink_ESS'; });

  test('session payée issue du lien Pro', async () => {
    simulerFetch(url => {
      assert.ok(url.endsWith('/v1/checkout/sessions/' + SESSION));
      return { corps: { object: 'checkout.session', id: SESSION, status: 'complete', payment_status: 'paid', payment_link: 'plink_PRO' } };
    });
    const d = await (await access(post({ cle: SESSION }), ctx())).json();
    assert.equal(d.offre, 'pro');
    assert.equal(appels[0].options.headers.Authorization, 'Bearer rk_test_cle');
  });
  test('session non payée : refus', async () => {
    simulerFetch(() => ({ corps: { object: 'checkout.session', id: SESSION, status: 'open', payment_status: 'unpaid', payment_link: 'plink_PRO' } }));
    assert.equal((await access(post({ cle: SESSION }), ctx())).status, 401);
  });
});

describe('verifierCle sans configuration de fournisseur', () => {
  test('aucun appel réseau si aucun fournisseur n\'est configuré', async () => {
    simulerFetch(() => { throw new Error('ne devrait pas être appelé'); });
    assert.equal(await verifierCle('A1B2C3D4-E5F60718-293A4B5C-6D7E8F90', { ACCESS_CODE_HASHES: '' }), null);
    assert.equal(appels.length, 0);
  });
  test('ErreurFournisseur est exportée', () => { assert.ok(new ErreurFournisseur('x') instanceof Error); });
});

describe('fonction content', () => {
  const jeton = offre => creerJeton({ offre, source: 'code' }, SECRET, 3600).jeton;

  test('sans jeton : 401', async () => {
    assert.equal((await content(get('module=m4'))).status, 401);
  });
  test('jeton falsifié : 401', async () => {
    assert.equal((await content(get('module=m4', jeton('pro') + 'x'))).status, 401);
  });
  test('offre insuffisante : 403 avec l\'offre requise', async () => {
    const r = await content(get('module=m6', jeton('essentiel')));
    assert.equal(r.status, 403);
    assert.equal((await r.json()).offreRequise, 'pro');
  });
  test('offre Pro : module 6 complet', async () => {
    const r = await content(get('module=m6', jeton('pro')));
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.id, 'm6');
    assert.ok(d.lecons.length >= 10);
    assert.ok(d.lecons.every(l => l.theorie && l.quiz.length >= 3));
  });
  test('offre Essentiel : modules 2, 3, 7, 8 et bonus accessibles', async () => {
    for (const id of ['m2', 'm3', 'm7', 'm8', 'bonus']) assert.equal((await content(get('module=' + id, jeton('essentiel')))).status, 200, id);
  });
  test('VIP accède à tout', async () => {
    for (const id of ['m2', 'm4', 'm5', 'm6', 'bonus']) assert.equal((await content(get('module=' + id, jeton('vip')))).status, 200, id);
  });
  test('module inconnu : 404 ; module gratuit : 400', async () => {
    assert.equal((await content(get('module=m42', jeton('pro')))).status, 404);
    assert.equal((await content(get('module=m1', jeton('pro')))).status, 400);
  });
  test('workflow n8n téléchargeable pour Pro, refusé pour Essentiel', async () => {
    const ok = await content(get('fichier=' + encodeURIComponent('n8n/01-qualification-prospects.json'), jeton('pro')));
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get('content-disposition'), /attachment/);
    const wf = JSON.parse(await ok.text());
    assert.ok(Array.isArray(wf.nodes) && wf.nodes.length > 2);
    assert.equal((await content(get('fichier=' + encodeURIComponent('n8n/01-qualification-prospects.json'), jeton('essentiel')))).status, 403);
  });
  test('chemins non déclarés ou remontée de dossier : 404', async () => {
    for (const f of ['../netlify/functions/access.mjs', 'modules/m6.mjs', 'n8n/../modules/m6.mjs', 'codes-acces.txt']) {
      assert.equal((await content(get('fichier=' + encodeURIComponent(f), jeton('vip')))).status, 404, f);
    }
  });
  test('POST refusé (405)', async () => {
    assert.equal((await content(new Request('http://localhost/.netlify/functions/content?module=m2', { method: 'POST' }))).status, 405);
  });
});
