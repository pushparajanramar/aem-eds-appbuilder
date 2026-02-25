import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

function detectVideoType(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/\.(mp4|webm|ogg)/.test(url)) return 'native';
  return 'unknown';
}

function buildEmbedUrl(url, type) {
  if (type === 'youtube') {
    const id = url.match(/(?:v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1` : null;
  }
  if (type === 'vimeo') {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
  }
  return url;
}

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'video',
    label: 'Video',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const link = block.querySelector('a');
  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  const source = link ? link.href : block.querySelector('p')?.textContent.trim();
  const videoType = detectVideoType(source || '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (picture || img) {
    annotateField(picture || img, { prop: 'poster', type: 'media', label: 'Video Poster' });
    if (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }
  }
  if (link) {
    annotateField(link, { prop: 'source', type: 'reference', label: 'Video Source' });
  }

  const container = document.createElement('div');
  container.className = 'video__container';
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute('aria-label', 'Play video');

  const poster = document.createElement('div');
  poster.className = 'video__poster';
  if (picture || img) poster.append(picture || img);

  const playBtn = document.createElement('div');
  playBtn.className = 'video__play-btn';
  playBtn.setAttribute('aria-hidden', 'true');
  playBtn.textContent = '▶';

  container.append(poster, playBtn);

  function loadVideo() {
    window.adobeDataLayer.push({
      event: 'component:video:play',
      component: { source, videoType },
    });

    if (videoType === 'native') {
      const video = document.createElement('video');
      video.className = 'video__player';
      video.setAttribute('controls', '');
      video.setAttribute('playsinline', '');
      if (!reducedMotion) video.setAttribute('autoplay', '');
      const src = document.createElement('source');
      src.src = source;
      video.append(src);
      container.replaceWith(video);
    } else {
      const embedUrl = buildEmbedUrl(source, videoType);
      if (!embedUrl) return;
      const iframe = document.createElement('iframe');
      iframe.className = 'video__player';
      iframe.src = embedUrl;
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      iframe.setAttribute('title', 'Video player');
      container.replaceWith(iframe);
    }
  }

  container.addEventListener('click', loadVideo);
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadVideo(); }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) obs.disconnect();
    });
  }, { threshold: 0.2 });

  block.textContent = '';
  block.append(container);
  observer.observe(container);
}
