/**
 * TemperatureService Tests
 */

import { TemperatureService } from '../TemperatureService';

describe('TemperatureService', () => {
  beforeEach(() => {
    // Reset to default unit
    TemperatureService.currentUnit = 'celsius';
  });

  describe('celsiusToFahrenheit', () => {
    it('should convert 0°C to 32°F', () => {
      expect(TemperatureService.celsiusToFahrenheit(0)).toBe(32);
    });

    it('should convert 100°C to 212°F', () => {
      expect(TemperatureService.celsiusToFahrenheit(100)).toBe(212);
    });

    it('should convert -40°C to -40°F', () => {
      expect(TemperatureService.celsiusToFahrenheit(-40)).toBe(-40);
    });
  });

  describe('fahrenheitToCelsius', () => {
    it('should convert 32°F to 0°C', () => {
      expect(TemperatureService.fahrenheitToCelsius(32)).toBe(0);
    });

    it('should convert 212°F to 100°C', () => {
      expect(TemperatureService.fahrenheitToCelsius(212)).toBe(100);
    });
  });

  describe('format', () => {
    it('should format temperature in Celsius by default', () => {
      const formatted = TemperatureService.format(25);
      expect(formatted).toBe('25°C');
    });

    it('should format temperature in Fahrenheit when specified', () => {
      const formatted = TemperatureService.format(25, 'fahrenheit');
      expect(formatted).toBe('77°F');
    });

    it('should handle negative temperatures', () => {
      expect(TemperatureService.format(-10)).toBe('-10°C');
    });

    it('should handle zero temperature', () => {
      expect(TemperatureService.format(0)).toBe('0°C');
    });

    it('should return N/A for null values', () => {
      expect(TemperatureService.format(null)).toBe('N/A');
    });

    it('should return N/A for undefined values', () => {
      expect(TemperatureService.format(undefined)).toBe('N/A');
    });
  });

  describe('formatValue', () => {
    it('should format temperature value without symbol', () => {
      const value = TemperatureService.formatValue(25.7);
      expect(value).toBe(26);
    });

    it('should return null for invalid values', () => {
      expect(TemperatureService.formatValue(null)).toBeNull();
    });
  });

  describe('currentUnit', () => {
    it('should return celsius by default', () => {
      expect(TemperatureService.currentUnit).toBe('celsius');
    });

    it('should allow setting unit to fahrenheit', () => {
      TemperatureService.currentUnit = 'fahrenheit';
      expect(TemperatureService.currentUnit).toBe('fahrenheit');
    });

    it('should reject invalid units and keep current value', () => {
      // First set a valid unit
      TemperatureService.currentUnit = 'fahrenheit';
      // Try to set invalid unit
      TemperatureService.currentUnit = 'invalid';
      // Should still be fahrenheit
      expect(TemperatureService.currentUnit).toBe('fahrenheit');
    });
  });

  describe('getUnitSymbol', () => {
    it('should return °C for celsius', () => {
      expect(TemperatureService.getUnitSymbol('celsius')).toBe('°C');
    });

    it('should return °F for fahrenheit', () => {
      expect(TemperatureService.getUnitSymbol('fahrenheit')).toBe('°F');
    });

    it('should return °C by default', () => {
      expect(TemperatureService.getUnitSymbol()).toBe('°C');
    });
  });

  describe('edge cases', () => {
    it('should handle very large temperatures', () => {
      const formatted = TemperatureService.format(1000);
      expect(formatted).toBe('1000°C');
    });

    it('should handle very small temperatures', () => {
      const formatted = TemperatureService.format(-273);
      expect(formatted).toBe('-273°C');
    });

    it('should round decimal temperatures', () => {
      const result = TemperatureService.format(25.7);
      expect(result).toBe('26°C');
    });
  });
});
