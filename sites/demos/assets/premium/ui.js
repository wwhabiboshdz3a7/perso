// Comportements communs : apparition des sections, formulaires de démonstration, année.
const targets = document.querySelectorAll('[data-in], section, footer');
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
    { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
  );
  targets.forEach((target) => observer.observe(target));
} else {
  targets.forEach((target) => target.classList.add('in'));
}

// Formulaires : ce sont des démonstrations, rien n'est envoyé.
for (const form of document.querySelectorAll('form[data-demo]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const done = form.querySelector('[data-done]');
    if (done) done.textContent = form.dataset.demo || 'Merci. Ceci est une démonstration : rien n’a été envoyé.';
    form.reset();
  });
}

// Vidéos d'ambiance : lecture seulement quand elles sont à l'écran, jamais si l'utilisateur réduit les animations.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = document.querySelectorAll('video[data-loop]');
if (videos.length && 'IntersectionObserver' in window) {
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !reduced) entry.target.play().catch(() => {});
      else entry.target.pause();
    }
  });
  videos.forEach((video) => watcher.observe(video));
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
