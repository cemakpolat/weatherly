/**
 * AutoRefreshManager - Single Responsibility: Handle auto-refresh functionality
 * 
 * This service manages automatic weather data refresh.
 * It follows the Single Responsibility Principle by focusing solely on
 * auto-refresh operations.
 */
import { SettingsManager } from './SettingsManager.js';
import { ToastService } from './ToastService.js';

export class AutoRefreshManager {
  static #intervalId = null;
  static #intervalMs = 5 * 60 * 1000; // Default 5 minutes
  static #refreshCallback = null;
  static #isRunning = false;

  /**
   * Initializes the auto-refresh manager.
   * @param {Function} refreshCallback - Callback function to refresh data.
   */
  static initialize(refreshCallback) {
    AutoRefreshManager.#refreshCallback = refreshCallback;
  }

  /**
   * Starts auto-refresh with saved or default interval.
   */
  static async start() {
    // Clear existing interval
    AutoRefreshManager.stop();

    try {
      const intervalMinutes = await SettingsManager.getAutoRefreshInterval();
      AutoRefreshManager.#intervalMs = intervalMinutes * 60 * 1000;

      AutoRefreshManager.#intervalId = setInterval(() => {
        console.log('Auto-refreshing weather data...');
        AutoRefreshManager.#executeRefresh();
      }, AutoRefreshManager.#intervalMs);

      AutoRefreshManager.#isRunning = true;
      console.log(`Auto-refresh started with interval: ${intervalMinutes} minutes`);
    } catch (error) {
      console.error('Error starting auto-refresh:', error);
      // Use default interval on error
      AutoRefreshManager.#intervalId = setInterval(() => {
        console.log('Auto-refreshing weather data...');
        AutoRefreshManager.#executeRefresh();
      }, AutoRefreshManager.#intervalMs);
      AutoRefreshManager.#isRunning = true;
    }
  }

  /**
   * Stops auto-refresh.
   */
  static stop() {
    if (AutoRefreshManager.#intervalId) {
      clearInterval(AutoRefreshManager.#intervalId);
      AutoRefreshManager.#intervalId = null;
      AutoRefreshManager.#isRunning = false;
      console.log('Auto-refresh stopped');
    }
  }

  /**
   * Updates the refresh interval.
   * @param {number} minutes - New interval in minutes.
   */
  static async setInterval(minutes) {
    AutoRefreshManager.#intervalMs = minutes * 60 * 1000;
    
    // Save to settings
    await SettingsManager.setAutoRefreshInterval(minutes);

    // Restart if currently running
    if (AutoRefreshManager.#isRunning) {
      AutoRefreshManager.stop();
      
      AutoRefreshManager.#intervalId = setInterval(() => {
        console.log('Auto-refreshing weather data...');
        AutoRefreshManager.#executeRefresh();
      }, AutoRefreshManager.#intervalMs);
      
      AutoRefreshManager.#isRunning = true;
      console.log(`Auto-refresh interval updated to: ${minutes} minutes`);
      
      ToastService.success(
        `Auto-refresh set to ${minutes} minute${minutes > 1 ? 's' : ''}`,
        2000
      );
    }
  }

  /**
   * Executes the refresh callback.
   * @private
   */
  static #executeRefresh() {
    if (AutoRefreshManager.#refreshCallback) {
      AutoRefreshManager.#refreshCallback();
    }
  }

  /**
   * Manually triggers a refresh.
   */
  static triggerRefresh() {
    console.log('Manual refresh triggered');
    ToastService.info('Refreshing all cities...', 2000);
    AutoRefreshManager.#executeRefresh();
  }

  /**
   * Gets the current interval in minutes.
   * @returns {number} - Current interval in minutes.
   */
  static getIntervalMinutes() {
    return AutoRefreshManager.#intervalMs / 60000;
  }

  /**
   * Checks if auto-refresh is currently running.
   * @returns {boolean} - True if running.
   */
  static isRunning() {
    return AutoRefreshManager.#isRunning;
  }

  /**
   * Pauses auto-refresh temporarily.
   */
  static pause() {
    if (AutoRefreshManager.#intervalId) {
      clearInterval(AutoRefreshManager.#intervalId);
      AutoRefreshManager.#intervalId = null;
      console.log('Auto-refresh paused');
    }
  }

  /**
   * Resumes auto-refresh after pause.
   */
  static resume() {
    if (AutoRefreshManager.#isRunning && !AutoRefreshManager.#intervalId) {
      AutoRefreshManager.#intervalId = setInterval(() => {
        console.log('Auto-refreshing weather data...');
        AutoRefreshManager.#executeRefresh();
      }, AutoRefreshManager.#intervalMs);
      console.log('Auto-refresh resumed');
    }
  }
}

export default AutoRefreshManager;
