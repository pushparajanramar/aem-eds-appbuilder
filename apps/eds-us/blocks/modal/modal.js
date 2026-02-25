import { annotateBlock, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export async function createModal(contentNodes) {
  await import('/blocks/modal/qsr-modal.js');
  window.adobeDataLayer = window.adobeDataLayer || [];

  const html = contentNodes
    ? (Array.isArray(contentNodes) ? contentNodes : [contentNodes])
        .map((n) => (n instanceof Node ? n.outerHTML || '' : String(n)))
        .join('')
    : '';

  const wc = document.createElement('qsr-modal');
  wc.setAttribute('contenthtml', html);
  wc.setAttribute('label', 'Dialog');
  document.body.append(wc);

  return {
    element: wc,
    show() {
      wc.setAttribute('open', 'true');
      window.adobeDataLayer.push({ event: 'component:modal:open' });
    },
    close() {
      wc.setAttribute('open', 'false');
      window.adobeDataLayer.push({ event: 'component:modal:close' });
    },
  };
}

export async function openModal(fragmentUrl) {
  const { loadFragment } = await import('../fragment/fragment.js');
  const fragment = await loadFragment(fragmentUrl);
  const modal = await createModal(fragment ? [fragment] : []);
  modal.show();
  return modal;
}

export default function decorate(block) {
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
