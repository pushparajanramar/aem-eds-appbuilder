import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

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

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/table/qsr-table.js');
      const wc = document.createElement('qsr-table');
      wc.setAttribute('tabledata', JSON.stringify(tabledata));
      wc.setAttribute('hasheader', hasheader);
      wc.setAttribute('variants', variantTokens);
      return wc;
    },
  });
}
