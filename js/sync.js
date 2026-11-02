// Fusion d'une conversation modifiée à la fois dans cet onglet et dans un autre.
// Fonctions pures, sans DOM : testées dans Node (tests/sync.test.mjs).

/**
 * stored : version actuellement en base (écrite par un autre onglet).
 * local  : version de cet onglet.
 * meta   : { baseIds: identifiants des messages lors de la dernière synchronisation,
 *            dirtyMsgs: Set des messages modifiés ici, dirtyFields: Set des champs modifiés ici }.
 * Règles : les messages ajoutés ailleurs sont conservés ; ceux ajoutés ici sont ajoutés à la suite ;
 * un message supprimé d'un côté (modification puis renvoi) reste supprimé ; pour un message
 * présent des deux côtés, la version locale l'emporte seulement si elle a été modifiée ici.
 */
export function mergeConversation(stored, local, meta = {}) {
  const baseIds = new Set(meta.baseIds || []);
  const dirtyMsgs = meta.dirtyMsgs || new Set();
  const dirtyFields = meta.dirtyFields || new Set();
  const localById = new Map(local.messages.map((m) => [m.id, m]));
  const storedIds = new Set(stored.messages.map((m) => m.id));
  const messages = [];
  for (const m of stored.messages) {
    const lm = localById.get(m.id);
    if (!lm && baseIds.has(m.id)) continue; // supprimé ici
    messages.push(lm && dirtyMsgs.has(m.id) ? lm : m);
  }
  for (const m of local.messages) {
    if (storedIds.has(m.id)) continue;
    if (baseIds.has(m.id) && !dirtyMsgs.has(m.id)) continue; // supprimé ailleurs
    messages.push(m);
  }
  const out = { ...stored, messages };
  for (const f of dirtyFields) if (f in local) out[f] = local[f];
  out.updatedAt = Math.max(Number(stored.updatedAt) || 0, Number(local.updatedAt) || 0);
  return out;
}
