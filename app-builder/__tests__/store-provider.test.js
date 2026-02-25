/**
 * Tests for store-provider action
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

const { renderStoreHTML } = require('../actions/store-provider/index');

describe('store-provider', () => {
  describe('renderStoreHTML', () => {
    const sampleStores = [
      { name: 'Store A', address: '123 Main St', city: 'Seattle', state: 'WA', zip: '98101', phone: '555-1234', hours: '6am-10pm', lat: 47.6, lng: -122.3 },
    ];

    it('returns empty message when stores array is empty', () => {
      const html = renderStoreHTML([]);
      expect(html).toContain('stores-empty');
    });

    it('renders store name in output', () => {
      const html = renderStoreHTML(sampleStores);
      expect(html).toContain('Store A');
    });

    it('includes data-device attribute from resolved device type', () => {
      const layout = { columns: 1, imageWidth: 400, fontSize: 'base', touch: true };
      const html = renderStoreHTML(sampleStores, layout, 'mobile');
      expect(html).toContain('data-device="mobile"');
    });

    it('includes data-columns attribute from layout', () => {
      const layout = { columns: 2, imageWidth: 600, fontSize: 'base', touch: true };
      const html = renderStoreHTML(sampleStores, layout, 'tablet');
      expect(html).toContain('data-columns="2"');
    });

    it('defaults to desktop layout when no device type provided', () => {
      const html = renderStoreHTML(sampleStores);
      expect(html).toContain('data-device="desktop"');
      expect(html).toContain('data-columns="3"');
    });

    it('escapes HTML in store fields to prevent XSS', () => {
      const xssStores = [{ name: '<script>alert(1)</script>', address: 'x', city: 'y', state: 'Z', zip: '0', phone: '', hours: '', lat: 0, lng: 0 }];
      const html = renderStoreHTML(xssStores);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});
