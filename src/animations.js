const NANA_ROOT = '/assets/nana/';
const NANA_SPRITES = {
  neutral: 'neutral.webp',
  blink: 'sleepy.webp',
  smile: 'smile.webp',
  talking: 'talking.webp',
  surprised: 'surprised.webp',
  thinking: 'thinking.webp',
  pointing: 'pointing.webp',
  satisfied: 'satisfied.webp',
  advice: 'advice.webp',
  wink: 'wink.webp',
  romantic: 'kiss.webp'
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const actorState = new WeakMap();
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function spriteNameFromUrl(src = '') {
  const file = src.split('/').pop()?.split('?')[0] || 'neutral.webp';
  return Object.entries(NANA_SPRITES).find(([, value]) => value === file)?.[0] || file.replace('.webp', '');
}

function spriteUrl(name) {
  return `${NANA_ROOT}${NANA_SPRITES[name] || NANA_SPRITES.neutral}`;
}

function stateFor(element) {
  if (!element) return null;
  if (!actorState.has(element)) {
    actorState.set(element, {
      base: spriteNameFromUrl(element.getAttribute('src') || ''),
      locked: false,
      timer: null,
      interval: null
    });
  }
  return actorState.get(element);
}

function internalSource(element, name) {
  const state = stateFor(element);
  if (!state) return;
  state.locked = true;
  element.src = spriteUrl(name);
  window.setTimeout(() => { state.locked = false; }, 0);
}

function clearActorTimers(element) {
  const state = stateFor(element);
  if (!state) return;
  window.clearTimeout(state.timer);
  window.clearInterval(state.interval);
  state.timer = null;
  state.interval = null;
}

function restoreBase(element) {
  const state = stateFor(element);
  if (!state) return;
  internalSource(element, state.base || 'neutral');
}

function registerActor(element) {
  if (!element || element.dataset.animationRegistered === 'true') return;
  element.dataset.animationRegistered = 'true';
  const state = stateFor(element);

  new MutationObserver(() => {
    if (!state.locked) state.base = spriteNameFromUrl(element.getAttribute('src') || '');
  }).observe(element, { attributes: true, attributeFilter: ['src'] });

  element.addEventListener('error', () => {
    if (!element.src.endsWith('/assets/nana/neutral.webp')) internalSource(element, 'neutral');
  });
}

function playPose(element, name, duration = 900, className = 'is-reacting') {
  if (!element) return;
  registerActor(element);
  clearActorTimers(element);
  const state = stateFor(element);
  const host = element.closest('.nana-widget, .nana-modal-card') || element;

  host.classList.remove('is-talking', 'is-reacting', 'is-blinking', 'is-celebrating');
  void host.offsetWidth;
  host.classList.add(className);
  internalSource(element, name);

  state.timer = window.setTimeout(() => {
    host.classList.remove(className);
    restoreBase(element);
  }, reducedMotion.matches ? Math.min(duration, 120) : duration);
}

function speak(element, duration = 1250) {
  if (!element) return;
  registerActor(element);
  clearActorTimers(element);
  const state = stateFor(element);
  const host = element.closest('.nana-widget, .nana-modal-card') || element;
  const bubble = host.querySelector?.('.nana-bubble, blockquote');

  host.classList.remove('is-reacting', 'is-blinking');
  host.classList.add('is-talking');
  bubble?.classList.add('is-speaking');

  if (reducedMotion.matches) {
    internalSource(element, 'talking');
    state.timer = window.setTimeout(() => {
      host.classList.remove('is-talking');
      bubble?.classList.remove('is-speaking');
      restoreBase(element);
    }, 180);
    return;
  }

  let talking = false;
  state.interval = window.setInterval(() => {
    talking = !talking;
    internalSource(element, talking ? 'talking' : state.base);
  }, 145);

  state.timer = window.setTimeout(() => {
    window.clearInterval(state.interval);
    state.interval = null;
    host.classList.remove('is-talking');
    bubble?.classList.remove('is-speaking');
    restoreBase(element);
  }, duration);
}

function spawnHearts(origin, count = 8) {
  if (!origin || reducedMotion.matches) return;
  const rect = origin.getBoundingClientRect();
  for (let index = 0; index < count; index += 1) {
    const heart = document.createElement('span');
    heart.className = 'actor-heart';
    heart.textContent = index % 4 === 0 ? '✦' : '♥';
    heart.style.left = `${rect.left + rect.width * (0.25 + Math.random() * 0.5)}px`;
    heart.style.top = `${rect.top + rect.height * (0.25 + Math.random() * 0.45)}px`;
    heart.style.setProperty('--heart-x', `${-42 + Math.random() * 84}px`);
    heart.style.setProperty('--heart-delay', `${Math.random() * 160}ms`);
    heart.style.setProperty('--heart-size', `${12 + Math.random() * 15}px`);
    document.body.appendChild(heart);
    window.setTimeout(() => heart.remove(), 1450);
  }
}

function coupleCelebrate(origin) {
  const avatars = $$('.person-avatar');
  avatars.forEach(avatar => {
    avatar.classList.remove('couple-celebrate');
    void avatar.offsetWidth;
    avatar.classList.add('couple-celebrate');
    window.setTimeout(() => avatar.classList.remove('couple-celebrate'), 1050);
  });
  spawnHearts(origin || $('#heartScore'), 14);
}

function petReact() {
  const petImages = $$('#petBtn > img, .pet-big');
  petImages.forEach(image => {
    image.classList.remove('pet-react');
    void image.offsetWidth;
    image.classList.add('pet-react');
    window.setTimeout(() => image.classList.remove('pet-react'), 900);
  });
  spawnHearts($('#petBtn'), 7);
}

function animateProposalStep() {
  const step = $('#proposalNanaStep');
  if (!step?.classList.contains('active')) return;

  const nana = step.querySelector('.proposal-nana');
  const dialogue = step.querySelector('.proposal-nana-dialogue');
  const ringBox = step.querySelector('.proposal-ring-box');

  [nana, dialogue, ringBox].forEach(element => {
    if (!element) return;
    element.classList.remove('nana-proposal-enter', 'dialogue-pop', 'ring-box-reveal');
    void element.offsetWidth;
  });

  nana?.classList.add('nana-proposal-enter');
  window.setTimeout(() => dialogue?.classList.add('dialogue-pop'), reducedMotion.matches ? 0 : 520);
  window.setTimeout(() => {
    ringBox?.classList.add('ring-box-reveal');
    spawnHearts(ringBox || nana, 12);
  }, reducedMotion.matches ? 0 : 880);
}

function animateAcceptedStep() {
  const step = $('#proposalAcceptedStep');
  if (!step?.classList.contains('active')) return;
  const nana = step.querySelector('.proposal-nana');
  nana?.classList.remove('nana-accepted-celebrate');
  if (nana) {
    void nana.offsetWidth;
    nana.classList.add('nana-accepted-celebrate');
  }
  spawnHearts(nana || step, 22);
}

function watchProposal() {
  const steps = $$('.proposal-step');
  if (!steps.length) return;
  const observer = new MutationObserver(() => {
    animateProposalStep();
    animateAcceptedStep();
  });
  steps.forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));
}

