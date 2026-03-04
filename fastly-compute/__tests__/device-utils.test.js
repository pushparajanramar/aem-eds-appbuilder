/**
 * Tests for shared/device-utils.js (Fastly Compute ESM version)
 */

import {
  DEVICE_TYPES,
  DEFAULT_DEVICE_TYPE,
  DEVICE_LAYOUT,
  getDeviceType,
  getDeviceLayout,
  isHeadless,
} from '../src/shared/device-utils.js';

describe('device-utils', () => {
  describe('DEVICE_TYPES', () => {
    it('contains all six supported device classes', () => {
      expect(DEVICE_TYPES.has('mobile')).toBe(true);
      expect(DEVICE_TYPES.has('tablet')).toBe(true);
      expect(DEVICE_TYPES.has('desktop')).toBe(true);
      expect(DEVICE_TYPES.has('kiosk')).toBe(true);
      expect(DEVICE_TYPES.has('digital-menu-board')).toBe(true);
      expect(DEVICE_TYPES.has('headless')).toBe(true);
    });
  });

  describe('DEFAULT_DEVICE_TYPE', () => {
    it('is desktop', () => {
      expect(DEFAULT_DEVICE_TYPE).toBe('desktop');
    });
  });

  describe('getDeviceType', () => {
    function mockRequest(headers = {}, url = 'https://example.com/test') {
      return new Request(url, { headers });
    }

    it('returns desktop when no device info is present', () => {
      expect(getDeviceType(mockRequest())).toBe('desktop');
    });

    it('reads X-Device-Type from request headers (Fastly VCL header)', () => {
      expect(getDeviceType(mockRequest({ 'x-device-type': 'mobile' }))).toBe('mobile');
      expect(getDeviceType(mockRequest({ 'x-device-type': 'kiosk' }))).toBe('kiosk');
      expect(getDeviceType(mockRequest({ 'x-device-type': 'digital-menu-board' }))).toBe('digital-menu-board');
      expect(getDeviceType(mockRequest({ 'x-device-type': 'headless' }))).toBe('headless');
    });

    it('falls back to desktop for an unknown header value', () => {
      expect(getDeviceType(mockRequest({ 'x-device-type': 'smart-fridge' }))).toBe('desktop');
    });

    it('reads ?device= from query string when no header is present', () => {
      expect(getDeviceType(mockRequest({}, 'https://example.com/test?device=kiosk'))).toBe('kiosk');
      expect(getDeviceType(mockRequest({}, 'https://example.com/test?device=mobile'))).toBe('mobile');
      expect(getDeviceType(mockRequest({}, 'https://example.com/test?device=headless'))).toBe('headless');
    });

    it('prefers header over query string', () => {
      expect(
        getDeviceType(mockRequest(
          { 'x-device-type': 'desktop' },
          'https://example.com/test?device=kiosk',
        )),
      ).toBe('desktop');
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

    it('headless has a valid layout entry', () => {
      const layout = getDeviceLayout('headless');
      expect(typeof layout.columns).toBe('number');
      expect(typeof layout.imageWidth).toBe('number');
      expect(typeof layout.fontSize).toBe('string');
      expect(typeof layout.touch).toBe('boolean');
    });
  });

  describe('isHeadless', () => {
    it('returns true for headless device type', () => {
      expect(isHeadless('headless')).toBe(true);
    });

    it('returns false for all non-headless device types', () => {
      expect(isHeadless('mobile')).toBe(false);
      expect(isHeadless('tablet')).toBe(false);
      expect(isHeadless('desktop')).toBe(false);
      expect(isHeadless('kiosk')).toBe(false);
      expect(isHeadless('digital-menu-board')).toBe(false);
    });

    it('returns false for unknown / falsy values', () => {
      expect(isHeadless('')).toBe(false);
      expect(isHeadless(null)).toBe(false);
      expect(isHeadless(undefined)).toBe(false);
    });
  });
});
