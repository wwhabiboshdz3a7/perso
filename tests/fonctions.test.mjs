// Tests unitaires des fonctions Netlify (node --test). Les appels aux fournisseurs sont simulés.
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { creerJeton, verifierJeton } from '../netlify/lib/jeton.mjs';
import { hacherCode, empreinteCle, lireCorrespondances, verifierCle, ErreurFournisseur, RefusCle } from '../netlify/lib/verificateurs.mjs';
import { lireRevocations } from '../netlify/lib/revocation.mjs';
import access, { reinitialiserLimites } from '../netlify/functions/access.mjs';
import content from '../netlify/functions/content.mjs';
import recuperer, { reinitialiserLimitesRecuperation } from '../netlify/functions/recuperer.mjs';
import guide, { reinitialiserLimitesGuide } from '../netlify/functions/guide.mjs';

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
  for (const k of ['TOKEN_SECRET', 'ACCESS_CODE_HASHES', 'GUMROAD_PRODUCT_IDS', 'LEMONSQUEEZY_STORE_ID', 'LEMONSQUEEZY_PRODUITS', 'STRIPE_SECRET_KEY', 'STRIPE_LIENS', 'TOKEN_TTL_DAYS', 'REVOKED_KEYS', 'LICENCE_MAX_ACTIVATIONS', 'EMAIL_FOURNISSEUR', 'EMAIL_API_KEY', 'EMAIL_EXPEDITEUR', 'SITE_URL']) delete process.env[k];
  Object.assign(process.env, vars);
}

const post = (corps, entetes = {}) => new Request('http://localhost/.netlify/functions/access', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...entetes }, body: JSON.stringify(corps)
});
const get = (query, jeton) => new Request(`http://localhost/.netlify/functions/content?${query}`, {
  headers: jeton ? { Authorization: `Bearer ${jeton}` } : {}
});
const ctx = (ip = '10.0.0.1') => ({ ip });
/** La clé est-elle refusée (réponse 200 avec valide: false, sans jeton) ? */
const refus = async req => { const r = await access(req, ctx()); const d = await r.json(); return r.status === 200 && d.valide === false && !d.jeton; };

