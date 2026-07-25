// Configuração pública do frontend. Nunca inclua service_role_key aqui.
window.__MYLOVE_CONFIG__ = {
  supabaseUrl: 'https://nrydxyufrgtkffxshufg.supabase.co',
  supabaseAnonKey: 'sb_publishable_jj-g23jHhn0cRkJNU61egw_m3Oj1pTI',
  demoEnabled: true,
  defaultInviteCode: 'LOVE-1517',
  profiles: {
    adriel: { name: 'Adriel', email: 'schimitadriel100@gmail.com', avatar: 'assets/avatar-adriel.webp', level: 24 },
    // Preencha quando a conta da Maria for criada. Até lá, o app pede o e-mail somente no primeiro acesso.
    maria: { name: 'Maria', email: '', avatar: 'assets/avatar-maria.webp', level: 25 }
  }
};

// my-love-animations-loader
(() => {
  if (!document.querySelector('link[data-my-love-animations]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/animations.css?v=1';
    style.dataset.myLoveAnimations = 'true';
    document.head.appendChild(style);
  }

  if (!document.querySelector('script[data-my-love-animations]')) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/src/animations.js?v=1';
    script.async = false;
    script.dataset.myLoveAnimations = 'true';
    document.head.appendChild(script);
  }
})();
// my-love-theme-hotfix-loader
(() => {
  if (!document.querySelector('link[data-theme-hotfix]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/theme-hotfix.css?v=2';
    style.dataset.themeHotfix = 'true';
    document.head.appendChild(style);
  }

  if (!document.querySelector('script[data-theme-hotfix]')) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/src/theme-hotfix.js?v=2';
    script.dataset.themeHotfix = 'true';
    document.head.appendChild(script);
  }
})();
