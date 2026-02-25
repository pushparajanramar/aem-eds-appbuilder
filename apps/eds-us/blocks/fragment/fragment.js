import { decorateMain, loadBlock } from '../../scripts/aem.js';

export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      await decorateMain(main);
      await Promise.all([...main.querySelectorAll('.block')].map(loadBlock));
      return main;
    }
  }
  return null;
}

export default function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    await import('/blocks/fragment/qsr-fragment.js');
    const wc = document.createElement('qsr-fragment');
    wc.setAttribute('path', path);
    block.replaceWith(wc);
  }, { rootMargin: '200px' });
  observer.observe(block);
}
