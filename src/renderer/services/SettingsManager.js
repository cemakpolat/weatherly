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
      themeMode: 'dark',
      autoRefreshInterval: 5,
      animationPreferences: {
        enabled: true,
      },
      dynamicBackgrounds: {
        enabled: false,
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
   * Gets the theme mode setting (light or dark).
   * @returns {Promise<string>} - 'light' or 'dark'.
   */
  static async getThemeMode() {
    return SettingsManager.get('themeMode', 'dark');
  }

  /**
   * Sets the theme mode setting.
   * @param {string} mode - 'light' or 'dark'.
   */
  static async setThemeMode(mode) {
    return SettingsManager.set('themeMode', mode);
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
   * Gets dynamic background preferences.
   * @returns {Promise<object>} - Dynamic background preferences.
   */
  static async getDynamicBackgrounds() {
    const settings = await SettingsManager.read();
    return settings.dynamicBackgrounds || SettingsManager.defaultSettings.dynamicBackgrounds;
  }

  /**
   * Sets dynamic background preferences.
   * @param {object} prefs - Dynamic background preferences.
   */
  static async setDynamicBackgrounds(prefs) {
    return SettingsManager.set('dynamicBackgrounds', prefs);
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

  /**
   * Exports settings as a JSON file.
   * @returns {Promise<void>}
   */
  static async exportSettings() {
    try {
      const settings = await SettingsManager.read(false);
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atmos-sphere-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Settings exported successfully');
      return true;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Imports settings from a JSON file.
   * @param {File} file - The file to import.
   * @returns {Promise<boolean>} - True if successful.
   */
  static async importSettings(file) {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate settings structure
      if (typeof importedSettings !== 'object' || importedSettings === null) {
        throw new Error('Invalid settings format');
      }
      
      // Merge with defaults to ensure all required fields exist
      const validatedSettings = { ...SettingsManager.defaultSettings, ...importedSettings };
      
      // Write the settings
      await SettingsManager.write(validatedSettings);
      
      console.log('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Resets all settings to defaults.
   * @returns {Promise<boolean>} - True if successful.
   */
  static async resetToDefaults() {
    try {
      await SettingsManager.write({ ...SettingsManager.defaultSettings });
      console.log('Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
}

export default SettingsManager;
