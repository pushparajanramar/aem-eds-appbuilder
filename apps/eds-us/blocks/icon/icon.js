import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'icon',
    label: 'Icon',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const nameCol = rows[0]?.children[0] || rows[0];
  const sizeCol = rows[1]?.children[0] || rows[1];

  if (nameCol) annotateField(nameCol, { prop: 'name', type: 'text', label: 'Icon Name' });

  const name = nameCol?.textContent.trim() || '';
  const size = sizeCol?.textContent.trim() || 'medium';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/icon/qsr-icon.js');
    const wc = document.createElement('qsr-icon');
    wc.setAttribute('name', name);
    wc.setAttribute('size', size);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
