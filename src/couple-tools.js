import { nanaSpeak, contextualEntry } from './nana.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const OWNER_LABELS = {
  couple: 'Do casal',
  adriel: 'Adriel',
  maria: 'Maria'
};

const NANA_TOPICS = [
  'entry',
  'missions',
  'romantic',
  'map',
  'messages',
  'xp',
  'pet',
  'countdown'
];

let store = null;
let rawMissions = [];
let goals = [];
let toolsChannel = null;
let activeCoupleId = null;
let nanaBubbleTimer = null;
let toastTimer = null;
let refreshPromise = null;

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

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${value}T12:00:00`));
}

function showToast(message, duration = 2800) {
  const toast = $('#toast');

  if (!toast) {
    console.info(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => toast.classList.remove('show'),
    duration
  );
}

function currentProfileKey() {
  const avatarKey = String(store?.state?.profile?.avatarKey || '').toLowerCase();
  const name = String(store?.state?.profile?.name || '').toLowerCase();

  if (avatarKey.includes('maria') || name.includes('maria')) return 'maria';
  return 'adriel';
}

function profileLabel(key) {
  return OWNER_LABELS[key] || 'Do casal';
}

function injectStyles() {
  if (document.querySelector('link[data-couple-tools]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/couple-tools.css';
  link.dataset.coupleTools = 'true';
  document.head.appendChild(link);
}

function injectInterface() {
  injectStyles();

  const missionRow = $('.mission-title-row');
  if (missionRow && !$('#managePlansBtn')) {
    const button = document.createElement('button');
    button.id = 'managePlansBtn';
    button.type = 'button';
    button.className = 'plan-plus-button';
    button.setAttribute('aria-label', 'Adicionar missões e metas');
    button.textContent = '+';
    missionRow.appendChild(button);
  }

  const staticGoalsCard = $('.goals-card');
  if (staticGoalsCard && !$('#goalsSummary')) {
    staticGoalsCard.innerHTML = `
      <div class="compact-card-heading">
        <h3>⭐ Metas pessoais</h3>
        <button type="button" id="manageGoalsBtn" aria-label="Gerenciar metas">+</button>
      </div>
      <div id="goalsSummary" class="goals-summary"></div>
    `;
  }

  const usPage = $('.page[data-page="us"]');
  if (usPage && !$('#goalsBoard')) {
    const board = document.createElement('section');
    board.className = 'soft-card goals-board';
    board.innerHTML = `
      <div class="goals-board-heading">
        <div>
          <small>Planos individuais e compartilhados</small>
          <h2>Metas do casal</h2>
        </div>
        <button type="button" id="manageGoalsBoardBtn">+ Adicionar</button>
      </div>
      <div id="goalsBoard"></div>
    `;

    const twoColumn = $('.two-column', usPage);
    twoColumn?.insertAdjacentElement('afterend', board);
  }

  const messagesHeader = $('.page[data-page="messages"] .page-header');
  if (messagesHeader && !$('#clearMessagesBtn')) {
    messagesHeader.classList.add('messages-header-tools');

    const controls = document.createElement('div');
    controls.className = 'message-test-controls';
    controls.innerHTML = `
      <span class="realtime-pill">
        <i></i>
        Tempo real
      </span>
      <button type="button" id="clearMessagesBtn" hidden>
        Limpar conversa de teste
      </button>
    `;

    messagesHeader.appendChild(controls);
  }

  if (!$('#plansModal')) {
    const dialog = document.createElement('dialog');
    dialog.id = 'plansModal';
    dialog.className = 'modal plans-dialog';
    dialog.innerHTML = `
      <div class="modal-card plans-modal-card">
        <header>
          <div>
            <small>Organização do casal</small>
            <h2>Missões e metas</h2>
          </div>
          <button type="button" id="closePlansModal" aria-label="Fechar">×</button>
        </header>

        <section class="planner-section">
          <h3>Nova missão diária</h3>
          <form id="customMissionForm" class="planner-form">
            <label>
              Missão
              <input
                id="customMissionTitle"
                maxlength="120"
                required
                placeholder="Ex.: Fazer uma ligação de 15 minutos"
              />
            </label>

            <div class="planner-two-columns">
              <label>
                Para quem?
                <select id="customMissionOwner">
                  <option value="couple">O casal</option>
                  <option value="adriel">Adriel</option>
                  <option value="maria">Maria</option>
                </select>
              </label>

              <label>
                Recompensa
                <select id="customMissionXp">
                  <option value="10">10 XP</option>
                  <option value="15" selected>15 XP</option>
                  <option value="20">20 XP</option>
                  <option value="25">25 XP</option>
                  <option value="30">30 XP</option>
                </select>
              </label>
            </div>

            <button type="submit" class="primary-button">
              Adicionar missão
            </button>
          </form>
        </section>

        <section class="planner-section">
          <h3>Nova meta</h3>
          <form id="personalGoalForm" class="planner-form">
            <label>
              Meta
              <input
                id="personalGoalTitle"
                maxlength="140"
                required
                placeholder="Ex.: Tirar a habilitação"
              />
            </label>

            <div class="planner-two-columns">
              <label>
                De quem?
                <select id="personalGoalOwner">
                  <option value="couple">Do casal</option>
                  <option value="adriel">Adriel</option>
                  <option value="maria">Maria</option>
                </select>
              </label>

              <label>
                Data opcional
                <input id="personalGoalDate" type="date" />
              </label>
            </div>

            <button type="submit" class="primary-button">
              Adicionar meta
            </button>
          </form>
        </section>

        <section class="planner-section planner-existing">
          <h3>Itens personalizados</h3>
          <div id="plannerExistingList"></div>
        </section>
      </div>
    `;

    document.body.appendChild(dialog);
  }

  bindInjectedEvents();
}

function openPlanner() {
  renderPlanner();
  $('#plansModal')?.showModal();
}

function bindInjectedEvents() {
  if (document.body.dataset.coupleToolsBound === 'true') return;
  document.body.dataset.coupleToolsBound = 'true';

  document.addEventListener('click', event => {
    if (event.target.closest(
      '#managePlansBtn, #manageGoalsBtn, #manageGoalsBoardBtn'
    )) {
      openPlanner();
    }
  });

  $('#closePlansModal')?.addEventListener(
    'click',
    () => $('#plansModal')?.close()
  );

  $('#plansModal')?.addEventListener('click', event => {
    if (event.target === $('#plansModal')) $('#plansModal').close();
  });

  $('#customMissionForm')?.addEventListener('submit', addCustomMission);
  $('#personalGoalForm')?.addEventListener('submit', addPersonalGoal);

  $('#clearMessagesBtn')?.addEventListener('click', clearConversation);

  const nanaButton = $('#nanaBtn');

  nanaButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const context = contextualEntry();
    const topic = context?.topic
      || NANA_TOPICS[Math.floor(Math.random() * NANA_TOPICS.length)];

    showNanaSpeech(topic);
  }, { capture: true });
}

function showNanaBubble() {
  const bubble = $('#nanaBubble');
  if (!bubble) return;

  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');

  clearTimeout(nanaBubbleTimer);
  nanaBubbleTimer = window.setTimeout(
    () => bubble.classList.remove('show'),
    5200
  );
}

function showNanaSpeech(topic = 'entry', variables = {}) {
  const result = nanaSpeak(topic, {
    days: daysUntilMeeting(),
    ...variables
  });

  const bubble = $('#nanaBubble');
  const sprite = $('#nanaSprite');

  if (bubble) bubble.textContent = result.text;
  if (sprite) sprite.src = `assets/nana/${result.sprite}.webp`;

  showNanaBubble();
  window.MyLoveAnimations?.nana?.speak?.(1350);
}

function enhanceNanaBubble() {
  const bubble = $('#nanaBubble');
  if (!bubble || bubble.dataset.floatingBubbleReady === 'true') return;

  bubble.dataset.floatingBubbleReady = 'true';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');

  new MutationObserver(() => showNanaBubble()).observe(bubble, {
    childList: true,
    subtree: true,
    characterData: true
  });

  window.setTimeout(showNanaBubble, 850);
}

function daysUntilMeeting() {
  const dateString = store?.state?.settings?.nextMeeting;
  if (!dateString) return 36;

  const target = new Date(`${dateString}T12:00:00`);
  return Math.max(
    0,
    Math.ceil((target.getTime() - Date.now()) / 86400000)
  );
}

function patchGiveLove() {
  if (!store || store.giveLove.__atomicLove === true) return;

  const originalGiveLove = store.giveLove.bind(store);

  const atomicGiveLove = async function () {
    if (!this.supabase || !this.state.couple) {
      return originalGiveLove();
    }

    const { data, error } = await this.supabase.rpc('give_love', {
      p_couple_id: this.state.couple.id
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('O progresso não retornou do banco.');

    this.state.progress = {
      ...this.state.progress,
      xp: row.xp,
      affinity: row.affinity,
      coins: row.coins,
      coupleLevel: row.couple_level,
      streak: row.streak,
      lastCompletedDay: row.last_completed_day
    };

    this.persistLocal();
    return this.state.progress;
  };

  atomicGiveLove.__atomicLove = true;
  store.giveLove = atomicGiveLove;
}

function enrichMissionsFromCache() {
  if (!rawMissions.length || !store?.state?.missions) return;

  const byId = new Map(rawMissions.map(mission => [mission.id, mission]));
  const byKey = new Map(rawMissions.map(mission => [mission.key, mission]));

  store.state.missions = store.state.missions.map(mission => {
    const raw = byId.get(mission.dbId) || byKey.get(mission.id);
    if (!raw) return mission;

    return {
      ...mission,
      id: raw.key,
      dbId: raw.id,
      title: raw.title,
      xp: raw.xp_reward,
      assigneeKey: raw.assignee_key || 'couple',
      isCustom: Boolean(raw.couple_id),
      coupleId: raw.couple_id,
      createdBy: raw.created_by
    };
  });
}

async function refreshExtendedData() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (!store?.supabase || !store?.state?.couple) {
      enrichMissionsFromCache();
      renderExtendedInterface();
      return;
    }

    const coupleId = store.state.couple.id;

    const [missionsResult, goalsResult] = await Promise.all([
      store.supabase
        .from('missions')
        .select(
          'id,key,title,type,xp_reward,sort_order,active,couple_id,'
          + 'assignee_key,created_by'
        )
        .eq('active', true)
        .order('sort_order')
        .order('created_at'),
      store.supabase
        .from('personal_goals')
        .select('*')
        .eq('couple_id', coupleId)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: true })
    ]);

    const error = missionsResult.error || goalsResult.error;
    if (error) throw error;

    rawMissions = missionsResult.data || [];
    goals = goalsResult.data || [];

    store.state.missions = rawMissions.map(mission => ({
      id: mission.key,
      dbId: mission.id,
      title: mission.title,
      xp: mission.xp_reward,
      assigneeKey: mission.assignee_key || 'couple',
      isCustom: Boolean(mission.couple_id),
      coupleId: mission.couple_id,
      createdBy: mission.created_by
    }));

    renderExtendedInterface();
  })().catch(error => {
    console.error('Falha ao carregar missões e metas:', error);
    showToast(error.message || 'Falha ao carregar missões e metas.');
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function setupToolsRealtime() {
  const coupleId = store?.state?.couple?.id;

  if (!store?.supabase || !coupleId || activeCoupleId === coupleId) return;

  if (toolsChannel) {
    store.supabase.removeChannel(toolsChannel);
  }

  activeCoupleId = coupleId;

  let refreshTimer = null;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshExtendedData, 180);
  };

  toolsChannel = store.supabase
    .channel(`couple-tools:${coupleId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'missions',
      filter: `couple_id=eq.${coupleId}`
    }, scheduleRefresh)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'personal_goals',
      filter: `couple_id=eq.${coupleId}`
    }, scheduleRefresh)
    .subscribe();
}

