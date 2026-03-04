import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'dropdown-menu',
    label: 'Dropdown Menu',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const triggerCol = rows[0]?.children[0] || rows[0];
  const itemRows = rows.slice(1);

  if (triggerCol) annotateField(triggerCol, { prop: 'trigger', type: 'text', label: 'Trigger Label' });

  const trigger = triggerCol?.textContent.trim() || 'Menu';
  const items = itemRows.map((row, i) => {
    const labelCol = row.children[0];
    const hrefCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `item-${i}`, type: 'text', label: `Item ${i + 1}` });
    return {
      label: labelCol?.textContent.trim() || '',
      href: hrefCol?.querySelector('a')?.href || hrefCol?.textContent.trim() || '#',
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/dropdown-menu/qsr-dropdown-menu.js');
    const wc = document.createElement('qsr-dropdown-menu');
    wc.setAttribute('trigger', trigger);
    wc.setAttribute('items', JSON.stringify(items));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
