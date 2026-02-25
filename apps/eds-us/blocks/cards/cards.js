import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'cards',
    label: 'Cards',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const items = rows.map((row, i) => {
    const cols = [...row.children];
    const imgCol = cols.find((c) => c.querySelector('img, picture'));
    const contentCols = cols.filter((c) => c !== imgCol);
    if (imgCol) annotateField(imgCol, { prop: `image-${i}`, type: 'media', label: `Card ${i + 1} Image` });
    contentCols.forEach((c, j) => annotateField(c, { prop: `content-${i}-${j}`, type: 'richtext', label: `Card ${i + 1} Content` }));

    const img = imgCol?.querySelector('img');
    const heading = row.querySelector('h1,h2,h3,h4,h5,h6');
    const bodyHtml = contentCols.map((c) => c.innerHTML).join('');
    return {
      imageUrl: img?.src || '',
      imageAlt: img?.alt || '',
      title: heading?.textContent.trim() || '',
      bodyHtml,
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/cards/qsr-cards.js');
    const wc = document.createElement('qsr-cards');
    wc.setAttribute('items', JSON.stringify(items));
    wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
