// Écrin — comportements communs aux pages : apparition des sections, rail de chapitres,
// formulaires de démonstration.

// Sections et médias qui se révèlent en entrant dans l'écran (.sheet, [data-in]).
const targets = document.querySelectorAll('.sheet, .foot, [data-in]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  targets.forEach((target) => observer.observe(target));
} else {
  targets.forEach((target) => target.classList.add('in'));
}

// Rail : un trait par chapitre, celui du chapitre courant s'allonge.
const rail = document.querySelector('.rail');
const chapters = [...document.querySelectorAll('[data-chapter]')];
if (rail && chapters.length) {
  chapters.forEach((chapter, index) => {
    if (!chapter.id) chapter.id = `chapitre-${index + 1}`;
    const link = document.createElement('a');
    link.href = `#${chapter.id}`;
    link.setAttribute('aria-label', chapter.dataset.label || `Chapitre ${index + 1}`);
    link.title = chapter.dataset.label || '';
    rail.append(link);
  });
  const links = [...rail.children];
  const last = chapters[chapters.length - 1];
  const update = () => {
    const middle = window.innerHeight / 2;
    let best = 0;
    let distance = Infinity;
    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      const d = Math.abs(rect.top + rect.height / 2 - middle);
      if (d < distance) {
        distance = d;
        best = index;
      }
    });
    links.forEach((link, index) => link.classList.toggle('is-current', index === best));
    rail.classList.toggle('is-off', last.getBoundingClientRect().bottom < middle * 0.6);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// Formulaires : ce sont des démonstrations, rien n'est envoyé.
for (const form of document.querySelectorAll('form[data-demo]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const done = form.querySelector('.form__done');
    if (done) done.textContent = form.dataset.demo || 'Merci. Ceci est une démonstration : aucune demande n’a été envoyée.';
    form.reset();
  });
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
