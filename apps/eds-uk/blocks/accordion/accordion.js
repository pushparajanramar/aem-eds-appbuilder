import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'accordion',
    label: 'Accordion',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  [...block.children].forEach((row, index) => {
    const labelCol = row.children[0];
    const bodyCol = row.children[1];

    annotateField(labelCol, { prop: 'label', type: 'text', label: 'Accordion Label' });
    annotateField(bodyCol, { prop: 'body', type: 'richtext', label: 'Accordion Body' });

    const details = document.createElement('details');
    details.className = 'accordion__item';

    const summary = document.createElement('summary');
    summary.className = 'accordion__summary';
    summary.append(...labelCol.childNodes);

    const body = document.createElement('div');
    body.className = 'accordion__body';
    body.append(...bodyCol.childNodes);

    const labelText = summary.textContent.trim();

    details.addEventListener('toggle', () => {
      window.adobeDataLayer.push({
        event: 'component:accordion:toggle',
        component: {
          itemIndex: index,
          label: labelText,
          isOpen: details.open,
        },
      });
    });

    details.append(summary, body);
    row.replaceWith(details);
  });
}
