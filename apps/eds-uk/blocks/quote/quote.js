import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'quote',
    label: 'Quote',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const quotationCol = rows[0]?.children[0] || rows[0];
  const attributionCol = rows[1]?.children[0] || rows[1];

  if (quotationCol) annotateField(quotationCol, { prop: 'quotation', type: 'richtext', label: 'Quotation' });
  if (attributionCol) annotateField(attributionCol, { prop: 'attribution', type: 'richtext', label: 'Attribution' });

  const quotation = quotationCol?.innerHTML || '';
  const attribution = attributionCol?.innerHTML || '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/quote/qsr-quote.js');
    const wc = document.createElement('qsr-quote');
    wc.setAttribute('quotation', quotation);
    wc.setAttribute('attribution', attribution);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
