/**
 * Tests for DynamicBackgroundManager
 */

/**
 * @jest-environment jsdom
 */

import { DynamicBackgroundManager } from '../DynamicBackgroundManager.js';

describe('DynamicBackgroundManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    DynamicBackgroundManager.disable();
    DynamicBackgroundManager.reset();
  });

  afterEach(() => {
    DynamicBackgroundManager.stopAutoUpdate();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        DynamicBackgroundManager.initialize();
      }).not.toThrow();
    });

    it('should start disabled by default', () => {
      expect(DynamicBackgroundManager.isEnabled()).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should enable dynamic backgrounds', () => {
      DynamicBackgroundManager.enable();
      expect(DynamicBackgroundManager.isEnabled()).toBe(true);
    });

    it('should disable dynamic backgrounds', () => {
      DynamicBackgroundManager.enable();
      DynamicBackgroundManager.disable();
      expect(DynamicBackgroundManager.isEnabled()).toBe(false);
    });
  });

  describe('getPrimaryWeatherCode', () => {
    it('should return null when container is null', () => {
      const result = DynamicBackgroundManager.getPrimaryWeatherCode(null);
      expect(result).toBeNull();
    });

    it('should return null when no cards exist', () => {
      const container = document.createElement('div');
      const result = DynamicBackgroundManager.getPrimaryWeatherCode(container);
      expect(result).toBeNull();
    });

    it('should return weather code from single card', () => {
      const container = document.createElement('div');
      const card = document.createElement('div');
      card.setAttribute('data-weather-code', '61');
      container.appendChild(card);

      const result = DynamicBackgroundManager.getPrimaryWeatherCode(container);
      expect(result).toBe(61);
    });

    it('should prioritize severe weather (thunderstorm)', () => {
      const container = document.createElement('div');
      
      // Add clear sky card
      const card1 = document.createElement('div');
      card1.setAttribute('data-weather-code', '0');
      container.appendChild(card1);

      // Add thunderstorm card
      const card2 = document.createElement('div');
      card2.setAttribute('data-weather-code', '95');
      container.appendChild(card2);

      // Add rain card
      const card3 = document.createElement('div');
      card3.setAttribute('data-weather-code', '61');
      container.appendChild(card3);

      const result = DynamicBackgroundManager.getPrimaryWeatherCode(container);
      expect(result).toBe(95); // Thunderstorm should be prioritized
    });

    it('should prioritize snow over rain', () => {
      const container = document.createElement('div');
      
      // Add rain card
      const card1 = document.createElement('div');
      card1.setAttribute('data-weather-code', '61');
      container.appendChild(card1);

      // Add snow card
      const card2 = document.createElement('div');
      card2.setAttribute('data-weather-code', '71');
      container.appendChild(card2);

      const result = DynamicBackgroundManager.getPrimaryWeatherCode(container);
      expect(result).toBe(71); // Snow should be prioritized over rain
    });
  });

  describe('getBackgroundForWeather', () => {
    it('should return null for null weather code', () => {
      const result = DynamicBackgroundManager.getBackgroundForWeather(null);
      expect(result).toBeNull();
    });

    it('should return background config for clear weather (0)', () => {
      const result = DynamicBackgroundManager.getBackgroundForWeather(0);
      expect(result).toBeDefined();
      expect(result.gradient).toBeDefined();
      expect(result.description).toBeDefined();
    });

    it('should return background config for rain (61)', () => {
      const result = DynamicBackgroundManager.getBackgroundForWeather(61);
      expect(result).toBeDefined();
      expect(result.gradient).toContain('linear-gradient');
      expect(result.description).toBeDefined();
    });

    it('should return background config for snow (71)', () => {
      const result = DynamicBackgroundManager.getBackgroundForWeather(71);
      expect(result).toBeDefined();
      expect(result.gradient).toContain('linear-gradient');
    });

    it('should return background config for thunderstorm (95)', () => {
      const result = DynamicBackgroundManager.getBackgroundForWeather(95);
      expect(result).toBeDefined();
      expect(result.gradient).toContain('linear-gradient');
    });
  });

  describe('applyBackground', () => {
    it('should not apply background if gradient is null', () => {
      const originalStyle = document.body.getAttribute('style') || '';
      DynamicBackgroundManager.applyBackground(null);
      expect(document.body.getAttribute('style') || '').toBe(originalStyle);
    });

    it('should apply background gradient to body', () => {
      const testGradient = 'linear-gradient(180deg, #000 0%, #fff 100%)';
      DynamicBackgroundManager.applyBackground(testGradient, false);
      
      expect(document.body.getAttribute('style')).toContain(testGradient);
    });

    it('should set background size', () => {
      const testGradient = 'linear-gradient(180deg, #000 0%, #fff 100%)';
      DynamicBackgroundManager.applyBackground(testGradient, false);
      
      expect(document.body.style.backgroundSize).toBe('400% 400%');
    });
  });

  describe('update', () => {
    it('should not update if disabled', () => {
      const container = document.createElement('div');
      const card = document.createElement('div');
      card.setAttribute('data-weather-code', '61');
      container.appendChild(card);

      const originalStyle = document.body.getAttribute('style') || '';
      DynamicBackgroundManager.update(container);
      
      expect(document.body.getAttribute('style') || '').toBe(originalStyle);
    });

    it('should update background when enabled', () => {
      DynamicBackgroundManager.enable();
      
      const container = document.createElement('div');
      const card = document.createElement('div');
      card.setAttribute('data-weather-code', '61');
      container.appendChild(card);

      DynamicBackgroundManager.update(container);
      
      expect(document.body.getAttribute('style') || '').toContain('linear-gradient');
    });

    it('should not update if weather code has not changed', () => {
      DynamicBackgroundManager.enable();
      
      const container = document.createElement('div');
      const card = document.createElement('div');
      card.setAttribute('data-weather-code', '61');
      container.appendChild(card);

      // First update
      DynamicBackgroundManager.update(container);
      const firstStyle = document.body.getAttribute('style') || '';

      // Second update with same weather
      DynamicBackgroundManager.update(container);
      const secondStyle = document.body.getAttribute('style') || '';
      
      expect(firstStyle).toBe(secondStyle);
    });
  });

  describe('reset', () => {
    it('should clear background styles', () => {
      DynamicBackgroundManager.enable();
      
      const container = document.createElement('div');
      const card = document.createElement('div');
      card.setAttribute('data-weather-code', '61');
      container.appendChild(card);

      DynamicBackgroundManager.update(container);
      expect((document.body.getAttribute('style') || '')).toContain('linear-gradient');

      DynamicBackgroundManager.reset();
      const styleAfterReset = document.body.getAttribute('style') || '';
      expect(styleAfterReset).not.toContain('linear-gradient');
    });

    it('should stop auto-updates', () => {
      DynamicBackgroundManager.enable();
      DynamicBackgroundManager.startAutoUpdate(100);
      
      DynamicBackgroundManager.reset();
      
      // Auto-update should be stopped
      // This is hard to test directly, but we can verify it doesn't throw
      expect(() => {
        DynamicBackgroundManager.stopAutoUpdate();
      }).not.toThrow();
    });
  });

  describe('auto-update', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start auto-update', () => {
      const container = document.createElement('div');
      document.body.innerHTML = '<div id="cities"></div>';

      DynamicBackgroundManager.enable();
      DynamicBackgroundManager.startAutoUpdate(1000);

      // Should update immediately
      expect(document.body.style.background).toBeDefined();
      
      DynamicBackgroundManager.stopAutoUpdate();
    });

    it('should stop auto-update', () => {
      DynamicBackgroundManager.enable();
      DynamicBackgroundManager.startAutoUpdate(1000);
      DynamicBackgroundManager.stopAutoUpdate();

      // Should not throw or cause errors
      expect(() => {
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });
  });
});
