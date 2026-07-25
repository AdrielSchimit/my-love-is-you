(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const DEFAULT_TRACK = {
    videoId: 'Te11UaHOHMQ',
    title: 'Young and Beautiful',
    artist: 'Lana Del Rey'
  };

  let store = null;
  let proposalLocked = false;
  let proposalCompletedAt = null;
  let proposalLoading = true;
  let milestoneChannel = null;

  let musicPreferences = {
    ...DEFAULT_TRACK,
    enabled: false,
    volume: 42
  };

  let musicTracks = [];
  let youtubePlayer = null;
  let youtubeApiPromise = null;
  let youtubePlayerPromise = null;
  let currentYoutubeVideoId = null;
  let musicIsPlaying = false;
  let musicPanelOpen = false;

  function escapeHtml(value = '') {
    return String(value).replace(
      /[&<>'"]/g,
      character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      })[character]
    );
  }

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

  function formatDate(value) {
    if (!value) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  }

  function updateActivePage() {
    const activePage = $('.page.active');
    const page = activePage?.dataset.page || 'home';
    document.body.dataset.activePage = page;

    if (page === 'messages') {
      const input = $('#messageInput');
      if (input && document.activeElement === input) {
        document.body.classList.add('chat-is-typing');
      }
    }
    else {
      document.body.classList.remove('chat-is-typing');
    }
  }

  function observePages() {
    const pageContainer = $('#pageContainer');
    if (!pageContainer) return;

    updateActivePage();

    const observer = new MutationObserver(updateActivePage);

    $$('.page', pageContainer).forEach(page => {
      observer.observe(page, {
        attributes: true,
        attributeFilter: ['class']
      });
    });

    $('#messageInput')?.addEventListener(
      'focus',
      () => document.body.classList.add('chat-is-typing')
    );

    $('#messageInput')?.addEventListener(
      'blur',
      () => document.body.classList.remove('chat-is-typing')
    );
  }

  function ensureInterface() {
    const messagesHeader = $('.page[data-page="messages"] .page-header');

    if (messagesHeader && !$('#nanaChatChip')) {
      const chip = document.createElement('button');
      chip.id = 'nanaChatChip';
      chip.className = 'nana-chat-chip';
      chip.type = 'button';
      chip.innerHTML = `
        <img src="assets/nana/neutral.webp" alt="" />
        <span>Nana</span>
      `;

      messagesHeader.appendChild(chip);

      chip.addEventListener('click', () => {
        if (window.MyLoveCoupleTools?.say) {
          window.MyLoveCoupleTools.say('messages');
          return;
        }

        $('#nanaBtn')?.click();
      });
    }

    const settings = $('.settings-list');

    if (settings && !$('#openMusicManagerBtn')) {
      const card = document.createElement('section');
      card.className = 'profile-music-control';
      card.innerHTML = `
        <div>
          <strong>Minha trilha sonora ♫</strong>
          <small>
            Sua música continua ao navegar pelo aplicativo.
          </small>
        </div>
        <button
          class="secondary-button"
          id="openMusicManagerBtn"
          type="button"
        >
          Escolher música
        </button>
      `;

      settings.appendChild(card);
    }

    const appView = $('#appView');

    if (appView && !$('#loveMusicBar')) {
      const musicBar = document.createElement('section');
      musicBar.id = 'loveMusicBar';
      musicBar.className = 'love-music-bar';
      musicBar.setAttribute('aria-label', 'Controle de música');
      musicBar.innerHTML = `
        <button
          id="loveMusicPlayPause"
          class="love-music-play"
          type="button"
          aria-label="Tocar música"
        >
          ▶
        </button>

        <button
          id="loveMusicOpen"
          class="love-music-description"
          type="button"
        >
          <small>Minha trilha</small>
          <strong id="loveMusicTitle">Young and Beautiful</strong>
        </button>
      `;

      const nana = $('#nanaBtn');
      appView.insertBefore(musicBar, nana || $('.bottom-nav'));

      const playerPanel = document.createElement('section');
      playerPanel.id = 'loveMusicPlayerPanel';
      playerPanel.className = 'love-music-player-panel hidden';
      playerPanel.innerHTML = `
        <header>
          <div>
            <small>Tocando no My Love</small>
            <strong id="loveMusicPanelTitle">
              Young and Beautiful
            </strong>
          </div>

          <button
            id="closeMusicPlayerPanel"
            type="button"
            aria-label="Fechar e pausar"
          >
            ×
          </button>
        </header>

        <div id="loveMusicYoutubePlayer"></div>

        <div class="love-music-panel-controls">
          <button
            id="panelMusicPlayPause"
            class="primary-button"
            type="button"
          >
            Pausar
          </button>

          <button
            id="openMusicManagerFromPanel"
            class="secondary-button"
            type="button"
          >
            Playlist
          </button>
        </div>
      `;

      appView.insertBefore(playerPanel, nana || $('.bottom-nav'));
    }

    if (!$('#musicManagerModal')) {
      const modal = document.createElement('dialog');
      modal.id = 'musicManagerModal';
      modal.className = 'modal music-manager-dialog';
      modal.innerHTML = `
        <form method="dialog" class="modal-card music-manager-card">
          <header>
            <div>
              <small>Trilha individual</small>
              <h2>Minhas músicas</h2>
            </div>

            <button value="cancel" aria-label="Fechar">×</button>
          </header>

          <label>
            Música escolhida
            <select id="musicTrackSelect"></select>
          </label>

          <div class="music-manager-actions">
            <button
              id="playSelectedTrack"
              class="primary-button"
              type="button"
            >
              Tocar selecionada
            </button>

            <button
              id="deleteSelectedTrack"
              class="secondary-button"
              type="button"
            >
              Excluir
            </button>
          </div>

          <label>
            Volume
            <input
              id="musicVolume"
              type="range"
              min="0"
              max="100"
              step="1"
              value="42"
            />
          </label>

          <section class="add-music-section">
            <h3>Adicionar do YouTube</h3>

            <label>
              Link do vídeo
              <input
                id="musicYoutubeUrl"
                type="url"
                inputmode="url"
                placeholder="https://youtu.be/..."
              />
            </label>

            <label>
              Nome da música
              <input
                id="musicNewTitle"
                maxlength="100"
                placeholder="Nome que aparecerá no app"
              />
            </label>

            <label>
              Artista
              <input
                id="musicNewArtist"
                maxlength="100"
                placeholder="Opcional"
              />
            </label>

            <button
              id="addYoutubeTrack"
              class="primary-button"
              type="button"
            >
              Adicionar à minha playlist
            </button>
          </section>

          <p class="music-manager-note">
            O YouTube exige um toque para iniciar. A música continua
            enquanto você troca de páginas dentro do app. Ao fechar o
            aplicativo ou bloquear o celular, o sistema pode pausar.
          </p>
        </form>
      `;

      document.body.appendChild(modal);
    }

    bindInterface();
    renderMusicUi();
  }

  function bindInterface() {
    if (document.body.dataset.relationshipExtrasBound === 'true') {
      return;
    }

    document.body.dataset.relationshipExtrasBound = 'true';

    $('#openMusicManagerBtn')?.addEventListener(
      'click',
      () => openMusicManager()
    );

    $('#loveMusicOpen')?.addEventListener(
      'click',
      () => openMusicManager()
    );

    $('#openMusicManagerFromPanel')?.addEventListener(
      'click',
      () => openMusicManager()
    );

    $('#loveMusicPlayPause')?.addEventListener(
      'click',
      () => toggleMusic()
    );

    $('#panelMusicPlayPause')?.addEventListener(
      'click',
      () => toggleMusic()
    );

    $('#closeMusicPlayerPanel')?.addEventListener(
      'click',
      () => closePlayerPanel()
    );

    $('#playSelectedTrack')?.addEventListener(
      'click',
      () => playSelectedTrack()
    );

    $('#addYoutubeTrack')?.addEventListener(
      'click',
      () => addYoutubeTrack()
    );

    $('#deleteSelectedTrack')?.addEventListener(
      'click',
      () => deleteSelectedTrack()
    );

    $('#musicTrackSelect')?.addEventListener(
      'change',
      () => selectTrack()
    );

    $('#musicVolume')?.addEventListener(
      'input',
      event => setMusicVolume(Number(event.target.value), false)
    );

    $('#musicVolume')?.addEventListener(
      'change',
      event => setMusicVolume(Number(event.target.value), true)
    );
  }

  function showAcceptedProposal() {
    $$('.proposal-step').forEach(step => {
      step.classList.toggle(
        'active',
        step.id === 'proposalAcceptedStep'
      );
    });

    const kicker = $('.proposal-kicker');

    if (kicker) {
      kicker.textContent = '♥ Pedido aceito ♥';
    }

    const accepted = $('#proposalAcceptedStep');

    if (accepted && proposalCompletedAt) {
      let note = $('.proposal-accepted-date', accepted);

      if (!note) {
        note = document.createElement('small');
        note.className = 'proposal-accepted-date';
        accepted.insertBefore(
          note,
          $('#proposalFinishBtn', accepted)
        );
      }

      note.textContent =
        `Essa surpresa virou história em ${formatDate(proposalCompletedAt)}.`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applyProposalState() {
    document.body.dataset.proposalLocked =
      proposalLocked ? 'true' : 'false';

    const giftButton = $('#giftBtn');

    if (giftButton) {
      giftButton.disabled = proposalLoading;
      giftButton.classList.toggle(
        'proposal-complete',
        proposalLocked
      );

      giftButton.setAttribute(
        'aria-label',
        proposalLocked
          ? 'Pedido aceito — rever surpresa'
          : 'Abrir surpresa especial'
      );

      giftButton.title = proposalLocked
        ? 'Rever nosso pedido ♥'
        : 'Surpresa especial';
    }

    // O marco aceito impede duplicações, mas não impede a reprise.
    // A apresentação sempre pode começar pela carta novamente.
  }

  async function loadProposalState() {
    proposalLoading = true;
    applyProposalState();

    try {
      if (!store?.supabase || !store?.state?.couple) {
        proposalLocked = Boolean(
          localStorage.getItem('myLoveProposalAcceptedAt')
        );

        proposalCompletedAt =
          localStorage.getItem('myLoveProposalAcceptedAt');

        return;
      }

      const { data, error } = await store.supabase
        .from('couple_milestones')
        .select('completed_at,completed_by,payload')
        .eq('couple_id', store.state.couple.id)
        .eq('milestone_key', 'proposal-accepted')
        .maybeSingle();

      if (error) throw error;

      proposalLocked = Boolean(data);
      proposalCompletedAt = data?.completed_at || null;

      if (proposalLocked && proposalCompletedAt) {
        localStorage.setItem(
          'myLoveProposalAcceptedAt',
          proposalCompletedAt
        );
      }
    }
    catch (error) {
      console.error(
        'Não foi possível verificar o pedido:',
        error
      );

      proposalLocked = Boolean(
        localStorage.getItem('myLoveProposalAcceptedAt')
      );

      proposalCompletedAt =
        localStorage.getItem('myLoveProposalAcceptedAt');
    }
    finally {
      proposalLoading = false;
      applyProposalState();
    }
  }

  async function markProposalAccepted() {
    const completedAt = new Date().toISOString();

    proposalLocked = true;
    proposalCompletedAt = completedAt;

    localStorage.setItem(
      'myLoveProposalAcceptedAt',
      completedAt
    );

    applyProposalState();

    if (!store?.supabase || !store?.state?.couple) {
      return;
    }

    const { data, error } = await store.supabase
      .from('couple_milestones')
      .upsert({
        couple_id: store.state.couple.id,
        milestone_key: 'proposal-accepted',
        completed_at: completedAt,
        completed_by: store.state.user.id,
        payload: {
          accepted_in: 'my-love-is-you'
        }
      }, {
        onConflict: 'couple_id,milestone_key'
      })
      .select('completed_at')
      .single();

    if (error) throw error;

    proposalCompletedAt = data.completed_at;
    applyProposalState();
  }

  function setupMilestoneRealtime() {
    const coupleId = store?.state?.couple?.id;

    if (!store?.supabase || !coupleId) return;

    if (milestoneChannel) {
      store.supabase.removeChannel(milestoneChannel);
    }

    milestoneChannel = store.supabase
      .channel(`couple-milestones:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_milestones',
          filter: `couple_id=eq.${coupleId}`
        },
        () => loadProposalState()
      )
      .subscribe();
  }

  function extractYoutubeVideoId(value) {
    const clean = String(value || '').trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    try {
      const url = new URL(clean);
      const host = url.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0] || null;
      }

      if (
        host === 'youtube.com'
        || host === 'm.youtube.com'
        || host === 'music.youtube.com'
      ) {
        if (url.pathname === '/watch') {
          return url.searchParams.get('v');
        }

        const match = url.pathname.match(
          /^\/(?:embed|shorts|live)\/([^/?#]+)/
        );

        return match?.[1] || null;
      }
    }
    catch {
      return null;
    }

    return null;
  }

  function loadYoutubeApi() {
    if (window.YT?.Player) {
      return Promise.resolve(window.YT);
    }

    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      const timeout = window.setTimeout(
        () => reject(
          new Error('O player do YouTube demorou para carregar.')
        ),
        15000
      );

      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        previousReady?.();
        resolve(window.YT);
      };

      const existing = document.querySelector(
        'script[data-love-youtube-api]'
      );

      if (existing) return;

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.loveYoutubeApi = 'true';
      script.onerror = () => {
        clearTimeout(timeout);
        reject(
          new Error('Não foi possível carregar o YouTube.')
        );
      };

      document.head.appendChild(script);
    });

    return youtubeApiPromise;
  }

  function openPlayerPanel() {
    const panel = $('#loveMusicPlayerPanel');
    if (!panel) return;

    panel.classList.remove('hidden');
    panel.classList.add('open');
    musicPanelOpen = true;
  }

  function closePlayerPanel() {
    pauseMusic();

    const panel = $('#loveMusicPlayerPanel');
    panel?.classList.remove('open');

    window.setTimeout(
      () => panel?.classList.add('hidden'),
      260
    );

    musicPanelOpen = false;
  }

  async function ensureYoutubePlayer() {
    openPlayerPanel();

    if (youtubePlayer) {
      return youtubePlayer;
    }

    if (youtubePlayerPromise) {
      return youtubePlayerPromise;
    }

    youtubePlayerPromise = loadYoutubeApi().then(
      () => new Promise((resolve, reject) => {
        youtubePlayer = new window.YT.Player(
          'loveMusicYoutubePlayer',
          {
            width: 220,
            height: 220,
            videoId: musicPreferences.videoId,
            playerVars: {
              playsinline: 1,
              controls: 1,
              rel: 0,
              origin: window.location.origin
            },
            events: {
              onReady(event) {
                event.target.setVolume(musicPreferences.volume);
                currentYoutubeVideoId =
                  musicPreferences.videoId;
                resolve(event.target);
              },
              onStateChange(event) {
                musicIsPlaying =
                  event.data === window.YT.PlayerState.PLAYING;

                updateMusicButtons();
              },
              onAutoplayBlocked() {
                showToast(
                  'O navegador bloqueou o início automático. '
                  + 'Toque no player para começar.'
                );
              },
              onError() {
                showToast(
                  'Esse vídeo não pôde ser reproduzido incorporado.'
                );
              }
            }
          }
        );

        window.setTimeout(() => {
          if (!youtubePlayer) {
            reject(
              new Error('O player do YouTube não respondeu.')
            );
          }
        }, 15000);
      })
    ).finally(() => {
      youtubePlayerPromise = null;
    });

    return youtubePlayerPromise;
  }

  async function playMusic() {
    try {
      const player = await ensureYoutubePlayer();

      if (currentYoutubeVideoId !== musicPreferences.videoId) {
        player.loadVideoById(musicPreferences.videoId);
        currentYoutubeVideoId = musicPreferences.videoId;
      }
      else {
        player.playVideo();
      }

      player.setVolume(musicPreferences.volume);
      musicPreferences.enabled = true;

      await saveMusicPreferences({
        music_enabled: true
      });

      updateMusicButtons();
    }
    catch (error) {
      showToast(error.message);
    }
  }

  function pauseMusic() {
    youtubePlayer?.pauseVideo();
    musicIsPlaying = false;
    musicPreferences.enabled = false;

    saveMusicPreferences({
      music_enabled: false
    }).catch(() => {});

    updateMusicButtons();
  }

  function toggleMusic() {
    if (musicIsPlaying) {
      pauseMusic();
      return;
    }

    playMusic();
  }

  function updateMusicButtons() {
    const icon = musicIsPlaying ? '❚❚' : '▶';
    const label = musicIsPlaying
      ? 'Pausar música'
      : 'Tocar música';

    const mainButton = $('#loveMusicPlayPause');
    const panelButton = $('#panelMusicPlayPause');

    if (mainButton) {
      mainButton.textContent = icon;
      mainButton.setAttribute('aria-label', label);
    }

    if (panelButton) {
      panelButton.textContent = musicIsPlaying
        ? 'Pausar'
        : 'Tocar';
    }
  }

  async function loadMusicData() {
    if (!store?.supabase || !store?.state?.user) {
      const local = JSON.parse(
        localStorage.getItem('my-love-music-preferences')
        || 'null'
      );

      musicPreferences = {
        ...musicPreferences,
        ...(local || {})
      };

      musicTracks = [
        {
          id: 'local-default',
          user_id: store?.state?.user?.id || 'local',
          video_id: musicPreferences.videoId,
          title: musicPreferences.title,
          artist: musicPreferences.artist
        }
      ];

      renderMusicUi();
      return;
    }

    const userId = store.state.user.id;

    const [preferencesResult, tracksResult] =
      await Promise.all([
        store.supabase
          .from('profile_preferences')
          .select(
            'music_video_id,music_title,music_artist,'
            + 'music_enabled,music_volume'
          )
          .eq('user_id', userId)
          .maybeSingle(),

        store.supabase
          .from('profile_music_tracks')
          .select('id,user_id,video_id,title,artist,created_at')
          .eq('user_id', userId)
          .order('created_at')
      ]);

    const error =
      preferencesResult.error || tracksResult.error;

    if (error) throw error;

    const preferences = preferencesResult.data || {};

    musicPreferences = {
      videoId:
        preferences.music_video_id
        || DEFAULT_TRACK.videoId,
      title:
        preferences.music_title
        || DEFAULT_TRACK.title,
      artist:
        preferences.music_artist
        || DEFAULT_TRACK.artist,
      enabled: Boolean(preferences.music_enabled),
      volume: Number(preferences.music_volume ?? 42)
    };

    musicTracks = tracksResult.data || [];

    if (!musicTracks.length) {
      const { data, error: insertError } = await store.supabase
        .from('profile_music_tracks')
        .insert({
          user_id: userId,
          video_id: DEFAULT_TRACK.videoId,
          title: DEFAULT_TRACK.title,
          artist: DEFAULT_TRACK.artist
        })
        .select()
        .single();

      if (insertError) throw insertError;
      musicTracks = [data];
    }

    renderMusicUi();
  }

  async function saveMusicPreferences(patch = {}) {
    const next = {
      music_video_id:
        patch.music_video_id
        ?? musicPreferences.videoId,
      music_title:
        patch.music_title
        ?? musicPreferences.title,
      music_artist:
        patch.music_artist
        ?? musicPreferences.artist,
      music_enabled:
        patch.music_enabled
        ?? musicPreferences.enabled,
      music_volume:
        patch.music_volume
        ?? musicPreferences.volume
    };

    if (!store?.supabase || !store?.state?.user) {
      localStorage.setItem(
        'my-love-music-preferences',
        JSON.stringify({
          videoId: next.music_video_id,
          title: next.music_title,
          artist: next.music_artist,
          enabled: next.music_enabled,
          volume: next.music_volume
        })
      );

      return;
    }

    const { error } = await store.supabase
      .from('profile_preferences')
      .upsert({
        user_id: store.state.user.id,
        ...next
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  function renderMusicUi() {
    const title =
      musicPreferences.title || DEFAULT_TRACK.title;

    const artist =
      musicPreferences.artist || DEFAULT_TRACK.artist;

    const mainTitle = $('#loveMusicTitle');
    const panelTitle = $('#loveMusicPanelTitle');

    if (mainTitle) {
      mainTitle.textContent = artist
        ? `${title} — ${artist}`
        : title;
    }

    if (panelTitle) {
      panelTitle.textContent = artist
        ? `${title} — ${artist}`
        : title;
    }

    const volume = $('#musicVolume');
    if (volume) volume.value = musicPreferences.volume;

    const select = $('#musicTrackSelect');

    if (select) {
      select.innerHTML = musicTracks.map(track => `
        <option
          value="${escapeHtml(track.id)}"
          ${track.video_id === musicPreferences.videoId
            ? 'selected'
            : ''}
        >
          ${escapeHtml(track.title)}
          ${track.artist
            ? ` — ${escapeHtml(track.artist)}`
            : ''}
        </option>
      `).join('');
    }

    updateMusicButtons();
  }

  function openMusicManager() {
    renderMusicUi();
    $('#musicManagerModal')?.showModal();
  }

  async function selectTrack() {
    const selectedId = $('#musicTrackSelect')?.value;
    const track = musicTracks.find(
      item => item.id === selectedId
    );

    if (!track) return;

    pauseMusic();

    musicPreferences.videoId = track.video_id;
    musicPreferences.title = track.title;
    musicPreferences.artist = track.artist || '';

    await saveMusicPreferences({
      music_video_id: track.video_id,
      music_title: track.title,
      music_artist: track.artist || '',
      music_enabled: false
    });

    if (youtubePlayer) {
      youtubePlayer.cueVideoById(track.video_id);
      currentYoutubeVideoId = track.video_id;
    }

    renderMusicUi();
    showToast('Música escolhida para o seu perfil.');
  }

  async function playSelectedTrack() {
    await selectTrack();
    $('#musicManagerModal')?.close();
    await playMusic();
  }

  async function addYoutubeTrack() {
    const urlInput = $('#musicYoutubeUrl');
    const titleInput = $('#musicNewTitle');
    const artistInput = $('#musicNewArtist');

    const videoId = extractYoutubeVideoId(urlInput?.value);
    const title = titleInput?.value.trim();
    const artist = artistInput?.value.trim() || '';

    if (!videoId) {
      showToast('Cole um link válido do YouTube.');
      return;
    }

    if (!title) {
      showToast('Digite o nome da música.');
      return;
    }

    try {
      let track;

      if (!store?.supabase || !store?.state?.user) {
        track = {
          id: `local-${Date.now()}`,
          user_id: 'local',
          video_id: videoId,
          title,
          artist
        };

        musicTracks.push(track);
      }
      else {
        const { data, error } = await store.supabase
          .from('profile_music_tracks')
          .upsert({
            user_id: store.state.user.id,
            video_id: videoId,
            title,
            artist
          }, {
            onConflict: 'user_id,video_id'
          })
          .select()
          .single();

        if (error) throw error;
        track = data;

        musicTracks = musicTracks.filter(
          item => item.id !== track.id
        );

        musicTracks.push(track);
      }

      musicPreferences.videoId = track.video_id;
      musicPreferences.title = track.title;
      musicPreferences.artist = track.artist || '';

      await saveMusicPreferences({
        music_video_id: track.video_id,
        music_title: track.title,
        music_artist: track.artist || '',
        music_enabled: false
      });

      urlInput.value = '';
      titleInput.value = '';
      artistInput.value = '';

      renderMusicUi();
      showToast('Música adicionada à sua playlist.');
    }
    catch (error) {
      showToast(error.message);
    }
  }

  async function deleteSelectedTrack() {
    const selectedId = $('#musicTrackSelect')?.value;

    if (musicTracks.length <= 1) {
      showToast('Mantenha pelo menos uma música na playlist.');
      return;
    }

    const track = musicTracks.find(
      item => item.id === selectedId
    );

    if (!track) return;

    if (!window.confirm(`Excluir “${track.title}” da playlist?`)) {
      return;
    }

    try {
      if (store?.supabase && store?.state?.user) {
        const { error } = await store.supabase
          .from('profile_music_tracks')
          .delete()
          .eq('id', track.id)
          .eq('user_id', store.state.user.id);

        if (error) throw error;
      }

      musicTracks = musicTracks.filter(
        item => item.id !== track.id
      );

      const fallback = musicTracks[0];

      musicPreferences.videoId = fallback.video_id;
      musicPreferences.title = fallback.title;
      musicPreferences.artist = fallback.artist || '';

      await saveMusicPreferences({
        music_video_id: fallback.video_id,
        music_title: fallback.title,
        music_artist: fallback.artist || '',
        music_enabled: false
      });

      pauseMusic();
      renderMusicUi();
      showToast('Música removida.');
    }
    catch (error) {
      showToast(error.message);
    }
  }

  async function setMusicVolume(value, persist) {
    musicPreferences.volume = Math.max(
      0,
      Math.min(100, Number(value) || 0)
    );

    youtubePlayer?.setVolume(musicPreferences.volume);

    if (persist) {
      try {
        await saveMusicPreferences({
          music_volume: musicPreferences.volume
        });
      }
      catch (error) {
        showToast(error.message);
      }
    }
  }

  async function initializeStoreFeatures() {
    setupMilestoneRealtime();

    await Promise.all([
      loadProposalState(),
      loadMusicData()
    ]);
  }

  async function init() {
    store = window.__MYLOVE_STORE__;

    if (!store) {
      window.setTimeout(init, 40);
      return;
    }

    ensureInterface();
    observePages();

    window.MyLoveProposalLock = {
      isLocked() {
        return proposalLocked;
      },
      markAccepted() {
        return markProposalAccepted();
      },
      refresh() {
        return loadProposalState();
      },
      showFinal() {
        showAcceptedProposal();
      },
      startReplay() {
        document.body.dataset.proposalReplay =
          proposalLocked ? 'true' : 'false';

        const kicker = $('.proposal-kicker');
        if (kicker) {
          kicker.textContent = proposalLocked
            ? '♥ Relembrar nosso pedido ♥'
            : '♥ Surpresa especial ♥';
        }

        $$('.proposal-step').forEach(step => {
          step.classList.toggle(
            'active',
            step.id === 'proposalLetterStep'
          );
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    store.subscribe((_state, event) => {
      ensureInterface();
      updateActivePage();

      if (
        ['remoteReady', 'demoStarted', 'needsOnboarding']
          .includes(event)
      ) {
        initializeStoreFeatures().catch(error => {
          console.error(
            'Falha ao inicializar recursos do relacionamento:',
            error
          );
        });
      }
    });

    if (store.state.user) {
      await initializeStoreFeatures();
    }
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
