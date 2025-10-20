/**
 * Thunderstorm Animation (Single Responsibility Principle)
 *
 * This class is responsible for creating and managing thunderstorm effects.
 */

import { IWeatherAnimation } from './IWeatherAnimation.js';

export class ThunderstormAnimation extends IWeatherAnimation {
  #container = null;
  #raindrops = [];
  #animationFrame = null;
  #intensity = 0.5;
  #lightningTimeout = null;
  #stormContainerId = null;
  #lightningFlashId = null;

  getName() {
    return 'Thunderstorm';
  }

  getWeatherCodes() {
    // Thunderstorm weather codes
    return [95, 96, 99];
  }

  start(container) {
    this.stop();
    this.#container = container;

    // Create thunderstorm container with unique ID
    const stormContainer = document.createElement('div');
    stormContainer.className = 'thunderstorm-container';
    stormContainer.id = `thunderstorm-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#stormContainerId = stormContainer.id; // Store ID for cleanup
    this.#container.appendChild(stormContainer);

    // Create heavy rain
    this.#createRain(stormContainer);

    // Create lightning flash element with unique ID
    const lightning = document.createElement('div');
    lightning.className = 'lightning-flash';
    lightning.id = `lightning-flash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.#lightningFlashId = lightning.id; // Store ID for lightning effects
    stormContainer.appendChild(lightning);

    // Start lightning
    this.#scheduleLightning();
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    if (this.#lightningTimeout) {
      clearTimeout(this.#lightningTimeout);
      this.#lightningTimeout = null;
    }

    if (this.#stormContainerId) {
      const stormContainer = document.getElementById(this.#stormContainerId);
      if (stormContainer) {
        stormContainer.remove();
      }
      this.#stormContainerId = null;
      this.#lightningFlashId = null;
    }

    this.#raindrops = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createRain(container) {
    const dropCount = Math.floor(60 * this.#intensity); // Reduced from 200

    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('div');
      drop.className = 'heavy-raindrop-enhanced';

      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const height = 40 + Math.random() * 30;
      const speed = 0.2 + Math.random() * 0.15;

      drop.style.cssText = `
        left: ${left}%;
        top: -${height}px;
        height: ${height}px;
        width: ${2 + Math.random() * 1}px;
        opacity: ${0.2 + Math.random() * 0.2};
        animation: heavy-rain-fall-enhanced ${speed}s linear infinite;
        animation-delay: ${delay}s;
        background: linear-gradient(to bottom,
          rgba(174, 214, 241, 0) 0%,
          rgba(174, 214, 241, 0.3) 15%,
          rgba(174, 214, 241, 0.5) 100%);
      `;

      container.appendChild(drop);

      // Create splash effects less frequently
      if (Math.random() < 0.2) {
        const splash = document.createElement('div');
        splash.className = 'thunder-splash';
        splash.style.cssText = `
          left: ${left}%;
          bottom: 0;
          animation: thunder-splash-animate ${speed}s linear infinite;
          animation-delay: ${delay + speed}s;
        `;
        container.appendChild(splash);
      }

      this.#raindrops.push({
        element: drop,
        x: left,
        y: -height,
        speed: 5 + Math.random() * 4,
      });
    }
  }

  #animate() {
    // Using CSS animations only
  }

  #scheduleLightning() {
    // Random lightning strikes with varied intervals
    const nextStrike = 1500 + Math.random() * 6000;

    this.#lightningTimeout = setTimeout(() => {
      this.#createLightning();
      this.#scheduleLightning(); // Schedule next strike
    }, nextStrike);
  }

  #createLightning() {
    if (!this.#lightningFlashId) return;
    const flash = document.getElementById(this.#lightningFlashId);
    if (!flash) return;

    // Random lightning pattern
    const pattern = Math.floor(Math.random() * 3);

    if (pattern === 0) {
      // Single strong flash
      flash.style.background = 'rgba(255, 255, 255, 0.85)';
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
      }, 80);
    } else if (pattern === 1) {
      // Double flash
      flash.style.background = 'rgba(200, 220, 255, 0.7)';
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          flash.style.opacity = '1';
          setTimeout(() => {
            flash.style.opacity = '0';
          }, 100);
        }, 120);
      }, 90);
    } else {
      // Triple flickering flash
      flash.style.background = 'rgba(230, 240, 255, 0.6)';
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          flash.style.opacity = '1';
          setTimeout(() => {
            flash.style.opacity = '0';
          }, 60);
        }, i * 150);
      }
    }
  }
}
