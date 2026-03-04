import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'toggle-switch',
    label: 'Toggle Switch',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Toggle Label' });

  const label = labelCol?.textContent.trim() || '';
  const checked = block.classList.contains('checked') ? 'true' : 'false';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/toggle-switch/qsr-toggle-switch.js');
    const wc = document.createElement('qsr-toggle-switch');
    wc.setAttribute('label', label);
    wc.setAttribute('checked', checked);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
