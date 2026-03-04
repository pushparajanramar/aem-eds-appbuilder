import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'tree-view',
    label: 'Tree View',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const childrenCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `tree-item-${i}`, type: 'text', label: `Item ${i + 1}` });
    return {
      label: labelCol?.textContent.trim() || '',
      children: childrenCol?.textContent.trim() || '',
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/tree-view/qsr-tree-view.js');
    const wc = document.createElement('qsr-tree-view');
    wc.setAttribute('items', JSON.stringify(items));
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
