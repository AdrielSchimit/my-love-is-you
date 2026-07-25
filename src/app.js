import { LoveStore } from './store.js';
import { nanaSpeak, contextualEntry } from './nana.js';

const config = window.__MYLOVE_CONFIG__ || {};
const store = new LoveStore(config);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fmt = new Intl.NumberFormat('pt-BR');
let selectedAuthProfile = null;
let currentPage = 'home';
let lastNana = contextualEntry();
let proposalNoAttempts = 0;
const proposalTrackUrl = 'https://www.youtube-nocookie.com/embed/Te11UaHOHMQ?autoplay=1&playsinline=1&rel=0';

const moods = [
  { key: 'happy', emoji: '😊', label: 'Feliz' },
  { key: 'love', emoji: '🥰', label: 'Apaixonado(a)' },
  { key: 'missing', emoji: '🥺', label: 'Com saudade' },
  { key: 'tired', emoji: '😴', label: 'Cansado(a)' },
  { key: 'sad', emoji: '😔', label: 'Triste' },
  { key: 'anxious', emoji: '😟', label: 'Ansioso(a)' },
  { key: 'talk', emoji: '💬', label: 'Quero conversar' },
  { key: 'okay', emoji: '🙂', label: 'Estou bem' }
];

const dailyQuotes = [
  '“Dois corações, um destino.”',
  '“O mapa mede quilômetros. Não mede comprometimento.”',
  '“Amar alguém é incluí-lo nos próprios planos.”',
  '“O mundo já é cansativo demais. Sejam descanso um para o outro.”',
  '“Escolher a mesma pessoa diariamente importa.”'
];

function showView(name) {
  for (const id of ['loadingView', 'authView', 'onboardingView', 'appView']) $(`#${id}`)?.classList.add('hidden');
  $(`#${name}`)?.classList.remove('hidden');
}

function routeFromState() {
  const s = store.state;
  if (!s.user) return showView('authView');
  if (!s.couple) {
    prepareOnboarding();
    return showView('onboardingView');
  }
  showView('appView');
  render();
}

function getLoginProfiles() {
  const savedMariaEmail = localStorage.getItem('my-love-is-you-maria-email') || '';
  const configured = config.profiles || {};
  return {
    adriel: {
      name: configured.adriel?.name || 'Adriel',
      email: configured.adriel?.email || 'schimitadriel100@gmail.com',
      avatar: configured.adriel?.avatar || 'assets/avatar-adriel.webp',
      level: configured.adriel?.level || 24
    },
    maria: {
      name: configured.maria?.name || 'Maria',
      email: configured.maria?.email || savedMariaEmail,
      avatar: configured.maria?.avatar || 'assets/avatar-maria.webp',
      level: configured.maria?.level || 25
    }
  };
}

function selectLoginProfile(key) {
  const profile = getLoginProfiles()[key];
  if (!profile) return;
  selectedAuthProfile = key;
  $('#profilePicker').classList.add('hidden');
  $('#profileLoginPanel').classList.remove('hidden');
  $('#selectedProfileAvatar').src = profile.avatar;
  $('#selectedProfileAvatar').alt = `Avatar de ${profile.name}`;
  $('#selectedProfileName').textContent = profile.name;
  $('#authSubmit').textContent = `Entrar como ${profile.name}`;
  $('#authStatus').textContent = '';
  $('#authPassword').value = '';
  $('#authEmail').value = profile.email || '';
  const needsEmail = !profile.email;
  $('#authEmailLabel').classList.toggle('hidden', !needsEmail);
  $('#authEmail').required = needsEmail;
  $('#firstAccessBtn').classList.toggle('hidden', key !== 'maria');
  setTimeout(() => (needsEmail ? $('#authEmail') : $('#authPassword')).focus(), 30);
}

function showProfilePicker() {
  selectedAuthProfile = null;
  $('#profileLoginPanel').classList.add('hidden');
  $('#profilePicker').classList.remove('hidden');
  $('#authStatus').textContent = '';
}

