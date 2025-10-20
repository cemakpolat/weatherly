/**
 * Weather Animation Interface (Interface Segregation Principle)
 *
 * This defines the contract that all weather animations must implement.
 */

export class IWeatherAnimation {
  /**
   * Gets the animation name
   * @returns {string}
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Gets the weather codes this animation applies to
   * @returns {Array<number>}
   */
  getWeatherCodes() {
    throw new Error('Method getWeatherCodes() must be implemented');
  }

  /**
   * Creates and starts the animation
   * @param {HTMLElement} container - The container element
   * @returns {void}
   */
  start(container) {
    throw new Error('Method start() must be implemented');
  }

  /**
   * Stops and cleans up the animation
   * @returns {void}
   */
  stop() {
    throw new Error('Method stop() must be implemented');
  }

  /**
   * Updates animation intensity
   * @param {number} intensity - Animation intensity (0-1)
   * @returns {void}
   */
  setIntensity(intensity) {
    throw new Error('Method setIntensity() must be implemented');
  }
}
