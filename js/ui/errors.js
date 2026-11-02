// Messages d'erreur clairs, en français, selon la nature du problème.

import { connection } from '../client.js';
import { localCorsHelp } from '../providers.js';

export function describeError(err) {
  const kind = (err && err.kind) || 'unknown';
  let conn;
  try { conn = connection(); } catch { conn = { label: 'le fournisseur', mode: 'browser' }; }
  const who = conn.mode === 'server' ? 'Le fournisseur configuré sur le serveur' : (conn.provider ? conn.provider.name : 'Le fournisseur');
  const wait = err && err.retryAfter ? ` Réessayez dans ${err.retryAfter} s.` : ' Patientez un instant avant de réessayer.';
  const info = { title: 'Une erreur est survenue', text: 'La requête n’a pas abouti.', detail: (err && err.detail) || '', action: 'retry' };
  switch (kind) {
    case 'auth':
      return { ...info, title: 'Clé API refusée', text: `${who} n’accepte pas la clé (erreur ${err.status || 401}). Vérifiez qu’elle est complète, toujours active et qu’elle correspond bien à ce fournisseur.`, action: 'settings' };
    case 'session':
      return { ...info, title: 'Session expirée', text: 'Reconnectez-vous au serveur sécurisé avec votre mot de passe.', action: 'settings' };
    case 'bad-password':
      return { ...info, title: 'Mot de passe incorrect', text: 'Vérifiez le mot de passe d’accès défini sur le serveur.', action: 'settings' };
    case 'no-server':
      return { ...info, title: 'Serveur introuvable', text: 'La fonction /api n’est pas déployée sur ce site. Publiez-le sur Netlify avec le dossier netlify/functions, ou utilisez le mode « Clé locale ».', action: 'settings' };
    case 'quota':
      return { ...info, title: 'Limite atteinte', text: `Le quota ou la limite de débit est atteint (erreur 429).${wait} Vous pouvez aussi choisir un autre modèle ou vérifier votre crédit.`, action: 'retry' };
    case 'payment':
      return { ...info, title: 'Crédit insuffisant', text: `${who} demande d’ajouter du crédit ou de changer d’offre (erreur 402). Les modèles gratuits restent utilisables.`, action: 'settings' };
    case 'notfound':
      return { ...info, title: 'Modèle ou adresse introuvable', text: 'Le modèle demandé n’existe pas (ou plus) chez ce fournisseur, ou l’URL de base est incorrecte. Rechargez la liste des modèles.', action: 'settings' };
    case 'context':
      return { ...info, title: 'Conversation trop longue', text: 'Le modèle ne peut pas traiter autant de texte. Réduisez le « contexte envoyé » dans les préférences, ou commencez une nouvelle conversation.', action: 'settings' };
    case 'bad-request':
      return { ...info, title: 'Requête refusée', text: 'Le modèle a refusé la requête : paramètre non pris en charge, images non acceptées par ce modèle, ou contenu trop long.', action: 'retry' };
    case 'too-large':
      return { ...info, title: 'Message trop volumineux', text: 'Les pièces jointes dépassent la taille acceptée. Retirez-en ou réduisez-les.', action: 'retry' };
    case 'server':
      return { ...info, title: 'Le fournisseur rencontre un problème', text: `Erreur ${err.status || 500} côté fournisseur. Ce n’est pas de votre fait : réessayez dans un instant ou changez de modèle.`, action: 'retry' };
    case 'network': {
      const local = conn.provider && conn.provider.local;
      const extra = local ? ` ${localCorsHelp(conn.provider).replace(/<[^>]+>/g, '')}` : ' Si l’adresse est correcte, le fournisseur bloque peut-être les appels depuis un navigateur (CORS) : utilisez alors le mode « Serveur sécurisé ».';
      return { ...info, title: 'Connexion impossible', text: `Impossible de joindre ${conn.base || 'le serveur'}. Vérifiez votre connexion et l’URL.${extra}`, action: 'settings' };
    }
    case 'offline':
      return { ...info, title: 'Vous êtes hors ligne', text: 'Vos conversations restent consultables. Le message pourra être envoyé au retour du réseau.', action: 'retry' };
    case 'nokey':
      return { ...info, title: 'Clé API manquante', text: `Ajoutez votre clé ${conn.provider ? conn.provider.name : ''} dans les réglages de connexion.`, action: 'settings' };
    case 'nobase':
      return { ...info, title: 'Adresse manquante', text: 'Indiquez l’URL de base de votre serveur compatible OpenAI.', action: 'settings' };
    case 'nomodel':
      return { ...info, title: 'Aucun modèle choisi', text: 'Testez la connexion puis choisissez un modèle dans la liste.', action: 'settings' };
    case 'locked':
      return { ...info, title: 'Coffre verrouillé', text: 'Saisissez votre phrase secrète pour utiliser la clé chiffrée.', action: 'unlock' };
    case 'bad-response':
      return { ...info, title: 'Réponse illisible', text: 'Le serveur a répondu dans un format inattendu. Vérifiez que l’URL pointe bien vers une API compatible OpenAI.', action: 'settings' };
    case 'stream':
      return { ...info, title: 'Réponse interrompue', text: 'Le fournisseur a signalé une erreur pendant la génération.', action: 'retry' };
    default:
      return { ...info, text: (err && err.message) ? 'Réessayez dans un instant.' : info.text };
  }
}