function initNana() {
  const widget = $('#nanaSprite');
  const modal = $('#nanaModalSprite');
  registerActor(widget);
  registerActor(modal);

  const bubble = $('#nanaBubble');
  if (bubble && widget) {
    new MutationObserver(() => speak(widget)).observe(bubble, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  const modalText = $('#nanaModalText');
  if (modalText && modal) {
    new MutationObserver(() => speak(modal, 1450)).observe(modalText, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  const widgetButton = $('#nanaBtn');
  widgetButton?.addEventListener('click', () => {
    const reactions = ['surprised', 'wink', 'satisfied', 'smile'];
    playPose(widget, reactions[Math.floor(Math.random() * reactions.length)], 850);
    spawnHearts(widgetButton, 5);
  }, { capture: true });

  const modalDialog = $('#nanaModal');
  if (modalDialog && modal) {
    new MutationObserver(() => {
      if (modalDialog.open) window.setTimeout(() => speak(modal, 1250), 80);
    }).observe(modalDialog, { attributes: true, attributeFilter: ['open'] });
  }

  const scheduleIdle = () => {
    const delay = 3800 + Math.random() * 3400;
    window.setTimeout(() => {
      if (!document.hidden && widget && !$('#appView')?.classList.contains('hidden') && !document.body.classList.contains('proposal-mode')) {
        const roll = Math.random();
        if (roll < 0.68) playPose(widget, 'blink', 190, 'is-blinking');
        else if (roll < 0.88) playPose(widget, 'smile', 620);
        else playPose(widget, 'thinking', 760);
      }
      scheduleIdle();
    }, delay);
  };
  scheduleIdle();
}

function initInteractionAnimations() {
  $('#heartScore')?.addEventListener('click', event => coupleCelebrate(event.currentTarget), { capture: true });
  $('#loveBtn')?.addEventListener('click', event => coupleCelebrate(event.currentTarget), { capture: true });
  $('#petBtn')?.addEventListener('click', petReact, { capture: true });
  ['#feedPet', '#petPet', '#playPet'].forEach(selector => $(selector)?.addEventListener('click', petReact, { capture: true }));

  $$('.person-avatar, .map-person img, .login-profile img').forEach(image => {
    image.addEventListener('click', () => spawnHearts(image, 5));
  });
}

function init() {
  document.body.classList.add('animations-ready');
  initNana();
  initInteractionAnimations();
  watchProposal();

  window.MyLoveAnimations = {
    nana: {
      play(name, duration = 900) { playPose($('#nanaSprite'), name, duration); },
      speak(duration = 1250) { speak($('#nanaSprite'), duration); },
      modal(name, duration = 900) { playPose($('#nanaModalSprite'), name, duration); }
    },
    coupleCelebrate,
    petReact,
    proposal: animateProposalStep
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
