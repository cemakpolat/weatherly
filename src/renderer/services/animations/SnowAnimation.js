/**
 * Snow Animation (Single Responsibility Principle)
 *
 * This class is responsible for creating and managing snow animation effects.
 */

import { IWeatherAnimation } from './IWeatherAnimation.js';

export class SnowAnimation extends IWeatherAnimation {
  #container = null;
  #snowflakes = [];
  #animationFrame = null;
  #intensity = 0.5;
  #snowContainerId = null;

  getName() {
    return 'Snow';
  }

  getWeatherCodes() {
    // Snow weather codes from Open-Meteo
    return [71, 73, 75, 77, 85, 86];
  }

  start(container) {
    this.stop();
    this.#container = container;

    // Create snow container with unique ID
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    snowContainer.id = `snow-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#snowContainerId = snowContainer.id; // Store ID for cleanup
    this.#container.appendChild(snowContainer);

    // Create snowflakes
    this.#createSnowflakes(snowContainer);
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#snowContainerId) {
      const snowContainer = document.getElementById(this.#snowContainerId);
      if (snowContainer) {
        snowContainer.remove();
      }
      this.#snowContainerId = null;
    }

    this.#snowflakes = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createSnowflakes(container) {
    const flakeCount = Math.floor(30 * this.#intensity); // Reduced from 100
    const flakeVariants = ['❄', '❅', '❆'];

    for (let i = 0; i < flakeCount; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake-enhanced';
      flake.innerHTML = flakeVariants[Math.floor(Math.random() * flakeVariants.length)];

      const x = Math.random() * 110 - 5;
      const y = Math.random() * 100; // Start distributed across screen
      const size = 10 + Math.random() * 12;
      const opacity = 0.2 + Math.random() * 0.3; // More transparent
      const duration = 15 + Math.random() * 10; // Slower fall
      const delay = Math.random() * 5;

      flake.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        font-size: ${size}px;
        opacity: ${opacity};
        text-shadow: 0 0 ${size / 4}px rgba(255, 255, 255, 0.5);
        animation: snow-fall-optimized ${duration}s linear infinite;
        animation-delay: ${delay}s;
      `;

      container.appendChild(flake);
    }
  }

  #animate() {
    // Using CSS animations only - no JavaScript animation loop
  }
}
