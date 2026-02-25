import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

function getProvider(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  return 'unknown';
}

function getEmbedUrl(url, provider) {
  if (provider === 'youtube') {
    const id = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : url;
  }
  if (provider === 'vimeo') {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url;
  }
  return url;
}

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'embed',
    label: 'Embed',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const link = block.querySelector('a');
  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  const rawUrl = link ? link.href : block.textContent.trim();
  const provider = getProvider(rawUrl);

  annotateField(link || block.firstElementChild, { prop: 'url', type: 'reference', label: 'Embed URL' });
  if (picture || img) {
    annotateField(picture || img, { prop: 'thumbnail', type: 'media', label: 'Thumbnail' });
  }
  if (img) {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  }

  const placeholder = document.createElement('div');
  placeholder.className = 'embed__placeholder';
  placeholder.setAttribute('role', 'button');
  placeholder.setAttribute('aria-label', `Play ${provider} video`);
  placeholder.setAttribute('tabindex', '0');

  if (picture || img) {
    placeholder.append(picture || img);
  }

  const playBtn = document.createElement('div');
  playBtn.className = 'embed__play-btn';
  playBtn.setAttribute('aria-hidden', 'true');
  playBtn.textContent = '▶';
  placeholder.append(playBtn);

  function loadEmbed() {
    window.adobeDataLayer.push({
      event: 'component:embed:play',
      component: { provider, url: rawUrl },
    });

    const wrap = document.createElement('div');
    wrap.className = 'embed__iframe-wrap';
    const iframe = document.createElement('iframe');
    iframe.src = getEmbedUrl(rawUrl, provider);
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.setAttribute('title', `${provider} video player`);
    wrap.append(iframe);
    placeholder.replaceWith(wrap);
  }

  placeholder.addEventListener('click', loadEmbed);
  placeholder.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadEmbed(); }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        obs.disconnect();
      }
    });
  }, { threshold: 0.1 });

  block.textContent = '';
  block.append(placeholder);
  observer.observe(placeholder);
}
