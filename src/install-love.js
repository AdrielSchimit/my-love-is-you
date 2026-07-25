(() => {
  'use strict';

  let deferredPrompt = null;

  const isInstalled = () => (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true
  );

  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = () => /android/i.test(navigator.userAgent);
  const isMobile = () => (
    isIos()
    || isAndroid()
    || window.matchMedia('(max-width: 820px)').matches
  );

  function modal() {
    return document.querySelector('#pwa-install-modal');
  }

  function openModal() {
    const element = modal();
    if (!element || isInstalled()) return;

    element.classList.remove('hidden');
    requestAnimationFrame(() => element.classList.add('visible'));
  }

  function closeModal() {
    const element = modal();
    if (!element) return;

    element.classList.remove('visible');
    window.setTimeout(() => element.classList.add('hidden'), 320);
  }

  function setGuide(title, html, buttonText = 'Entendi ♥') {
    const titleElement = document.querySelector('#pwa-install-title');
    const description = document.querySelector('#pwa-install-desc');
    const installButton = document.querySelector('#btn-install-pwa');

    if (titleElement) titleElement.textContent = title;
    if (description) description.innerHTML = html;

    if (installButton) {
      installButton.textContent = buttonText;
      installButton.dataset.guideMode = 'true';
    }
  }

  function updateInstallUi() {
    const showButton = document.querySelector('#btn-show-install-pwa');
    const installButton = document.querySelector('#btn-install-pwa');
    const installedNote = document.querySelector('#pwa-installed-note');
    const installed = isInstalled();

    if (showButton) {
      showButton.hidden = installed;
      showButton.style.display = installed ? 'none' : 'block';
    }

    if (installedNote) installedNote.hidden = !installed;

    if (installButton && installed) {
      installButton.disabled = true;
      installButton.textContent = 'Já instalado neste aparelho ♥';
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallUi();

    if (
      isMobile()
      && !sessionStorage.getItem('pwa-dismissed')
      && !sessionStorage.getItem('pwa-romantic-shown')
    ) {
      sessionStorage.setItem('pwa-romantic-shown', 'true');
      window.setTimeout(openModal, 700);
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.setItem('my-love-is-you-installed', 'true');
    closeModal();
    updateInstallUi();
  });

  function bindInstallActions() {
    const showButton = document.querySelector('#btn-show-install-pwa');
    const installButton = document.querySelector('#btn-install-pwa');
    const cancelButton = document.querySelector('#btn-cancel-pwa');
    const closeButton = document.querySelector(
      '#pwa-install-modal .close-modal'
    );

    showButton?.addEventListener('click', event => {
      event.preventDefault();
      openModal();
    }, true);

    installButton?.addEventListener('click', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (installButton.dataset.guideMode === 'true') {
        closeModal();
        return;
      }

      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;

        if (choice.outcome === 'accepted') {
          deferredPrompt = null;
          closeModal();
          updateInstallUi();
        }
        return;
      }

      if (isIos()) {
        setGuide(
          'Coloque nosso universo na tela inicial',
          [
            '1. Toque no botão <strong>Compartilhar</strong> do Safari.',
            '2. Escolha <strong>Adicionar à Tela de Início</strong>.',
            '3. Confirme em <strong>Adicionar</strong>.'
          ].join('<br>')
        );
        return;
      }

      if (isAndroid()) {
        setGuide(
          'Instale pelo menu do navegador',
          [
            '1. Toque nos <strong>três pontinhos ⋮</strong> do Chrome.',
            '2. Escolha <strong>Instalar app</strong> ou ',
            '<strong>Adicionar à tela inicial</strong>.',
            '3. Confirme a instalação.'
          ].join('<br>')
        );
        return;
      }

      setGuide(
        'Instale pelo navegador',
        [
          'Abra o menu do navegador e procure por ',
          '<strong>Instalar My Love</strong> ou ',
          '<strong>Adicionar à tela inicial</strong>.'
        ].join('')
      );
    }, true);

    const dismiss = () => {
      sessionStorage.setItem('pwa-dismissed', 'true');
      closeModal();
    };

    cancelButton?.addEventListener('click', dismiss, true);
    closeButton?.addEventListener('click', dismiss, true);

    updateInstallUi();

    if (
      isMobile()
      && !isInstalled()
      && !sessionStorage.getItem('pwa-dismissed')
      && !sessionStorage.getItem('pwa-romantic-shown')
    ) {
      sessionStorage.setItem('pwa-romantic-shown', 'true');
      window.setTimeout(openModal, 1800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindInstallActions, {
      once: true
    });
  }
  else {
    bindInstallActions();
  }
})();
