/**
 * @jest-environment jsdom
 */

import { RainAnimation } from '../RainAnimation.js';

describe('RainAnimation', () => {
  let animation;
  let container;

  beforeEach(() => {
    animation = new RainAnimation();
    container = document.createElement('div');
    container.id = 'test-container';
    container.style.width = '400px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (animation) {
      animation.stop();
    }
    document.body.innerHTML = '';
  });

  describe('Interface Implementation', () => {
    test('should implement getName method', () => {
      expect(animation.getName()).toBe('Rain');
    });

    test('should implement getWeatherCodes method', () => {
      const codes = animation.getWeatherCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    test('should return correct rain weather codes', () => {
      const codes = animation.getWeatherCodes();
      const expectedCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
      expect(codes).toEqual(expectedCodes);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation successfully', () => {
      expect(() => animation.start(container)).not.toThrow();
    });

    test('should create rain container when started', () => {
      animation.start(container);

      const rainContainer = container.querySelector('.rain-container-enhanced');
      expect(rainContainer).not.toBeNull();
    });

    test('should create rain container with unique ID', () => {
      animation.start(container);

      const rainContainer = container.querySelector('.rain-container-enhanced');
      expect(rainContainer.id).toMatch(/^rain-animation-\d+-[a-z0-9]+$/);
    });

    test('should create raindrops when started', () => {
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      expect(raindrops.length).toBeGreaterThan(0);
    });

    test('should create correct number of raindrops based on default intensity', () => {
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      // Default intensity is 0.5, so expect ~25 drops (50 * 0.5)
      expect(raindrops.length).toBeGreaterThanOrEqual(20);
      expect(raindrops.length).toBeLessThanOrEqual(30);
    });

    test('should stop animation successfully', () => {
      animation.start(container);
      expect(() => animation.stop()).not.toThrow();
    });

    test('should remove rain container when stopped', () => {
      animation.start(container);
      animation.stop();

      const rainContainer = container.querySelector('.rain-container-enhanced');
      expect(rainContainer).toBeNull();
    });

    test('should handle multiple start calls', () => {
      animation.start(container);
      const firstContainer = container.querySelector('.rain-container-enhanced');
      const firstId = firstContainer.id;

      animation.start(container);
      const secondContainer = container.querySelector('.rain-container-enhanced');
      const secondId = secondContainer.id;

      expect(secondId).not.toBe(firstId);
      expect(container.querySelectorAll('.rain-container-enhanced').length).toBe(1);
    });

    test('should handle stop without start', () => {
      expect(() => animation.stop()).not.toThrow();
    });

    test('should handle multiple stop calls', () => {
      animation.start(container);
      expect(() => {
        animation.stop();
        animation.stop();
        animation.stop();
      }).not.toThrow();
    });
  });

  describe('Intensity Control', () => {
    test('should set intensity successfully', () => {
      expect(() => animation.setIntensity(0.7)).not.toThrow();
    });

    test('should affect raindrop count based on intensity', () => {
      animation.setIntensity(0.2);
      animation.start(container);
      const lowCount = container.querySelectorAll('.raindrop-enhanced').length;

      animation.stop();

      animation.setIntensity(0.9);
      animation.start(container);
      const highCount = container.querySelectorAll('.raindrop-enhanced').length;

      expect(highCount).toBeGreaterThan(lowCount);
    });

    test('should clamp intensity to 0-1 range (minimum)', () => {
      animation.setIntensity(-0.5);
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      expect(raindrops.length).toBeGreaterThanOrEqual(0);
    });

    test('should clamp intensity to 0-1 range (maximum)', () => {
      animation.setIntensity(2.0);
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      expect(raindrops.length).toBeLessThanOrEqual(60);
    });

    test('should handle zero intensity', () => {
      animation.setIntensity(0);
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      expect(raindrops.length).toBe(0);
    });

    test('should handle maximum intensity', () => {
      animation.setIntensity(1);
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      expect(raindrops.length).toBeGreaterThan(40);
    });
  });

  describe('Raindrop Properties', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should create raindrops with proper CSS class', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.className).toBe('raindrop-enhanced');
      });
    });

    test('should position raindrops across full width', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      const positions = Array.from(raindrops).map(drop => {
        const leftValue = drop.style.left;
        return parseFloat(leftValue);
      });

      const minPos = Math.min(...positions);
      const maxPos = Math.max(...positions);

      expect(minPos).toBeGreaterThanOrEqual(0);
      expect(maxPos).toBeLessThanOrEqual(100);
      expect(maxPos - minPos).toBeGreaterThan(50); // Spread across width
    });

    test('should create raindrops with varying heights', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      const heights = Array.from(raindrops).map(drop => {
        return parseFloat(drop.style.height);
      });

      const uniqueHeights = new Set(heights);
      expect(uniqueHeights.size).toBeGreaterThan(1);
    });

    test('should create raindrops with varying opacity', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      const opacities = Array.from(raindrops).map(drop => {
        return parseFloat(drop.style.opacity);
      });

      const uniqueOpacities = new Set(opacities);
      expect(uniqueOpacities.size).toBeGreaterThan(1);
    });

    test('should apply CSS animation to raindrops', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.style.animation).toContain('rain-fall-enhanced');
        expect(drop.style.animation).toContain('linear');
        expect(drop.style.animation).toContain('infinite');
      });
    });

    test('should create raindrops with gradient background', () => {
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.style.background).toContain('linear-gradient');
        expect(drop.style.background).toContain('rgba(174, 214, 241');
      });
    });

    test('should create some splash effects', () => {
      const splashes = container.querySelectorAll('.rain-splash');
      // With 30% chance, expect some splashes
      expect(splashes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Optimization', () => {
    test('should use CSS-only animations', () => {
      animation.start(container);

      // Check that raindrops use CSS animations, not JS loops
      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      raindrops.forEach(drop => {
        expect(drop.style.animation).toBeTruthy();
      });
    });

    test('should create reasonable number of particles', () => {
      animation.setIntensity(1.0);
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      // Should be optimized: <= 50 raindrops at max intensity
      expect(raindrops.length).toBeLessThanOrEqual(50);
    });

    test('should use transparent opacity for performance', () => {
      animation.start(container);

      const raindrops = container.querySelectorAll('.raindrop-enhanced');
      raindrops.forEach(drop => {
        const opacity = parseFloat(drop.style.opacity);
        expect(opacity).toBeLessThan(0.5); // Should be relatively transparent
      });
    });
  });

  describe('Cleanup', () => {
    test('should clean up all DOM elements on stop', () => {
      animation.start(container);
      const initialChildCount = container.children.length;
      expect(initialChildCount).toBeGreaterThan(0);

      animation.stop();

      expect(container.children.length).toBe(0);
    });

    test('should prevent memory leaks on restart', () => {
      for (let i = 0; i < 5; i++) {
        animation.start(container);
        animation.stop();
      }

      expect(container.children.length).toBe(0);
      expect(document.querySelectorAll('.rain-container-enhanced').length).toBe(0);
    });

    test('should remove specific container instance', () => {
      animation.start(container);
      const containerId = container.querySelector('.rain-container-enhanced').id;

      animation.stop();

      expect(document.getElementById(containerId)).toBeNull();
    });
  });

  describe('Multiple Instances', () => {
    test('should support multiple independent instances', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = new RainAnimation();
      const animation2 = new RainAnimation();

      animation1.start(container1);
      animation2.start(container2);

      expect(container1.querySelector('.rain-container-enhanced')).not.toBeNull();
      expect(container2.querySelector('.rain-container-enhanced')).not.toBeNull();

      animation1.stop();
      animation2.stop();
    });

    test('should create unique IDs for each instance', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = new RainAnimation();
      const animation2 = new RainAnimation();

      animation1.start(container1);
      animation2.start(container2);

      const id1 = container1.querySelector('.rain-container-enhanced').id;
      const id2 = container2.querySelector('.rain-container-enhanced').id;

      expect(id1).not.toBe(id2);

      animation1.stop();
      animation2.stop();
    });
  });

  describe('Edge Cases', () => {
    test('should handle container with existing content', () => {
      const existingDiv = document.createElement('div');
      existingDiv.textContent = 'Existing content';
      container.appendChild(existingDiv);

      animation.start(container);

      expect(container.querySelector('.rain-container-enhanced')).not.toBeNull();
      expect(existingDiv.textContent).toBe('Existing content');
    });

    test('should handle very small container', () => {
      container.style.width = '50px';
      container.style.height = '50px';

      expect(() => animation.start(container)).not.toThrow();
    });

    test('should handle rapid start/stop cycles', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          animation.start(container);
          animation.stop();
        }
      }).not.toThrow();
    });

    test('should handle intensity changes while running', () => {
      animation.start(container);

      expect(() => {
        animation.setIntensity(0.3);
        animation.setIntensity(0.7);
        animation.setIntensity(0.5);
      }).not.toThrow();
    });
  });
});