function prepareOnboarding() {
  const isMaria = store.state.profile?.avatarKey === 'maria' || /^maria/i.test(store.state.profile?.name || '');
  const createCard = $('#createCoupleBtn');
  const joinCard = $('#joinCoupleCard');
  if (createCard) createCard.classList.toggle('hidden', isMaria);
  if (joinCard) joinCard.classList.remove('hidden');
  const input = $('#joinCode');
  if (input && !input.value) input.value = config.defaultInviteCode || store.state.inviteCode || '';
  const text = $('#onboardingView .muted');
  if (text) text.textContent = isMaria
    ? 'Seu espaço já foi criado pelo Adriel. Toque em Conectar para unir os dois perfis.'
    : 'Crie o espaço uma única vez. Depois, a Maria entra usando o código mostrado.';
}

function toast(message, duration = 2600) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), duration);
}

function confetti(count = 20) {
  for (let i = 0; i < count; i++) {
    const item = document.createElement('span');
    item.className = 'confetti';
    item.textContent = ['♥', '✦', '✿'][Math.floor(Math.random() * 3)];
    item.style.left = `${20 + Math.random() * 60}%`;
    item.style.top = `${25 + Math.random() * 35}%`;
    item.style.color = ['#ff77a8', '#ffd16c', '#c995e3'][Math.floor(Math.random() * 3)];
    item.style.fontSize = `${12 + Math.random() * 20}px`;
    document.body.append(item);
    setTimeout(() => item.remove(), 1700);
  }
}

function nanaSay(topic, variables = {}, open = false) {
  lastNana = nanaSpeak(topic, variables);
  $('#nanaBubble').textContent = lastNana.text;
  $('#nanaSprite').src = `assets/nana/${lastNana.sprite}.webp`;
  $('#nanaModalText').textContent = lastNana.text;
  $('#nanaModalSprite').src = `assets/nana/${lastNana.sprite}.webp`;
  if (open) $('#nanaModal').showModal();
  return lastNana;
}

