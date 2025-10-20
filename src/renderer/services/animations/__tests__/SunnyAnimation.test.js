/**
 * @jest-environment jsdom
 */

import { SunnyAnimation } from '../SunnyAnimation.js';

describe('SunnyAnimation', () => {
  let animation;
  let container;

  beforeEach(() => {
    animation = new SunnyAnimation();
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
      expect(animation.getName()).toBe('Sunny');
    });

    test('should return correct sunny weather codes', () => {
      const codes = animation.getWeatherCodes();
      const expectedCodes = [0, 1];
      expect(codes).toEqual(expectedCodes);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation successfully', () => {
      expect(() => animation.start(container)).not.toThrow();
    });

    test('should create sunny container with unique ID', () => {
      animation.start(container);
      const sunnyContainer = container.querySelector('.sunny-container-enhanced');
      expect(sunnyContainer).not.toBeNull();
      expect(sunnyContainer.id).toMatch(/^sunny-animation-\d+-[a-z0-9]+$/);
    });

    test('should create sun rays when started', () => {
      animation.start(container);
      const sunRays = container.querySelector('.sun-rays-enhanced');
      expect(sunRays).not.toBeNull();
    });

    test('should create light beams', () => {
      animation.start(container);
      const lightBeams = container.querySelectorAll('.light-beam');
      expect(lightBeams.length).toBe(4);
    });

    test('should create particles', () => {
      animation.start(container);
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      expect(particles.length).toBeGreaterThan(0);
    });

    test('should stop animation and remove container', () => {
      animation.start(container);
      animation.stop();
      expect(container.querySelector('.sunny-container-enhanced')).toBeNull();
    });
  });

  describe('Intensity Control', () => {
    test('should affect particle count based on intensity', () => {
      animation.setIntensity(0.2);
      animation.start(container);
      const lowCount = container.querySelectorAll('.sunny-particle-enhanced').length;

      animation.stop();

      animation.setIntensity(0.9);
      animation.start(container);
      const highCount = container.querySelectorAll('.sunny-particle-enhanced').length;

      expect(highCount).toBeGreaterThan(lowCount);
    });

    test('should handle zero intensity', () => {
      animation.setIntensity(0);
      animation.start(container);
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      expect(particles.length).toBe(0);
    });

    test('should handle maximum intensity', () => {
      animation.setIntensity(1);
      animation.start(container);
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      expect(particles.length).toBeGreaterThan(10);
    });
  });

  describe('Visual Elements', () => {
    beforeEach(() => {
      animation.start(container);
    });

    test('should create sun rays with proper opacity', () => {
      const sunRays = container.querySelector('.sun-rays-enhanced');
      const opacity = parseFloat(sunRays.style.opacity);
      expect(opacity).toBeLessThan(0.15);
    });

    test('should create light beams with rotation', () => {
      const lightBeams = container.querySelectorAll('.light-beam');
      const rotations = Array.from(lightBeams).map(beam => {
        const transform = beam.style.transform || beam.style.cssText;
        return transform;
      });

      // Should have different rotations
      expect(rotations.some(r => r.includes('rotate(0deg)'))).toBe(true);
      expect(rotations.some(r => r.includes('rotate(90deg)'))).toBe(true);
      expect(rotations.some(r => r.includes('rotate(180deg)'))).toBe(true);
      expect(rotations.some(r => r.includes('rotate(270deg)'))).toBe(true);
    });

    test('should create particles with proper CSS class', () => {
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      particles.forEach(particle => {
        expect(particle.className).toBe('sunny-particle-enhanced');
      });
    });

    test('should position particles across container', () => {
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      const positions = Array.from(particles).map(particle => {
        return parseFloat(particle.style.left);
      });

      expect(Math.min(...positions)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...positions)).toBeLessThanOrEqual(100);
    });

    test('should apply CSS animation to particles', () => {
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      particles.forEach(particle => {
        expect(particle.style.animation).toContain('sunny-float-optimized');
        expect(particle.style.animation).toContain('ease-in-out');
        expect(particle.style.animation).toContain('infinite');
      });
    });

    test('should use transparent opacity for particles', () => {
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      particles.forEach(particle => {
        const opacity = parseFloat(particle.style.opacity);
        expect(opacity).toBeLessThan(0.2);
      });
    });
  });

  describe('Performance', () => {
    test('should create reasonable number of particles', () => {
      animation.setIntensity(1.0);
      animation.start(container);
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      expect(particles.length).toBeLessThanOrEqual(15);
    });

    test('should use CSS-only animations', () => {
      animation.start(container);
      const particles = container.querySelectorAll('.sunny-particle-enhanced');
      particles.forEach(particle => {
        expect(particle.style.animation).toBeTruthy();
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

      const animation1 = new SunnyAnimation();
      const animation2 = new SunnyAnimation();

      animation1.start(container1);
      animation2.start(container2);

      const id1 = container1.querySelector('.sunny-container-enhanced').id;
      const id2 = container2.querySelector('.sunny-container-enhanced').id;
      expect(id1).not.toBe(id2);

      animation1.stop();
      animation2.stop();
    });
  });
});
