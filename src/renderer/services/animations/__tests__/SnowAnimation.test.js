/**
 * @jest-environment jsdom
 */

import { SnowAnimation } from '../SnowAnimation.js';

describe('SnowAnimation', () => {
  let animation;
  let container;

  beforeEach(() => {
    animation = new SnowAnimation();
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
      expect(animation.getName()).toBe('Snow');
    });

    test('should implement getWeatherCodes method', () => {
      const codes = animation.getWeatherCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    test('should return correct snow weather codes', () => {
      const codes = animation.getWeatherCodes();
      const expectedCodes = [71, 73, 75, 77, 85, 86];
      expect(codes).toEqual(expectedCodes);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation successfully', () => {
      expect(() => animation.start(container)).not.toThrow();
    });

    test('should create snow container when started', () => {
      animation.start(container);
      const snowContainer = container.querySelector('.snow-container');
      expect(snowContainer).not.toBeNull();
    });

    test('should create snow container with unique ID', () => {
      animation.start(container);
      const snowContainer = container.querySelector('.snow-container');
      expect(snowContainer.id).toMatch(/^snow-animation-\d+-[a-z0-9]+$/);
    });

    test('should create snowflakes when started', () => {
      animation.start(container);
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      expect(snowflakes.length).toBeGreaterThan(0);
    });

    test('should stop animation successfully', () => {
      animation.start(container);
      expect(() => animation.stop()).not.toThrow();
    });

    test('should remove snow container when stopped', () => {
      animation.start(container);
      animation.stop();
      const snowContainer = container.querySelector('.snow-container');
      expect(snowContainer).toBeNull();
    });
  });

  describe('Intensity Control', () => {
    test('should set intensity successfully', () => {
      expect(() => animation.setIntensity(0.7)).not.toThrow();
    });

    test('should affect snowflake count based on intensity', () => {
      animation.setIntensity(0.2);
      animation.start(container);
      const lowCount = container.querySelectorAll('.snowflake-enhanced').length;

      animation.stop();

      animation.setIntensity(0.9);
      animation.start(container);
      const highCount = container.querySelectorAll('.snowflake-enhanced').length;

      expect(highCount).toBeGreaterThan(lowCount);
    });

    test('should handle zero intensity', () => {
      animation.setIntensity(0);
      animation.start(container);
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      expect(snowflakes.length).toBe(0);
    });

    test('should handle maximum intensity', () => {
      animation.setIntensity(1);
      animation.start(container);
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      expect(snowflakes.length).toBeGreaterThan(25);
    });
  });

  describe('Snowflake Properties', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should create snowflakes with proper CSS class', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      snowflakes.forEach(flake => {
        expect(flake.className).toBe('snowflake-enhanced');
      });
    });

    test('should use snowflake emoji variants', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      const validEmojis = ['❄', '❅', '❆'];

      snowflakes.forEach(flake => {
        expect(validEmojis).toContain(flake.innerHTML);
      });
    });

    test('should position snowflakes across full width', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      const positions = Array.from(snowflakes).map(flake => {
        return parseFloat(flake.style.left);
      });

      const minPos = Math.min(...positions);
      const maxPos = Math.max(...positions);

      expect(minPos).toBeGreaterThanOrEqual(-5);
      expect(maxPos).toBeLessThanOrEqual(110);
    });

    test('should create snowflakes with varying sizes', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      const sizes = Array.from(snowflakes).map(flake => {
        return parseFloat(flake.style.fontSize);
      });

      const uniqueSizes = new Set(sizes);
      expect(uniqueSizes.size).toBeGreaterThan(1);
    });

    test('should create snowflakes with varying opacity', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      const opacities = Array.from(snowflakes).map(flake => {
        return parseFloat(flake.style.opacity);
      });

      const uniqueOpacities = new Set(opacities);
      expect(uniqueOpacities.size).toBeGreaterThan(1);
    });

    test('should apply CSS animation to snowflakes', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      snowflakes.forEach(flake => {
        expect(flake.style.animation).toContain('snow-fall-optimized');
        expect(flake.style.animation).toContain('linear');
        expect(flake.style.animation).toContain('infinite');
      });
    });

    test('should apply text shadow for glow effect', () => {
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      snowflakes.forEach(flake => {
        expect(flake.style.textShadow).toContain('rgba(255, 255, 255');
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should use CSS-only animations', () => {
      animation.start(container);
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      snowflakes.forEach(flake => {
        expect(flake.style.animation).toBeTruthy();
      });
    });

    test('should create reasonable number of particles', () => {
      animation.setIntensity(1.0);
      animation.start(container);
      const totalElements = container.querySelectorAll('*').length;
      expect(totalElements).toBeLessThan(50);
    });

    test('should use transparent opacity for performance', () => {
      animation.start(container);
      const snowflakes = container.querySelectorAll('.snowflake-enhanced');
      snowflakes.forEach(flake => {
        const opacity = parseFloat(flake.style.opacity);
        expect(opacity).toBeLessThan(0.6);
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
      expect(document.querySelectorAll('.snow-container').length).toBe(0);
    });
  });

  describe('Multiple Instances', () => {
    test('should support multiple independent instances', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = new SnowAnimation();
      const animation2 = new SnowAnimation();

      animation1.start(container1);
      animation2.start(container2);

      expect(container1.querySelector('.snow-container')).not.toBeNull();
      expect(container2.querySelector('.snow-container')).not.toBeNull();

      const id1 = container1.querySelector('.snow-container').id;
      const id2 = container2.querySelector('.snow-container').id;
      expect(id1).not.toBe(id2);

      animation1.stop();
      animation2.stop();
    });
  });
});