function missionOwnerBadge(mission) {
  const key = mission.assigneeKey || 'couple';
  return `
    <small class="mission-owner mission-owner-${key}">
      ${escapeHtml(profileLabel(key))}
    </small>
  `;
}

function renderMissions() {
  const list = $('#missionList');
  if (!list || !store) return;

  enrichMissionsFromCache();

  const profileKey = currentProfileKey();
  const missions = store.state.missions || [];

  if (!missions.length) {
    list.innerHTML = '<p class="muted">Nenhuma missão ativa.</p>';
    return;
  }

  list.innerHTML = missions.map(mission => {
    const checked = store.getTodayCompletion(mission);
    const owner = mission.assigneeKey || 'couple';
    const allowed = owner === 'couple' || owner === profileKey;
    const locked = checked || !allowed;

    return `
      <label class="mission ${mission.isCustom ? 'custom-mission' : ''} ${!allowed ? 'mission-locked' : ''}">
        <input
          type="checkbox"
          data-tool-mission="${escapeHtml(mission.id)}"
          ${checked ? 'checked' : ''}
          ${locked ? 'disabled' : ''}
        />
        <span class="mission-copy">
          <span>${escapeHtml(mission.title)}</span>
          ${missionOwnerBadge(mission)}
        </span>
        <b>+${Number(mission.xp) || 0} XP</b>
      </label>
    `;
  }).join('');

  $$('[data-tool-mission]', list).forEach(input => {
    input.addEventListener('change', async () => {
      const mission = store.state.missions.find(
        item => item.id === input.dataset.toolMission
      );

      if (!mission) return;

      input.disabled = true;

      try {
        const result = await store.toggleMission(mission);

        showToast(`Missão concluída: +${mission.xp} XP ♥`);
        showNanaSpeech(result.allDone ? 'allDone' : 'missionDone');
        window.MyLoveAnimations?.coupleCelebrate?.(input);
        await refreshExtendedData();
      }
      catch (error) {
        input.checked = false;
        showToast(error.message);
      }
    });
  });

  const allDone = missions.length > 0
    && missions.every(mission => store.getTodayCompletion(mission));

  const bonus = $('#missionBonus');
  if (bonus) {
    bonus.textContent = allDone
      ? 'Tudo concluído. Resultado adequado. Recompensa liberada. ✓'
      : 'Conclua todas e ganhe bônus! 🎁';
  }
}

