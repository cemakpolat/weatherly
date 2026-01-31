/**
 * SettingsManager - Single Responsibility: Handle all application settings operations
 * 
 * This service manages reading, writing, and applying application settings.
 * It follows the Single Responsibility Principle by focusing solely on settings management.
 * It uses Dependency Inversion by depending on an electron abstraction.
 */
export class SettingsManager {
  static #electron = null;
  static #cache = null;
  static #saveTimeout = null;
  static #debounceDelay = 500;

  /**
   * Default settings structure
   */
  static get defaultSettings() {
    return {
      isSearchBarHidden: true,
      temperatureUnit: 'celsius',
      isCompactView: false,
      cities: [],
      theme: 'purple-blue',
      autoRefreshInterval: 5,
      animationPreferences: {
        enabled: true,
      },
      weatherAlerts: {
        enabled: true,
        thunderstorm: true,
        heavyRain: true,
        heavySnow: true,
        extremeTemperature: true,
        highPrecipitation: true,
      },
      apiKeys: {
        openweathermap: '',
      },
    };
  }

  /**
   * Initializes the settings manager with the electron interface.
   * @param {object} electron - The electron interface for reading/writing settings.
   */
  static initialize(electron) {
    SettingsManager.#electron = electron;
  }

  /**
   * Gets the electron interface.
   * @throws {Error} If not initialized.
   */
  static #getElectron() {
    if (!SettingsManager.#electron) {
      throw new Error('SettingsManager not initialized. Call initialize() first.');
    }
    return SettingsManager.#electron;
  }

  /**
   * Reads all settings.
   * @param {boolean} useCache - Whether to use cached settings.
   * @returns {Promise<object>} - The settings object.
   */
  static async read(useCache = true) {
    if (useCache && SettingsManager.#cache) {
      return { ...SettingsManager.#cache };
    }

    try {
      const electron = SettingsManager.#getElectron();
      const settings = await electron.readSettings();
      SettingsManager.#cache = { ...SettingsManager.defaultSettings, ...settings };
      return { ...SettingsManager.#cache };
    } catch (error) {
      console.error('Error reading settings:', error);
      return { ...SettingsManager.defaultSettings };
    }
  }

  /**
   * Writes settings to storage.
   * @param {object} settings - The settings to write.
   * @returns {Promise<boolean>} - True if successful.
   */
  static async write(settings) {
    try {
      const electron = SettingsManager.#getElectron();
      await electron.writeSettings(settings);
      SettingsManager.#cache = { ...settings };
      return true;
    } catch (error) {
      console.error('Error writing settings:', error);
      return false;
    }
  }

  /**
   * Updates specific settings (merges with existing).
   * @param {object} updates - The settings to update.
   * @returns {Promise<boolean>} - True if successful.
   */
  static async update(updates) {
    const currentSettings = await SettingsManager.read();
    const newSettings = { ...currentSettings, ...updates };
    return SettingsManager.write(newSettings);
  }

  /**
   * Debounced write - useful for frequent updates.
   * @param {object} settings - The settings to write.
   */
  static debouncedWrite(settings) {
    clearTimeout(SettingsManager.#saveTimeout);
    SettingsManager.#saveTimeout = setTimeout(async () => {
      await SettingsManager.write(settings);
    }, SettingsManager.#debounceDelay);
  }

  /**
   * Gets a specific setting value.
   * @param {string} key - The setting key.
   * @param {any} defaultValue - Default value if not found.
   * @returns {Promise<any>} - The setting value.
   */
  static async get(key, defaultValue = null) {
    const settings = await SettingsManager.read();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  /**
   * Sets a specific setting value.
   * @param {string} key - The setting key.
   * @param {any} value - The value to set.
   * @returns {Promise<boolean>} - True if successful.
   */
  static async set(key, value) {
    return SettingsManager.update({ [key]: value });
  }

  // --- Specific Settings Accessors ---

  /**
   * Gets the temperature unit setting.
   * @returns {Promise<string>} - 'celsius' or 'fahrenheit'.
   */
  static async getTemperatureUnit() {
    return SettingsManager.get('temperatureUnit', 'celsius');
  }

  /**
   * Sets the temperature unit setting.
   * @param {string} unit - 'celsius' or 'fahrenheit'.
   */
  static async setTemperatureUnit(unit) {
    return SettingsManager.set('temperatureUnit', unit);
  }

  /**
   * Gets the theme setting.
   * @returns {Promise<string>} - The theme name.
   */
  static async getTheme() {
    return SettingsManager.get('theme', 'purple-blue');
  }

  /**
   * Sets the theme setting.
   * @param {string} theme - The theme name.
   */
  static async setTheme(theme) {
    return SettingsManager.set('theme', theme);
  }

  /**
   * Gets animation preferences.
   * @returns {Promise<object>} - Animation preferences.
   */
  static async getAnimationPreferences() {
    const settings = await SettingsManager.read();
    return settings.animationPreferences || SettingsManager.defaultSettings.animationPreferences;
  }

  /**
   * Sets animation preferences.
   * @param {object} prefs - Animation preferences.
   */
  static async setAnimationPreferences(prefs) {
    return SettingsManager.set('animationPreferences', prefs);
  }

  /**
   * Gets weather alert preferences.
   * @returns {Promise<object>} - Weather alert preferences.
   */
  static async getWeatherAlerts() {
    const settings = await SettingsManager.read();
    return settings.weatherAlerts || SettingsManager.defaultSettings.weatherAlerts;
  }

  /**
   * Sets weather alert preferences.
   * @param {object} prefs - Weather alert preferences.
   */
  static async setWeatherAlerts(prefs) {
    return SettingsManager.set('weatherAlerts', prefs);
  }

  /**
   * Gets the auto-refresh interval.
   * @returns {Promise<number>} - Interval in minutes.
   */
  static async getAutoRefreshInterval() {
    return SettingsManager.get('autoRefreshInterval', 5);
  }

  /**
   * Sets the auto-refresh interval.
   * @param {number} minutes - Interval in minutes.
   */
  static async setAutoRefreshInterval(minutes) {
    return SettingsManager.set('autoRefreshInterval', minutes);
  }

  /**
   * Gets saved cities.
   * @returns {Promise<Array>} - Array of city objects.
   */
  static async getCities() {
    return SettingsManager.get('cities', []);
  }

  /**
   * Sets saved cities.
   * @param {Array} cities - Array of city objects.
   */
  static async setCities(cities) {
    return SettingsManager.set('cities', cities);
  }

  /**
   * Gets API keys.
   * @returns {Promise<object>} - API keys object.
   */
  static async getApiKeys() {
    const settings = await SettingsManager.read();
    return settings.apiKeys || SettingsManager.defaultSettings.apiKeys;
  }

  /**
   * Sets an API key.
   * @param {string} provider - The provider name (e.g., 'openweathermap').
   * @param {string} key - The API key.
   */
  static async setApiKey(provider, key) {
    const settings = await SettingsManager.read();
    const apiKeys = settings.apiKeys || {};
    apiKeys[provider] = key;
    return SettingsManager.set('apiKeys', apiKeys);
  }

  /**
   * Clears the settings cache.
   */
  static clearCache() {
    SettingsManager.#cache = null;
  }
}

export default SettingsManager;
