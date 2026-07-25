(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);

  let store = null;
  let panelObserver = null;
  let dragState = null;
  let autoMinimizeTimer = null;

  function showToast(message, duration = 2800) {
    const toast = $('#toast');

    if (!toast) {
      console.info(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(
      () => toast.classList.remove('show'),
      duration
    );
  }

  function playerPanel() {
    return $('#loveMusicPlayerPanel');
  }

  function positionStorageKey() {
    const userId = store?.state?.user?.id || 'local';
    return `my-love-player-position:${userId}`;
  }

  function currentViewportLimits(panel) {
    const width = panel.offsetWidth || 204;
    const height = panel.offsetHeight || 204;
    const margin = 7;

    return {
      minX: margin,
      minY: margin + (window.visualViewport?.offsetTop || 0),
      maxX: Math.max(
        margin,
        window.innerWidth - width - margin
      ),
      maxY: Math.max(
        margin,
        window.innerHeight
          - height
          - 102
          - (window.visualViewport?.offsetTop || 0)
      )
    };
  }

  function clampPosition(panel, x, y) {
    const limits = currentViewportLimits(panel);

    return {
      x: Math.min(limits.maxX, Math.max(limits.minX, x)),
      y: Math.min(limits.maxY, Math.max(limits.minY, y))
    };
  }

  function setPlayerPosition(x, y, persist = true) {
    const panel = playerPanel();
    if (!panel) return;

    const position = clampPosition(panel, x, y);

    panel.dataset.dragged = 'true';
    panel.style.setProperty(
      '--music-player-x',
      `${position.x}px`
    );
    panel.style.setProperty(
      '--music-player-y',
      `${position.y}px`
    );

    if (persist) {
      localStorage.setItem(
        positionStorageKey(),
        JSON.stringify(position)
      );
    }
  }

  function restorePlayerPosition() {
    const panel = playerPanel();
    if (!panel) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(positionStorageKey())
        || 'null'
      );

      if (
        saved
        && Number.isFinite(saved.x)
        && Number.isFinite(saved.y)
      ) {
        setPlayerPosition(saved.x, saved.y, false);
        return;
      }
    }
    catch {
      // Posição inválida: usa o canto padrão.
    }

    const width = panel.offsetWidth || 204;

    setPlayerPosition(
      window.innerWidth - width - 8,
      74,
      false
    );
  }

  function isMusicPlaying() {
    const button = $('#loveMusicPlayPause');
    const label = button?.getAttribute('aria-label') || '';

    return (
      label.toLowerCase().includes('pausar')
      || button?.textContent?.includes('❚')
    );
  }

  function pauseMusic() {
    const button = $('#loveMusicPlayPause');

    if (button && isMusicPlaying()) {
      button.click();
    }
  }

  function closeMusicPlayer() {
    const panel = playerPanel();
    if (!panel) return;

    pauseMusic();

    panel.classList.remove(
      'open',
      'music-minimized',
      'v21-mini-player'
    );
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');

    showToast('Música pausada. O controle continua disponível.');
  }

  function minimizeMusicPlayer() {
    const panel = playerPanel();

    if (
      !panel
      || panel.classList.contains('hidden')
    ) {
      return;
    }

    panel.classList.add(
      'open',
      'music-minimized',
      'v21-mini-player'
    );

    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');

    restorePlayerPosition();
  }

  function scheduleAutoMinimize(delay = 380) {
    clearTimeout(autoMinimizeTimer);

    autoMinimizeTimer = window.setTimeout(() => {
      minimizeMusicPlayer();
    }, delay);
  }

  function createPlayerControls(panel) {
    if ($('#v21MusicPlayerControls', panel)) return;

    $('#expandMusicMiniPlayer', panel)?.remove();
    $('#moveMusicMiniPlayer', panel)?.remove();

    const controls = document.createElement('div');
    controls.id = 'v21MusicPlayerControls';
    controls.className = 'v21-player-controls';
    controls.innerHTML = `
      <button
        id="v21MusicDragHandle"
        class="v21-player-button v21-drag-handle"
        type="button"
        aria-label="Arrastar player"
        title="Segure e arraste"
      >
        ⠿
      </button>

      <button
        id="v21MusicExpand"
        class="v21-player-button"
        type="button"
        aria-label="Ampliar player"
        title="Ampliar"
      >
        ↗
      </button>

      <button
        id="v21MusicClose"
        class="v21-player-button v21-player-close"
        type="button"
        aria-label="Fechar e pausar"
        title="Fechar e pausar"
      >
        ×
      </button>
    `;

    panel.appendChild(controls);

    $('#v21MusicClose', panel)?.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();
        closeMusicPlayer();
      }
    );

    $('#v21MusicExpand', panel)?.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();

        panel.classList.remove(
          'music-minimized',
          'v21-mini-player'
        );

        panel.dataset.dragged = 'false';
        panel.style.removeProperty('--music-player-x');
        panel.style.removeProperty('--music-player-y');
      }
    );

    const handle = $('#v21MusicDragHandle', panel);

    handle?.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      minimizeMusicPlayer();

      const rect = panel.getBoundingClientRect();

      dragState = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };

      handle.setPointerCapture?.(event.pointerId);
      panel.classList.add('is-dragging');
    });

    handle?.addEventListener('pointermove', event => {
      if (
        !dragState
        || dragState.pointerId !== event.pointerId
      ) {
        return;
      }

      event.preventDefault();

      setPlayerPosition(
        event.clientX - dragState.offsetX,
        event.clientY - dragState.offsetY,
        false
      );
    });

    const finishDrag = event => {
      if (
        !dragState
        || dragState.pointerId !== event.pointerId
      ) {
        return;
      }

      const rect = panel.getBoundingClientRect();

      setPlayerPosition(rect.left, rect.top, true);

      dragState = null;
      panel.classList.remove('is-dragging');

      try {
        handle.releasePointerCapture?.(event.pointerId);
      }
      catch {
        // O navegador já liberou o ponteiro.
      }
    };

    handle?.addEventListener('pointerup', finishDrag);
    handle?.addEventListener('pointercancel', finishDrag);
  }

  function ensureSearchInterface() {
    const titleInput = $('#musicNewTitle');
    const artistInput = $('#musicNewArtist');
    const urlInput = $('#musicYoutubeUrl');

    if (
      !titleInput
      || !artistInput
      || !urlInput
      || $('#searchYoutubeByName')
    ) {
      return;
    }

    const searchButton = document.createElement('button');
    searchButton.id = 'searchYoutubeByName';
    searchButton.className = 'secondary-button youtube-name-search';
    searchButton.type = 'button';
    searchButton.innerHTML = `
      <span>⌕</span>
      Buscar pelo nome e artista
    `;

    const hint = document.createElement('small');
    hint.className = 'youtube-name-search-hint';
    hint.textContent =
      'Abre a busca pronta. Escolha o vídeo oficial e cole o link aqui.';

    titleInput
      .closest('label')
      ?.insertAdjacentElement('beforebegin', searchButton);

    searchButton.insertAdjacentElement('afterend', hint);

    searchButton.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const artist = artistInput.value.trim();

      if (!title && !artist) {
        showToast('Digite o nome da música ou o artista.');
        titleInput.focus();
        return;
      }

      const query = [
        title,
        artist,
        'official audio'
      ].filter(Boolean).join(' ');

      const searchUrl =
        'https://www.youtube.com/results?search_query='
        + encodeURIComponent(query);

      const popup = window.open(
        searchUrl,
        '_blank',
        'noopener,noreferrer'
      );

      if (!popup) {
        showToast(
          'O navegador bloqueou a busca. Permita pop-ups '
          + 'ou toque novamente.'
        );
        return;
      }

      showToast(
        'Busca aberta. Escolha o vídeo e copie o link para o campo.'
      );
    });

    const searchOnEnter = event => {
      if (
        event.key === 'Enter'
        && !event.shiftKey
      ) {
        event.preventDefault();
        searchButton.click();
      }
    };

    titleInput.addEventListener('keydown', searchOnEnter);
    artistInput.addEventListener('keydown', searchOnEnter);
  }

  function setupPanel() {
    const panel = playerPanel();
    if (!panel) return false;

    createPlayerControls(panel);
    ensureSearchInterface();

    if (panel.dataset.v21Bound !== 'true') {
      panel.dataset.v21Bound = 'true';

      const classObserver = new MutationObserver(() => {
        if (
          panel.classList.contains('open')
          && !panel.classList.contains('hidden')
          && !panel.classList.contains('is-dragging')
        ) {
          scheduleAutoMinimize(250);
        }
      });

      classObserver.observe(panel, {
        attributes: true,
        attributeFilter: ['class']
      });

      window.addEventListener('resize', () => {
        if (
          panel.classList.contains('v21-mini-player')
        ) {
          const rect = panel.getBoundingClientRect();
          setPlayerPosition(rect.left, rect.top, true);
        }
      });

      window.visualViewport?.addEventListener(
        'resize',
        () => {
          if (
            panel.classList.contains('v21-mini-player')
          ) {
            const rect = panel.getBoundingClientRect();
            setPlayerPosition(rect.left, rect.top, true);
          }
        }
      );
    }

    return true;
  }

  function bindPlaybackButtons() {
    if (document.body.dataset.v21PlaybackBound === 'true') {
      return;
    }

    document.body.dataset.v21PlaybackBound = 'true';

    document.addEventListener('click', event => {
      if (
        event.target.closest(
          '#loveMusicPlayPause, '
          + '#panelMusicPlayPause, '
          + '#playSelectedTrack'
        )
      ) {
        scheduleAutoMinimize(700);
      }
    });
  }

  function init() {
    store = window.__MYLOVE_STORE__;

    if (!store) {
      window.setTimeout(init, 50);
      return;
    }

    bindPlaybackButtons();
    ensureSearchInterface();

    if (!setupPanel()) {
      panelObserver = new MutationObserver(() => {
        ensureSearchInterface();

        if (setupPanel()) {
          panelObserver.disconnect();
          panelObserver = null;
        }
      });

      panelObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    store.subscribe(() => {
      window.requestAnimationFrame(() => {
        ensureSearchInterface();
        setupPanel();
      });
    });

    window.MyLoveV21 = {
      minimizeMusicPlayer,
      closeMusicPlayer,
      restorePlayerPosition
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );
  }
  else {
    init();
  }
})();
