/**
 * Configuration Service (Single Responsibility Principle)
 *
 * This service is responsible for managing application configuration,
 * including weather provider selection and other user preferences.
 */

import { WeatherProviderType } from './WeatherProviderFactory.js';

export class ConfigService {
  /**
   * Gets the configured weather provider type
   * @returns {Promise<string>} The configured provider type
   */
  static async getWeatherProvider() {
    try {
      const settings = await window.electron.readSettings();
      return settings.weatherProvider || WeatherProviderType.OPEN_METEO;
    } catch (error) {
      console.error('Error reading weather provider config:', error);
      return WeatherProviderType.OPEN_METEO;
    }
  }

  /**
   * Sets the weather provider type
   * @param {string} providerType - The provider type to set
   * @returns {Promise<void>}
   */
  static async setWeatherProvider(providerType) {
    try {
      const settings = await window.electron.readSettings();
      settings.weatherProvider = providerType;
      await window.electron.writeSettings(settings);
      console.log(`Weather provider set to: ${providerType}`);
    } catch (error) {
      console.error('Error saving weather provider config:', error);
      throw error;
    }
  }

  /**
   * Gets all application settings
   * @returns {Promise<object>} The settings object
   */
  static async getAllSettings() {
    try {
      return await window.electron.readSettings();
    } catch (error) {
      console.error('Error reading settings:', error);
      return {};
    }
  }

  /**
   * Saves all application settings
   * @param {object} settings - The settings to save
   * @returns {Promise<void>}
   */
  static async saveAllSettings(settings) {
    try {
      await window.electron.writeSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }
}
