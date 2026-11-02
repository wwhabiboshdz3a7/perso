// Voix : dictée (Web Speech API, fr-FR) et lecture à voix haute (speechSynthesis).

import { stripMarkdown } from './util.js';

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const dictationSupported = () => !!Recognition;
export const speechSupported = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

let rec = null;

/**
 * Démarre la dictée. onText(texteFinal, texteProvisoire) est appelé au fil de la reconnaissance.
 * Renvoie une fonction d'arrêt.
 */
export function startDictation({ onText, onEnd, onError, lang = 'fr-FR' }) {
  if (!Recognition) { onError?.('unsupported'); return () => {}; }
  stopDictation();
  rec = new Recognition();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  let finalText = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onText?.(finalText, interim);
  };
  rec.onerror = (e) => onError?.(e.error || 'error');
  rec.onend = () => { rec = null; onEnd?.(finalText); };
  try { rec.start(); } catch { onError?.('start'); }
  return stopDictation;
}

export function stopDictation() {
  if (rec) { try { rec.stop(); } catch { /* déjà arrêtée */ } }
}

export function frenchVoices() {
  if (!speechSupported()) return [];
  return speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
}

let speakingId = null;

export function speak(text, { voiceURI = '', rate = 1, id = null, onEnd } = {}) {
  if (!speechSupported()) return false;
  speechSynthesis.cancel();
  const clean = stripMarkdown(text).slice(0, 12000);
  if (!clean) return false;
  // Découpe en phrases : certains moteurs coupent les longues lectures.
  const parts = clean.match(/[^.!?…\n]+[.!?…]*\s*/g) || [clean];
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.voiceURI === voiceURI) || voices.find((v) => /^fr(-|_)FR/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang));
  speakingId = id;
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = voice ? voice.lang : 'fr-FR';
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === parts.length - 1) u.onend = () => { if (speakingId === id) speakingId = null; onEnd?.(); };
    u.onerror = () => { if (i === parts.length - 1) { speakingId = null; onEnd?.(); } };
    speechSynthesis.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  speakingId = null;
  if (speechSupported()) speechSynthesis.cancel();
}

export const currentSpeaking = () => speakingId;
