import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'bottom-navigation',
    label: 'Bottom Navigation',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const hrefCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `nav-item-${i}`, type: 'text', label: `Nav Item ${i + 1}` });
    return {
      label: labelCol?.textContent.trim() || '',
      href: hrefCol?.querySelector('a')?.href || hrefCol?.textContent.trim() || '#',
      active: row.classList.contains('active'),
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/bottom-navigation/qsr-bottom-navigation.js');
    const wc = document.createElement('qsr-bottom-navigation');
    wc.setAttribute('items', JSON.stringify(items));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