function goalCard(goal, compact = false) {
  const owner = goal.owner_key || 'couple';
  const allowed = owner === 'couple' || owner === currentProfileKey();
  const date = goal.target_date
    ? `<small>Até ${escapeHtml(formatDate(goal.target_date))}</small>`
    : '';

  return `
    <article class="personal-goal ${goal.completed ? 'completed' : ''} ${compact ? 'compact' : ''}">
      <button
        type="button"
        class="goal-check"
        data-toggle-goal="${goal.id}"
        ${allowed ? '' : 'disabled'}
        aria-label="${goal.completed ? 'Reabrir meta' : 'Concluir meta'}"
      >
        ${goal.completed ? '✓' : '○'}
      </button>

      <div>
        <span>${escapeHtml(goal.title)}</span>
        <div class="goal-metadata">
          <em class="goal-owner owner-${owner}">
            ${escapeHtml(profileLabel(owner))}
          </em>
          ${date}
        </div>
      </div>
    </article>
  `;
}

function renderGoals() {
  const summary = $('#goalsSummary');
  const board = $('#goalsBoard');

  const activeGoals = goals.filter(goal => !goal.completed);
  const ordered = [...goals].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return new Date(a.created_at) - new Date(b.created_at);
  });

  if (summary) {
    summary.innerHTML = activeGoals.length
      ? activeGoals.slice(0, 4).map(goal => goalCard(goal, true)).join('')
      : '<p class="muted compact-empty">Nenhuma meta pendente.</p>';
  }

  if (board) {
    board.innerHTML = ordered.length
      ? ordered.map(goal => goalCard(goal)).join('')
      : '<p class="muted">Criem a primeira meta de vocês.</p>';
  }

  $$('[data-toggle-goal]').forEach(button => {
    button.addEventListener('click', async () => {
      const goal = goals.find(item => item.id === button.dataset.toggleGoal);
      if (!goal) return;

      button.disabled = true;

      try {
        const completed = !goal.completed;
        const { error } = await store.supabase
          .from('personal_goals')
          .update({
            completed,
            completed_at: completed ? new Date().toISOString() : null
          })
          .eq('id', goal.id);

        if (error) throw error;

        showToast(
          completed
            ? 'Meta concluída. Progresso registrado. ♥'
            : 'Meta reaberta.'
        );

        showNanaSpeech(completed ? 'missionDone' : 'missions');
        await refreshExtendedData();
      }
      catch (error) {
        showToast(error.message);
      }
      finally {
        button.disabled = false;
      }
    });
  });
}

