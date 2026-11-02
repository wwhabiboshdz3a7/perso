// Thème appliqué avant l'affichage (évite le flash de couleur).
(function () {
  try {
    var t = localStorage.getItem('levier.theme');
    if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
})();