function daysUntil(dateString) {
  if (!dateString) return 36;
  const target = new Date(`${dateString}T12:00:00`);
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

function dateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function render() {
  const s = store.state;
  const progress = s.progress;
  const target = (Math.floor(progress.xp / 1000) + 2) * 1000;
  const levelStart = target - 1000;
  const percentage = Math.max(3, Math.min(100, ((progress.xp - levelStart) / 1000) * 100));
  $('#xpValue').textContent = fmt.format(progress.xp);
  $('#xpTarget').textContent = fmt.format(target);
  $('#xpFill').style.width = `${percentage}%`;
  $('#affinityValue').textContent = progress.affinity;
  $('#petLevel').textContent = s.pet.level;
  $('#petBar').style.width = `${s.pet.xp}%`;
  $('#memoryCount').textContent = s.memories.length + s.drawings.length;
  $('#daysUntil').textContent = daysUntil(s.settings.nextMeeting);
  $('#calendarDays').textContent = daysUntil(s.settings.nextMeeting);
  $('#streakPill').textContent = `🔥 ${progress.streak} dias`;
  $('#streakLarge').textContent = progress.streak;
  $('#coupleLevel').textContent = progress.coupleLevel || Math.max(1, Math.floor(progress.xp / 1000));
  $('#dailyQuote').textContent = dailyQuotes[new Date().getDate() % dailyQuotes.length];
  $('#inviteCode').textContent = s.inviteCode || s.couple?.inviteCode || 'LOVE-8421';
  $('#profileName').textContent = s.profile?.name || 'Adriel';
  $('#profileEmail').textContent = s.user?.email || 'Modo demonstração';
  $('#profileAvatar').src = (s.profile?.avatarKey || s.profile?.name || '').toLowerCase().includes('maria') ? 'assets/avatar-maria-map.webp' : 'assets/avatar-adriel-map.webp';
  $('#connectionStatus').textContent = store.isConfigured() && s.mode === 'remote' ? 'Supabase conectado — sincronização em tempo real ativa.' : 'Modo local de demonstração — dados salvos apenas neste aparelho.';
  $('#meetingDateInput').value = s.settings.nextMeeting || '';
  $('#calendarDateInput').value = s.settings.nextMeeting || '';
  $('#petNameInput').value = s.pet.name || 'Mochi';
  $('#themeSelect').value = s.settings.theme || 'sakura';
  document.body.classList.remove('theme-cyber', 'theme-cream');
  if (s.settings.theme === 'cyber') document.body.classList.add('theme-cyber');
  if (s.settings.theme === 'cream') document.body.classList.add('theme-cream');
  renderMissions();
  renderMood();
  renderBoss();
  renderRewards();
  renderMessages();
  renderMemories();
  renderDrawings();
  renderCapsules();
  renderPet();
}

function renderMissions() {
  const list = $('#missionList');
  list.innerHTML = store.state.missions.map(mission => {
    const checked = store.getTodayCompletion(mission);
    return `<label class="mission"><input type="checkbox" data-mission="${escapeHtml(mission.id)}" ${checked ? 'checked' : ''}/><span>${escapeHtml(mission.title)}</span><b>+${mission.xp} XP</b></label>`;
  }).join('');
  $$('.mission input', list).forEach(input => input.addEventListener('change', async () => {
    const mission = store.state.missions.find(m => m.id === input.dataset.mission);
    input.disabled = true;
    try {
      const result = await store.toggleMission(mission);
      if (result.completed) {
        toast(`Missão concluída: +${mission.xp} XP ♥`);
        confetti(12);
        nanaSay(result.allDone ? 'allDone' : 'missionDone');
      } else nanaSay('missed');
      render();
    } catch (error) { toast(error.message); input.checked = !input.checked; }
    finally { input.disabled = false; }
  }));
  const allDone = store.state.missions.length > 0 && store.state.missions.every(m => store.getTodayCompletion(m));
  $('#missionBonus').textContent = allDone ? 'Tudo concluído. Resultado adequado. Recompensa liberada. ✓' : 'Conclua todas e ganhe bônus! 🎁';
}

function renderMood() {
  const userId = store.state.user?.id;
  const current = store.state.moods[userId];
  $('#moodOptions').innerHTML = moods.map(mood => `<button class="mood-button ${current?.mood_key === mood.key ? 'active' : ''}" data-mood="${mood.key}"><span class="emoji">${mood.emoji}</span><span>${mood.label}</span></button>`).join('');
  $$('.mood-button').forEach(button => button.addEventListener('click', async () => {
    const mood = moods.find(item => item.key === button.dataset.mood);
    try { await store.setMood(mood.key, mood.emoji, mood.label); toast(`Check-in registrado: ${mood.emoji} ${mood.label}`); if (['sad','anxious'].includes(mood.key)) nanaSay('sad'); render(); } catch (error) { toast(error.message); }
  }));
  const partnerId = store.state.partner?.id;
  const partnerMood = partnerId && store.state.moods[partnerId];
  $('#partnerMood').textContent = partnerMood ? `${store.state.partner.name} está ${partnerMood.emoji} ${partnerMood.label}.` : 'Aguardando o check-in do seu amor…';
}

function renderBoss() {
  const done = Object.values(store.state.completions).filter(Boolean).length;
  const progress = Math.min(15, done + (store.state.progress.streak * 3));
  $('#bossProgress').textContent = progress;
  $('#bossFill').style.width = `${Math.min(100, progress / 15 * 100)}%`;
  if (progress >= 15) {
    $('#bossTitle').textContent = 'Boss derrotado: distância administrada';
    $('#bossDescription').textContent = 'Disciplina, atenção e afeto. Uma combinação funcional.';
  }
}

function renderRewards() {
  const coins = store.state.progress.coins;
  $('#rewardList').innerHTML = `<p><strong>💎 ${coins} moedas</strong></p>` + store.state.rewards.map(reward => `<div class="reward-item"><div><strong>${escapeHtml(reward.title)}</strong><small>${reward.cost} moedas</small></div><button data-reward="${reward.id}" ${coins < reward.cost ? 'disabled' : ''}>Resgatar</button></div>`).join('');
  $$('#rewardList [data-reward]').forEach(button => button.addEventListener('click', async () => {
    const reward = store.state.rewards.find(r => String(r.id) === button.dataset.reward);
    try { await store.redeemReward(reward); toast(`Recompensa liberada: ${reward.title}`); confetti(18); render(); } catch (error) { toast(error.message); }
  }));
}

function renderMessages() {
  const list = $('#messageList');
  const userId = store.state.user?.id;
  if (!store.state.messages.length) list.innerHTML = '<p class="muted">Nenhuma mensagem ainda. Uma conversa honesta economiza muitas suposições.</p>';
  else list.innerHTML = store.state.messages.map(message => `<article class="message ${message.sender_id === userId ? 'mine' : 'theirs'}"><div>${escapeHtml(message.content)}</div><small>${message.sender_id === userId ? 'Você' : store.state.partner?.name || 'Seu amor'} · ${dateTime(message.created_at)}</small></article>`).join('');
  requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
}

function renderMemories() {
  const grid = $('#memoryGrid');
  if (!store.state.memories.length) { grid.innerHTML = '<p class="muted">O baú está vazio.</p>'; return; }
  grid.innerHTML = store.state.memories.map(memory => `<article class="memory-card">${memory.preview_url ? `<img src="${escapeHtml(memory.preview_url)}" alt="" />` : `<img src="assets/couple-polaroids.webp" alt="" />`}<div><h3>${escapeHtml(memory.title || 'Memória')}</h3><p>${escapeHtml(memory.content || '')}</p><small>${dateTime(memory.created_at || memory.createdAt)}</small></div></article>`).join('');
}

function renderDrawings() {
  const grid = $('#drawingGrid');
  if (!store.state.drawings.length) { grid.innerHTML = '<p class="muted">Nenhum desenho enviado ainda.</p>'; return; }
  grid.innerHTML = store.state.drawings.map(drawing => `<article class="drawing-card"><img src="${escapeHtml(drawing.preview_url || drawing.dataUrl)}" alt="Desenho do casal" />${drawing.caption ? `<p>${escapeHtml(drawing.caption)}</p>` : ''}</article>`).join('');
}

function renderCapsules() {
  const list = $('#capsuleList');
  const nowDate = new Date();
  if (!store.state.capsules.length) { list.innerHTML = '<p class="muted">Nenhuma cápsula selada.</p>'; return; }
  list.innerHTML = store.state.capsules.map(capsule => {
    const open = new Date(`${capsule.open_at}T12:00:00`) <= nowDate;
    return `<article class="capsule-entry ${open ? '' : 'locked'}"><strong>${open ? '💌 Cápsula aberta' : '🔒 Abrir em ' + new Date(capsule.open_at + 'T12:00:00').toLocaleDateString('pt-BR')}</strong><p>${open ? escapeHtml(capsule.content) : 'Conteúdo protegido até a data escolhida.'}</p></article>`;
  }).join('');
}

function renderPet() {
  const pet = store.state.pet;
  $('#petModalTitle').textContent = `${pet.name}, nosso gatinho`;
  $('#hungerBar').style.width = `${pet.hunger}%`;
  $('#loveBar').style.width = `${pet.love}%`;
  $('#energyBar').style.width = `${pet.energy}%`;
  if (pet.hunger < 30) $('#petMessage').textContent = 'Miau. A administração da alimentação foi questionável.';
  else if (pet.love < 30) $('#petMessage').textContent = 'Ele sentiu falta de vocês. Eu também teria reclamações.';
  else $('#petMessage').textContent = 'Parece satisfeito. Um resultado melhor do que muitos relatórios.';
}

function setPage(page) {
  currentPage = page;
  $$('.page').forEach(section => section.classList.toggle('active', section.dataset.page === page));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.pageTarget === page));
  document.body.classList.toggle('proposal-mode', page === 'proposal');
  if (page === 'proposal') resetProposal();
  if (page === 'messages') nanaSay('messages');
  if (page === 'memories') nanaSay('memories');
  if (page === 'us') nanaSay('romantic');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function showProposalStep(stepId) {
  $$('.proposal-step').forEach(step => step.classList.toggle('active', step.id === stepId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProposal() {
  proposalNoAttempts = 0;
  showProposalStep(localStorage.getItem('myLoveProposalAcceptedAt') ? 'proposalAcceptedStep' : 'proposalLetterStep');
  const noButton = $('#proposalNoBtn');
  if (noButton) {
    noButton.style.left = '';
    noButton.style.top = '';
    noButton.style.right = '5%';
    noButton.style.bottom = '16px';
    noButton.style.transform = '';
  }
}

function proposalHearts(count = 42) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'proposal-heart-float';
    heart.textContent = Math.random() > .25 ? '♥' : '✦';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.bottom = `${-10 - Math.random() * 20}px`;
    heart.style.fontSize = `${14 + Math.random() * 26}px`;
    heart.style.animationDelay = `${Math.random() * .8}s`;
    heart.style.color = ['#ff79aa','#ffd0e0','#ffd77d','#d9a8ff'][Math.floor(Math.random()*4)];
    document.body.append(heart);
    setTimeout(() => heart.remove(), 3400);
  }
}

async function acceptProposal() {
  localStorage.setItem('myLoveProposalAcceptedAt', new Date().toISOString());
  proposalHearts(70);
  confetti(45);
  showProposalStep('proposalAcceptedStep');
  toast('Nova fase desbloqueada: namoro ♥', 4200);

  try {
    if (store.state.user && store.state.couple) {
      await store.sendMessage('💍 SIM! A surpresa foi aceita. Adriel e Maria desbloquearam uma nova fase da história! ♥');
      await store.addMemory({
        title: 'O nosso SIM 💍',
        content: 'O dia em que uma pergunta especial virou uma nova fase da nossa história.'
      });
      render();
    }
  } catch (error) {
    console.warn('A resposta foi salva localmente, mas não foi possível sincronizar agora:', error);
  }
}

function resetCanvas() {
  const canvas = $('#loveCanvas');
  const context = canvas.getContext('2d');
  context.fillStyle = '#fffaf1'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#ef5d91'; context.lineWidth = 3; context.setLineDash([5, 7]);
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36); context.setLineDash([]);
}

