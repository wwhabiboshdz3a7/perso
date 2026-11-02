// Applique le thème avant le premier rendu (évite le flash de couleur).
(function () {
  var theme = 'system', size = 'm', font = 'sans';
  try {
    var s = JSON.parse(localStorage.getItem('nour.settings') || '{}');
    theme = (s.prefs && s.prefs.theme) || 'system';
    size = (s.prefs && s.prefs.textSize) || 'm';
    font = (s.prefs && s.prefs.readingFont) || 'sans';
  } catch (e) { /* stockage indisponible */ }
  var dark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.size = size;
  root.dataset.font = font;
})();
