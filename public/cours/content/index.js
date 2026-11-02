// Chargement des modules : M0 et M1 sont servis en statique ; les autres passent par la fonction
// `content` (accès vérifié côté serveur). Le catalogue décrit tous les modules.
import { modules, bonus, offrePermet, trouverModule } from './catalogue.js';
import { chargerModuleProtege, offreActuelle } from '../../assets/js/acces-client.js';

export { modules, bonus, trouverModule };

const gratuits = {
  m0: () => import('./m0.js'),
  m1: () => import('./m1.js')
};

const cache = new Map();

export const estAccessible = id => {
  const m = trouverModule(id);
  return !!m && offrePermet(offreActuelle(), m.offre);
};

function normaliser(id, d) {
  const meta = trouverModule(id);
  const lecons = (d.lecons || []).map((l, i) => ({ ...l, index: i + 1 }));
  return { ...d, id, numero: meta.numero, titre: meta.titre, accroche: meta.accroche, offre: meta.offre, lecons };
}

/** Charge un module (contenu complet). Lève ErreurAcces si le module est verrouillé. */
export function chargerModule(id) {
  if (cache.has(id)) return cache.get(id);
  const promesse = (async () => {
    if (gratuits[id]) return normaliser(id, (await gratuits[id]()).default);
    const d = await chargerModuleProtege(id);
    return id === 'bonus' ? d : normaliser(id, d);
  })();
  cache.set(id, promesse);
  promesse.catch(() => cache.delete(id));
  return promesse;
}

/** Vide le cache (après un changement d'accès). */
export function viderCache() { cache.clear(); }

/** Tous les modules accessibles avec l'offre actuelle (pour la recherche, le profil…). */
export async function chargerAccessibles() {
  const ids = modules.filter(m => estAccessible(m.id)).map(m => m.id);
  const res = await Promise.allSettled(ids.map(chargerModule));
  return res.filter(r => r.status === 'fulfilled').map(r => r.value);
}
