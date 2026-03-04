import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'spinner',
    label: 'Spinner',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Loading Label' });

  const label = labelCol?.textContent.trim() || 'Loading…';
  const size = block.classList.contains('large') ? 'large' : block.classList.contains('small') ? 'small' : 'medium';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/spinner/qsr-spinner.js');
    const wc = document.createElement('qsr-spinner');
    wc.setAttribute('label', label);
    wc.setAttribute('size', size);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
