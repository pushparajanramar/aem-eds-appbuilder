import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'button',
    label: 'Button',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const hrefCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Button Label' });
  if (hrefCol) annotateField(hrefCol, { prop: 'href', type: 'text', label: 'Button Link' });

  const label = labelCol?.textContent.trim() || '';
  const href = hrefCol?.querySelector('a')?.href || hrefCol?.textContent.trim() || '#';
  const variant = block.classList.contains('secondary') ? 'secondary'
    : block.classList.contains('outline') ? 'outline' : 'primary';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/button/qsr-button.js');
    const wc = document.createElement('qsr-button');
    wc.setAttribute('label', label);
    wc.setAttribute('href', href);
    wc.setAttribute('variant', variant);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
