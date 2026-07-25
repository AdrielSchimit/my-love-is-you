import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.__MYLOVE_CONFIG__ || {};
const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabase = configured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const state = {
  user: null,
  coupleId: null,
  members: [],
  room: null,
  roomChannel: null,
  reactionChannel: null,
  reactions: [],
  countdownTimer: null,
  positionTimer: null,
  initialized: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function toast(message) {
  const existing = document.querySelector('#toast');
  if (existing) {
    existing.textContent = message;
    existing.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => existing.classList.remove('show'), 2800);
    return;
  }
  alert(message);
}

function formatTime(seconds = 0) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function parseTime(value = '') {
  const text = String(value).trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) return Number(text) * 60;
  const match = text.match(/^(\d+):(\d{1,2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function currentPosition(room = state.room) {
  if (!room) return 0;
  const base = Number(room.position_seconds || 0);
  if (room.status !== 'playing' || !room.playback_started_at) return base;
  const elapsed = (Date.now() - new Date(room.playback_started_at).getTime()) / 1000;
  return Math.max(0, base + elapsed);
}

function memberById(id) {
  return state.members.find(member => member.id === id);
}

function isHost() {
  return Boolean(state.user && state.room && state.room.host_user_id === state.user.id);
}

function hasReady(userId) {
  return Boolean(state.room?.ready_user_ids?.includes(userId));
}

function injectInterface() {
  if (document.getElementById('cinemaLaunchCard')) return;

  const featureGrid = document.querySelector('.feature-grid');
  if (!featureGrid) return;

  featureGrid.insertAdjacentHTML('afterend', `
    <button class="cinema-launch-card" id="cinemaLaunchCard" type="button">
      <span class="cinema-launch-icon">🎬</span>
      <span>
        <strong>Cineminha à distância</strong>
        <small>Escolham o episódio, sincronizem o play e reajam juntos.</small>
      </span>
      <span class="cinema-live-dot" id="cinemaLiveDot" aria-hidden="true"></span>
    </button>
  `);

  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="cinemaSyncModal" class="cinema-sync-modal">
      <article class="cinema-sync-shell">
        <header class="cinema-sync-header">
          <div>
            <span class="cinema-eyebrow">NOSSO CINEMINHA</span>
            <h2>Assistir anime juntos 🎬</h2>
          </div>
          <button id="cinemaCloseBtn" class="cinema-close-btn" type="button" aria-label="Fechar">×</button>
        </header>

        <p class="cinema-legal-note">
          O My love is You sincroniza a sessão, a contagem e o minuto. O episódio abre na Crunchyroll em cada celular.
        </p>

        <section id="cinemaDisconnected" class="cinema-empty-state hidden">
          <strong>Entre nas contas do casal para usar a sala sincronizada.</strong>
        </section>

        <section id="cinemaConnected" class="cinema-room hidden">
          <div class="cinema-editor-card">
            <label>
              Anime
              <input id="cinemaTitleInput" maxlength="100" placeholder="Ex.: Jujutsu Kaisen" />
            </label>
            <label>
              Episódio
              <input id="cinemaEpisodeInput" maxlength="100" placeholder="Ex.: Temporada 1 · Episódio 4" />
            </label>
            <label>
              Link do episódio na Crunchyroll
              <input id="cinemaUrlInput" type="url" inputmode="url" placeholder="https://www.crunchyroll.com/..." />
            </label>
            <button id="cinemaSaveBtn" class="cinema-primary-btn" type="button">Salvar sessão</button>
          </div>

          <section class="cinema-now-card">
            <span class="cinema-status-pill" id="cinemaStatusPill">Aguardando</span>
            <h3 id="cinemaNowTitle">Escolham o anime de hoje</h3>
            <p id="cinemaNowEpisode">Nenhum episódio definido.</p>
            <div class="cinema-clock" id="cinemaClock">00:00</div>
            <div class="cinema-countdown hidden" id="cinemaCountdown">3</div>
          </section>

          <section class="cinema-ready-card">
            <div class="cinema-section-title">
              <strong>Quem está pronto?</strong>
              <span id="cinemaHostLabel"></span>
            </div>
            <div id="cinemaReadyList" class="cinema-ready-list"></div>
            <button id="cinemaReadyBtn" class="cinema-secondary-btn" type="button">Estou pronto 🍿</button>
          </section>

          <div class="cinema-open-row">
            <button id="cinemaOpenCrunchyrollBtn" class="cinema-crunchyroll-btn" type="button">
              Abrir episódio na Crunchyroll
            </button>
          </div>

          <section class="cinema-controls-card">
            <div class="cinema-position-row">
              <label>
                Minuto atual
                <input id="cinemaPositionInput" inputmode="numeric" placeholder="00:00" />
              </label>
              <button id="cinemaSyncPositionBtn" class="cinema-secondary-btn" type="button">Sincronizar minuto</button>
            </div>

            <div class="cinema-host-controls" id="cinemaHostControls">
              <button id="cinemaStartBtn" class="cinema-primary-btn" type="button">3, 2, 1… PLAY!</button>
              <button id="cinemaPauseBtn" class="cinema-secondary-btn" type="button">Pausar juntos</button>
              <button id="cinemaEndBtn" class="cinema-ghost-btn" type="button">Encerrar sessão</button>
            </div>

            <div class="cinema-guest-help hidden" id="cinemaGuestHelp">
              <strong>Adriel controla a sessão.</strong>
              <span>Quando ele iniciar, você verá a mesma contagem no seu celular.</span>
            </div>
          </section>

          <section class="cinema-reaction-card">
            <strong>Reações rápidas</strong>
            <div class="cinema-reaction-buttons">
              <button type="button" data-cinema-reaction="😍">😍</button>
              <button type="button" data-cinema-reaction="😂">😂</button>
              <button type="button" data-cinema-reaction="😱">😱</button>
              <button type="button" data-cinema-reaction="😭">😭</button>
              <button type="button" data-cinema-reaction="🔥">🔥</button>
              <button type="button" data-cinema-reaction="❤️">❤️</button>
            </div>
            <div id="cinemaReactionFeed" class="cinema-reaction-feed"></div>
          </section>
        </section>
      </article>
    </dialog>
  `);

  bindInterface();
}

function bindInterface() {
  $('#cinemaLaunchCard')?.addEventListener('click', openCinema);
  $('#cinemaCloseBtn')?.addEventListener('click', closeCinema);
  $('#cinemaSaveBtn')?.addEventListener('click', saveRoomDetails);
  $('#cinemaReadyBtn')?.addEventListener('click', toggleReady);
  $('#cinemaOpenCrunchyrollBtn')?.addEventListener('click', openCrunchyroll);
  $('#cinemaStartBtn')?.addEventListener('click', startCountdown);
  $('#cinemaPauseBtn')?.addEventListener('click', pauseTogether);
  $('#cinemaEndBtn')?.addEventListener('click', endSession);
  $('#cinemaSyncPositionBtn')?.addEventListener('click', syncPosition);

  $$('[data-cinema-reaction]').forEach(button => {
    button.addEventListener('click', () => sendReaction(button.dataset.cinemaReaction));
  });

  $('#cinemaSyncModal')?.addEventListener('click', event => {
    if (event.target === $('#cinemaSyncModal')) closeCinema();
  });
}

async function waitForApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (document.querySelector('.feature-grid')) {
      injectInterface();
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}

async function initializeContext() {
  if (!supabase) return false;

  const { data: authData } = await supabase.auth.getSession();
  state.user = authData.session?.user || null;
  if (!state.user) return false;

  const { data: membership, error: membershipError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', state.user.id)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.couple_id) return false;

  state.coupleId = membership.couple_id;

  const { data: memberRows, error: memberError } = await supabase
    .from('couple_members')
    .select('user_id, joined_at')
    .eq('couple_id', state.coupleId)
    .order('joined_at', { ascending: true });

  if (memberError) throw memberError;

  const ids = (memberRows || []).map(row => row.user_id);
  let profileRows = [];
  if (ids.length) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_key, level')
      .in('id', ids);
    if (error) throw error;
    profileRows = data || [];
  }

  state.members = ids.map(id => {
    const profile = profileRows.find(item => item.id === id) || {};
    return {
      id,
      name: profile.display_name || 'Seu amor',
      avatarKey: profile.avatar_key || '',
      level: profile.level || 1
    };
  });

  await loadRoom();
  await loadReactions();
  subscribeRealtime();
  return true;
}

async function loadRoom() {
  const { data, error } = await supabase
    .from('cinema_rooms')
    .select('*')
    .eq('couple_id', state.coupleId)
    .maybeSingle();

  if (error) throw error;
  state.room = data;
  renderRoom();
}

async function loadReactions() {
  if (!state.room) return;
  const { data, error } = await supabase
    .from('cinema_reactions')
    .select('id, user_id, emoji, created_at')
    .eq('room_id', state.room.id)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) throw error;
  state.reactions = data || [];
  renderReactions();
}

function subscribeRealtime() {
  state.roomChannel?.unsubscribe();
  state.reactionChannel?.unsubscribe();

  state.roomChannel = supabase
    .channel(`cinema-room-${state.coupleId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cinema_rooms',
      filter: `couple_id=eq.${state.coupleId}`
    }, payload => {
      if (payload.new?.id) {
        state.room = payload.new;
        renderRoom();
      }
    })
    .subscribe();

  if (state.room) {
    state.reactionChannel = supabase
      .channel(`cinema-reactions-${state.room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cinema_reactions',
        filter: `room_id=eq.${state.room.id}`
      }, payload => {
        state.reactions.unshift(payload.new);
        state.reactions = state.reactions.slice(0, 12);
        renderReactions();
        showFloatingReaction(payload.new.emoji);
      })
      .subscribe();
  }
}

async function openCinema() {
  const modal = $('#cinemaSyncModal');
  if (!modal) return;
  modal.showModal();

  $('#cinemaDisconnected').classList.add('hidden');
  $('#cinemaConnected').classList.add('hidden');

  try {
    const connected = await initializeContext();
    $('#cinemaDisconnected').classList.toggle('hidden', connected);
    $('#cinemaConnected').classList.toggle('hidden', !connected);
    if (!connected) {
      $('#cinemaDisconnected').innerHTML = '<strong>Entre nas contas do casal para usar a sala sincronizada.</strong>';
    }
  } catch (error) {
    console.error(error);
    $('#cinemaDisconnected').classList.remove('hidden');
    $('#cinemaConnected').classList.add('hidden');
    $('#cinemaDisconnected').innerHTML = `<strong>Não foi possível abrir a sala.</strong><span>${escapeHtml(error.message)}</span>`;
  }
}

function closeCinema() {
  $('#cinemaSyncModal')?.close();
}

function renderRoom() {
  if (!state.room) return;

  const room = state.room;
  const host = memberById(room.host_user_id);
  const title = room.title || 'Escolham o anime de hoje';
  const episode = room.episode_label || 'Nenhum episódio definido.';

  $('#cinemaTitleInput').value = room.title || '';
  $('#cinemaEpisodeInput').value = room.episode_label || '';
  $('#cinemaUrlInput').value = room.crunchyroll_url || '';
  $('#cinemaNowTitle').textContent = title;
  $('#cinemaNowEpisode').textContent = episode;
  $('#cinemaHostLabel').textContent = host ? `Host: ${host.name}` : 'Host definido';
  $('#cinemaLiveDot').classList.toggle('is-live', ['countdown', 'playing'].includes(room.status));

  const hostMode = isHost();
  ['#cinemaTitleInput', '#cinemaEpisodeInput', '#cinemaUrlInput', '#cinemaSaveBtn'].forEach(selector => {
    const element = $(selector);
    if (element) element.disabled = !hostMode;
  });

  $('#cinemaHostControls').classList.toggle('hidden', !hostMode);
  $('#cinemaGuestHelp').classList.toggle('hidden', hostMode);

  const ready = hasReady(state.user?.id);
  $('#cinemaReadyBtn').textContent = ready ? 'Já estou pronto ✓' : 'Estou pronto 🍿';
  $('#cinemaReadyBtn').classList.toggle('is-ready', ready);

  renderReadyList();
  renderStatus();
  startVisualTimers();
}

function renderReadyList() {
  const list = $('#cinemaReadyList');
  if (!list) return;

  list.innerHTML = state.members.map(member => {
    const ready = hasReady(member.id);
    const avatar = member.avatarKey.toLowerCase().includes('maria')
      ? '/assets/avatar-maria-map.webp'
      : '/assets/avatar-adriel-map.webp';
    return `
      <article class="cinema-ready-person ${ready ? 'is-ready' : ''}">
        <img src="${avatar}" alt="${escapeHtml(member.name)}" />
        <span><strong>${escapeHtml(member.name)}</strong><small>${ready ? 'Pronto ✓' : 'Aguardando'}</small></span>
      </article>
    `;
  }).join('');
}

function renderStatus() {
  const room = state.room;
  const pill = $('#cinemaStatusPill');
  if (!pill || !room) return;

  const map = {
    idle: 'Preparando a sessão',
    countdown: 'Contagem sincronizada',
    playing: 'Assistindo juntos',
    paused: 'Pausado para os dois',
    ended: 'Sessão encerrada'
  };

  pill.textContent = map[room.status] || 'Aguardando';
  pill.dataset.status = room.status;
}

function startVisualTimers() {
  clearInterval(state.countdownTimer);
  clearInterval(state.positionTimer);

  const updateClock = () => {
    if (!state.room) return;
    $('#cinemaClock').textContent = formatTime(currentPosition());
  };

  updateClock();
  state.positionTimer = setInterval(updateClock, 500);

  const updateCountdown = () => {
    const box = $('#cinemaCountdown');
    if (!box || !state.room || state.room.status !== 'countdown' || !state.room.countdown_ends_at) {
      box?.classList.add('hidden');
      return;
    }

    const remaining = Math.ceil((new Date(state.room.countdown_ends_at).getTime() - Date.now()) / 1000);
    if (remaining > 0) {
      box.textContent = String(remaining);
      box.classList.remove('hidden');
      return;
    }

    box.textContent = 'PLAY!';
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 900);
  };

  updateCountdown();
  state.countdownTimer = setInterval(updateCountdown, 200);
}

async function updateRoom(patch) {
  if (!state.room || !state.user) return;
  const { data, error } = await supabase
    .from('cinema_rooms')
    .update({ ...patch, last_action_by: state.user.id })
    .eq('id', state.room.id)
    .select()
    .single();

  if (error) throw error;
  state.room = data;
  renderRoom();
}

async function saveRoomDetails() {
  if (!isHost()) return;
  try {
    await updateRoom({
      title: $('#cinemaTitleInput').value.trim(),
      episode_label: $('#cinemaEpisodeInput').value.trim(),
      crunchyroll_url: $('#cinemaUrlInput').value.trim()
    });
    toast('Sessão do Cineminha salva 🎬');
  } catch (error) {
    toast(error.message);
  }
}

async function toggleReady() {
  if (!state.room) return;
  try {
    const { data, error } = await supabase.rpc('toggle_cinema_ready', {
      p_room_id: state.room.id
    });
    if (error) throw error;
    state.room = data;
    renderRoom();
  } catch (error) {
    toast(error.message);
  }
}

function openCrunchyroll() {
  const url = state.room?.crunchyroll_url;
  if (!url) {
    toast('Adicione primeiro o link do episódio.');
    return;
  }

  try {
    const parsed = new URL(url);
    const valid = parsed.hostname.includes('crunchyroll.com');
    if (!valid) {
      toast('Use um link oficial da Crunchyroll.');
      return;
    }
    window.open(parsed.href, '_blank', 'noopener,noreferrer');
  } catch {
    toast('O link do episódio não é válido.');
  }
}

async function startCountdown() {
  if (!isHost()) return;
  if (!state.room?.crunchyroll_url) {
    toast('Salve o link do episódio antes de começar.');
    return;
  }

  const allReady = state.members.length >= 2 && state.members.every(member => hasReady(member.id));
  if (!allReady) {
    const proceed = confirm('Nem todo mundo marcou que está pronto. Começar mesmo assim?');
    if (!proceed) return;
  }

  const countdownEnd = new Date(Date.now() + 4000);
  try {
    await updateRoom({
      status: 'countdown',
      countdown_ends_at: countdownEnd.toISOString(),
      playback_started_at: countdownEnd.toISOString()
    });

    setTimeout(async () => {
      if (!isHost() || state.room?.status !== 'countdown') return;
      try {
        await updateRoom({
          status: 'playing',
          countdown_ends_at: null,
          playback_started_at: countdownEnd.toISOString()
        });
      } catch (error) {
        console.warn(error);
      }
    }, 4300);
  } catch (error) {
    toast(error.message);
  }
}

async function pauseTogether() {
  if (!isHost()) return;
  try {
    const position = currentPosition();
    await updateRoom({
      status: 'paused',
      position_seconds: position,
      playback_started_at: null,
      countdown_ends_at: null
    });
    toast(`Pausado em ${formatTime(position)} para os dois.`);
  } catch (error) {
    toast(error.message);
  }
}

async function syncPosition() {
  if (!state.room || !state.user) return;
  const seconds = parseTime($('#cinemaPositionInput').value);
  if (!seconds && $('#cinemaPositionInput').value.trim() !== '0' && $('#cinemaPositionInput').value.trim() !== '00:00') {
    toast('Use o formato 12:34 ou apenas os minutos.');
    return;
  }

  if (!isHost()) {
    toast(`O minuto oficial da sala é ${formatTime(currentPosition())}.`);
    return;
  }

  try {
    await updateRoom({
      position_seconds: seconds,
      playback_started_at: state.room.status === 'playing' ? new Date().toISOString() : null
    });
    toast(`Minuto sincronizado em ${formatTime(seconds)}.`);
  } catch (error) {
    toast(error.message);
  }
}

async function endSession() {
  if (!isHost()) return;
  try {
    await updateRoom({
      status: 'ended',
      position_seconds: currentPosition(),
      playback_started_at: null,
      countdown_ends_at: null,
      ready_user_ids: []
    });
    toast('Sessão encerrada. Um dia produtivo para o relacionamento.');
  } catch (error) {
    toast(error.message);
  }
}

async function sendReaction(emoji) {
  if (!state.room || !state.user || !state.coupleId) return;
  const { error } = await supabase.from('cinema_reactions').insert({
    room_id: state.room.id,
    couple_id: state.coupleId,
    user_id: state.user.id,
    emoji
  });
  if (error) toast(error.message);
}

function renderReactions() {
  const feed = $('#cinemaReactionFeed');
  if (!feed) return;
  feed.innerHTML = state.reactions.slice(0, 8).map(reaction => {
    const member = memberById(reaction.user_id);
    return `<span title="${escapeHtml(member?.name || 'Seu amor')}">${escapeHtml(reaction.emoji)}</span>`;
  }).join('');
}

function showFloatingReaction(emoji) {
  const item = document.createElement('span');
  item.className = 'cinema-floating-reaction';
  item.textContent = emoji;
  item.style.left = `${20 + Math.random() * 60}%`;
  document.body.append(item);
  setTimeout(() => item.remove(), 1800);
}

async function init() {
  if (state.initialized) return;
  state.initialized = true;
  await waitForApp();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init, { once: true })
  : init();
