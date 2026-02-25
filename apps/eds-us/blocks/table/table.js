import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'table',
    label: 'Table',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const tabledata = rows.map((row, i) => {
    const cols = [...row.children];
    cols.forEach((col, j) => annotateField(col, { prop: `cell-${i}-${j}`, type: 'text', label: `Cell ${i + 1},${j + 1}` }));
    return cols.map((col) => col.textContent.trim());
  });

  const hasheader = block.classList.contains('no-header') ? 'false' : 'true';
  const variantTokens = ['striped', 'bordered', 'no-header']
    .filter((v) => block.classList.contains(v))
    .join(' ');

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/table/qsr-table.js');
    const wc = document.createElement('qsr-table');
    wc.setAttribute('tabledata', JSON.stringify(tabledata));
    wc.setAttribute('hasheader', hasheader);
    wc.setAttribute('variants', variantTokens);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
