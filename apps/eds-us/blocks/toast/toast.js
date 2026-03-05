import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'toast',
    label: 'Toast Notification',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const messageCol = rows[0]?.children[0] || rows[0];
  const variantCol = rows[1]?.children[0] || rows[1];

  if (messageCol) annotateField(messageCol, { prop: 'message', type: 'text', label: 'Toast Message' });
  if (variantCol) annotateField(variantCol, { prop: 'variant', type: 'text', label: 'Toast Variant' });

  const message = messageCol?.textContent.trim() || '';
  const variant = variantCol?.textContent.trim() || 'info';
  const position = block.classList.contains('top') ? 'top' : 'bottom';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/toast/qsr-toast.js');
      const wc = document.createElement('qsr-toast');
      wc.setAttribute('message', message);
      wc.setAttribute('variant', variant);
      wc.setAttribute('position', position);
      return wc;
    },
  });
}
