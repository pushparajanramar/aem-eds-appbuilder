import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

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

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/button-group/qsr-button-group.js');
      const wc = document.createElement('qsr-button-group');
      wc.setAttribute('buttons', JSON.stringify(buttons));
      return wc;
    },
  });
}
