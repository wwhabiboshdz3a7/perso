// Classement du lien « site web » d'un établissement :
//   none   → aucun site
//   social → réseau social, annuaire, plateforme de réservation ou de livraison
//            (« Réseaux/annuaire seulement ») : pas de vrai site à soi
//   site   → un vrai site (éventuellement un site gratuit : drapeau `free`)
// Module partagé entre le navigateur et la fonction Netlify (aucune dépendance au DOM).

export const SITE_STATUS = {
  none: { label: 'Aucun site', short: 'Aucun site' },
  social: { label: 'Réseaux/annuaire seulement', short: 'Réseaux seulement' },
  site: { label: 'A un site', short: 'A un site' },
};

// [motif, nom affiché, famille]. Le motif est comparé au nom d'hôte (sans « www. ») :
// égalité ou sous-domaine pour un domaine complet, inclusion pour un motif finissant par « . ».
const NOT_A_SITE = [
  ['facebook.com', 'Facebook', 'reseau'],
  ['fb.com', 'Facebook', 'reseau'],
  ['fb.me', 'Facebook', 'reseau'],
  ['instagram.com', 'Instagram', 'reseau'],
  ['instagr.am', 'Instagram', 'reseau'],
  ['tiktok.com', 'TikTok', 'reseau'],
  ['twitter.com', 'X (Twitter)', 'reseau'],
  ['x.com', 'X (Twitter)', 'reseau'],
  ['linkedin.com', 'LinkedIn', 'reseau'],
  ['youtube.com', 'YouTube', 'reseau'],
  ['youtu.be', 'YouTube', 'reseau'],
  ['pinterest.', 'Pinterest', 'reseau'],
  ['snapchat.com', 'Snapchat', 'reseau'],
  ['wa.me', 'WhatsApp', 'reseau'],
  ['whatsapp.com', 'WhatsApp', 'reseau'],
  ['linktr.ee', 'Linktree', 'reseau'],
  ['beacons.ai', 'Beacons', 'reseau'],
  ['bio.link', 'Bio.link', 'reseau'],
  ['lnk.bio', 'Lnk.bio', 'reseau'],
  ['pagesjaunes.fr', 'PagesJaunes', 'annuaire'],
  ['118712.fr', '118 712', 'annuaire'],
  ['118000.fr', '118 000', 'annuaire'],
  ['tripadvisor.', 'Tripadvisor', 'annuaire'],
  ['yelp.', 'Yelp', 'annuaire'],
  ['foursquare.com', 'Foursquare', 'annuaire'],
  ['mappy.com', 'Mappy', 'annuaire'],
  ['petitfute.com', 'Petit Futé', 'annuaire'],
  ['societe.com', 'Societe.com', 'annuaire'],
  ['houzz.', 'Houzz', 'annuaire'],
  ['habitatpresto.com', 'Habitatpresto', 'annuaire'],
  ['starofservice.com', 'StarOfService', 'annuaire'],
  ['travaux.com', 'Travaux.com', 'annuaire'],
  ['leboncoin.fr', 'Leboncoin', 'annuaire'],
  ['thefork.', 'TheFork', 'reservation'],
  ['lafourchette.com', 'TheFork', 'reservation'],
  ['zenchef.com', 'Zenchef', 'reservation'],
  ['planity.com', 'Planity', 'reservation'],
  ['treatwell.', 'Treatwell', 'reservation'],
  ['doctolib.fr', 'Doctolib', 'reservation'],
  ['kiute.com', 'Kiute', 'reservation'],
  ['booksy.com', 'Booksy', 'reservation'],
  ['fresha.com', 'Fresha', 'reservation'],
  ['calendly.com', 'Calendly', 'reservation'],
  ['booking.com', 'Booking.com', 'reservation'],
  ['airbnb.', 'Airbnb', 'reservation'],
  ['ubereats.com', 'Uber Eats', 'livraison'],
  ['deliveroo.', 'Deliveroo', 'livraison'],
  ['just-eat.', 'Just Eat', 'livraison'],
  ['justeat.', 'Just Eat', 'livraison'],
  ['sites.google.com', 'Google Sites', 'annuaire'],
  ['business.site', 'Ancien site Google (fermé)', 'annuaire'],
  ['g.page', 'Fiche Google', 'annuaire'],
  ['maps.app.goo.gl', 'Fiche Google', 'annuaire'],
  ['goo.gl', 'Lien court Google', 'annuaire'],
];

// Sites gratuits / sous-domaines de constructeurs : un vrai site, mais souvent faible.
const FREE_BUILDERS = [
  ['wixsite.com', 'Wix'],
  ['jimdosite.com', 'Jimdo'],
  ['jimdofree.com', 'Jimdo'],
  ['webnode.', 'Webnode'],
  ['site123.me', 'Site123'],
  ['godaddysites.com', 'GoDaddy'],
  ['wordpress.com', 'WordPress.com'],
  ['blogspot.com', 'Blogger'],
  ['over-blog.com', 'Over-Blog'],
  ['e-monsite.com', 'e-monsite'],
  ['simplesite.com', 'SimpleSite'],
  ['webself.net', 'Webself'],
  ['strikingly.com', 'Strikingly'],
  ['weebly.com', 'Weebly'],
  ['square.site', 'Square'],
  ['canva.site', 'Canva'],
  ['carrd.co', 'Carrd'],
  ['ueniweb.com', 'Ueni'],
];

export function hostOf(uri) {
  if (!uri || typeof uri !== 'string') return '';
  const raw = uri.trim();
  if (!raw) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  } catch {
    return '';
  }
}

function matches(host, pattern) {
  if (pattern.endsWith('.')) return host.includes(pattern) || host.startsWith(pattern);
  return host === pattern || host.endsWith(`.${pattern}`);
}

/**
 * @param {string|null|undefined} uri
 * @returns {{status:'none'|'social'|'site', host:string, provider?:string, family?:string, free?:boolean, url?:string}}
 */
export function classifyWebsite(uri) {
  const host = hostOf(uri);
  if (!host) return { status: 'none', host: '' };
  const url = String(uri).trim();
  if (host === 'google.com' || host.endsWith('.google.com') || host === 'google.fr') {
    if (host === 'sites.google.com') return { status: 'social', host, provider: 'Google Sites', family: 'annuaire', url };
    return { status: 'social', host, provider: 'Fiche Google', family: 'annuaire', url };
  }
  for (const [pattern, provider, family] of NOT_A_SITE) {
    if (matches(host, pattern)) return { status: 'social', host, provider, family, url };
  }
  for (const [pattern, provider] of FREE_BUILDERS) {
    if (matches(host, pattern)) return { status: 'site', host, provider, free: true, url };
  }
  return { status: 'site', host, url };
}

export function websiteLabel(info) {
  if (!info) return SITE_STATUS.none.label;
  if (info.status === 'social') return info.provider ? `${info.provider} seulement` : SITE_STATUS.social.label;
  if (info.status === 'site') return info.free ? `Site gratuit (${info.provider})` : SITE_STATUS.site.label;
  return SITE_STATUS.none.label;
}
