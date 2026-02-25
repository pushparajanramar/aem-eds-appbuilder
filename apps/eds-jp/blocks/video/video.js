import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

function detectVideoType(url) {
  if (/youtu(\.be|be\.com)/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'video';
}

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'video',
    label: 'Video',
  });

  const link = block.querySelector('a');
  const picture = block.querySelector('picture');
  const img = picture?.querySelector('img');
  const src = link?.href || '';
  const posterurl = img?.src || '';
  const videotype = detectVideoType(src);
  const autoplay = block.classList.contains('autoplay') ? 'true' : 'false';

  if (link) annotateField(link.closest('div') || link, { prop: 'src', type: 'text', label: 'Video URL' });
  if (img) annotateField(picture?.closest('div') || picture, { prop: 'poster', type: 'media', label: 'Video Poster' });

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/video/qsr-video.js');
    const wc = document.createElement('qsr-video');
    wc.setAttribute('src', src);
    wc.setAttribute('posterurl', posterurl);
    wc.setAttribute('videotype', videotype);
    wc.setAttribute('autoplay', autoplay);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
