import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'quote',
    label: 'Quote',
  });

  const rows = [...block.children];
  const quotationRow = rows[0];
  const attributionRow = rows[1];

  const quotationEl = quotationRow?.querySelector('p, blockquote');
  const attributionEl = attributionRow?.querySelector('p, em');

  if (quotationEl) annotateField(quotationEl, { prop: 'quotation', type: 'richtext', label: 'Quotation' });
  if (attributionEl) annotateField(attributionEl, { prop: 'attribution', type: 'text', label: 'Attribution' });

  const blockquote = document.createElement('blockquote');

  const quoteText = document.createElement('p');
  quoteText.className = 'quote__text';
  quoteText.textContent = quotationEl ? quotationEl.textContent.trim() : '';
  blockquote.append(quoteText);

  if (attributionEl) {
    const attribution = document.createElement('p');
    attribution.className = 'quote__attribution';
    const raw = attributionEl.textContent.trim().replace(/^—\s*/, '');
    const cite = document.createElement('cite');
    cite.textContent = raw;
    attribution.append(cite);
    blockquote.append(attribution);
  }

  block.textContent = '';
  block.append(blockquote);
}
