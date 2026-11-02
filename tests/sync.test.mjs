// Tests de la fusion d'une conversation modifiée dans deux onglets (js/sync.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeConversation } from '../js/sync.js';

const msg = (id, content = id) => ({ id, role: id.startsWith('u') ? 'user' : 'assistant', content });

test('les messages ajoutés dans les deux onglets sont tous conservés', () => {
  const base = [msg('u0', 'message initial'), msg('a0')];
  const stored = { id: 'c', title: 'T', updatedAt: 2, messages: [...base, msg('uB', 'depuis B'), msg('aB')] };
  const local = { id: 'c', title: 'T', updatedAt: 3, messages: [...base, msg('uA', 'depuis A'), msg('aA')] };
  const out = mergeConversation(stored, local, { baseIds: ['u0', 'a0'], dirtyMsgs: new Set(['uA', 'aA']) });
  assert.deepEqual(out.messages.map((m) => m.id), ['u0', 'a0', 'uB', 'aB', 'uA', 'aA']);
  assert.equal(out.updatedAt, 3);
});

test('un message supprimé ici (modifier et renvoyer) reste supprimé', () => {
  const stored = { id: 'c', updatedAt: 1, messages: [msg('u0'), msg('a0'), msg('u1'), msg('a1')] };
  const local = { id: 'c', updatedAt: 2, messages: [msg('u0', 'corrigé'), msg('a2')] };
  const out = mergeConversation(stored, local, { baseIds: ['u0', 'a0', 'u1', 'a1'], dirtyMsgs: new Set(['u0', 'a2']) });
  assert.deepEqual(out.messages.map((m) => m.id), ['u0', 'a2']);
  assert.equal(out.messages[0].content, 'corrigé');
});

test('la version locale d’un message ne l’emporte que si elle a été modifiée ici', () => {
  const stored = { id: 'c', updatedAt: 1, messages: [msg('u0'), { ...msg('a0'), content: 'réponse régénérée ailleurs' }] };
  const local = { id: 'c', updatedAt: 1, messages: [msg('u0'), { ...msg('a0'), content: 'ancienne réponse' }] };
  const out = mergeConversation(stored, local, { baseIds: ['u0', 'a0'], dirtyMsgs: new Set() });
  assert.equal(out.messages[1].content, 'réponse régénérée ailleurs');
});

test('un message supprimé ailleurs n’est pas recréé, sauf s’il a été modifié ici', () => {
  const stored = { id: 'c', updatedAt: 1, messages: [msg('u0')] };
  const local = { id: 'c', updatedAt: 1, messages: [msg('u0'), msg('a0'), msg('a1')] };
  const out = mergeConversation(stored, local, { baseIds: ['u0', 'a0', 'a1'], dirtyMsgs: new Set(['a1']) });
  assert.deepEqual(out.messages.map((m) => m.id), ['u0', 'a1']);
});

test('seuls les champs modifiés ici remplacent ceux de la base', () => {
  const stored = { id: 'c', title: 'Renommé ailleurs', pinned: true, updatedAt: 1, messages: [] };
  const local = { id: 'c', title: 'Ancien titre', pinned: false, persona: 'dev', updatedAt: 1, messages: [] };
  const out = mergeConversation(stored, local, { baseIds: [], dirtyMsgs: new Set(), dirtyFields: new Set(['persona']) });
  assert.equal(out.title, 'Renommé ailleurs');
  assert.equal(out.pinned, true);
  assert.equal(out.persona, 'dev');
});
