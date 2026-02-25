import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'carousel',
    label: 'Carousel',
  });

  const rows = [...block.querySelectorAll(':scope > div')];
  const slides = rows.map((row, i) => {
    const imgCol = row.children[0];
    const contentCol = row.children[1];
    if (imgCol) annotateField(imgCol, { prop: `slide-image-${i}`, type: 'media', label: `Slide ${i + 1} Image` });
    if (contentCol) annotateField(contentCol, { prop: `slide-content-${i}`, type: 'richtext', label: `Slide ${i + 1} Content` });
    const img = imgCol?.querySelector('img');
    return {
      imageUrl: img?.src || '',
      imageAlt: img?.alt || '',
      contentHtml: contentCol?.innerHTML || '',
      align: block.classList.contains('align-right') ? 'right' : 'left',
    };
  });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/carousel/qsr-carousel.js');
    const wc = document.createElement('qsr-carousel');
    wc.setAttribute('slides', JSON.stringify(slides));
    wc.setAttribute('devicetype', document.documentElement.dataset.device || 'desktop');
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
