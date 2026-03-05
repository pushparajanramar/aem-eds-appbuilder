import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'textarea',
    label: 'Textarea',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const labelCol = rows[0]?.children[0] || rows[0];
  const placeholderCol = rows[1]?.children[0] || rows[1];

  if (labelCol) annotateField(labelCol, { prop: 'label', type: 'text', label: 'Textarea Label' });
  if (placeholderCol) annotateField(placeholderCol, { prop: 'placeholder', type: 'text', label: 'Placeholder' });

  const label = labelCol?.textContent.trim() || '';
  const placeholder = placeholderCol?.textContent.trim() || '';

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/textarea/qsr-textarea.js');
      const wc = document.createElement('qsr-textarea');
      wc.setAttribute('label', label);
      wc.setAttribute('placeholder', placeholder);
      return wc;
    },
  });
}
