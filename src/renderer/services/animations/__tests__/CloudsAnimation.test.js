/**
 * @jest-environment jsdom
 */

import { CloudsAnimation } from '../CloudsAnimation.js';

describe('CloudsAnimation', () => {
  let animation;
  let container;

  beforeEach(() => {
    animation = new CloudsAnimation();
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
  });

  describe('Interface Implementation', () => {
    test('should implement getName method', () => {
      expect(animation.getName()).toBe('Clouds');
    });

    test('should return correct cloud weather codes', () => {
      const codes = animation.getWeatherCodes();
      const expectedCodes = [2, 3, 45, 48];
      expect(codes).toEqual(expectedCodes);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation successfully', () => {
      expect(() => animation.start(container)).not.toThrow();
    });

    test('should create clouds container with unique ID', () => {
      animation.start(container);
      const cloudsContainer = container.querySelector('.clouds-container');
      expect(cloudsContainer).not.toBeNull();
      expect(cloudsContainer.id).toMatch(/^clouds-animation-\d+-[a-z0-9]+$/);
    });

    test('should create clouds when started', () => {
      animation.start(container);
      const clouds = container.querySelectorAll('.cloud-enhanced');
      expect(clouds.length).toBeGreaterThan(0);
    });

    test('should stop animation and remove container', () => {
      animation.start(container);
      animation.stop();
      expect(container.querySelector('.clouds-container')).toBeNull();
    });
  });

  describe('Intensity Control', () => {
    test('should affect cloud count based on intensity', () => {
      animation.setIntensity(0.2);
      animation.start(container);
      const lowCount = container.querySelectorAll('.cloud-enhanced').length;

      animation.stop();

      animation.setIntensity(0.9);
      animation.start(container);
      const highCount = container.querySelectorAll('.cloud-enhanced').length;

      expect(highCount).toBeGreaterThan(lowCount);
    });

    test('should handle minimum intensity', () => {
      animation.setIntensity(0);
      animation.start(container);
      const clouds = container.querySelectorAll('.cloud-enhanced');
      expect(clouds.length).toBeGreaterThanOrEqual(4); // Minimum 4 clouds
    });

    test('should handle maximum intensity', () => {
      animation.setIntensity(1);
      animation.start(container);
      const clouds = container.querySelectorAll('.cloud-enhanced');
      expect(clouds.length).toBeLessThanOrEqual(8); // Maximum 8 clouds
    });
  });

  describe('Cloud Properties', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should create clouds with proper CSS class', () => {
      const clouds = container.querySelectorAll('.cloud-enhanced');
      clouds.forEach(cloud => {
        expect(cloud.className).toBe('cloud-enhanced');
      });
    });

    test('should create clouds with bubble shapes', () => {
      const clouds = container.querySelectorAll('.cloud-enhanced');
      clouds.forEach(cloud => {
        const bubbles = cloud.querySelectorAll('.cloud-bubble-enhanced');
        expect(bubbles.length).toBe(3);
      });
    });

    test('should position clouds across container', () => {
      const clouds = container.querySelectorAll('.cloud-enhanced');
      const positions = Array.from(clouds).map(cloud => {
        return parseFloat(cloud.style.left);
      });

      expect(Math.min(...positions)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...positions)).toBeLessThanOrEqual(110);
    });

    test('should apply CSS animation to clouds', () => {
      const clouds = container.querySelectorAll('.cloud-enhanced');
      clouds.forEach(cloud => {
        expect(cloud.style.animation).toContain('cloud-drift');
        expect(cloud.style.animation).toContain('linear');
        expect(cloud.style.animation).toContain('infinite');
      });
    });

    test('should use transparent opacity', () => {
      const clouds = container.querySelectorAll('.cloud-enhanced');
      clouds.forEach(cloud => {
        const opacity = parseFloat(cloud.style.opacity);
        expect(opacity).toBeLessThan(0.3);
      });
    });
  });

  describe('Performance', () => {
    test('should create reasonable number of clouds', () => {
      animation.setIntensity(1.0);
      animation.start(container);
      const clouds = container.querySelectorAll('.cloud-enhanced');
      expect(clouds.length).toBeLessThanOrEqual(8);
    });

    test('should use CSS-only animations', () => {
      animation.start(container);
      const clouds = container.querySelectorAll('.cloud-enhanced');
      clouds.forEach(cloud => {
        expect(cloud.style.animation).toBeTruthy();
      });
    });
  });

  describe('Cleanup', () => {
    test('should clean up all DOM elements on stop', () => {
      animation.start(container);
      animation.stop();
      expect(container.children.length).toBe(0);
    });

    test('should support multiple independent instances', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = new CloudsAnimation();
      const animation2 = new CloudsAnimation();

      animation1.start(container1);
      animation2.start(container2);

      const id1 = container1.querySelector('.clouds-container').id;
      const id2 = container2.querySelector('.clouds-container').id;
      expect(id1).not.toBe(id2);

      animation1.stop();
      animation2.stop();
    });
  });
});
