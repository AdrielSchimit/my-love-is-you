const LOCAL_KEY = 'my-love-is-you-v2-state';
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const randomCode = () => `LOVE-${Math.floor(1000 + Math.random() * 9000)}`;
const uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultMissions = [
  { id: 'talk', title: 'Conversar por 30 minutos', xp: 20 },
  { id: 'compliment', title: 'Enviar um elogio sincero', xp: 15 },
  { id: 'watch', title: 'Assistir algo juntos', xp: 25 }
];
const defaultRewards = [
  { id: 'movie', title: 'Escolher o próximo filme', cost: 80 },
  { id: 'milkshake', title: 'Vale milkshake de morango', cost: 120 },
  { id: 'date', title: 'Planejar o próximo encontro', cost: 180 },
  { id: 'letter', title: 'Carta secreta desbloqueada', cost: 250 }
];

function baseState() {
  return {
    version: 2,
    mode: 'local',
    user: null,
    profile: null,
    couple: null,
    partner: null,
    progress: { xp: 8480, affinity: 84, coins: 140, coupleLevel: 8, streak: 0, lastCompletedDay: null },
    pet: { name: 'Mochi', level: 15, xp: 72, hunger: 78, love: 84, energy: 75, lastDecayAt: now() },
    missions: defaultMissions,
    completions: {},
    moods: {},
    messages: [],
    memories: [
      { id: uuid(), title: 'O começo', content: 'A gente se conheceu e, em três dias, já começou a falar em casamento.', createdAt: now(), authorName: 'Adriel' },
      { id: uuid(), title: 'Coisas que a Maria ama', content: 'Crianças, gatos e milkshake de morango.', createdAt: now(), authorName: 'Maria' },
      { id: uuid(), title: 'Nosso mapa', content: 'Barrinha e Franca são aproximadamente 125 km no mapa.', createdAt: now(), authorName: 'Adriel' }
    ],
    drawings: [],
    capsules: [],
    rewards: defaultRewards,
    redemptions: [],
    settings: { nextMeeting: '', theme: 'sakura', distanceKm: 125 },
    inviteCode: 'LOVE-8421',
    updatedAt: now()
  };
}

function merge(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') base[key] = merge(base[key], value);
    else base[key] = value;
  }
  return base;
}

