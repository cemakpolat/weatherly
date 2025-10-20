/**
 * Sunny Animation (Single Responsibility Principle)
 *
 * This class is responsible for creating and managing sunny/clear weather effects.
 */

import { IWeatherAnimation } from './IWeatherAnimation.js';

export class SunnyAnimation extends IWeatherAnimation {
  #container = null;
  #particles = [];
  #animationFrame = null;
  #intensity = 0.5;
  #sunnyContainerId = null;

  getName() {
    return 'Sunny';
  }

  getWeatherCodes() {
    // Clear sky and mainly clear weather codes
    return [0, 1];
  }

  start(container) {
    this.stop();
    this.#container = container;

    // Create sunny container with unique ID
    const sunnyContainer = document.createElement('div');
    sunnyContainer.className = 'sunny-container-enhanced';
    sunnyContainer.id = `sunny-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#sunnyContainerId = sunnyContainer.id; // Store ID for cleanup
    this.#container.appendChild(sunnyContainer);

    // Add single sun ray layer
    const sunRays = document.createElement('div');
    sunRays.className = 'sun-rays-enhanced';
    sunRays.style.opacity = '0.08'; // More transparent
    sunnyContainer.appendChild(sunRays);

    // Reduce light beams
    for (let i = 0; i < 4; i++) {
      const beam = document.createElement('div');
      beam.className = 'light-beam';
      beam.style.cssText = `
        transform: rotate(${i * 90}deg);
        opacity: 0.15;
      `;
      sunnyContainer.appendChild(beam);
    }

    // Create fewer particles
    this.#createParticles(sunnyContainer);
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#sunnyContainerId) {
      const sunnyContainer = document.getElementById(this.#sunnyContainerId);
      if (sunnyContainer) {
        sunnyContainer.remove();
      }
      this.#sunnyContainerId = null;
    }

    this.#particles = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createParticles(container) {
    const particleCount = Math.floor(15 * this.#intensity); // Reduced from 50

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'sunny-particle-enhanced';

      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = 2 + Math.random() * 2;
      const duration = 20 + Math.random() * 15;

      particle.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        opacity: 0.15;
        background: radial-gradient(circle, rgba(255, 255, 200, 0.4), transparent);
        animation: sunny-float-optimized ${duration}s ease-in-out infinite;
      `;

      container.appendChild(particle);
    }
  }

  #animate() {
    // Using CSS animations only
  }
}
