import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'tabs',
    label: 'Tabs',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const tabsdata = rows.map((row, i) => {
    const labelCol = row.children[0];
    const contentCol = row.children[1];
    if (labelCol) annotateField(labelCol, { prop: `tab-label-${i}`, type: 'text', label: `Tab ${i + 1} Label` });
    if (contentCol) annotateField(contentCol, { prop: `tab-content-${i}`, type: 'richtext', label: `Tab ${i + 1} Content` });
    return {
      label: labelCol?.textContent.trim() || `Tab ${i + 1}`,
      contentHtml: contentCol?.innerHTML || '',
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/tabs/qsr-tabs.js');
      const wc = document.createElement('qsr-tabs');
      wc.setAttribute('tabsdata', JSON.stringify(tabsdata));
      return wc;
    },
  });
}
