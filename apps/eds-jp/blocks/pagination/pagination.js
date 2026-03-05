import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'pagination',
    label: 'Pagination',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const totalCol = rows[0]?.children[0] || rows[0];
  const currentCol = rows[1]?.children[0] || rows[1];

  if (totalCol) annotateField(totalCol, { prop: 'total', type: 'text', label: 'Total Pages' });
  if (currentCol) annotateField(currentCol, { prop: 'current', type: 'text', label: 'Current Page' });

  const total = totalCol?.textContent.trim() || '1';
  const current = currentCol?.textContent.trim() || '1';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/pagination/qsr-pagination.js');
      const wc = document.createElement('qsr-pagination');
      wc.setAttribute('total', total);
      wc.setAttribute('current', current);
      return wc;
    },
  });
}
