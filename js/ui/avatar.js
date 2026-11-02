// Avatars de l'assistant : glyphes lumineux, initiale ou image importée.

import { esc } from '../util.js';

export const AVATAR_GLYPHS = [
  { id: 'arche', label: 'Arche' },
  { id: 'etoile', label: 'Étoile' },
  { id: 'orbite', label: 'Orbite' },
  { id: 'flamme', label: 'Flamme' },
  { id: 'zellige', label: 'Zellige' },
];

export function avatarHTML(avatar, name = 'Nour') {
  const a = avatar || { type: 'glyph', value: 'arche' };
  if (a.type === 'image' && /^data:image\/(png|jpe?g|webp);base64,/i.test(a.value || '')) {
    return `<img src="${esc(a.value)}" alt="">`;
  }
  if (a.type === 'initial') {
    const letter = (String(name || 'N').trim()[0] || 'N').toUpperCase();
    return `<span class="initial" aria-hidden="true">${esc(letter)}</span>`;
  }
  const id = AVATAR_GLYPHS.some((g) => g.id === a.value) ? a.value : 'arche';
  return `<svg aria-hidden="true" focusable="false"><use href="#av-${id}"/></svg>`;
}
