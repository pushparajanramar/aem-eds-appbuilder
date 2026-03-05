import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'sidebar',
    label: 'Sidebar',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const hrefCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `sidebar-item-${i}`, type: 'text', label: `Item ${i + 1}` });
    return {
      label: labelCol?.textContent.trim() || '',
      href: hrefCol?.querySelector('a')?.href || hrefCol?.textContent.trim() || '#',
      active: row.classList.contains('active'),
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/sidebar/qsr-sidebar.js');
      const wc = document.createElement('qsr-sidebar');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
