import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'button-group',
    label: 'Button Group',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const buttons = rows.map((row, i) => {
    const labelCol = row.children[0];
    const hrefCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `btn-label-${i}`, type: 'text', label: `Button ${i + 1} Label` });
    return {
      label: labelCol?.textContent.trim() || '',
      href: hrefCol?.querySelector('a')?.href || hrefCol?.textContent.trim() || '#',
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/button-group/qsr-button-group.js');
    const wc = document.createElement('qsr-button-group');
    wc.setAttribute('buttons', JSON.stringify(buttons));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