beforeEach(() => {
  reinitialiserLimites();
  reinitialiserLimitesRecuperation();
  reinitialiserLimitesGuide();
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
    const falsifie = Buffer.from(JSON.stringify({ v: 2, o: 'vip', s: 'code', r: '', k: '', iat: 1, exp: 9999999999 })).toString('base64url');
    assert.equal(verifierJeton(`${falsifie}.${sig}`, SECRET), null);
    assert.equal(verifierJeton(`${corps}.${sig.slice(0, -2)}xx`, SECRET), null);
    assert.equal(verifierJeton(jeton, SECRET + 'x'), null);
    assert.equal(verifierJeton(jeton, SECRET, Date.now() + 3601 * 1000), null);
    assert.equal(verifierJeton('nimportequoi', SECRET), null);
  });
  test('tolérance d\'expiration réservée au renouvellement', () => {
    const { jeton } = creerJeton({ offre: 'pro', source: 'code', empreinte: 'abc' }, SECRET, 60);
    const plusTard = Date.now() + 3600 * 1000;
    assert.equal(verifierJeton(jeton, SECRET, plusTard), null);
    assert.equal(verifierJeton(jeton, SECRET, plusTard, { toleranceSecondes: 7200 }).k, 'abc');
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
  test('code inconnu : refus explicite (valide: false)', async () => {
    const r = await access(post({ cle: 'LEV-FAUX0-FAUX0-FAUX0' }), ctx());
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.valide, false);
    assert.equal(d.jeton, undefined);
    assert.match(d.erreur, /non reconnu/);
  });
  test('code valide : jeton pro, insensible à la casse et aux espaces', async () => {
    const r = await access(post({ cle: '  lev-testp-ro234-56789 ' }), ctx());
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.valide, true);
    assert.equal(d.offre, 'pro');
    assert.equal(d.source, 'code');
    const c = verifierJeton(d.jeton, SECRET);
    assert.equal(c.k, empreinteCle(CODE_PRO));
    assert.equal(d.expire - d.emis, 30 * 86400, 'jeton de 30 jours par défaut');
    assert.equal(d.renouvele, false);
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
    for (let i = 0; i < 10; i++) assert.equal((await (await access(post({ cle: 'MAUVAIS-' + i }), ctx('1.2.3.4'))).json()).valide, false);
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
    assert.equal(params.get('increment_uses_count'), 'true', 'une nouvelle activation est comptée');
  });
  test('limite d\'activations atteinte : refus explicite', async () => {
    simulerFetch(() => ({ corps: { success: true, uses: 6, purchase: { product_id: 'prodEss==', sale_id: 'v2', refunded: false } } }));
    const d = await (await access(post({ cle: CLE }), ctx())).json();
    assert.equal(d.valide, false);
    assert.equal(d.motif, 'limite');
    assert.match(d.erreur, /nombre maximal d'appareils \(5\)/);
  });
  test('renouvellement avec le jeton de l\'appareil : compteur non incrémenté, limite ignorée', async () => {
    let uses = 1;
    simulerFetch((url, o) => {
      const p = new URLSearchParams(o.body);
      if (p.get('product_id') !== 'prodPro==') return { statut: 404, corps: { success: false } };
      if (p.get('increment_uses_count') === 'true') uses++;
      return { corps: { success: true, uses, purchase: { product_id: 'prodPro==', sale_id: 'vente1' } } };
    });
    const premier = await (await access(post({ cle: CLE }), ctx())).json();
    assert.equal(uses, 2);
    uses = 40; // la licence a été partagée depuis : les appareils déjà activés gardent l'accès
    const r = await (await access(post({ cle: CLE, jeton: premier.jeton }), ctx())).json();
    assert.equal(r.valide, true);
    assert.equal(r.renouvele, true);
    assert.equal(uses, 40, 'pas d\'incrément au renouvellement');
    assert.equal((await (await access(post({ cle: CLE }), ctx())).json()).motif, 'limite', 'nouvel appareil refusé');
  });
  test('le jeton d\'une autre clé ne vaut pas renouvellement', async () => {
    const autre = creerJeton({ offre: 'pro', source: 'gumroad', empreinte: empreinteCle('AUTRE') }, SECRET, 3600).jeton;
    simulerFetch((url, o) => ({ corps: { success: true, uses: 1, purchase: { product_id: new URLSearchParams(o.body).get('product_id') } } }));
    await access(post({ cle: CLE, jeton: autre }), ctx());
    assert.equal(new URLSearchParams(appels[0].options.body).get('increment_uses_count'), 'true');
  });
  test('licence remboursée : refus', async () => {
    simulerFetch(() => ({ corps: { success: true, purchase: { product_id: 'prodEss==', refunded: true } } }));
    assert.equal(await refus(post({ cle: CLE })), true);
    assert.equal((await (await access(post({ cle: CLE }), ctx())).json()).motif, 'rembourse');
  });
  test('Gumroad injoignable : 502', async () => {
    simulerFetch(() => new TypeError('fetch failed'));
    assert.equal((await access(post({ cle: CLE }), ctx())).status, 502);
  });
});

