import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'icon',
    label: 'Icon',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const nameCol = rows[0]?.children[0] || rows[0];
  const sizeCol = rows[1]?.children[0] || rows[1];

  if (nameCol) annotateField(nameCol, { prop: 'name', type: 'text', label: 'Icon Name' });

  const name = nameCol?.textContent.trim() || '';
  const size = sizeCol?.textContent.trim() || 'medium';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/icon/qsr-icon.js');
      const wc = document.createElement('qsr-icon');
      wc.setAttribute('name', name);
      wc.setAttribute('size', size);
      return wc;
    },
  });
}
