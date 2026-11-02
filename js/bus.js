// Canal entre les onglets ouverts sur Nour : chaque écriture est signalée aux autres onglets,
// qui rechargent ce qui a changé (conversations, mémoire, bibliothèque).

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nour') : null;
const handlers = new Set();
if (channel) channel.onmessage = (e) => { handlers.forEach((fn) => { try { fn(e.data || {}); } catch { /* ignoré */ } }); };

export const bus = {
  post(message) {
    try { channel?.postMessage(message); } catch { /* canal fermé */ }
  },
  on(fn) { handlers.add(fn); return () => handlers.delete(fn); },
};