function renderPlanner() {
  const list = $('#plannerExistingList');
  if (!list) return;

  const customMissions = rawMissions.filter(mission => Boolean(mission.couple_id));

  const missionItems = customMissions.map(mission => {
    const stateMission = store.state.missions.find(
      item => item.dbId === mission.id
    );
    const completedToday = stateMission
      ? store.getTodayCompletion(stateMission)
      : false;

    return `
      <article class="planner-existing-item">
        <div>
          <strong>${escapeHtml(mission.title)}</strong>
          <small>
            Missão · ${escapeHtml(profileLabel(mission.assignee_key || 'couple'))}
            · ${mission.xp_reward} XP
          </small>
        </div>

        <button
          type="button"
          data-delete-mission="${mission.id}"
          ${completedToday ? 'disabled title="Missão já concluída hoje"' : ''}
        >
          Excluir
        </button>
      </article>
    `;
  }).join('');

  const goalItems = goals.map(goal => `
    <article class="planner-existing-item ${goal.completed ? 'completed' : ''}">
      <div>
        <strong>${escapeHtml(goal.title)}</strong>
        <small>
          Meta · ${escapeHtml(profileLabel(goal.owner_key || 'couple'))}
          ${goal.target_date ? `· ${escapeHtml(formatDate(goal.target_date))}` : ''}
        </small>
      </div>

      <button type="button" data-delete-goal="${goal.id}">
        Excluir
      </button>
    </article>
  `).join('');

  list.innerHTML = missionItems || goalItems
    ? `
      ${missionItems
        ? `<h4>Missões</h4>${missionItems}`
        : ''
      }
      ${goalItems
        ? `<h4>Metas</h4>${goalItems}`
        : ''
      }
    `
    : '<p class="muted">Nenhum item personalizado ainda.</p>';

  $$('[data-delete-mission]', list).forEach(button => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Excluir esta missão personalizada?')) return;

      button.disabled = true;

      try {
        const { error } = await store.supabase
          .from('missions')
          .delete()
          .eq('id', button.dataset.deleteMission);

        if (error) throw error;

        showToast('Missão removida.');
        await store.loadRemoteData();
        await refreshExtendedData();
        renderPlanner();
      }
      catch (error) {
        showToast(error.message);
        button.disabled = false;
      }
    });
  });

  $$('[data-delete-goal]', list).forEach(button => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Excluir esta meta?')) return;

      button.disabled = true;

      try {
        const { error } = await store.supabase
          .from('personal_goals')
          .delete()
          .eq('id', button.dataset.deleteGoal);

        if (error) throw error;

        showToast('Meta removida.');
        await refreshExtendedData();
        renderPlanner();
      }
      catch (error) {
        showToast(error.message);
        button.disabled = false;
      }
    });
  });
}

