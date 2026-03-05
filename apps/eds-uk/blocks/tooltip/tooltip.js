import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'tooltip',
    label: 'Tooltip',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const triggerCol = rows[0]?.children[0] || rows[0];
  const contentCol = rows[1]?.children[0] || rows[1];

  if (triggerCol) annotateField(triggerCol, { prop: 'trigger', type: 'richtext', label: 'Trigger' });
  if (contentCol) annotateField(contentCol, { prop: 'content', type: 'text', label: 'Tooltip Content' });

  const triggerhtml = triggerCol?.innerHTML || '';
  const content = contentCol?.textContent.trim() || '';
  const placement = block.classList.contains('bottom') ? 'bottom'
    : block.classList.contains('left') ? 'left'
      : block.classList.contains('right') ? 'right' : 'top';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/tooltip/qsr-tooltip.js');
      const wc = document.createElement('qsr-tooltip');
      wc.setAttribute('triggerhtml', triggerhtml);
      wc.setAttribute('content', content);
      wc.setAttribute('placement', placement);
      return wc;
    },
  });
}
