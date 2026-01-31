/**
 * WeatherAlertService - Single Responsibility: Handle weather alerts
 * 
 * This service manages weather alert detection and notification.
 * It follows the Single Responsibility Principle by focusing solely on
 * alert-related operations.
 */
import { SettingsManager } from './SettingsManager.js';
import { ToastService } from './ToastService.js';
import { detectSevereWeather } from '../utils/weatherUtils.js';
import { TemperatureService } from './TemperatureService.js';

export class WeatherAlertService {
  static #electron = null;

  /**
   * Initializes the weather alert service with electron for native notifications.
   * @param {object} electron - The electron interface.
   */
  static initialize(electron) {
    WeatherAlertService.#electron = electron;
  }

  /**
   * Checks for and shows weather alerts for a city.
   * @param {object} weatherData - The weather data.
   * @param {string} cityName - The city name.
   * @returns {Promise<Array>} - Array of alerts shown.
   */
  static async checkAndShowAlerts(weatherData, cityName) {
    const alertPrefs = await SettingsManager.getWeatherAlerts();

    // Check if alerts are enabled globally
    if (!alertPrefs.enabled) {
      return [];
    }

    // Detect severe weather
    const alerts = detectSevereWeather(
      weatherData,
      cityName,
      temp => TemperatureService.format(temp)
    );

    // Filter based on preferences
    const filteredAlerts = alerts.filter(alert => alertPrefs[alert.type]);

    // Show notifications for each alert
    filteredAlerts.forEach(alert => {
      // Native notification via electron
      if (WeatherAlertService.#electron) {
        WeatherAlertService.#electron.showNotification('Weather Alert', alert.message);
      }
      
      // In-app toast notification
      ToastService.warning(alert.message, 5000);
    });

    return filteredAlerts;
  }

  /**
   * Checks alerts for all cities' weather data.
   * @param {Array} citiesWeatherData - Array of { cityName, weatherData } objects.
   * @returns {Promise<Array>} - All alerts found.
   */
  static async checkAllCities(citiesWeatherData) {
    const allAlerts = [];

    for (const { cityName, weatherData } of citiesWeatherData) {
      const alerts = await WeatherAlertService.checkAndShowAlerts(weatherData, cityName);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  /**
   * Saves alert preferences.
   * @param {object} preferences - Alert preferences.
   */
  static async savePreferences(preferences) {
    await SettingsManager.setWeatherAlerts(preferences);
    console.log('Alert preferences saved:', preferences);
  }

  /**
   * Gets current alert preferences.
   * @returns {Promise<object>} - Current alert preferences.
   */
  static async getPreferences() {
    return SettingsManager.getWeatherAlerts();
  }

  /**
   * Enables all alerts.
   */
  static async enableAll() {
    const prefs = await WeatherAlertService.getPreferences();
    Object.keys(prefs).forEach(key => {
      prefs[key] = true;
    });
    await WeatherAlertService.savePreferences(prefs);
  }

  /**
   * Disables all alerts.
   */
  static async disableAll() {
    const prefs = await WeatherAlertService.getPreferences();
    Object.keys(prefs).forEach(key => {
      prefs[key] = false;
    });
    await WeatherAlertService.savePreferences(prefs);
  }
}

export default WeatherAlertService;
