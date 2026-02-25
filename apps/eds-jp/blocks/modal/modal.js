import { loadCSS, loadBlock, decorateBlock } from '../../scripts/aem.js';
import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx?.codeBasePath || ''}/blocks/modal/modal.css`);
  window.adobeDataLayer = window.adobeDataLayer || [];

  const dialog = document.createElement('dialog');
  dialog.className = 'modal__dialog';
  dialog.setAttribute('aria-modal', 'true');

  const header = document.createElement('div');
  header.className = 'modal__header';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal__close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.textContent = '×';
  header.append(closeBtn);

  const content = document.createElement('div');
  content.className = 'modal__content';
  if (contentNodes) {
    const nodes = Array.isArray(contentNodes) ? contentNodes : [contentNodes];
    nodes.forEach((n) => content.append(n));
  }

  dialog.append(header, content);
  document.body.append(dialog);

  closeBtn.addEventListener('click', () => {
    dialog.close();
    window.adobeDataLayer.push({ event: 'component:modal:close' });
  });

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const outside = e.clientX < rect.left || e.clientX > rect.right
      || e.clientY < rect.top || e.clientY > rect.bottom;
    if (outside) {
      dialog.close();
      window.adobeDataLayer.push({ event: 'component:modal:close' });
    }
  });

  dialog.addEventListener('close', () => {
    window.adobeDataLayer.push({ event: 'component:modal:close' });
  });

  return {
    dialog,
    show() {
      dialog.showModal();
      window.adobeDataLayer.push({ event: 'component:modal:open' });
    },
    close() { dialog.close(); },
  };
}

export async function openModal(fragmentUrl) {
  const { loadFragment } = await import('../fragment/fragment.js');
  const fragment = await loadFragment(fragmentUrl);
  const modal = await createModal(fragment ? [fragment] : []);
  modal.show();
  return modal;
}

export default async function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'modal',
    label: 'Modal',
  });

  const trigger = block.querySelector('a, button');
  if (!trigger) return;

  const fragmentUrl = trigger.href || trigger.dataset.href;
  trigger.addEventListener('click', async (e) => {
    e.preventDefault();
    await openModal(fragmentUrl);
  });
}