describe('licences Lemon Squeezy', () => {
  const CLE = '38b1460a-5104-4067-a91d-77b872934d51';
  beforeEach(() => { process.env.LEMONSQUEEZY_STORE_ID = '1234'; process.env.LEMONSQUEEZY_PRODUITS = 'essentiel:111,vip:333'; });
  const meta = { store_id: 1234, order_id: 9, product_id: 50, variant_id: 333 };
  const activation = (m = meta) => ({ corps: { activated: true, error: null, license_key: { id: 1, status: 'active', key: CLE, activation_limit: 3, activation_usage: 1 }, instance: { id: 'inst-1', name: 'x' }, meta: m } });

  test('nouvel appareil : activation (limite appliquée par Lemon Squeezy), offre déduite de la variante', async () => {
    simulerFetch(() => activation());
    const d = await (await access(post({ cle: CLE }), ctx())).json();
    assert.equal(d.offre, 'vip');
    assert.equal(d.source, 'lemonsqueezy');
    assert.equal(appels[0].url, 'https://api.lemonsqueezy.com/v1/licenses/activate');
    const p = new URLSearchParams(appels[0].options.body);
    assert.equal(p.get('license_key'), CLE);
    assert.ok(p.get('instance_name'));
    assert.equal(verifierJeton(d.jeton, SECRET).i, 'inst-1', 'instance mémorisée dans le jeton');
  });
  test('limite d\'activations atteinte : refus explicite', async () => {
    simulerFetch(() => ({ statut: 400, corps: { activated: false, error: 'This license key has reached the activation limit.', license_key: { status: 'active', activation_limit: 1, activation_usage: 1 }, meta } }));
    const d = await (await access(post({ cle: CLE }), ctx())).json();
    assert.equal(d.valide, false);
    assert.equal(d.motif, 'limite');
  });
  test('renouvellement : validation de l\'instance de cet appareil, sans nouvelle activation', async () => {
    simulerFetch(() => activation());
    const premier = await (await access(post({ cle: CLE }), ctx())).json();
    simulerFetch(url => {
      assert.equal(url, 'https://api.lemonsqueezy.com/v1/licenses/validate');
      return { corps: { valid: true, error: null, license_key: { status: 'active' }, instance: { id: 'inst-1' }, meta } };
    });
    const d = await (await access(post({ cle: CLE, jeton: premier.jeton }), ctx())).json();
    assert.equal(d.valide, true);
    assert.equal(d.renouvele, true);
    assert.equal(new URLSearchParams(appels[0].options.body).get('instance_id'), 'inst-1');
  });
  test('licence d\'une autre boutique : refus', async () => {
    simulerFetch(() => activation({ store_id: 999, product_id: 111, variant_id: 1 }));
    assert.equal(await refus(post({ cle: CLE })), true);
  });
  test('licence désactivée (remboursement) : refus', async () => {
    simulerFetch(() => ({ statut: 400, corps: { activated: false, error: 'license_key disabled', license_key: { status: 'disabled' }, meta: { store_id: 1234, product_id: 111 } } }));
    assert.equal(await refus(post({ cle: CLE })), true);
  });
});

describe('paiements Stripe (liens de paiement)', () => {
  const SESSION = 'cs_test_a1B2c3D4e5F6g7H8i9J0';
  beforeEach(() => { process.env.STRIPE_SECRET_KEY = 'rk_test_cle'; process.env.STRIPE_LIENS = 'pro:plink_PRO,essentiel:plink_ESS'; });
  const charge = (x = {}) => ({ object: 'charge', id: 'ch_1', amount: 19700, amount_refunded: 0, refunded: false, disputed: false, ...x });
  const session = (x = {}) => ({ object: 'checkout.session', id: SESSION, mode: 'payment', status: 'complete', payment_status: 'paid', payment_link: 'plink_PRO',
    payment_intent: { object: 'payment_intent', id: 'pi_1', status: 'succeeded', latest_charge: charge() }, ...x });

  test('session payée issue du lien Pro, paiement lu avec la session', async () => {
    simulerFetch(url => {
      assert.ok(url.startsWith('https://api.stripe.com/v1/checkout/sessions/' + SESSION + '?'));
      assert.equal(new URL(url).searchParams.get('expand[]'), 'payment_intent.latest_charge');
      return { corps: session() };
    });
    const d = await (await access(post({ cle: SESSION }), ctx())).json();
    assert.equal(d.offre, 'pro');
    assert.equal(appels.length, 1);
    assert.equal(appels[0].options.headers.Authorization, 'Bearer rk_test_cle');
  });
  test('session non payée : refus', async () => {
    simulerFetch(() => ({ corps: session({ status: 'open', payment_status: 'unpaid' }) }));
    assert.equal(await refus(post({ cle: SESSION })), true);
  });
  test('paiement remboursé, même partiellement, ou contesté : refus explicite', async () => {
    for (const c of [{ refunded: true, amount_refunded: 19700 }, { amount_refunded: 5000 }, { disputed: true }]) {
      simulerFetch(() => ({ corps: session({ payment_intent: { object: 'payment_intent', status: 'succeeded', latest_charge: charge(c) } }) }));
      const d = await (await access(post({ cle: SESSION }), ctx())).json();
      assert.equal(d.valide, false, JSON.stringify(c));
      assert.equal(d.motif, 'rembourse');
    }
  });
  test('paiement non développé dans la session : lecture du PaymentIntent', async () => {
    simulerFetch(url => url.includes('/payment_intents/pi_9')
      ? { corps: { object: 'payment_intent', id: 'pi_9', status: 'succeeded', latest_charge: charge({ refunded: true, amount_refunded: 19700 }) } }
      : { corps: session({ payment_intent: 'pi_9' }) });
    assert.equal((await (await access(post({ cle: SESSION }), ctx())).json()).motif, 'rembourse');
    assert.equal(appels.length, 2);
  });
  test('clé restreinte sans droit sur les paiements : erreur fournisseur (502), pas d\'accès', async () => {
    simulerFetch(() => ({ corps: session({ payment_intent: { id: 'pi_1' } }) }));
    assert.equal((await access(post({ cle: SESSION }), ctx())).status, 502);
  });
  test('session gratuite (code promo à 100 %) acceptée sans paiement', async () => {
    simulerFetch(() => ({ corps: session({ payment_status: 'no_payment_required', payment_intent: null }) }));
    assert.equal((await (await access(post({ cle: SESSION }), ctx())).json()).offre, 'pro');
  });
  test('session d\'un autre lien de paiement : refus', async () => {
    simulerFetch(() => ({ corps: session({ payment_link: 'plink_AUTRE' }) }));
    assert.equal(await refus(post({ cle: SESSION })), true);
  });
});

