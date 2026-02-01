/**
 * SettingsManager Tests
 */

import { SettingsManager } from '../SettingsManager';

// Mock IPC renderer
const mockIpcRenderer = {
  invoke: jest.fn(),
};

if (typeof window === 'undefined') {
  global.window = {};
}

global.window.electron = {
  readSettings: jest.fn(),
  writeSettings: jest.fn(),
};

describe('SettingsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize SettingsManager with mock electron
    SettingsManager.initialize(global.window.electron);
  });

  describe('initialize', () => {
    it('should initialize with electron interface', () => {
      const mockElectron = { readSettings: jest.fn(), writeSettings: jest.fn() };
      SettingsManager.initialize(mockElectron);
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('read', () => {
    it('should read settings from electron', async () => {
      const mockSettings = {
        temperatureUnit: 'fahrenheit',
        theme: 'dark',
      };
      
      global.window.electron.readSettings.mockResolvedValue(mockSettings);

      const settings = await SettingsManager.read(false); // Don't use cache

      expect(global.window.electron.readSettings).toHaveBeenCalled();
      expect(settings.temperatureUnit).toBe('fahrenheit');
    });

    it('should handle read errors gracefully', async () => {
      global.window.electron.readSettings.mockRejectedValue(new Error('Storage error'));

      const settings = await SettingsManager.read(false);
      
      // Should return default settings on error
      expect(settings).toBeDefined();
      expect(settings.temperatureUnit).toBeDefined();
    });
  });

  describe('write', () => {
    it('should write settings to electron', async () => {
      const newSettings = {
        temperatureUnit: 'fahrenheit',
        theme: 'dark',
      };
      
      global.window.electron.writeSettings.mockResolvedValue();

      const result = await SettingsManager.write(newSettings);

      expect(result).toBe(true);
      expect(global.window.electron.writeSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should handle write errors', async () => {
      global.window.electron.writeSettings.mockRejectedValue(new Error('Write error'));

      const result = await SettingsManager.write({});

      expect(result).toBe(false);
    });
  });

  describe('defaultSettings', () => {
    it('should have default temperature unit', () => {
      const defaults = SettingsManager.defaultSettings;
      expect(defaults.temperatureUnit).toBeDefined();
      expect(defaults.temperatureUnit).toBe('celsius');
    });

    it('should have default theme settings', () => {
      const defaults = SettingsManager.defaultSettings;
      expect(defaults.theme).toBeDefined();
      expect(defaults.themeMode).toBeDefined();
    });

    it('should have animation preferences', () => {
      const defaults = SettingsManager.defaultSettings;
      expect(defaults.animationPreferences).toBeDefined();
      expect(defaults.animationPreferences.enabled).toBe(true);
    });
  });

  describe('integration', () => {
    it('should handle read-write cycle', async () => {
      const testSettings = {
        ...SettingsManager.defaultSettings,
        temperatureUnit: 'fahrenheit',
      };

      global.window.electron.readSettings.mockResolvedValue(testSettings);
      global.window.electron.writeSettings.mockResolvedValue();

      const readSettings = await SettingsManager.read(false);
      expect(readSettings.temperatureUnit).toBe('fahrenheit');

      await SettingsManager.write(readSettings);
      expect(global.window.electron.writeSettings).toHaveBeenCalled();
    });
  });
});
