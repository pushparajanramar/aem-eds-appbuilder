/**
 * Tests for device-provider action
 */

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

const { main, renderDeviceMetaHTML } = require('../actions/device-provider/index');

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

  describe('main', () => {
    it('returns JSON by default', async () => {
      const result = await main({ market: 'us' });
      expect(result.statusCode).toBe(200);
      expect(result.headers['content-type']).toContain('application/json');
      expect(result.body.deviceType).toBe('desktop');
      expect(result.body.market).toBe('us');
    });

    it('returns HTML when Accept: text/html', async () => {
      const result = await main({
        market: 'us',
        __ow_headers: { accept: 'text/html', 'x-device-type': 'mobile' },
      });
      expect(result.statusCode).toBe(200);
      expect(result.headers['content-type']).toContain('text/html');
      expect(result.body).toContain('<meta name="x-device-type" content="mobile">');
    });

    it('resolves device type from x-device-type header', async () => {
      const result = await main({ __ow_headers: { 'x-device-type': 'kiosk' } });
      expect(result.body.deviceType).toBe('kiosk');
    });

    it('includes Vary: X-Device-Type response header', async () => {
      const result = await main({});
      expect(result.headers.vary).toBe('X-Device-Type');
    });

    it('returns layout for digital-menu-board', async () => {
      const result = await main({ deviceType: 'digital-menu-board' });
      expect(result.body.deviceType).toBe('digital-menu-board');
      expect(result.body.layout.columns).toBe(4);
    });

    it('recognises headless as a valid device type and returns JSON layout', async () => {
      const result = await main({ deviceType: 'headless' });
      expect(result.statusCode).toBe(200);
      expect(result.headers['content-type']).toContain('application/json');
      expect(result.body.deviceType).toBe('headless');
      expect(typeof result.body.layout.columns).toBe('number');
    });

    it('returns Vary: X-Device-Type for headless device type', async () => {
      const result = await main({ deviceType: 'headless' });
      expect(result.headers.vary).toBe('X-Device-Type');
    });
  });
});
