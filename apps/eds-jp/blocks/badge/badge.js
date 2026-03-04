import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'badge',
    label: 'Badge',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const variantCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Badge Label' });
  if (variantCol) annotateField(variantCol, { prop: 'variant', type: 'text', label: 'Badge Variant' });

  const label = labelCol?.textContent.trim() || '';
  const variant = variantCol?.textContent.trim() || 'default';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/badge/qsr-badge.js');
    const wc = document.createElement('qsr-badge');
    wc.setAttribute('label', label);
    wc.setAttribute('variant', variant);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
