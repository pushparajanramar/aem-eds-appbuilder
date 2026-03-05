import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'toggle-switch',
    label: 'Toggle Switch',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Toggle Label' });

  const label = labelCol?.textContent.trim() || '';
  const checked = block.classList.contains('checked') ? 'true' : 'false';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/toggle-switch/qsr-toggle-switch.js');
      const wc = document.createElement('qsr-toggle-switch');
      wc.setAttribute('label', label);
      wc.setAttribute('checked', checked);
      return wc;
    },
  });
}
