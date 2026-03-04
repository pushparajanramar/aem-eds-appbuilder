import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'number-input',
    label: 'Number Input',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const minCol = rows[1]?.children[0] || rows[1];
  const maxCol = rows[2]?.children[0] || rows[2];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Input Label' });

  const label = labelCol?.textContent.trim() || '';
  const min = minCol?.textContent.trim() || '0';
  const max = maxCol?.textContent.trim() || '100';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/number-input/qsr-number-input.js');
    const wc = document.createElement('qsr-number-input');
    wc.setAttribute('label', label);
    wc.setAttribute('min', min);
    wc.setAttribute('max', max);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