function bindDrawing() {
  const canvas = $('#loveCanvas');
  const context = canvas.getContext('2d');
  let drawing = false, last = null;
  const point = event => { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; };
  canvas.addEventListener('pointerdown', event => { drawing = true; last = point(event); canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => { if (!drawing) return; const p = point(event); context.strokeStyle = $('#drawColor').value; context.lineWidth = Number($('#drawSize').value); context.lineCap = 'round'; context.lineJoin = 'round'; context.beginPath(); context.moveTo(last.x, last.y); context.lineTo(p.x, p.y); context.stroke(); last = p; });
  ['pointerup','pointercancel','pointerleave'].forEach(name => canvas.addEventListener(name, () => { drawing = false; last = null; }));
  $('#clearCanvas').addEventListener('click', resetCanvas);
  $('#sendDrawing').addEventListener('click', async () => {
    const button = $('#sendDrawing'); button.disabled = true;
    try { await store.sendDrawing(canvas.toDataURL('image/jpeg', .82), $('#drawingCaption').value); $('#drawModal').close(); toast('Desenho enviado para o seu amor ♥'); confetti(18); nanaSay('drawing'); render(); }
    catch (error) { toast(error.message); }
    finally { button.disabled = false; }
  });
}

function bindEvents() {
  $$('[data-login-profile]').forEach(button => button.addEventListener('click', () => selectLoginProfile(button.dataset.loginProfile)));
  $('#backToProfiles').addEventListener('click', showProfilePicker);
  $('#demoMode').classList.toggle('hidden', config.demoEnabled === false);

  $('#authForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!selectedAuthProfile) return showProfilePicker();
    const profile = getLoginProfiles()[selectedAuthProfile];
    const email = (profile.email || $('#authEmail').value).trim().toLowerCase();
    const status = $('#authStatus');
    if (!email) { status.textContent = 'Informe o e-mail da Maria neste primeiro acesso.'; return; }
    status.textContent = 'Conectando…';
    $('#authSubmit').disabled = true;
    try {
      await store.signIn(email, $('#authPassword').value);
      if (selectedAuthProfile === 'maria') localStorage.setItem('my-love-is-you-maria-email', email);
      routeFromState();
    } catch (error) {
      status.textContent = error.message === 'Invalid login credentials'
        ? 'Senha incorreta ou conta ainda não criada.'
        : error.message;
    } finally {
      $('#authSubmit').disabled = false;
    }
  });

  $('#firstAccessBtn').addEventListener('click', async () => {
    if (selectedAuthProfile !== 'maria') return;
    const email = $('#authEmail').value.trim().toLowerCase();
    const password = $('#authPassword').value;
    const status = $('#authStatus');
    if (!email) { $('#authEmailLabel').classList.remove('hidden'); $('#authEmail').required = true; status.textContent = 'Digite o e-mail da Maria.'; return; }
    if (password.length < 6) { status.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    status.textContent = 'Criando o perfil da Maria…';
    $('#firstAccessBtn').disabled = true;
    try {
      const data = await store.signUp('Maria', email, password);
      localStorage.setItem('my-love-is-you-maria-email', email);
      if (data.session) {
        routeFromState();
      } else {
        status.textContent = 'Perfil criado. Confirme o e-mail e depois volte para entrar.';
      }
    } catch (error) {
      status.textContent = error.message.includes('already registered')
        ? 'Essa conta já existe. Use o botão Entrar como Maria.'
        : error.message;
    } finally {
      $('#firstAccessBtn').disabled = false;
    }
  });

  $('#demoMode').addEventListener('click', () => { store.startDemo(); routeFromState(); nanaSay('entry'); });
  $('#createCoupleBtn').addEventListener('click', async () => { try { await store.createCouple(); routeFromState(); toast(`Espaço criado. Código: ${store.state.inviteCode}`); } catch (error) { $('#onboardingStatus').textContent = error.message; } });
  $('#joinCoupleBtn').addEventListener('click', async () => { try { await store.joinCouple($('#joinCode').value); routeFromState(); toast('Corações conectados.'); confetti(30); } catch (error) { $('#onboardingStatus').textContent = error.message; } });
  $('#onboardingLogout').addEventListener('click', () => store.signOut());
  $$('.nav-item').forEach(button => button.addEventListener('click', () => setPage(button.dataset.pageTarget)));
  $('#proposalBackBtn').addEventListener('click', () => setPage('home'));
  $('#proposalContinueBtn').addEventListener('click', () => { showProposalStep('proposalNanaStep'); proposalHearts(16); });
  $('#proposalReceiveBtn').addEventListener('click', () => { showProposalStep('proposalQuestionStep'); proposalHearts(24); });
  $('#proposalYesBtn').addEventListener('click', acceptProposal);
  $('#proposalFinishBtn').addEventListener('click', () => setPage('home'));
  $('#proposalNoBtn').addEventListener('click', event => {
    proposalNoAttempts += 1;
    const button = event.currentTarget;
    const area = button.closest('.proposal-choice-area');
    const maxX = Math.max(0, area.clientWidth - button.offsetWidth - 8);
    const maxY = Math.max(0, area.clientHeight - button.offsetHeight - 8);
    button.style.right = 'auto';
    button.style.bottom = 'auto';
    button.style.left = `${Math.random() * maxX}px`;
    button.style.top = `${Math.random() * maxY}px`;
    button.style.transform = `rotate(${Math.random() * 14 - 7}deg)`;
    if (proposalNoAttempts < 3) toast(['Tem certeza? O Nana já trouxe a caixinha.','Essa opção parece estar com problemas logísticos.'][proposalNoAttempts - 1], 2200);
    else toast('Você pode pensar no seu tempo. O SIM vai continuar aqui, sem pressão. ♥', 3600);
  });
  $('#proposalMusicBtn').addEventListener('click', () => {
    const wrap = $('#proposalYoutubeWrap');
    if (!wrap.querySelector('iframe')) {
      const frame = document.createElement('iframe');
      frame.src = proposalTrackUrl;
      frame.title = 'Young and Beautiful — Lana Del Rey';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      wrap.append(frame);
    }
    wrap.hidden = false;
    $('#proposalMusicBtn').textContent = '♫';
    toast('Música aberta no player oficial.');
  });
  $('#loveBtn').addEventListener('click', async () => { await store.giveLove(); confetti(12); toast('+5 XP de carinho ♥'); nanaSay('romantic'); render(); });
  $('#heartScore').addEventListener('click', () => { toast(`Afinidade do casal: ${store.state.progress.affinity}%`); nanaSay('xp'); });
  $('#mapCard').addEventListener('click', event => { if (!event.target.closest('button')) nanaSay('map', {}, true); });
  $('#drawBtn').addEventListener('click', () => { resetCanvas(); $('#drawingCaption').value = ''; $('#drawModal').showModal(); nanaSay('drawing'); });
  $('#petBtn').addEventListener('click', () => { renderPet(); $('#petModal').showModal(); nanaSay('pet'); });
  $('#chestBtn').addEventListener('click', () => setPage('memories'));
  $('#nanaBtn').addEventListener('click', () => { $('#nanaModalText').textContent = lastNana.text; $('#nanaModalSprite').src = `assets/nana/${lastNana.sprite}.webp`; $('#nanaModal').showModal(); });
  $$('.nana-topics button').forEach(button => button.addEventListener('click', () => nanaSay(button.dataset.nanaTopic, { days: daysUntil(store.state.settings.nextMeeting) }, true)));
  $('#calendarBtn').addEventListener('click', () => { render(); $('#calendarModal').showModal(); nanaSay('countdown', { days: daysUntil(store.state.settings.nextMeeting) }); });
  $('#nextDateBtn').addEventListener('click', event => { event.stopPropagation(); $('#calendarModal').showModal(); nanaSay('countdown', { days: daysUntil(store.state.settings.nextMeeting) }); });
  $('#saveMeetingDate').addEventListener('click', async () => { await store.updateSettings({ nextMeeting: $('#calendarDateInput').value }); $('#calendarModal').close(); toast('Próximo encontro atualizado.'); render(); });
  $('#meetingDateInput').addEventListener('change', async event => { await store.updateSettings({ nextMeeting: event.target.value }); render(); });
  $('#petNameInput').addEventListener('change', async event => { await store.updateSettings({ petName: event.target.value.trim() || 'Mochi' }); render(); });
  $('#themeSelect').addEventListener('change', async event => { await store.updateSettings({ theme: event.target.value }); render(); });
  $('#feedPet').addEventListener('click', () => petAction('feed'));
  $('#petPet').addEventListener('click', () => petAction('love'));
  $('#playPet').addEventListener('click', () => petAction('play'));
  $('#messageForm').addEventListener('submit', async event => { event.preventDefault(); const input = $('#messageInput'); const content = input.value; if (!content.trim()) return; input.value = ''; try { await store.sendMessage(content); toast('Mensagem enviada.'); nanaSay('messages'); render(); } catch (error) { input.value = content; toast(error.message); } });
  $('#newMemoryBtn').addEventListener('click', () => { $('#memoryTitle').value = ''; $('#memoryContent').value = ''; $('#memoryFile').value = ''; $('#memoryModal').showModal(); });
  $('#saveMemoryBtn').addEventListener('click', async () => { const title = $('#memoryTitle').value.trim(); if (!title) return toast('Dê um título à memória.'); try { await store.addMemory({ title, content: $('#memoryContent').value.trim(), file: $('#memoryFile').files[0] }); $('#memoryModal').close(); toast('Memória guardada no baú.'); nanaSay('memories'); render(); } catch (error) { toast(error.message); } });
  $('#openCapsulesBtn').addEventListener('click', () => { renderCapsules(); $('#capsuleModal').showModal(); });
  $('#saveCapsuleBtn').addEventListener('click', async () => { const content = $('#capsuleContent').value.trim(), date = $('#capsuleDate').value; if (!content || !date) return toast('Escreva a mensagem e escolha a data.'); await store.addCapsule(content, date); $('#capsuleContent').value = ''; renderCapsules(); toast('Cápsula selada.'); });
  $('#copyInviteBtn').addEventListener('click', async () => { const code = store.state.inviteCode; await navigator.clipboard.writeText(`Entre no My love is You com o código ${code}`); toast('Convite copiado.'); });
  $('#notificationBtn').addEventListener('click', async () => { if (!('Notification' in window)) return toast('Este navegador não suporta notificações.'); const permission = await Notification.requestPermission(); toast(permission === 'granted' ? 'Notificações ativadas.' : 'Permissão não concedida.'); });
  $('#giftBtn').addEventListener('click', () => setPage('proposal'));
  $('#logoutBtn').addEventListener('click', async () => { await store.signOut(); routeFromState(); });
}

async function petAction(type) {
  try { const result = await store.petAction(type); toast(result.leveled ? `Nível ${store.state.pet.level}! O pequeno está evoluindo adequadamente.` : 'Pet cuidado. Responsabilidade básica concluída.'); nanaSay('pet'); if (result.leveled) confetti(20); render(); } catch (error) { toast(error.message); }
}

store.subscribe((_state, event) => {
  if (['signedOut', 'needsOnboarding', 'remoteReady', 'demoStarted'].includes(event)) routeFromState();
  if (!$('#appView').classList.contains('hidden')) render();
});

bindEvents();
bindDrawing();
store.init().then(() => { routeFromState(); setTimeout(() => nanaSay(contextualEntry().topic || 'entry'), 500); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

// PWA Install & Update Logic
let deferredInstallPrompt = null;
const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                    window.matchMedia('(display-mode: fullscreen)').matches || 
                    window.navigator.standalone === true;

if (isInstalled) {
  document.body.classList.add('is-installed');
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallPromotion();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hideInstallPromotion();
  localStorage.setItem('my-love-is-you-installed', 'true');
});

function isIos() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function showInstallPromotion() {
  if (isInstalled || sessionStorage.getItem('pwa-dismissed')) return;
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('visible'), 10);
  }
}

