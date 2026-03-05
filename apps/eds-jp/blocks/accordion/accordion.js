import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'accordion',
    label: 'Accordion',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row) => {
    const labelCol = row.children[0];
    const bodyCol = row.children[1];
    annotateField(labelCol, { prop: 'label', type: 'text', label: 'Accordion Label' });
    annotateField(bodyCol, { prop: 'body', type: 'richtext', label: 'Accordion Body' });
    return { label: labelCol.innerHTML, body: bodyCol.innerHTML };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/accordion/qsr-accordion.js');
      const wc = document.createElement('qsr-accordion');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
