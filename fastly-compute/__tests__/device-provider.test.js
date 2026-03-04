/**
 * Tests for handlers/device-provider.js (Fastly Compute ESM version)
 */

import { renderDeviceMetaHTML } from '../src/handlers/device-provider.js';

describe('device-provider', () => {
  describe('renderDeviceMetaHTML', () => {
    it('includes device type in meta tag', () => {
      const html = renderDeviceMetaHTML('mobile', { columns: 1, imageWidth: 400, fontSize: 'base', touch: true }, 'us');
      expect(html).toContain('<meta name="x-device-type" content="mobile">');
    });

    it('sets data-device attribute via inline script', () => {
      const html = renderDeviceMetaHTML('kiosk', { columns: 2, imageWidth: 600, fontSize: 'large', touch: true }, 'us');
      expect(html).toContain("data-device','kiosk'");
    });

    it('adds touch-device class for touch devices', () => {
      const html = renderDeviceMetaHTML('tablet', { columns: 2, imageWidth: 600, fontSize: 'base', touch: true }, 'uk');
      expect(html).toContain('touch-device');
    });

    it('includes market meta', () => {
      const html = renderDeviceMetaHTML('desktop', { columns: 3, imageWidth: 800, fontSize: 'base', touch: false }, 'jp');
      expect(html).toContain('<meta name="x-market" content="jp">');
    });
  });
});
