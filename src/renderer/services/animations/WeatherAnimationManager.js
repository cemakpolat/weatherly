/**
 * Weather Animation Manager (Factory Pattern + Facade Pattern)
 *
 * This class manages weather animations, providing a unified interface
 * to start, stop, and switch between different weather effects.
 *
 * Now supports per-card animations for individual city weather displays.
 */

import { RainAnimation } from './RainAnimation.js';
import { SnowAnimation } from './SnowAnimation.js';
import { SunnyAnimation } from './SunnyAnimation.js';
import { CloudsAnimation } from './CloudsAnimation.js';
import { ThunderstormAnimation } from './ThunderstormAnimation.js';

export class WeatherAnimationManager {
  #currentAnimation = null;
  #container = null;
  #weatherCodeToAnimationClass = new Map();

  constructor() {
    this.#initializeAnimationMapping();
  }

  #initializeAnimationMapping() {
    // Map weather codes to animation classes (not instances)
    // This allows creating fresh instances for each card
    const animationClasses = [
      ThunderstormAnimation, // Check thunderstorm first (priority)
      RainAnimation,
      SnowAnimation,
      SunnyAnimation,
      CloudsAnimation,
    ];

    animationClasses.forEach(AnimationClass => {
      // Create a temporary instance to get weather codes
      const tempInstance = new AnimationClass();
      tempInstance.getWeatherCodes().forEach(code => {
        this.#weatherCodeToAnimationClass.set(code, AnimationClass);
      });
    });
  }

  /**
   * Sets the container element for animations
   * @param {HTMLElement} container - The container element
   */
  setContainer(container) {
    this.#container = container;
  }

  /**
   * Starts animation based on weather code
   * @param {number} weatherCode - The weather code
   * @param {number} [intensity=0.5] - Animation intensity (0-1)
   */
  startForWeatherCode(weatherCode, intensity = 0.5) {
    if (!this.#container) {
      console.warn('Animation container not set');
      return;
    }

    // Get appropriate animation class for weather code
    const AnimationClass = this.#weatherCodeToAnimationClass.get(weatherCode);

    if (!AnimationClass) {
      console.log(`No animation found for weather code: ${weatherCode}`);
      this.stopAll();
      return;
    }

    // Create instance if needed
    const animation = new AnimationClass();

    // Don't restart if same animation type is already running
    if (this.#currentAnimation && this.#currentAnimation.getName() === animation.getName()) {
      this.#currentAnimation.setIntensity(intensity);
      return;
    }

    // Stop current animation
    this.stopAll();

    // Start new animation
    console.log(`Starting ${animation.getName()} animation for weather code ${weatherCode}`);
    animation.setIntensity(intensity);
    animation.start(this.#container);
    this.#currentAnimation = animation;
  }

  /**
   * Stops all animations
   */
  stopAll() {
    if (this.#currentAnimation) {
      this.#currentAnimation.stop();
      this.#currentAnimation = null;
    }
  }

  /**
   * Sets the intensity of the current animation
   * @param {number} intensity - Animation intensity (0-1)
   */
  setIntensity(intensity) {
    if (this.#currentAnimation) {
      this.#currentAnimation.setIntensity(intensity);
    }
  }

  /**
   * Gets the currently running animation name
   * @returns {string|null}
   */
  getCurrentAnimationName() {
    return this.#currentAnimation ? this.#currentAnimation.getName() : null;
  }

  /**
   * Gets all available animations
   * @returns {Array<{name: string, weatherCodes: Array<number>}>}
   */
  getAvailableAnimations() {
    const animations = [];
    this.#weatherCodeToAnimationClass.forEach(AnimationClass => {
      const instance = new AnimationClass();
      const existing = animations.find(a => a.name === instance.getName());
      if (!existing) {
        animations.push({
          name: instance.getName(),
          weatherCodes: instance.getWeatherCodes(),
        });
      }
    });
    return animations;
  }

  /**
   * Creates a standalone animation instance for a specific container (e.g., city card)
   * @param {HTMLElement} container - The container element for the animation
   * @param {number} weatherCode - The weather code
   * @param {number} [intensity=0.5] - Animation intensity (0-1)
   * @returns {object|null} - Animation instance with stop() method, or null if no animation found
   */
  createCardAnimation(container, weatherCode, intensity = 0.5) {
    if (!container) {
      console.warn('Animation container not provided');
      return null;
    }

    // Get appropriate animation class for weather code
    const AnimationClass = this.#weatherCodeToAnimationClass.get(weatherCode);

    if (!AnimationClass) {
      console.log(`No animation found for weather code: ${weatherCode}`);
      return null;
    }

    // Create a new instance for this specific container
    const animation = new AnimationClass();
    animation.setIntensity(intensity);
    animation.start(container);

    console.log(`Started ${animation.getName()} animation for weather code ${weatherCode} in card`);

    // Return an object with control methods
    return {
      stop: () => animation.stop(),
      setIntensity: newIntensity => animation.setIntensity(newIntensity),
      getName: () => animation.getName(),
    };
  }
}
