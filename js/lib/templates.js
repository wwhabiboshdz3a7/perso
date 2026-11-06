// Scripts d'appel, emails et SMS personnalisés pour chaque prospect.
import { fmtRating, fmtInt, cityFromAddress } from './format.js';
import { categoryLabel } from './categories.js';

export const DEFAULT_PROFILE = {
  firstName: 'Ibrahim',
  agency: 'NEXORA',
  phone: '',
  email: 'nexora.pro.web@gmail.com',
  site: 'nexora-agence.fr',
  offer: 'Starter',
  price: '500 à 800 €',
  city: 'Toulouse',
};

function activity(place) {
  const cat = place.categories?.[0];
  if (cat) return categoryLabel(cat).toLowerCase().split(',')[0];
  if (place.typeLabel) return place.typeLabel.toLowerCase();
  return 'commerce';
}

function cityOf(place, profile) {
  return place.city || cityFromAddress(place.address) || profile.city || 'votre ville';
}

/** Phrase d'accroche selon ce que l'on sait de la fiche Google. */
function reviewHook(place) {
  const n = place.reviews;
  const r = place.rating;
  if (Number.isFinite(n) && n >= 20 && Number.isFinite(r) && r >= 4.3) {
    return `vous avez ${fmtInt(n)} avis Google avec une note de ${fmtRating(r)} sur 5, c'est vraiment excellent`;
  }
  if (Number.isFinite(n) && n >= 5 && Number.isFinite(r)) {
    return `vous avez ${fmtInt(n)} avis Google (${fmtRating(r)} sur 5), vos clients parlent de vous`;
  }
  if (Number.isFinite(n) && n > 0) {
    return 'vos premiers clients vous laissent déjà des avis sur Google';
  }
  return 'votre établissement est bien référencé dans le quartier';
}

function siteSituation(place) {
  const w = place.website || {};
  if (w.status === 'social') {
    if (w.provider === 'Ancien site Google (fermé)') return 'votre ancien site Google ne fonctionne plus depuis la fermeture du service par Google';
    return `vos clients ne trouvent que votre page ${w.provider || 'sur les réseaux'}, pas de vrai site à votre nom`;
  }
  if (w.status === 'site' && w.free) return `votre site actuel est sur un hébergement gratuit (${w.provider}), avec la publicité et l'adresse de la plateforme`;
  if (w.status === 'site') return 'votre site pourrait mieux convertir vos visiteurs en clients';
  return 'je n\'ai pas trouvé de site internet à votre nom';
}

export function buildCallScript(place, profile = DEFAULT_PROFILE) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const city = cityOf(place, p);
  const act = activity(place);
  return [
    `Bonjour, je suis bien ${/^chez\b/i.test(place.name) ? '' : 'chez '}${place.name} ?`,
    '',
    `Je m'appelle ${p.firstName}, de l'agence ${p.agency}, on est à ${p.city}. Je vous prends deux minutes, pas plus.`,
    '',
    `Je vous appelle parce que je suis tombé sur votre fiche Google : ${reviewHook(place)}. Par contre, ${siteSituation(place)}.`,
    '',
    `Aujourd'hui, quand quelqu'un cherche « ${act} à ${city} » sur son téléphone, il compare les fiches et clique sur celles qui ont un site : les horaires, les photos, les prix, la prise de contact en un clic. Vos avis vous amènent des clients, un site les convertit.`,
    '',
    `On crée des sites vitrines pour les commerces comme le vôtre : l'offre ${p.offer} (${p.price}) est livrée clé en main, avec votre fiche Google optimisée et la mise en ligne comprise.`,
    '',
    'Est-ce que je peux vous envoyer deux ou trois exemples par SMS ou par email, et on en reparle quand ça vous arrange ?',
    '',
    '— Si oui : noter l\'email ou le portable, proposer un créneau de rappel.',
    '— Si « pas maintenant » : demander le meilleur moment pour rappeler.',
    '— Si refus net : remercier, et proposer de ne plus le recontacter (statut « Ne plus contacter »).',
  ].join('\n');
}

