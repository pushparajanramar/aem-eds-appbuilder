import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'list',
    label: 'List',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const col = row.children[0] || row;
    if (col) annotateField(col, { prop: `list-item-${i}`, type: 'richtext', label: `Item ${i + 1}` });
    return col?.innerHTML || '';
  });

  const variant = block.classList.contains('ordered') ? 'ordered'
    : block.classList.contains('none') ? 'none' : 'unordered';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/list/qsr-list.js');
    const wc = document.createElement('qsr-list');
    wc.setAttribute('items', JSON.stringify(items));
    wc.setAttribute('variant', variant);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
