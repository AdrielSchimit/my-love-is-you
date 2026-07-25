(function () {
  'use strict';

  const ORIGINALS = new WeakMap();
  const ANIME_CLASSES = [
    'theme-hunter',
    'theme-bleach',
    'theme-fullmetal',
    'theme-one-piece',
    'theme-blue-lock'
  ];

  const THEMES = {
    sakura: {
      label: 'Sakura noturna',
      metaColor: '#25142f'
    },
    cyber: {
      label: 'Romance cyber',
      metaColor: '#181127'
    },
    cream: {
      label: 'Café aconchegante',
      metaColor: '#6f4a54'
    },
    hunter: {
      label: 'Hunter — Expedição',
      badge: 'EXPEDIÇÃO DO CASAL',
      metaColor: '#173b2a',
      assets: {
        draw: '/assets/themes/hunter/map.webp',
        chest: '/assets/themes/hunter/crystals.webp',
        boss: '/assets/themes/hunter/target.webp',
        gift: '/assets/themes/hunter/backpack.webp',
        navHome: '/assets/themes/hunter/green-tent.webp',
        navUs: '/assets/themes/hunter/compass.webp',
        navMessages: '/assets/themes/hunter/license.webp',
        decoA: '/assets/themes/hunter/yoyo.webp',
        decoB: '/assets/themes/hunter/blue-potion.webp',
        mapDeco: '/assets/themes/hunter/compass.webp',
        petAccessory: '/assets/themes/hunter/backpack.webp'
      }
    },
    bleach: {
      label: 'Bleach — Noite espiritual',
      badge: 'VÍNCULO ESPIRITUAL',
      metaColor: '#061927',
      assets: {
        draw: '/assets/themes/bleach/talismans.webp',
        chest: '/assets/themes/bleach/skull-crest.webp',
        boss: '/assets/themes/bleach/torii-portal.webp',
        gift: '/assets/themes/bleach/butterfly.webp',
        navHome: '/assets/themes/bleach/lantern.webp',
        navUs: '/assets/themes/bleach/orb.webp',
        navMessages: '/assets/themes/bleach/skull-charm.webp',
        decoA: '/assets/themes/bleach/flame.webp',
        decoB: '/assets/themes/bleach/energy-slash.webp',
        mapDeco: '/assets/themes/bleach/torii-portal.webp',
        petAccessory: '/assets/themes/bleach/butterfly.webp'
      }
    },
    fullmetal: {
      label: 'Fullmetal — Oficina alquímica',
      badge: 'ALQUIMIA DO CASAL',
      metaColor: '#2f160f',
      assets: {
        draw: '/assets/themes/fullmetal/alchemy-circle-blue.webp',
        chest: '/assets/themes/fullmetal/chest.webp',
        boss: '/assets/themes/fullmetal/red-crystal.webp',
        gift: '/assets/themes/fullmetal/pocket-watch.webp',
        navHome: '/assets/themes/fullmetal/brown-book.webp',
        navUs: '/assets/themes/fullmetal/coin.webp',
        navMessages: '/assets/themes/fullmetal/alchemy-book.webp',
        decoA: '/assets/themes/fullmetal/alchemy-circle-red.webp',
        decoB: '/assets/themes/fullmetal/potion.webp',
        mapDeco: '/assets/themes/fullmetal/sketch.webp',
        petAccessory: '/assets/themes/fullmetal/pocket-watch.webp'
      }
    },
    'one-piece': {
      label: 'One Piece — Rota pirata',
      badge: 'ROTA DOS DOIS',
      metaColor: '#153754',
      assets: {
        draw: '/assets/themes/one-piece/map.webp',
        chest: '/assets/themes/one-piece/chest.webp',
        boss: '/assets/themes/one-piece/island.webp',
        gift: '/assets/themes/one-piece/straw-hat.webp',
        navHome: '/assets/themes/one-piece/wheel.webp',
        navUs: '/assets/themes/one-piece/compass.webp',
        navMessages: '/assets/themes/one-piece/message-bottle.webp',
        decoA: '/assets/themes/one-piece/anchor.webp',
        decoB: '/assets/themes/one-piece/gems-large.webp',
        mapDeco: '/assets/themes/one-piece/island.webp',
        petAccessory: '/assets/themes/one-piece/straw-hat.webp'
      }
    },
    'blue-lock': {
      label: 'Blue Lock — Arena',
      badge: 'DUPLA EM CAMPO',
      metaColor: '#031a38',
      assets: {
        draw: '/assets/themes/blue-lock/tactics-board.webp',
        chest: '/assets/themes/blue-lock/scoreboard.webp',
        boss: '/assets/themes/blue-lock/goal-text.webp',
        gift: '/assets/themes/blue-lock/ball.webp',
        navHome: '/assets/themes/blue-lock/ball.webp',
        navUs: '/assets/themes/blue-lock/target.webp',
        navMessages: '/assets/themes/blue-lock/whistle.webp',
        decoA: '/assets/themes/blue-lock/energy-burst.webp',
        decoB: '/assets/themes/blue-lock/energy-slash.webp',
        mapDeco: '/assets/themes/blue-lock/corner-flag.webp',
        petAccessory: '/assets/themes/blue-lock/ball.webp'
      }
    }
  };

  function remember(element) {
    if (!element || ORIGINALS.has(element)) return;

    ORIGINALS.set(element, {
      src: element.getAttribute('src'),
      alt: element.getAttribute('alt') || ''
    });
  }

  function restoreImage(element) {
    if (!element) return;

    const original = ORIGINALS.get(element);
    if (!original) return;

    element.setAttribute('src', original.src);
    element.setAttribute('alt', original.alt);
  }

  function replaceImage(selector, source, alt) {
    const element = document.querySelector(selector);
    if (!element) return;

    remember(element);

    if (!source) {
      restoreImage(element);
      return;
    }

    element.setAttribute('src', source);
    if (alt) element.setAttribute('alt', alt);
  }

  function ensureThemeUi() {
    const home = document.querySelector('.page[data-page="home"]');
    if (!home) return;

    if (!home.querySelector('.anime-theme-badge')) {
      const badge = document.createElement('div');
      badge.className = 'anime-theme-badge';
      badge.hidden = true;
      badge.setAttribute('aria-live', 'polite');
      home.prepend(badge);
    }

    if (!home.querySelector('.anime-theme-decoration')) {
      const layer = document.createElement('div');
      layer.className = 'anime-theme-decoration';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = [
        '<img class="anime-deco anime-deco-a" alt="" hidden />',
        '<img class="anime-deco anime-deco-b" alt="" hidden />'
      ].join('');
      home.append(layer);
    }
  }

  function resetDecorations() {
    document.documentElement.style.removeProperty('--theme-map-deco');
    document.documentElement.style.removeProperty('--theme-pet-accessory');

    document.querySelectorAll('.anime-deco').forEach(image => {
      image.removeAttribute('src');
      image.hidden = true;
    });

    const badge = document.querySelector('.anime-theme-badge');
    if (badge) badge.hidden = true;
  }

  function apply(themeKey) {
    const key = THEMES[themeKey] ? themeKey : 'sakura';
    const theme = THEMES[key];

    ensureThemeUi();

    document.body.dataset.animeTheme = key;
    document.documentElement.dataset.animeTheme = key;
    document.body.classList.remove(...ANIME_CLASSES);

    if (theme.assets) {
      document.body.classList.add(`theme-${key}`);
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme.metaColor);

    resetDecorations();

    replaceImage(
      '#drawBtn img',
      theme.assets?.draw,
      `${theme.label}: escrever na tela`
    );
    replaceImage(
      '#chestBtn img',
      theme.assets?.chest,
      `${theme.label}: Baú do amor`
    );
    replaceImage(
      '.boss-card img',
      theme.assets?.boss,
      `${theme.label}: desafio semanal`
    );
    replaceImage(
      '#giftBtn img',
      theme.assets?.gift,
      `${theme.label}: recompensa`
    );
    replaceImage(
      '.bottom-nav [data-page-target="home"] img',
      theme.assets?.navHome,
      ''
    );
    replaceImage(
      '.bottom-nav [data-page-target="us"] img',
      theme.assets?.navUs,
      ''
    );
    replaceImage(
      '.bottom-nav [data-page-target="messages"] img',
      theme.assets?.navMessages,
      ''
    );

    const badge = document.querySelector('.anime-theme-badge');
    if (badge && theme.badge) {
      badge.textContent = theme.badge;
      badge.hidden = false;
    }

    const decoA = document.querySelector('.anime-deco-a');
    const decoB = document.querySelector('.anime-deco-b');

    if (decoA && theme.assets?.decoA) {
      decoA.src = theme.assets.decoA;
      decoA.hidden = false;
    }

    if (decoB && theme.assets?.decoB) {
      decoB.src = theme.assets.decoB;
      decoB.hidden = false;
    }

    if (theme.assets?.mapDeco) {
      document.documentElement.style.setProperty(
        '--theme-map-deco',
        `url("${theme.assets.mapDeco}")`
      );
    }

    if (theme.assets?.petAccessory) {
      document.documentElement.style.setProperty(
        '--theme-pet-accessory',
        `url("${theme.assets.petAccessory}")`
      );
    }

    window.dispatchEvent(new CustomEvent('my-love-theme-applied', {
      detail: { key, theme }
    }));
  }

  window.MyLoveThemes = {
    apply,
    definitions: THEMES
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureThemeUi();

    const select = document.querySelector('#themeSelect');
    if (!select) return;

    select.addEventListener('change', event => {
      apply(event.target.value);
    });

    apply(select.value || 'sakura');
  });
})();