export function buildEmail(place, profile = DEFAULT_PROFILE) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const city = cityOf(place, p);
  const act = activity(place);
  const hasStrongReviews = Number.isFinite(place.reviews) && place.reviews >= 10;
  const subject = hasStrongReviews
    ? `${place.name} : ${fmtInt(place.reviews)} avis Google, et un site à la hauteur ?`
    : `${place.name} : un site pour être trouvé à ${city}`;
  const signature = [p.firstName, `Agence ${p.agency}`, p.phone, p.email, p.site].filter(Boolean).join('\n');
  const body = [
    'Bonjour,',
    '',
    `Je me permets de vous écrire après avoir vu la fiche Google de ${place.name} : ${reviewHook(place)}.`,
    '',
    `En revanche, ${siteSituation(place)}. C'est dommage, car les personnes qui cherchent « ${act} à ${city} » comparent les fiches et se tournent souvent vers celles qui ont un site clair : horaires, photos, tarifs, contact en un clic.`,
    '',
    `Avec l'agence ${p.agency}, nous réalisons des sites vitrines pour les commerces et artisans de ${p.city} et des environs. Notre offre ${p.offer} (${p.price}) comprend le design, la mise en ligne et l'optimisation de votre fiche Google.`,
    '',
    'Seriez-vous d\'accord pour que je vous envoie deux ou trois exemples de sites réalisés pour des établissements comme le vôtre ? Un échange de dix minutes suffit pour voir si cela vous correspond.',
    '',
    'Bien cordialement,',
    signature,
    '',
    '—',
    `Vous recevez ce message car ${place.name} est référencé publiquement sur Google Maps. Si vous ne souhaitez plus être contacté, répondez simplement « STOP » : vos coordonnées seront retirées de notre liste.`,
  ].join('\n');
  return { subject, body };
}

export function buildSms(place, profile = DEFAULT_PROFILE) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const hook = Number.isFinite(place.reviews) && place.reviews >= 10 && Number.isFinite(place.rating)
    ? `${fmtInt(place.reviews)} avis à ${fmtRating(place.rating)}/5, bravo !`
    : 'Belle fiche Google !';
  return `Bonjour, ${p.firstName} de l'agence ${p.agency} (${p.city}). ${hook} Je n'ai pas trouvé de site pour ${place.name} : on en crée à partir de ${p.price.split(' ')[0]} €${p.site ? ` (exemples : ${p.site})` : ''}. Intéressé(e) ? Répondez STOP pour ne plus être contacté.`;
}

export function buildObjections(profile = DEFAULT_PROFILE) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const from = p.price.split(' ')[0];
  return [
  ['« Je n\'ai pas le temps. »', 'Justement : on s\'occupe de tout, il me faut 30 minutes avec vous pour les textes et les photos, ensuite c\'est nous qui travaillons. Je vous rappelle à quel moment ?'],
  ['« J\'ai déjà Facebook / Instagram. »', 'C\'est très bien pour fidéliser. Mais sur Google, les clients qui ne vous connaissent pas encore cherchent un site : horaires, menu ou tarifs, prise de contact. Et une page Facebook ne vous appartient pas vraiment.'],
  ['« C\'est trop cher. »', `L'offre ${p.offer} démarre à ${from} € : si un seul nouveau client par mois vient grâce au site, il est remboursé en quelques semaines. Et il n'y a pas d'abonnement obligatoire.`],
  ['« Mes clients me trouvent déjà. »', 'Vos avis le prouvent ! Le site sert à transformer ceux qui hésitent encore : ce sont des clients que vous ne voyez pas passer.'],
  ['« Envoyez-moi un mail. »', 'Avec plaisir : je vous envoie des exemples dès maintenant. À quelle adresse ? Je vous rappelle jeudi pour en parler ?'],
  ['« Pas intéressé. »', 'Je comprends, merci pour votre temps. Souhaitez-vous que je ne vous recontacte plus ? (si oui → statut « Ne plus contacter »)'],
  ];
}
