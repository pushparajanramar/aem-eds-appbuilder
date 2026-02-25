/*
 * Copyright 2024 Adobe. All rights reserved.
 * EDS Runtime — generated from @adobe/aem-eds core
 * !! DO NOT MODIFY !!
 */

/* ─── Block Loading ─────────────────────────────────────────────────────── */
export function sampleRUM() {}

export function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

export function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

export function toClassName(name) {
  return typeof name === 'string'
    ? name
        .toLowerCase()
        .replace(/[^0-9a-z]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
}

export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll('img')];
          if (imgs.length === 1) {
            value = imgs[0].src;
          } else {
            value = imgs.map((img) => img.src);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else {
          value = row.children[1].textContent;
        }
        config[name] = value;
      }
    }
  });
  return config;
}

export function decorateIcons(element = document) {
  element.querySelectorAll('span.icon').forEach(async (span) => {
    if (span.classList.length < 2 || !span.classList[1].startsWith('icon-')) return;
    const icon = span.classList[1].substring(5);
    const resp = await fetch(`/icons/${icon}.svg`);
    if (resp.ok) {
      const iconHTML = await resp.text();
      if (iconHTML.match(/<svg/)) {
        span.innerHTML = iconHTML;
      }
    }
  });
}

export async function loadBlock(block) {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName } = block.dataset;
    try {
      const cssLoaded = loadCSS(`/blocks/${blockName}/${blockName}.css`);
      const mod = await import(`/blocks/${blockName}/${blockName}.js`);
      await cssLoaded;
      if (mod.default) await mod.default(block);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed loading block ${block.dataset.blockName}`, err);
    }
    block.dataset.blockStatus = 'loaded';
  }
  return block;
}

export function decorateBlocks(main) {
  main.querySelectorAll('div.section > div > div').forEach(decorateBlock);
}

export function decorateBlock(block) {
  const shortBlockName = block.classList[0];
  if (shortBlockName) {
    block.classList.add('block');
    block.dataset.blockName = shortBlockName;
    block.dataset.blockStatus = 'initialized';
    const section = block.closest('.section');
    if (section) section.classList.add(`${shortBlockName}-container`);
  }
}

export async function decorateMain(main) {
  decorateIcons(main);
  decorateBlocks(main);
}

export async function loadPage() {
  const main = document.querySelector('main');
  if (main) {
    await decorateMain(main);
    applyDeviceType();
    loadCSS('/styles/device.css');
    document.body.classList.add('appear');
  }
}

/**
 * Read the device type injected by the device-provider action (via a <meta>
 * tag or the X-Device-Type response header echoed by Fastly) and apply it as
 * a data attribute on <html> so CSS and JS can adapt layouts without
 * performing User-Agent sniffing in the browser.
 *
 * Resolution order:
 *   1. <meta name="x-device-type"> (set by device-provider action)
 *   2. document.documentElement already has data-device (set inline by device-provider)
 *   3. Viewport-width heuristic (client-side fallback only)
 */
function applyDeviceType() {
  // Ensure viewport meta tag is present for responsive design
  if (!document.head.querySelector('meta[name="viewport"]')) {
    const vp = document.createElement('meta');
    vp.name = 'viewport';
    vp.content = 'width=device-width, initial-scale=1';
    document.head.prepend(vp);
  }

  const html = document.documentElement;
  if (html.dataset.device) return; // already set by device-provider inline script

  const meta = document.head.querySelector('meta[name="x-device-type"]');
  if (meta && meta.content) {
    html.setAttribute('data-device', meta.content);
    return;
  }

  // Client-side viewport fallback (low-fidelity; prefer server-side detection)
  const w = window.innerWidth;
  let deviceType = 'desktop';
  if (w <= 480) {
    deviceType = 'mobile';
  } else if (w <= 1024) {
    deviceType = 'tablet';
  }
  html.setAttribute('data-device', deviceType);
}
