import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';
import { withLazyLoading } from '../../scripts/a11y.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'pricing-table',
    label: 'Pricing Table',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const plans = rows.map((row, i) => {
    const cols = [...row.children];
    const nameCol = cols[0];
    const priceCol = cols[1];
    const featuresCol = cols[2];
    const ctaCol = cols[3];
    if (nameCol) annotateField(nameCol, { prop: `plan-name-${i}`, type: 'text', label: `Plan ${i + 1} Name` });
    if (priceCol) annotateField(priceCol, { prop: `plan-price-${i}`, type: 'text', label: `Plan ${i + 1} Price` });
    if (featuresCol) annotateField(featuresCol, { prop: `plan-features-${i}`, type: 'richtext', label: `Plan ${i + 1} Features` });
    return {
      name: nameCol?.textContent.trim() || '',
      price: priceCol?.textContent.trim() || '',
      featuresHtml: featuresCol?.innerHTML || '',
      ctaHtml: ctaCol?.innerHTML || '',
      highlighted: row.classList.contains('highlighted'),
    };
  });

  withLazyLoading(block, {
    loadComponent: async () => {
      await import('/blocks/pricing-table/qsr-pricing-table.js');
      const wc = document.createElement('qsr-pricing-table');
      wc.setAttribute('plans', JSON.stringify(plans));
      return wc;
    },
  });
}
