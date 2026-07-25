(() => {
  'use strict';

  const VALID_THEMES = new Set([
    'sakura',
    'cyber',
    'cream',
    'hunter',
    'bleach',
    'fullmetal',
    'one-piece',
    'blue-lock'
  ]);

  let preferenceChannel = null;
  let activePreferenceUserId = null;
  let applyingPreference = false;

  function validTheme(theme) {
    return VALID_THEMES.has(theme) ? theme : 'sakura';
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');

    if (!toast) {
      console.info(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(
      () => toast.classList.remove('show'),
      2400
    );
  }

  function decorateThemeField() {
    const select = document.querySelector('#themeSelect');
    if (!select || select.dataset.personalThemeReady === 'true') return;

    select.dataset.personalThemeReady = 'true';
    select.setAttribute(
      'aria-description',
      'Esta escolha altera somente o seu perfil.'
    );

    const note = document.createElement('small');
    note.className = 'personal-theme-note';
    note.textContent = 'Aparência individual — não muda o tema do seu amor.';
    select.insertAdjacentElement('afterend', note);
  }

  function applyPersonalTheme(store, theme, persist = true) {
    const selectedTheme = validTheme(theme);

    store.state.settings = {
      ...store.state.settings,
      theme: selectedTheme
    };

    if (persist) {
      store.persistLocal();
    }
    else {
      window.MyLoveThemes?.apply(selectedTheme);
      const select = document.querySelector('#themeSelect');
      if (select) select.value = selectedTheme;
    }

    return selectedTheme;
  }

  async function getOrCreatePreference(store) {
    if (!store.supabase || !store.state.user) {
      return validTheme(store.state.settings?.theme);
    }

    const userId = store.state.user.id;

    const { data, error } = await store.supabase
      .from('profile_preferences')
      .select('theme,sound_enabled,reduced_motion')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data?.theme) {
      return validTheme(data.theme);
    }

    const fallbackTheme = validTheme(store.state.settings?.theme);

    const { error: insertError } = await store.supabase
      .from('profile_preferences')
      .upsert({
        user_id: userId,
        theme: fallbackTheme
      }, {
        onConflict: 'user_id'
      });

    if (insertError) throw insertError;

    return fallbackTheme;
  }

  async function reloadPersonalTheme(store, options = {}) {
    if (
      applyingPreference
      || !store.supabase
      || !store.state.user
    ) {
      return;
    }

    applyingPreference = true;

    try {
      const theme = await getOrCreatePreference(store);
      const changed = store.state.settings?.theme !== theme;

      applyPersonalTheme(store, theme, changed);

      if (!changed) {
        window.MyLoveThemes?.apply(theme);
        const select = document.querySelector('#themeSelect');
        if (select) select.value = theme;
      }

      if (options.notify) {
        showToast(`Seu tema foi atualizado para ${theme}.`);
      }
    }
    catch (error) {
      console.error('Não foi possível carregar o tema individual:', error);
    }
    finally {
      applyingPreference = false;
    }
  }

  function setupPreferenceRealtime(store) {
    const userId = store.state.user?.id;

    if (!store.supabase || !userId) {
      if (preferenceChannel) {
        store.supabase?.removeChannel(preferenceChannel);
        preferenceChannel = null;
      }

      activePreferenceUserId = null;
      return;
    }

    if (activePreferenceUserId === userId && preferenceChannel) {
      return;
    }

    if (preferenceChannel) {
      store.supabase.removeChannel(preferenceChannel);
    }

    activePreferenceUserId = userId;

    preferenceChannel = store.supabase
      .channel(`profile-preferences:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_preferences',
          filter: `user_id=eq.${userId}`
        },
        () => reloadPersonalTheme(store)
      )
      .subscribe();
  }

  function patchStore(store) {
    if (store.updateSettings.__personalThemePatched === true) return;

    const originalLoadRemoteData = store.loadRemoteData.bind(store);
    const originalSignOut = store.signOut.bind(store);

    store.loadRemoteData = async function (...args) {
      const result = await originalLoadRemoteData(...args);

      if (this.supabase && this.state.user) {
        await reloadPersonalTheme(this);
      }

      return result;
    };

    const updateSettings = async function (patch = {}) {
      const previousSettings = { ...this.state.settings };
      const previousPetName = this.state.pet.name;

      const hasTheme = Object.prototype.hasOwnProperty.call(patch, 'theme');
      const hasMeeting = Object.prototype.hasOwnProperty.call(
        patch,
        'nextMeeting'
      );
      const hasDistance = Object.prototype.hasOwnProperty.call(
        patch,
        'distanceKm'
      );
      const hasPetName = Object.prototype.hasOwnProperty.call(
        patch,
        'petName'
      );

      const nextPatch = { ...patch };

      if (hasTheme) {
        nextPatch.theme = validTheme(nextPatch.theme);
      }

      this.state.settings = {
        ...this.state.settings,
        ...nextPatch
      };

      if (hasPetName) {
        this.state.pet.name = patch.petName;
        delete this.state.settings.petName;
      }

      try {
        if (this.supabase && this.state.user) {
          const operations = [];

          if (hasTheme) {
            operations.push(
              this.supabase
                .from('profile_preferences')
                .upsert({
                  user_id: this.state.user.id,
                  theme: this.state.settings.theme
                }, {
                  onConflict: 'user_id'
                })
            );
          }

          if (this.state.couple && (hasMeeting || hasDistance)) {
            const sharedSettings = {
              couple_id: this.state.couple.id
            };

            if (hasMeeting) {
              sharedSettings.next_meeting =
                this.state.settings.nextMeeting || null;
            }

            if (hasDistance) {
              sharedSettings.distance_km =
                Number(this.state.settings.distanceKm) || 125;
            }

            operations.push(
              this.supabase
                .from('couple_settings')
                .upsert(sharedSettings, {
                  onConflict: 'couple_id'
                })
            );
          }

          if (this.state.couple && hasPetName) {
            operations.push(
              this.supabase
                .from('pet_states')
                .update({ name: this.state.pet.name })
                .eq('couple_id', this.state.couple.id)
            );
          }

          const results = await Promise.all(operations);
          const failed = results.find(result => result.error);

          if (failed?.error) throw failed.error;
        }

        this.persistLocal();

        if (hasTheme) {
          window.MyLoveThemes?.apply(this.state.settings.theme);
          showToast('Tema salvo somente no seu perfil.');
        }
      }
      catch (error) {
        this.state.settings = previousSettings;
        this.state.pet.name = previousPetName;
        this.persistLocal();
        throw error;
      }
    };

    updateSettings.__personalThemePatched = true;
    store.updateSettings = updateSettings;

    store.signOut = async function (...args) {
      if (preferenceChannel && this.supabase) {
        await this.supabase.removeChannel(preferenceChannel);
      }

      preferenceChannel = null;
      activePreferenceUserId = null;

      return originalSignOut(...args);
    };

    store.subscribe((_state, event) => {
      decorateThemeField();
      setupPreferenceRealtime(store);

      if (
        ['ready', 'remoteReady', 'realtime', 'demoStarted'].includes(event)
      ) {
        reloadPersonalTheme(store);
      }
    });
  }

  function init() {
    const store = window.__MYLOVE_STORE__;

    if (!store) {
      window.setTimeout(init, 40);
      return;
    }

    decorateThemeField();
    patchStore(store);
    setupPreferenceRealtime(store);

    if (store.state.user) {
      reloadPersonalTheme(store);
    }

    window.MyLoveProfileTheme = {
      reload() {
        return reloadPersonalTheme(store, { notify: true });
      },
      current() {
        return validTheme(store.state.settings?.theme);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
  else {
    init();
  }
})();