describe('révocation des accès', () => {
  const jetonCode = async code => (await (await access(post({ cle: code }), ctx())).json()).jeton;

  test('lecture de la liste : clés brutes et références de vente', () => {
    const r = lireRevocations('LEV-AAAAA-BBBBB-CCCCC, gumroad:vente==\nstripe:cs_live_x ; # commentaire');
    assert.ok(r.has('k:' + empreinteCle('lev-aaaaa-bbbbb-ccccc')));
    assert.ok(r.has('gumroad:vente=='));
    assert.ok(r.has('stripe:cs_live_x'));
  });
  test('code retiré de ACCESS_CODE_HASHES : le jeton déjà émis est refusé aussitôt', async () => {
    const jeton = await jetonCode(CODE_PRO);
    assert.equal((await content(get('module=m4', jeton))).status, 200);
    process.env.ACCESS_CODE_HASHES = `essentiel:${hacherCode(CODE_ESS)}`;
    const r = await content(get('module=m4', jeton));
    assert.equal(r.status, 401);
    assert.equal((await r.json()).code, 'revoque');
    assert.equal(await refus(post({ cle: CODE_PRO })), true, 'nouvelle activation refusée');
  });
  test('code rétrogradé (pro → essentiel) : l\'ancien jeton Pro est refusé', async () => {
    const jeton = await jetonCode(CODE_PRO);
    process.env.ACCESS_CODE_HASHES = `essentiel:${hacherCode(CODE_PRO)}`;
    assert.equal((await content(get('module=m2', jeton))).status, 401);
  });
  test('clé listée dans REVOKED_KEYS : activation, renouvellement et contenu refusés', async () => {
    const jeton = await jetonCode(CODE_ESS);
    process.env.REVOKED_KEYS = ' lev-essen-tiel2-34567 ';
    assert.equal((await content(get('module=m2', jeton))).status, 401);
    const d = await (await access(post({ cle: CODE_ESS }), ctx())).json();
    assert.equal(d.valide, false);
    assert.equal(d.motif, 'revoque');
    assert.equal((await (await access(post({ cle: CODE_ESS, jeton }), ctx())).json()).valide, false);
  });
  test('référence de vente révoquée (remboursement Gumroad) : contenu refusé', async () => {
    const jeton = creerJeton({ offre: 'pro', source: 'gumroad', ref: 'vente42', empreinte: empreinteCle('X') }, SECRET, 3600).jeton;
    assert.equal((await content(get('module=m4', jeton))).status, 200);
    process.env.REVOKED_KEYS = 'gumroad:vente42';
    assert.equal((await content(get('module=m4', jeton))).status, 401);
  });
  test('renouvellement d\'un code encore valide : nouveau jeton, même empreinte', async () => {
    const jeton = await jetonCode(CODE_PRO);
    const d = await (await access(post({ cle: CODE_PRO, jeton }), ctx())).json();
    assert.equal(d.valide, true);
    assert.equal(d.renouvele, true);
    assert.equal(verifierJeton(d.jeton, SECRET).k, empreinteCle(CODE_PRO));
  });
  test('RefusCle est exportée', () => { assert.ok(new RefusCle('limite', 'x') instanceof Error); });
});

