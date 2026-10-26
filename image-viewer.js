(() => {
  'use strict';
  const sendOrigin = location.protocol === 'file:' ? '*' : location.origin;
  if (window.CR_FRAME_SHELL) {
    const dialog = document.createElement('dialog');
    dialog.className = 'cr-image-viewer';
    dialog.setAttribute('aria-label', '이미지 크게 보기');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'cr-image-close';
    close.textContent = '닫기 ×';
    close.setAttribute('aria-label', '확대한 이미지 닫기');
    const image = document.createElement('img');
    dialog.append(close, image);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      (window.CRActiveContentFrame?.() || document.getElementById('cr-content-frame'))?.contentWindow?.postMessage({ type: 'cr-image-closed' }, sendOrigin);
    });
    addEventListener('message', event => {
      const frame = (window.CRActiveContentFrame?.() || document.getElementById('cr-content-frame'));
      if (event.source !== frame?.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin) || event.data?.type !== 'cr-image-open') return;
      let url;
      try { url = new URL(event.data.src, location.href); } catch { return; }
      if (url.origin !== location.origin && url.origin !== 'https://cdn.imgchest.com') return;
      image.src = url.href;
      image.alt = String(event.data.alt || '채린 소개 이미지');
      if (!dialog.open) dialog.showModal();
      close.focus();
    });
    return;
  }

  let lastImage;
  function decorate() {
    document.querySelectorAll('main img:not([data-cr-zoom])').forEach(image => {
      if (image.closest('a,button,[role="button"]')) return;
      image.dataset.crZoom = '';
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', (image.alt || '이미지') + ' 크게 보기');
    });
  }
  function open(image) {
    lastImage = image;
    parent.postMessage({ type: 'cr-image-open', src: image.currentSrc || image.src, alt: image.alt }, sendOrigin);
  }
  document.addEventListener('click', event => {
    const image = event.target.closest('img[data-cr-zoom]');
    if (image) open(image);
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('img[data-cr-zoom]')) {
      event.preventDefault();
      open(event.target);
    }
  });
  addEventListener('message', event => {
    if (event.source === parent && (location.protocol === 'file:' || event.origin === location.origin) && event.data?.type === 'cr-image-closed') lastImage?.focus({ preventScroll: true });
  });
  decorate();
  new MutationObserver(decorate).observe(document.querySelector('main'), { childList: true, subtree: true });
})();