async function addCustomMission(event) {
  event.preventDefault();

  if (!store?.supabase || !store?.state?.couple) {
    showToast('Entre na conta conectada para criar missões.');
    return;
  }

  const titleInput = $('#customMissionTitle');
  const ownerInput = $('#customMissionOwner');
  const xpInput = $('#customMissionXp');
  const title = titleInput.value.trim();

  if (!title) return;

  const customCount = rawMissions.filter(
    mission => Boolean(mission.couple_id)
  ).length;

  const row = {
    key: `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    type: 'daily',
    xp_reward: Number(xpInput.value) || 15,
    sort_order: 100 + customCount,
    active: true,
    couple_id: store.state.couple.id,
    assignee_key: ownerInput.value,
    created_by: store.state.user.id
  };

  const submit = event.submitter;
  if (submit) submit.disabled = true;

  try {
    const { error } = await store.supabase.from('missions').insert(row);
    if (error) throw error;

    titleInput.value = '';
    showToast('Nova missão adicionada.');
    showNanaSpeech('missions');

    await store.loadRemoteData();
    await refreshExtendedData();
    renderPlanner();
  }
  catch (error) {
    showToast(error.message);
  }
  finally {
    if (submit) submit.disabled = false;
  }
}

async function addPersonalGoal(event) {
  event.preventDefault();

  if (!store?.supabase || !store?.state?.couple) {
    showToast('Entre na conta conectada para criar metas.');
    return;
  }

  const titleInput = $('#personalGoalTitle');
  const ownerInput = $('#personalGoalOwner');
  const dateInput = $('#personalGoalDate');
  const title = titleInput.value.trim();

  if (!title) return;

  const row = {
    couple_id: store.state.couple.id,
    owner_key: ownerInput.value,
    created_by: store.state.user.id,
    title,
    target_date: dateInput.value || null
  };

  const submit = event.submitter;
  if (submit) submit.disabled = true;

  try {
    const { error } = await store.supabase
      .from('personal_goals')
      .insert(row);

    if (error) throw error;

    titleInput.value = '';
    dateInput.value = '';

    showToast('Meta adicionada.');
    showNanaSpeech('missions');

    await refreshExtendedData();
    renderPlanner();
  }
  catch (error) {
    showToast(error.message);
  }
  finally {
    if (submit) submit.disabled = false;
  }
}

async function clearConversation() {
  if (!store?.supabase || !store?.state?.couple) {
    showToast('O chat local já pode ser recarregado.');
    store.state.messages = [];
    store.persistLocal();
    return;
  }

  const accepted = window.confirm(
    'Apagar todas as mensagens atuais para iniciar o teste do zero?'
  );

  if (!accepted) return;

  const button = $('#clearMessagesBtn');
  button.disabled = true;

  try {
    const { data, error } = await store.supabase.rpc(
      'clear_couple_messages',
      { p_couple_id: store.state.couple.id }
    );

    if (error) throw error;

    store.state.messages = [];
    store.persistLocal();
    await store.loadRemoteData();

    showToast(
      `${Number(data) || 0} mensagem(ns) removida(s). Chat pronto para teste.`
    );

    showNanaSpeech('messages');
  }
  catch (error) {
    showToast(error.message);
  }
  finally {
    button.disabled = false;
  }
}

function updateMessageTools() {
  const clearButton = $('#clearMessagesBtn');
  if (!clearButton || !store) return;

  clearButton.hidden = currentProfileKey() !== 'adriel';
}

function renderExtendedInterface() {
  injectInterface();
  updateMessageTools();
  enrichMissionsFromCache();
  renderMissions();
  renderGoals();

  if ($('#plansModal')?.open) {
    renderPlanner();
  }
}

function onStoreChange(_state, event) {
  setupToolsRealtime();
  enrichMissionsFromCache();
  renderExtendedInterface();

  if ([
    'remoteReady',
    'demoStarted',
    'needsOnboarding'
  ].includes(event)) {
    refreshExtendedData();
  }
}

async function init() {
  store = window.__MYLOVE_STORE__;

  if (!store) {
    window.setTimeout(init, 40);
    return;
  }

  injectInterface();
  patchGiveLove();
  enhanceNanaBubble();

  store.subscribe(onStoreChange);

  setupToolsRealtime();
  renderExtendedInterface();

  if (store.state.couple) {
    await refreshExtendedData();
  }

  window.MyLoveCoupleTools = {
    refresh: refreshExtendedData,
    openPlanner,
    clearConversation,
    say: showNanaSpeech
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
}
else {
  init();
}