describe('récupération d\'un achat Stripe par email', () => {
  const reqRec = email => new Request('http://localhost/.netlify/functions/recuperer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  const configurer = () => Object.assign(process.env, { STRIPE_SECRET_KEY: 'rk_test_cle', STRIPE_LIENS: 'pro:plink_PRO', EMAIL_FOURNISSEUR: 'brevo', EMAIL_API_KEY: 'xkeysib-test', EMAIL_EXPEDITEUR: 'Levier <acces@exemple.fr>', SITE_URL: 'https://formation.exemple.fr/' });

  test('non configurée : réponse explicite (support), aucun appel', async () => {
    simulerFetch(() => { throw new Error('ne devrait pas être appelé'); });
    const d = await (await recuperer(reqRec('ana@example.com'), ctx())).json();
    assert.equal(d.ok, false);
    assert.equal(d.indisponible, true);
    assert.equal(appels.length, 0);
  });
  test('achat trouvé : email envoyé avec le lien d\'activation, à l\'adresse du paiement', async () => {
    configurer();
    simulerFetch(url => {
      if (url.startsWith('https://api.stripe.com/')) {
        const u = new URL(url);
        assert.equal(u.searchParams.get('customer_details[email]'), 'ana@example.com');
        return { corps: { object: 'list', data: [
          { id: 'cs_test_bon123456789', status: 'complete', payment_status: 'paid', payment_link: 'plink_PRO', created: 1790000000 },
          { id: 'cs_test_autre12345678', status: 'complete', payment_status: 'paid', payment_link: 'plink_AUTRE', created: 1790000000 }
        ] } };
      }
      return { statut: 201, corps: { messageId: 'm1' } };
    });
    const d = await (await recuperer(reqRec('ana@example.com'), ctx())).json();
    assert.equal(d.ok, true);
    const envoi = appels.find(a => a.url === 'https://api.brevo.com/v3/smtp/email');
    assert.ok(envoi, 'email envoyé');
    assert.equal(envoi.options.headers['api-key'], 'xkeysib-test');
    const corps = JSON.parse(envoi.options.body);
    assert.deepEqual(corps.to, [{ email: 'ana@example.com' }]);
    assert.equal(corps.sender.email, 'acces@exemple.fr');
    assert.match(corps.textContent, /https:\/\/formation\.exemple\.fr\/merci\/achat\.html\?session_id=cs_test_bon123456789/);
    assert.ok(!corps.textContent.includes('cs_test_autre'), 'seuls les liens de la formation');
    assert.match(corps.textContent, /Offre Pro/);
  });
  test('aucun achat : même réponse, aucun email', async () => {
    configurer();
    simulerFetch(url => url.startsWith('https://api.stripe.com/') ? { corps: { object: 'list', data: [] } } : { statut: 201, corps: {} });
    const d = await (await recuperer(reqRec('inconnu@example.com'), ctx())).json();
    assert.equal(d.ok, true);
    assert.ok(!appels.some(a => a.url.includes('brevo')));
  });
  test('Resend comme prestataire d\'emails', async () => {
    configurer();
    process.env.EMAIL_FOURNISSEUR = 'resend';
    simulerFetch(url => url.startsWith('https://api.stripe.com/')
      ? { corps: { object: 'list', data: [{ id: 'cs_test_bon123456789', status: 'complete', payment_status: 'paid', payment_link: 'plink_PRO', created: 1790000000 }] } }
      : { corps: { id: 'e1' } });
    await recuperer(reqRec('ana@example.com'), ctx());
    const envoi = appels.find(a => a.url === 'https://api.resend.com/emails');
    assert.equal(envoi.options.headers.Authorization, 'Bearer xkeysib-test');
    assert.equal(JSON.parse(envoi.options.body).from, 'Levier <acces@exemple.fr>');
  });
  test('email invalide, puis limitation des demandes', async () => {
    configurer();
    simulerFetch(url => url.startsWith('https://api.stripe.com/') ? { corps: { object: 'list', data: [] } } : { statut: 201, corps: {} });
    assert.equal((await (await recuperer(reqRec('pas-un-email'), ctx())).json()).ok, false);
    for (let i = 0; i < 3; i++) assert.equal((await recuperer(reqRec('ana@example.com'), ctx('9.9.9.9'))).status, 200);
    assert.equal((await recuperer(reqRec('ana@example.com'), ctx('9.9.9.8'))).status, 429, 'trop de demandes pour cette adresse');
  });
});

describe('mini-guide de l\'aimant (fonction guide)', () => {
  const inscrire = corps => guide(new Request('http://localhost/.netlify/functions/guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }), ctx());
  const lire = g => guide(new Request('http://localhost/.netlify/functions/guide?g=' + encodeURIComponent(g)), ctx());

  test('email et consentement exigés, robots écartés', async () => {
    assert.equal((await (await inscrire({ email: 'pas-un-email', consentement: 'oui' })).json()).ok, false);
    assert.equal((await (await inscrire({ email: 'ana@example.com' })).json()).ok, false);
    assert.equal((await (await inscrire({ email: 'ana@example.com', consentement: 'oui', 'bot-field': 'x' })).json()).ok, false);
  });
  test('inscription : jeton qui ouvre le guide complet ; sans jeton valide, rien', async () => {
    const d = await (await inscrire({ email: 'ana@example.com', consentement: 'oui', prenom: 'Ana' })).json();
    assert.equal(d.ok, true);
    assert.equal(d.envoye, false, 'pas d\'envoi sans configuration EMAIL_*');
    const g = await (await lire(d.jeton)).json();
    assert.equal(g.ok, true);
    assert.equal((g.html.match(/class="service"/g) || []).length, 7);
    assert.equal((await (await lire('faux.jeton')).json()).ok, false);
    const jetonAcces = creerJeton({ offre: 'pro', source: 'code', empreinte: 'x' }, SECRET, 3600).jeton;
    assert.equal((await (await lire(jetonAcces)).json()).ok, false, 'un jeton d\'accès n\'ouvre pas le guide');
    assert.equal((await content(get('module=m2', d.jeton))).status, 401, 'un jeton de guide n\'ouvre pas la formation');
  });
  test('envoi du lien du guide par email quand c\'est configuré', async () => {
    Object.assign(process.env, { EMAIL_FOURNISSEUR: 'brevo', EMAIL_API_KEY: 'xkeysib-test', EMAIL_EXPEDITEUR: 'Levier <bonjour@exemple.fr>', SITE_URL: 'https://formation.exemple.fr' });
    simulerFetch(() => ({ statut: 201, corps: { messageId: 'm' } }));
    const d = await (await inscrire({ email: 'ana@example.com', consentement: 'oui', prenom: 'Ana' })).json();
    assert.equal(d.envoye, true);
    const corps = JSON.parse(appels[0].options.body);
    assert.deepEqual(corps.to, [{ email: 'ana@example.com' }]);
    assert.ok(corps.textContent.includes('https://formation.exemple.fr/merci/?g=' + d.jeton));
    assert.match(corps.textContent, /^Bonjour Ana,/);
  });
  test('email injoignable : le guide reste accessible par le jeton', async () => {
    Object.assign(process.env, { EMAIL_FOURNISSEUR: 'resend', EMAIL_API_KEY: 're_test', EMAIL_EXPEDITEUR: 'bonjour@exemple.fr' });
    simulerFetch(() => new TypeError('fetch failed'));
    const d = await (await inscrire({ email: 'ana@example.com', consentement: 'oui' })).json();
    assert.equal(d.ok, true);
    assert.equal(d.envoye, false);
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
  const jeton = offre => creerJeton({ offre, source: 'gumroad', ref: 'vente-test', empreinte: empreinteCle('cle-test-' + offre) }, SECRET, 3600).jeton;

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
