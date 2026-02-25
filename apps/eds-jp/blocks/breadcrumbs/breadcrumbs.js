import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'breadcrumbs',
    label: 'Breadcrumbs',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs__list';

  rows.forEach((row, i) => {
    const cell = row.querySelector('div') || row;
    annotateField(cell, { prop: `item-${i}`, type: 'text', label: `Breadcrumb Item ${i + 1}` });

    const li = document.createElement('li');
    li.className = 'breadcrumbs__item';

    const isLast = i === rows.length - 1;
    if (isLast) {
      li.classList.add('breadcrumbs__item--active');
    }

    const link = cell.querySelector('a');
    if (link) {
      link.className = 'breadcrumbs__link';
      if (isLast) {
        link.setAttribute('aria-current', 'page');
      }
      li.append(link);
    } else {
      const span = document.createElement('span');
      span.className = 'breadcrumbs__link';
      span.textContent = cell.textContent.trim();
      if (isLast) {
        span.setAttribute('aria-current', 'page');
      }
      li.append(span);
    }

    ol.append(li);
  });

  nav.append(ol);
  block.textContent = '';
  block.append(nav);
}
