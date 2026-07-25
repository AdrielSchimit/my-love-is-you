(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let store = null;
  let chestObserver = null;
  let musicOutsideBound = false;

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

  function currentMemoryById(id) {
    return store?.state?.memories?.find(
      item => String(item.id) === String(id)
    );
  }

  function currentDrawingById(id) {
    return store?.state?.drawings?.find(
      item => String(item.id) === String(id)
    );
  }

  async function removeStoredFile(bucket, path) {
    if (!store?.supabase || !path) return;

    const { error } = await store.supabase
      .storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.warn(
        `Não foi possível remover o arquivo de ${bucket}:`,
        error
      );
    }
  }

  async function deleteMemory(memory) {
    if (!memory) return;

    const accepted = window.confirm(
      `Remover “${memory.title || 'esta memória'}” do Baú?`
    );

    if (!accepted) return;

    try {
      if (store.supabase && store.state.couple) {
        await removeStoredFile(
          'couple-media',
          memory.storage_path
        );

        const { error } = await store.supabase
          .from('memories')
          .delete()
          .eq('id', memory.id)
          .eq('couple_id', store.state.couple.id);

        if (error) throw error;

        await store.loadRemoteData();
      }
      else {
        store.state.memories = store.state.memories.filter(
          item => item.id !== memory.id
        );

        store.persistLocal();
      }

      showToast('Memória removida do Baú.');
    }
    catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível remover a memória.');
    }
  }

  async function deleteDrawing(drawing) {
    if (!drawing) return;

    const accepted = window.confirm(
      'Remover este desenho do Baú?'
    );

    if (!accepted) return;

    try {
      if (store.supabase && store.state.couple) {
        await removeStoredFile(
          'drawings',
          drawing.storage_path
        );

        const { error } = await store.supabase
          .from('drawings')
          .delete()
          .eq('id', drawing.id)
          .eq('couple_id', store.state.couple.id);

        if (error) throw error;

        await store.loadRemoteData();
      }
      else {
        store.state.drawings = store.state.drawings.filter(
          item => item.id !== drawing.id
        );

        store.persistLocal();
      }

      showToast('Desenho removido do Baú.');
    }
    catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível remover o desenho.');
    }
  }

  async function clearChest() {
    const memories = [...(store?.state?.memories || [])];
    const drawings = [...(store?.state?.drawings || [])];
    const total = memories.length + drawings.length;

    if (!total) {
      showToast('O Baú já está vazio.');
      return;
    }

    const accepted = window.confirm(
      `Apagar ${memories.length} memória(s) e `
      + `${drawings.length} desenho(s)?\n\n`
      + 'Essa ação não pode ser desfeita.'
    );

    if (!accepted) return;

    try {
      if (store.supabase && store.state.couple) {
        const memoryPaths = memories
          .map(item => item.storage_path)
          .filter(Boolean);

        const drawingPaths = drawings
          .map(item => item.storage_path)
          .filter(Boolean);

        if (memoryPaths.length) {
          const result = await store.supabase
            .storage
            .from('couple-media')
            .remove(memoryPaths);

          if (result.error) {
            console.warn(
              'Algumas fotos não foram removidas:',
              result.error
            );
          }
        }

        if (drawingPaths.length) {
          const result = await store.supabase
            .storage
            .from('drawings')
            .remove(drawingPaths);

          if (result.error) {
            console.warn(
              'Alguns desenhos não foram removidos:',
              result.error
            );
          }
        }

        const [memoryDelete, drawingDelete] = await Promise.all([
          store.supabase
            .from('memories')
            .delete()
            .eq('couple_id', store.state.couple.id),

          store.supabase
            .from('drawings')
            .delete()
            .eq('couple_id', store.state.couple.id)
        ]);

        const error = memoryDelete.error || drawingDelete.error;
        if (error) throw error;

        await store.loadRemoteData();
      }
      else {
        store.state.memories = [];
        store.state.drawings = [];
        store.persistLocal();
      }

      showToast('Baú esvaziado.');
    }
    catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível limpar o Baú.');
    }
  }

  function decorateChest() {
    if (!store) return;

    const memoryPage = $('.page[data-page="memories"]');
    const memoryGrid = $('#memoryGrid');
    const drawingGrid = $('#drawingGrid');

    if (!memoryPage || !memoryGrid || !drawingGrid) return;

    if (!$('#chestManagementBar')) {
      const toolbar = document.createElement('section');
      toolbar.id = 'chestManagementBar';
      toolbar.className = 'chest-management-bar';
      toolbar.innerHTML = `
        <div>
          <strong>Organizar o Baú</strong>
          <small>Remova testes ou lembranças duplicadas.</small>
        </div>

        <button
          id="clearLoveChestBtn"
          class="secondary-button"
          type="button"
        >
          Limpar Baú
        </button>
      `;

      memoryGrid.insertAdjacentElement('beforebegin', toolbar);

      $('#clearLoveChestBtn')?.addEventListener(
        'click',
        clearChest
      );
    }

    $$('.memory-card', memoryGrid).forEach((card, index) => {
      const memory = store.state.memories[index];
      if (!memory) return;

      card.dataset.memoryId = memory.id;

      if (!$('.chest-delete-button', card)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chest-delete-button';
        button.setAttribute(
          'aria-label',
          `Excluir ${memory.title || 'memória'}`
        );
        button.textContent = '🗑';

        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          deleteMemory(
            currentMemoryById(card.dataset.memoryId)
          );
        });

        card.appendChild(button);
      }
    });

    $$('.drawing-card', drawingGrid).forEach((card, index) => {
      const drawing = store.state.drawings[index];
      if (!drawing) return;

      card.dataset.drawingId = drawing.id;

      if (!$('.chest-delete-button', card)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chest-delete-button';
        button.setAttribute(
          'aria-label',
          'Excluir desenho'
        );
        button.textContent = '🗑';

        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          deleteDrawing(
            currentDrawingById(card.dataset.drawingId)
          );
        });

        card.appendChild(button);
      }
    });
  }

  function observeChest() {
    const memoryGrid = $('#memoryGrid');
    const drawingGrid = $('#drawingGrid');

    if (!memoryGrid || !drawingGrid || chestObserver) return;

    chestObserver = new MutationObserver(() => {
      window.requestAnimationFrame(decorateChest);
    });

    chestObserver.observe(memoryGrid, {
      childList: true,
      subtree: true
    });

    chestObserver.observe(drawingGrid, {
      childList: true,
      subtree: true
    });

    decorateChest();
  }

  function minimizeMusicPlayer() {
    const panel = $('#loveMusicPlayerPanel');
    if (!panel || panel.classList.contains('hidden')) return;

    panel.classList.add('music-minimized');
    panel.classList.add('open');
    panel.classList.remove('hidden');

    const close = $('#closeMusicPlayerPanel');
    if (close) {
      close.textContent = '−';
      close.setAttribute('aria-label', 'Minimizar player');
      close.title = 'Minimizar';
    }
  }

  function expandMusicPlayer() {
    const panel = $('#loveMusicPlayerPanel');
    if (!panel) return;

    panel.classList.remove('music-minimized');
    panel.classList.add('open');
    panel.classList.remove('hidden');

    const close = $('#closeMusicPlayerPanel');
    if (close) {
      close.textContent = '−';
      close.setAttribute('aria-label', 'Minimizar player');
      close.title = 'Minimizar';
    }
  }

  function toggleMusicCorner() {
    const panel = $('#loveMusicPlayerPanel');
    if (!panel) return;

    panel.dataset.corner =
      panel.dataset.corner === 'left'
        ? 'right'
        : 'left';
  }

  function setupMusicMinimize() {
    const panel = $('#loveMusicPlayerPanel');
    const close = $('#closeMusicPlayerPanel');

    if (!panel || !close) return false;
    if (panel.dataset.v20Ready === 'true') return true;

    panel.dataset.v20Ready = 'true';
    panel.dataset.corner = 'right';

    close.textContent = '−';
    close.setAttribute('aria-label', 'Minimizar player');
    close.title = 'Minimizar';

    close.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        minimizeMusicPlayer();
      },
      { capture: true }
    );

    const expand = document.createElement('button');
    expand.id = 'expandMusicMiniPlayer';
    expand.className = 'music-mini-action music-mini-expand';
    expand.type = 'button';
    expand.setAttribute('aria-label', 'Ampliar player');
    expand.title = 'Ampliar';
    expand.textContent = '↗';

    expand.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      expandMusicPlayer();
    });

    const move = document.createElement('button');
    move.id = 'moveMusicMiniPlayer';
    move.className = 'music-mini-action music-mini-move';
    move.type = 'button';
    move.setAttribute('aria-label', 'Mover player de lado');
    move.title = 'Mover de lado';
    move.textContent = '↔';

    move.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggleMusicCorner();
    });

    panel.append(expand, move);

    if (!musicOutsideBound) {
      musicOutsideBound = true;

      document.addEventListener('pointerdown', event => {
        const activePanel = $('#loveMusicPlayerPanel');

        if (
          !activePanel
          || activePanel.classList.contains('hidden')
          || activePanel.classList.contains('music-minimized')
          || activePanel.contains(event.target)
          || event.target.closest(
            '#loveMusicBar, #musicManagerModal'
          )
        ) {
          return;
        }

        minimizeMusicPlayer();
      });

      $$('.nav-item').forEach(button => {
        button.addEventListener(
          'click',
          () => window.setTimeout(minimizeMusicPlayer, 0)
        );
      });
    }

    return true;
  }

  function watchMusicPanel() {
    if (setupMusicMinimize()) return;

    const observer = new MutationObserver(() => {
      if (setupMusicMinimize()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    store = window.__MYLOVE_STORE__;

    if (!store) {
      window.setTimeout(init, 50);
      return;
    }

    observeChest();
    watchMusicPanel();

    store.subscribe(() => {
      window.requestAnimationFrame(() => {
        decorateChest();
        setupMusicMinimize();
      });
    });

    window.MyLoveV20 = {
      clearChest,
      deleteMemory,
      deleteDrawing,
      minimizeMusicPlayer,
      expandMusicPlayer
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
