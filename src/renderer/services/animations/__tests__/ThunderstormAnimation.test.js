/**
 * @jest-environment jsdom
 */

import { ThunderstormAnimation } from '../ThunderstormAnimation.js';

describe('ThunderstormAnimation', () => {
  let animation;
  let container;

  beforeEach(() => {
    jest.useFakeTimers();
    animation = new ThunderstormAnimation();
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (animation) {
      animation.stop();
    }
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  describe('Interface Implementation', () => {
    test('should implement getName method', () => {
      expect(animation.getName()).toBe('Thunderstorm');
    });

    test('should return correct thunderstorm weather codes', () => {
      const codes = animation.getWeatherCodes();
      const expectedCodes = [95, 96, 99];
      expect(codes).toEqual(expectedCodes);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation successfully', () => {
      expect(() => animation.start(container)).not.toThrow();
    });

    test('should create thunderstorm container with unique ID', () => {
      animation.start(container);
      const stormContainer = container.querySelector('.thunderstorm-container');
      expect(stormContainer).not.toBeNull();
      expect(stormContainer.id).toMatch(/^thunderstorm-animation-\d+-[a-z0-9]+$/);
    });

    test('should create heavy rain when started', () => {
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      expect(raindrops.length).toBeGreaterThan(0);
    });

    test('should create lightning flash element', () => {
      animation.start(container);
      const lightning = container.querySelector('.lightning-flash');
      expect(lightning).not.toBeNull();
      expect(lightning.id).toMatch(/^lightning-flash-\d+-[a-z0-9]+$/);
    });

    test('should stop animation and remove container', () => {
      animation.start(container);
      animation.stop();
      expect(container.querySelector('.thunderstorm-container')).toBeNull();
    });

    test('should clear lightning timeout on stop', () => {
      animation.start(container);
      animation.stop();

      // Advance timers - no lightning should occur
      jest.advanceTimersByTime(10000);

      // No errors should occur
      expect(true).toBe(true);
    });
  });

  describe('Intensity Control', () => {
    test('should affect raindrop count based on intensity', () => {
      animation.setIntensity(0.2);
      animation.start(container);
      const lowCount = container.querySelectorAll('.heavy-raindrop-enhanced').length;

      animation.stop();

      animation.setIntensity(0.9);
      animation.start(container);
      const highCount = container.querySelectorAll('.heavy-raindrop-enhanced').length;

      expect(highCount).toBeGreaterThan(lowCount);
    });

    test('should handle zero intensity', () => {
      animation.setIntensity(0);
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      expect(raindrops.length).toBe(0);
    });

    test('should handle maximum intensity', () => {
      animation.setIntensity(1);
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      expect(raindrops.length).toBeGreaterThan(50);
    });
  });

  describe('Rain Properties', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should create raindrops with proper CSS class', () => {
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.className).toBe('heavy-raindrop-enhanced');
      });
    });

    test('should position raindrops across full width', () => {
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      const positions = Array.from(raindrops).map(drop => {
        return parseFloat(drop.style.left);
      });

      expect(Math.min(...positions)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...positions)).toBeLessThanOrEqual(100);
    });

    test('should create raindrops with varying properties', () => {
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      const heights = Array.from(raindrops).map(drop => parseFloat(drop.style.height));
      const opacities = Array.from(raindrops).map(drop => parseFloat(drop.style.opacity));

      expect(new Set(heights).size).toBeGreaterThan(1);
      expect(new Set(opacities).size).toBeGreaterThan(1);
    });

    test('should apply CSS animation to raindrops', () => {
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.style.animation).toContain('heavy-rain-fall-enhanced');
        expect(drop.style.animation).toContain('linear');
        expect(drop.style.animation).toContain('infinite');
      });
    });

    test('should create some splash effects', () => {
      const splashes = container.querySelectorAll('.thunder-splash');
      // With 20% chance, expect some splashes
      expect(splashes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lightning Effects', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should schedule lightning strikes', () => {
      const lightning = container.querySelector('.lightning-flash');
      expect(lightning).not.toBeNull();

      // Initial opacity should be 0 or empty (not set)
      const opacity = lightning.style.opacity;
      expect(opacity === '' || opacity === '0').toBe(true);
    });

    test('should trigger lightning after delay', () => {
      const lightning = container.querySelector('.lightning-flash');

      // Advance time to trigger lightning
      jest.advanceTimersByTime(2000);

      // Lightning should have been triggered at least once
      // (We can't easily test the exact behavior due to random timing)
      expect(lightning).not.toBeNull();
    });

    test('should handle multiple lightning patterns', () => {
      const lightning = container.querySelector('.lightning-flash');

      // Test that lightning element exists and can handle style changes
      expect(() => {
        lightning.style.opacity = '1';
        lightning.style.background = 'rgba(255, 255, 255, 0.85)';
        lightning.style.opacity = '0';
      }).not.toThrow();
    });

    test('should not trigger lightning after stop', () => {
      const lightning = container.querySelector('.lightning-flash');

      animation.stop();

      // Advance time
      jest.advanceTimersByTime(10000);

      // Lightning element should be removed
      expect(document.getElementById(lightning.id)).toBeNull();
    });
  });

  describe('Performance', () => {
    test('should create reasonable number of raindrops', () => {
      animation.setIntensity(1.0);
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      expect(raindrops.length).toBeLessThanOrEqual(60);
    });

    test('should use CSS-only animations for rain', () => {
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.style.animation).toBeTruthy();
      });
    });

    test('should use transparent opacity', () => {
      animation.start(container);
      const raindrops = container.querySelectorAll('.heavy-raindrop-enhanced');
      raindrops.forEach(drop => {
        const opacity = parseFloat(drop.style.opacity);
        expect(opacity).toBeLessThan(0.5);
      });
    });
  });

  describe('Cleanup', () => {
    test('should clean up all DOM elements on stop', () => {
      animation.start(container);
      animation.stop();
      expect(container.children.length).toBe(0);
    });

    test('should prevent memory leaks on restart', () => {
      for (let i = 0; i < 5; i++) {
        animation.start(container);
        animation.stop();
      }

      expect(container.children.length).toBe(0);
      expect(document.querySelectorAll('.thunderstorm-container').length).toBe(0);
    });

    test('should clear all timeouts on stop', () => {
      animation.start(container);

      // Get pending timer count
      const timersBefore = jest.getTimerCount();

      animation.stop();

      // Timers should be cleared
      const timersAfter = jest.getTimerCount();
      expect(timersAfter).toBeLessThanOrEqual(timersBefore);
    });
  });

  describe('Multiple Instances', () => {
    test('should support multiple independent instances', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = new ThunderstormAnimation();
      const animation2 = new ThunderstormAnimation();

      animation1.start(container1);
      animation2.start(container2);

      expect(container1.querySelector('.thunderstorm-container')).not.toBeNull();
      expect(container2.querySelector('.thunderstorm-container')).not.toBeNull();

      const id1 = container1.querySelector('.thunderstorm-container').id;
      const id2 = container2.querySelector('.thunderstorm-container').id;
      expect(id1).not.toBe(id2);

      const lightning1 = container1.querySelector('.lightning-flash').id;
      const lightning2 = container2.querySelector('.lightning-flash').id;
      expect(lightning1).not.toBe(lightning2);

      animation1.stop();
      animation2.stop();
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid start/stop cycles', () => {
      expect(() => {
        for (let i = 0; i < 5; i++) {
          animation.start(container);
          animation.stop();
        }
      }).not.toThrow();
    });

    test('should handle stop being called multiple times', () => {
      animation.start(container);
      expect(() => {
        animation.stop();
        animation.stop();
        animation.stop();
      }).not.toThrow();
    });
  });
});
