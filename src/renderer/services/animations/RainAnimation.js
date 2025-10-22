/**
 * Rain Animation (Single Responsibility Principle)
 *
 * This class is responsible for creating and managing rain animation effects.
 */

import { IWeatherAnimation } from './IWeatherAnimation.js';

export class RainAnimation extends IWeatherAnimation {
  #container = null;
  #raindrops = [];
  #animationFrame = null;
  #intensity = 0.5;
  #rainContainerId = null;

  getName() {
    return 'Rain';
  }

  getWeatherCodes() {
    // Rain weather codes from Open-Meteo
    return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
  }

  start(container) {
    this.stop(); // Clean up any existing animation
    this.#container = container;

    // Create rain container with unique ID
    const rainContainer = document.createElement('div');
    rainContainer.className = 'rain-container';
    rainContainer.id = `rain-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#rainContainerId = rainContainer.id; // Store ID for cleanup
    this.#container.appendChild(rainContainer);

    // Create raindrops
    this.#createRaindrops(rainContainer);
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#rainContainerId) {
      const rainContainer = document.getElementById(this.#rainContainerId);
      if (rainContainer) {
        rainContainer.remove();
      }
      this.#rainContainerId = null;
    }

    this.#raindrops = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createRaindrops(container) {
    const dropCount = Math.floor(50 * this.#intensity); // Reduced from 150

    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('div');
      drop.className = 'raindrop-enhanced';

      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const height = 30 + Math.random() * 20;
      const speed = 0.3 + Math.random() * 0.3;

      drop.style.cssText = `
        left: ${left}%;
        top: -${height}px;
        height: ${height}px;
        width: ${1 + Math.random() * 1}px;
        opacity: ${0.15 + Math.random() * 0.15};
        animation: rain-fall-enhanced ${speed}s linear infinite;
        animation-delay: ${delay}s;
        background: linear-gradient(to bottom,
          rgba(174, 214, 241, 0) 0%,
          rgba(174, 214, 241, 0.25) 20%,
          rgba(174, 214, 241, 0.4) 100%);
      `;

      container.appendChild(drop);

      // Create splash effect - less frequently
      if (Math.random() < 0.15) {
        const splash = document.createElement('div');
        splash.className = 'rain-splash';
        splash.style.cssText = `
          left: ${left}%;
          bottom: 0;
          animation: splash-animate ${speed}s linear infinite;
          animation-delay: ${delay + speed}s;
        `;
        container.appendChild(splash);
      }

      this.#raindrops.push({
        element: drop,
        x: left,
        y: -height,
        speed: 3 + Math.random() * 3,
      });
    }
  }

  #animate() {
    // Removed animate loop - using CSS animations only for better performance
  }
}
