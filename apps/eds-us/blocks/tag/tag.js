import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'tag',
    label: 'Tag',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const labelCol = row.children[0];
    const variantCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `tag-${i}`, type: 'text', label: `Tag ${i + 1}` });
    return {
      label: labelCol?.textContent.trim() || '',
      variant: variantCol?.textContent.trim() || 'default',
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/tag/qsr-tag.js');
      const wc = document.createElement('qsr-tag');
      wc.setAttribute('items', JSON.stringify(items));
      return wc;
    },
  });
}
