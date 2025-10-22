/**
 * Clouds Animation (Single Responsibility Principle)
 *
 * This class is responsible for creating and managing cloudy weather effects.
 */

import { IWeatherAnimation } from './IWeatherAnimation.js';

export class CloudsAnimation extends IWeatherAnimation {
  #container = null;
  #clouds = [];
  #animationFrame = null;
  #intensity = 0.5;
  #cloudsContainerId = null;

  getName() {
    return 'Clouds';
  }

  getWeatherCodes() {
    // Partly cloudy, overcast, and foggy weather codes
    return [2, 3, 45, 48];
  }

  start(container) {
    this.stop();
    this.#container = container;

    // Create clouds container with unique ID
    const cloudsContainer = document.createElement('div');
    cloudsContainer.className = 'clouds-container';
    cloudsContainer.id = `clouds-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#cloudsContainerId = cloudsContainer.id; // Store ID for cleanup
    this.#container.appendChild(cloudsContainer);

    // Create clouds
    this.#createClouds(cloudsContainer);
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#cloudsContainerId) {
      const cloudsContainer = document.getElementById(this.#cloudsContainerId);
      if (cloudsContainer) {
        cloudsContainer.remove();
      }
      this.#cloudsContainerId = null;
    }

    this.#clouds = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createClouds(container) {
    const cloudCount = Math.floor(4 + 4 * this.#intensity); // Reduced from 8-20

    for (let i = 0; i < cloudCount; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud-enhanced';

      const x = Math.random() * 110;
      const y = Math.random() * 80;
      const scale = 0.5 + Math.random() * 0.8;
      const opacity = 0.08 + Math.random() * 0.12; // More transparent
      const duration = 60 + Math.random() * 40; // Slower movement

      cloud.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        transform: scale(${scale});
        opacity: ${opacity};
        animation: cloud-drift ${duration}s linear infinite;
      `;

      // Create cloud shape - simplified
      const bubbleCount = 3;
      for (let j = 0; j < bubbleCount; j++) {
        const bubble = document.createElement('div');
        bubble.className = 'cloud-bubble-enhanced';
        const bubbleSize = 40 + Math.random() * 20;
        const bubbleOffset = (j - 1) * 20;

        bubble.style.cssText = `
          width: ${bubbleSize}px;
          height: ${bubbleSize}px;
          margin-left: ${bubbleOffset}px;
        `;
        cloud.appendChild(bubble);
      }

      container.appendChild(cloud);
    }
  }

  #animate() {
    // Using CSS animations only
  }
}
