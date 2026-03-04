import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'calendar',
    label: 'Calendar',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const monthCol = rows[0]?.children[0] || rows[0];
  const yearCol = rows[1]?.children[0] || rows[1];

  if (monthCol) annotateField(monthCol, { prop: 'month', type: 'text', label: 'Month' });
  if (yearCol) annotateField(yearCol, { prop: 'year', type: 'text', label: 'Year' });

  const month = monthCol?.textContent.trim() || '';
  const year = yearCol?.textContent.trim() || '';

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/calendar/qsr-calendar.js');
    const wc = document.createElement('qsr-calendar');
    wc.setAttribute('month', month);
    wc.setAttribute('year', year);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
