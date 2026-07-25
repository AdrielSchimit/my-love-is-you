(() => {
  'use strict';

  const LABELS = {
    sakura: 'Sakura noturna',
    cyber: 'Romance cyber',
    cream: 'Caf\u00e9 aconchegante',
    hunter: 'Hunter \u2014 Expedi\u00e7\u00e3o',
    bleach: 'Bleach \u2014 Noite espiritual',
    fullmetal: 'Fullmetal \u2014 Oficina alqu\u00edmica',
    'one-piece': 'One Piece \u2014 Rota pirata',
    'blue-lock': 'Blue Lock \u2014 Arena'
  };

  const ORIGINAL_THEMES = new Set(['sakura', 'cyber', 'cream']);
  const ORIGINAL_CLASSES = ['theme-sakura', 'theme-cyber', 'theme-cream'];

  function repairThemeLabels() {
    const select = document.querySelector('#themeSelect');
    if (!select) return null;

    const originalGroup = select.querySelector('optgroup:first-of-type');
    const animeGroup = select.querySelector('optgroup:nth-of-type(2)');

    if (originalGroup && originalGroup.label !== 'Temas originais') {
      originalGroup.label = 'Temas originais';
    }

    if (animeGroup && animeGroup.label !== 'Universos de anime') {
      animeGroup.label = 'Universos de anime';
    }

    for (const option of select.options) {
      const label = LABELS[option.value];
      if (label && option.textContent !== label) {
        option.textContent = label;
      }
    }

    return select;
  }

  function syncOriginalTheme(themeKey) {
    const key = LABELS[themeKey] ? themeKey : 'sakura';

    document.body.classList.remove(...ORIGINAL_CLASSES);
    if (ORIGINAL_THEMES.has(key)) {
      document.body.classList.add(`theme-${key}`);
    }

    document.documentElement.dataset.activeLoveTheme = key;
  }

  function init() {
    const select = repairThemeLabels();
    if (!select) return;

    syncOriginalTheme(select.value);

    select.addEventListener('change', event => {
      syncOriginalTheme(event.target.value);
      repairThemeLabels();
    });

    window.addEventListener('my-love-theme-applied', event => {
      const key = event.detail?.key || select.value;
      syncOriginalTheme(key);
      repairThemeLabels();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