export class LoveStore {
  constructor(config = {}) {
    this.config = config;
    this.state = this.loadLocal();
    this.supabase = null;
    this.remoteReady = false;
    this.listeners = new Set();
    this.channel = null;
    this.pendingReload = null;
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(event = 'change', detail = {}) { for (const listener of this.listeners) listener(this.state, event, detail); }
  loadLocal() { try { return merge(baseState(), JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')); } catch { return baseState(); } }
  persistLocal() { this.state.updatedAt = now(); localStorage.setItem(LOCAL_KEY, JSON.stringify(this.state)); this.emit(); }

  async init() {
    const { supabaseUrl, supabaseAnonKey } = this.config;
    if (supabaseUrl && supabaseAnonKey) {
      await loadSupabaseClient();
      if (!window.supabase?.createClient) throw new Error('Não foi possível carregar o cliente Supabase.');
      this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await this.supabase.auth.getSession();
      if (data.session?.user) await this.bootstrapRemote(data.session.user);
      this.supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) await this.bootstrapRemote(session.user);
        else { this.remoteReady = false; this.state.user = null; this.emit('signedOut'); }
      });
    }
    this.applyPetDecay();
    this.emit('ready');
    return this.state;
  }

  isConfigured() { return !!this.supabase; }
  isAuthenticated() { return !!this.state.user; }
  hasCouple() { return !!this.state.couple; }

  async signUp(name, email, password) {
    if (!this.supabase) throw new Error('Supabase ainda não configurado. Use o modo demonstração por enquanto.');
    const { data, error } = await this.supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    if (data.user && data.session) await this.bootstrapRemote(data.user);
    return data;
  }

  async signIn(email, password) {
    if (!this.supabase) throw new Error('Supabase ainda não configurado.');
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.bootstrapRemote(data.user);
    return data;
  }

  async signOut() {
    if (this.supabase) await this.supabase.auth.signOut();
    if (this.channel) await this.supabase?.removeChannel(this.channel);
    this.state = baseState();
    localStorage.removeItem(LOCAL_KEY);
    this.remoteReady = false;
    this.emit('signedOut');
  }

  startDemo(name = 'Adriel') {
    this.state.mode = 'local';
    this.state.user = { id: 'demo-adriel', email: 'demo@local.app' };
    this.state.profile = { id: 'demo-adriel', name, avatarKey: 'adriel', level: 24 };
    this.state.partner = { id: 'demo-maria', name: 'Maria', avatarKey: 'maria', level: 25 };
    this.state.couple = { id: 'demo-couple', name: 'Adriel & Maria', inviteCode: this.state.inviteCode };
    this.persistLocal();
    this.emit('demoStarted');
  }

  async bootstrapRemote(user) {
    this.state.mode = 'remote';
    this.state.user = user;
    const { data: profile, error: profileError } = await this.supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    this.state.profile = profile ? { id: profile.id, name: profile.display_name, avatarKey: profile.avatar_key, level: profile.level } : { id: user.id, name: user.user_metadata?.name || user.email?.split('@')[0], level: 1 };
    const { data: membership, error: memberError } = await this.supabase.from('couple_members').select('couple_id, role, couples(*)').eq('user_id', user.id).maybeSingle();
    if (memberError) throw memberError;
    if (!membership) {
      this.state.couple = null; this.state.partner = null; this.remoteReady = true; this.emit('needsOnboarding'); return;
    }
    this.state.couple = { id: membership.couple_id, name: membership.couples.name, inviteCode: membership.couples.invite_code };
    this.state.inviteCode = membership.couples.invite_code;
    await this.loadRemoteData();
    this.remoteReady = true;
    this.setupRealtime();
    this.emit('remoteReady');
  }

  async createCouple() {
    if (!this.supabase) { this.startDemo(); return this.state.couple; }
    const code = randomCode();
    const { data, error } = await this.supabase.rpc('create_couple', { p_name: 'Adriel & Maria', p_invite_code: code });
    if (error) throw error;
    await this.bootstrapRemote(this.state.user);
    return data;
  }

  async joinCouple(code) {
    if (!this.supabase) { this.startDemo('Maria'); return this.state.couple; }
    const { data, error } = await this.supabase.rpc('join_couple', { p_invite_code: code.trim().toUpperCase() });
    if (error) throw error;
    await this.bootstrapRemote(this.state.user);
    return data;
  }

  async loadRemoteData() {
    const coupleId = this.state.couple.id;
    const [members, progress, pet, missions, completions, moods, messages, memories, drawings, capsules, rewards, redemptions, settings] = await Promise.all([
      this.supabase.from('couple_members').select('user_id, profiles(id,display_name,avatar_key,level)').eq('couple_id', coupleId),
      this.supabase.from('couple_progress').select('*').eq('couple_id', coupleId).maybeSingle(),
      this.supabase.from('pet_states').select('*').eq('couple_id', coupleId).maybeSingle(),
      this.supabase.from('missions').select('*').eq('active', true).order('sort_order'),
      this.supabase.from('mission_completions').select('*').eq('couple_id', coupleId).eq('completion_date', today()),
      this.supabase.from('moods').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(10),
      this.supabase.from('messages').select('*').eq('couple_id', coupleId).order('created_at', { ascending: true }).limit(150),
      this.supabase.from('memories').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(100),
      this.supabase.from('drawings').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(50),
      this.supabase.from('time_capsules').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
      this.supabase.from('rewards').select('*').eq('active', true).order('cost'),
      this.supabase.from('reward_redemptions').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
      this.supabase.from('couple_settings').select('*').eq('couple_id', coupleId).maybeSingle()
    ]);
    const error = [members,progress,pet,missions,completions,moods,messages,memories,drawings,capsules,rewards,redemptions,settings].find(r => r.error)?.error;
    if (error) throw error;
    const partner = members.data?.find(m => m.user_id !== this.state.user.id)?.profiles;
    if (partner) this.state.partner = { id: partner.id, name: partner.display_name, avatarKey: partner.avatar_key, level: partner.level };
    if (progress.data) this.state.progress = { xp: progress.data.xp, affinity: progress.data.affinity, coins: progress.data.coins, coupleLevel: progress.data.couple_level, streak: progress.data.streak, lastCompletedDay: progress.data.last_completed_day };
    if (pet.data) this.state.pet = { name: pet.data.name, level: pet.data.level, xp: pet.data.xp, hunger: pet.data.hunger, love: pet.data.love, energy: pet.data.energy, lastDecayAt: pet.data.last_decay_at };
    this.state.missions = (missions.data || []).map(m => ({ id: m.key, dbId: m.id, title: m.title, xp: m.xp_reward }));
    this.state.completions = Object.fromEntries((completions.data || []).map(c => [c.mission_id, c]));
    this.state.moods = Object.fromEntries((moods.data || []).map(m => [m.user_id, m]));
    this.state.messages = messages.data || [];
    this.state.memories = memories.data || [];
    this.state.drawings = drawings.data || [];
    this.state.capsules = capsules.data || [];
    this.state.rewards = rewards.data || defaultRewards;
    this.state.redemptions = redemptions.data || [];
    if (settings.data) this.state.settings = { nextMeeting: settings.data.next_meeting || '', theme: settings.data.theme || 'sakura', distanceKm: settings.data.distance_km || 125 };
    this.persistLocal();
  }

  setupRealtime() {
    if (!this.supabase || !this.state.couple) return;
    if (this.channel) this.supabase.removeChannel(this.channel);
    const coupleId = this.state.couple.id;
    const tables = ['messages','moods','mission_completions','couple_progress','pet_states','memories','drawings','time_capsules','couple_settings','reward_redemptions'];
    let channel = this.supabase.channel(`couple:${coupleId}`);
    for (const table of tables) channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `couple_id=eq.${coupleId}` }, () => this.scheduleRemoteReload());
    this.channel = channel.subscribe();
  }

  scheduleRemoteReload() {
    clearTimeout(this.pendingReload);
    this.pendingReload = setTimeout(async () => { await this.loadRemoteData(); this.emit('realtime'); }, 250);
  }

  applyPetDecay() {
    const last = new Date(this.state.pet.lastDecayAt || now());
    const hours = Math.floor((Date.now() - last.getTime()) / 3600000);
    if (hours <= 0) return;
    this.state.pet.hunger = Math.max(0, this.state.pet.hunger - Math.min(45, hours * 2));
    this.state.pet.energy = Math.max(0, this.state.pet.energy - Math.min(35, hours));
    this.state.pet.love = Math.max(0, this.state.pet.love - Math.min(20, Math.floor(hours / 3)));
    this.state.pet.lastDecayAt = now();
    this.persistLocal();
  }

  getTodayCompletion(mission) {
    const key = mission.dbId || mission.id;
    return !!this.state.completions[key];
  }

  async toggleMission(mission) {
    const key = mission.dbId || mission.id;
    const completed = this.getTodayCompletion(mission);
    if (this.supabase && this.state.couple) {
      if (completed) await this.supabase.from('mission_completions').delete().eq('id', this.state.completions[key].id);
      else {
        const { error } = await this.supabase.from('mission_completions').insert({ couple_id: this.state.couple.id, mission_id: mission.dbId, completed_by: this.state.user.id, completion_date: today(), xp_earned: mission.xp });
        if (error) throw error;
      }
      await this.loadRemoteData();
    } else {
      if (completed) {
        delete this.state.completions[key];
        this.state.progress.xp = Math.max(0, this.state.progress.xp - mission.xp);
      } else {
        this.state.completions[key] = { id: uuid(), completed_by: this.state.user?.id, completion_date: today() };
        this.state.progress.xp += mission.xp;
        this.state.progress.affinity = Math.min(100, this.state.progress.affinity + 1);
        this.state.progress.coins += Math.ceil(mission.xp / 3);
      }
      this.calculateDailyStreak();
      this.persistLocal();
    }
    const allDone = this.state.missions.every(m => this.getTodayCompletion(m));
    return { completed: !completed, allDone };
  }

  calculateDailyStreak() {
    if (!this.state.missions.every(m => this.getTodayCompletion(m))) return;
    if (this.state.progress.lastCompletedDay === today()) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    this.state.progress.streak = this.state.progress.lastCompletedDay === yesterday ? this.state.progress.streak + 1 : 1;
    this.state.progress.lastCompletedDay = today();
    this.state.progress.xp += 40;
    this.state.progress.coins += 20;
  }

  async setMood(key, emoji, label) {
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('moods').insert({ couple_id: this.state.couple.id, user_id: this.state.user.id, mood_key: key, emoji, label });
      if (error) throw error;
      await this.loadRemoteData();
    } else {
      this.state.moods[this.state.user.id] = { user_id: this.state.user.id, mood_key: key, emoji, label, created_at: now() };
      this.persistLocal();
    }
  }

  async sendMessage(content) {
    const clean = content.trim(); if (!clean) return;
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('messages').insert({ couple_id: this.state.couple.id, sender_id: this.state.user.id, content: clean });
      if (error) throw error;
      await this.loadRemoteData();
    } else {
      this.state.messages.push({ id: uuid(), sender_id: this.state.user.id, content: clean, created_at: now() });
      this.state.progress.xp += 3; this.persistLocal();
    }
  }

  async sendDrawing(dataUrl, caption = '') {
    if (this.supabase && this.state.couple) {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${this.state.couple.id}/${this.state.user.id}/${Date.now()}.jpg`;
      const upload = await this.supabase.storage.from('drawings').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (upload.error) throw upload.error;
      const { data: signed } = await this.supabase.storage.from('drawings').createSignedUrl(path, 60 * 60 * 24 * 7);
      const { error } = await this.supabase.from('drawings').insert({ couple_id: this.state.couple.id, author_id: this.state.user.id, storage_path: path, preview_url: signed?.signedUrl, caption });
      if (error) throw error;
      await this.loadRemoteData();
    } else {
      this.state.drawings.unshift({ id: uuid(), author_id: this.state.user.id, preview_url: dataUrl, caption, created_at: now() });
      this.state.progress.xp += 15; this.persistLocal();
    }
  }

  async petAction(type) {
    const pet = { ...this.state.pet };
    if (type === 'feed') pet.hunger = Math.min(100, pet.hunger + 22);
    if (type === 'love') pet.love = Math.min(100, pet.love + 17);
    if (type === 'play') { pet.energy = Math.max(0, pet.energy - 10); pet.love = Math.min(100, pet.love + 10); }
    pet.xp += 8;
    let leveled = false;
    if (pet.xp >= 100) { pet.xp -= 100; pet.level += 1; leveled = true; }
    pet.lastDecayAt = now(); this.state.pet = pet; this.state.progress.xp += 5;
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('pet_states').upsert({ couple_id: this.state.couple.id, name: pet.name, level: pet.level, xp: pet.xp, hunger: pet.hunger, love: pet.love, energy: pet.energy, last_decay_at: pet.lastDecayAt });
      if (error) throw error;
    }
    this.persistLocal(); return { leveled };
  }

  async addMemory({ title, content, file }) {
    let imageUrl = null, storagePath = null;
    if (this.supabase && this.state.couple && file) {
      storagePath = `${this.state.couple.id}/${this.state.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
      const upload = await this.supabase.storage.from('couple-media').upload(storagePath, file, { upsert: false });
      if (upload.error) throw upload.error;
      const { data } = await this.supabase.storage.from('couple-media').createSignedUrl(storagePath, 60 * 60 * 24 * 30);
      imageUrl = data?.signedUrl || null;
    } else if (file) imageUrl = await fileToDataUrl(file);
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('memories').insert({ couple_id: this.state.couple.id, author_id: this.state.user.id, title, content, storage_path: storagePath, preview_url: imageUrl });
      if (error) throw error;
      await this.loadRemoteData();
    } else {
      this.state.memories.unshift({ id: uuid(), author_id: this.state.user.id, title, content, preview_url: imageUrl, created_at: now(), authorName: this.state.profile.name });
      this.state.progress.xp += 12; this.persistLocal();
    }
  }

  async addCapsule(content, openAt) {
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('time_capsules').insert({ couple_id: this.state.couple.id, author_id: this.state.user.id, content, open_at: openAt });
      if (error) throw error;
      await this.loadRemoteData();
    } else {
      this.state.capsules.unshift({ id: uuid(), author_id: this.state.user.id, content, open_at: openAt, created_at: now() });
      this.persistLocal();
    }
  }

  async updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch };
    if (patch.petName) { this.state.pet.name = patch.petName; delete this.state.settings.petName; }
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('couple_settings').upsert({ couple_id: this.state.couple.id, next_meeting: this.state.settings.nextMeeting || null, theme: this.state.settings.theme, distance_km: this.state.settings.distanceKm });
      if (error) throw error;
      await this.supabase.from('pet_states').update({ name: this.state.pet.name }).eq('couple_id', this.state.couple.id);
    }
    this.persistLocal();
  }

  async redeemReward(reward) {
    if (this.state.progress.coins < reward.cost) throw new Error('Moedas insuficientes. Consistência primeiro, recompensa depois.');
    this.state.progress.coins -= reward.cost;
    if (this.supabase && this.state.couple) {
      const { error } = await this.supabase.from('reward_redemptions').insert({ couple_id: this.state.couple.id, reward_id: reward.id, redeemed_by: this.state.user.id, cost: reward.cost });
      if (error) throw error;
    } else this.state.redemptions.unshift({ id: uuid(), reward_id: reward.id, created_at: now() });
    this.persistLocal();
  }

  async giveLove() { this.state.progress.affinity = Math.min(100, this.state.progress.affinity + 1); this.state.progress.xp += 5; this.persistLocal(); }
}

function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }


function loadSupabaseClient() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    const timer = setTimeout(() => reject(new Error('Tempo esgotado ao carregar Supabase.')), 12000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('Falha ao carregar Supabase.')); };
    document.head.appendChild(script);
  });
}
