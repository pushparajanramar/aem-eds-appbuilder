import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'carousel',
    label: 'Carousel',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const slides = [...block.children];
  const total = slides.length;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');
  block.setAttribute('aria-label', 'Image Carousel');

  const track = document.createElement('div');
  track.className = 'carousel__track';

  slides.forEach((row, i) => {
    const picture = row.querySelector('picture');
    const img = row.querySelector('img');
    const contentCells = [...row.children].filter((c) => !c.querySelector('picture'));

    annotateField(picture || img, { prop: `slide-${i}-image`, type: 'media', label: `Slide ${i + 1} Image` });
    if (img) {
      img.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
      img.setAttribute('decoding', 'async');
    }

    const slide = document.createElement('div');
    slide.className = 'carousel__slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'Slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${total}`);

    if (picture || img) {
      const bg = document.createElement('div');
      bg.className = 'carousel__slide-bg';
      bg.append(picture || img);
      slide.append(bg);
    }

    if (contentCells.length) {
      const content = document.createElement('div');
      content.className = 'carousel__slide-content';
      contentCells.forEach((c) => content.append(...c.childNodes));
      slide.append(content);
    }

    track.append(slide);
  });

  // Nav buttons
  const nav = document.createElement('div');
  nav.className = 'carousel__nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel__btn carousel__btn--prev';
  prevBtn.setAttribute('aria-label', 'Previous Slide');
  prevBtn.textContent = '‹';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel__btn carousel__btn--next';
  nextBtn.setAttribute('aria-label', 'Next Slide');
  nextBtn.textContent = '›';

  nav.append(prevBtn, nextBtn);

  // Indicators
  const indicators = document.createElement('div');
  indicators.className = 'carousel__indicators';

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = `carousel__dot${i === 0 ? ' carousel__dot--active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    indicators.append(dot);
    return dot;
  });

  let current = 0;

  function goTo(index) {
    current = (index + total) % total;
    const slideEls = track.querySelectorAll('.carousel__slide');
    track.scrollTo({ left: slideEls[current].offsetLeft, behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle('carousel__dot--active', i === current));
    window.adobeDataLayer.push({
      event: 'component:carousel:slide',
      component: { slideIndex: current, total },
    });
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // IntersectionObserver for auto-updating active dot on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = [...track.children].indexOf(entry.target);
        if (idx !== -1) {
          current = idx;
          dots.forEach((d, i) => d.classList.toggle('carousel__dot--active', i === idx));
        }
      }
    });
  }, { root: track, threshold: 0.6 });

  block.textContent = '';
  block.append(track, nav, indicators);
  track.querySelectorAll('.carousel__slide').forEach((s) => io.observe(s));
}
