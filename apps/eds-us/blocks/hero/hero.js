import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Optimize images
  const picture = block.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      picture.replaceWith(optimizedPic);
    }
  }

  // Add semantic wrapper classes
  const firstDiv = block.querySelector('div');
  if (firstDiv) {
    const hasImage = firstDiv.querySelector('picture');
    if (hasImage) {
      firstDiv.classList.add('hero-content');
    }
  }
}
