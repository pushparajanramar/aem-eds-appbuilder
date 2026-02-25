/**
 * Tests for shared/device-utils.js
 */

const {
  DEVICE_TYPES,
  DEFAULT_DEVICE_TYPE,
  DEVICE_LAYOUT,
  getDeviceType,
  getDeviceLayout,
} = require('../actions/shared/device-utils');

describe('device-utils', () => {
  describe('DEVICE_TYPES', () => {
    it('contains all five supported device classes', () => {
      expect(DEVICE_TYPES.has('mobile')).toBe(true);
      expect(DEVICE_TYPES.has('tablet')).toBe(true);
      expect(DEVICE_TYPES.has('desktop')).toBe(true);
      expect(DEVICE_TYPES.has('kiosk')).toBe(true);
      expect(DEVICE_TYPES.has('digital-menu-board')).toBe(true);
    });
  });

  describe('DEFAULT_DEVICE_TYPE', () => {
    it('is desktop', () => {
      expect(DEFAULT_DEVICE_TYPE).toBe('desktop');
    });
  });

  describe('getDeviceType', () => {
    it('returns desktop when params are empty', () => {
      expect(getDeviceType({})).toBe('desktop');
      expect(getDeviceType(null)).toBe('desktop');
      expect(getDeviceType(undefined)).toBe('desktop');
    });

    it('reads X-Device-Type from __ow_headers (Fastly VCL header)', () => {
      expect(getDeviceType({ __ow_headers: { 'x-device-type': 'mobile' } })).toBe('mobile');
      expect(getDeviceType({ __ow_headers: { 'x-device-type': 'kiosk' } })).toBe('kiosk');
      expect(getDeviceType({ __ow_headers: { 'x-device-type': 'digital-menu-board' } })).toBe('digital-menu-board');
    });

    it('falls back to desktop for an unknown header value', () => {
      expect(getDeviceType({ __ow_headers: { 'x-device-type': 'smart-fridge' } })).toBe('desktop');
    });

    it('reads deviceType param when no header is present', () => {
      expect(getDeviceType({ deviceType: 'tablet' })).toBe('tablet');
    });

    it('reads ?device= from __ow_query when no header or param is present', () => {
      expect(getDeviceType({ __ow_query: 'device=kiosk' })).toBe('kiosk');
      expect(getDeviceType({ __ow_query: 'foo=bar&device=mobile' })).toBe('mobile');
    });

    it('prefers header over param and query string', () => {
      expect(
        getDeviceType({
          __ow_headers: { 'x-device-type': 'desktop' },
          deviceType: 'mobile',
          __ow_query: 'device=kiosk',
        }),
      ).toBe('desktop');
    });

    it('prefers explicit param over query string', () => {
      expect(getDeviceType({ deviceType: 'tablet', __ow_query: 'device=kiosk' })).toBe('tablet');
    });
  });

  describe('getDeviceLayout', () => {
    it('returns a layout object for each device type', () => {
      for (const type of DEVICE_TYPES) {
        const layout = getDeviceLayout(type);
        expect(typeof layout.columns).toBe('number');
        expect(typeof layout.imageWidth).toBe('number');
        expect(typeof layout.fontSize).toBe('string');
        expect(typeof layout.touch).toBe('boolean');
      }
    });

    it('returns the desktop layout for unknown device type', () => {
      const fallback = getDeviceLayout('smart-fridge');
      expect(fallback).toEqual(DEVICE_LAYOUT['desktop']);
    });

    it('digital-menu-board has the most columns', () => {
      const dmb = getDeviceLayout('digital-menu-board');
      const desktop = getDeviceLayout('desktop');
      expect(dmb.columns).toBeGreaterThan(desktop.columns);
    });

    it('mobile has 1 column', () => {
      expect(getDeviceLayout('mobile').columns).toBe(1);
    });

    it('kiosk and digital-menu-board are touch or non-touch accordingly', () => {
      expect(getDeviceLayout('kiosk').touch).toBe(true);
      expect(getDeviceLayout('digital-menu-board').touch).toBe(false);
    });
  });
});