function hideInstallPromotion() {
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnShowInstall = document.getElementById('btn-show-install-pwa');
  if (btnShowInstall && !isInstalled) {
    btnShowInstall.style.display = 'block';
    btnShowInstall.addEventListener('click', showInstallPromotion);
  }
  const btnInstall = document.getElementById('btn-install-pwa');
  const btnCancel = document.getElementById('btn-cancel-pwa');
  const modalClose = document.querySelector('#pwa-install-modal .close-modal');
  
  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          deferredInstallPrompt = null;
        }
      } else if (isIos()) {
        const title = document.getElementById('pwa-install-title');
        const desc = document.getElementById('pwa-install-desc');
        if (title) title.innerText = 'Instale no seu iPhone';
        if (desc) desc.innerHTML = '1. Toque no bot�o Compartilhar.<br>2. Escolha "Adicionar � Tela de In�cio".<br>3. Confirme em "Adicionar".';
      }
      hideInstallPromotion();
    });
  }
  
  const cancelAction = () => {
    sessionStorage.setItem('pwa-dismissed', 'true');
    hideInstallPromotion();
  };
  
  if (btnCancel) btnCancel.addEventListener('click', cancelAction);
  if (modalClose) modalClose.addEventListener('click', cancelAction);
  
  if (isIos() && !isInstalled && !sessionStorage.getItem('pwa-dismissed')) {
      showInstallPromotion();
  }
});

// Service Worker Registration and Update Notification
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          if (confirm('Uma nova vers�o est� dispon�vel. Atualizar agora?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });
  });
}

