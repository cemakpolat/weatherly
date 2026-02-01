/**
 * WeatherAlertService Tests
 */

import { WeatherAlertService } from '../WeatherAlertService';
import { SettingsManager } from '../SettingsManager';
import { ToastService } from '../ToastService';
import { TemperatureService } from '../TemperatureService';
import * as weatherUtils from '../../utils/weatherUtils';

// Mock dependencies
jest.mock('../SettingsManager', () => ({
  SettingsManager: {
    getWeatherAlerts: jest.fn(),
    setWeatherAlerts: jest.fn(),
  },
}));
jest.mock('../ToastService', () => ({
  ToastService: {
    warning: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock('../TemperatureService', () => ({
  TemperatureService: {
    format: jest.fn(temp => `${temp}°C`),
  },
}));
jest.mock('../../utils/weatherUtils', () => ({
  detectSevereWeather: jest.fn(() => []),
}));

describe('WeatherAlertService', () => {
  let mockElectron;

  beforeEach(() => {
    jest.clearAllMocks();

    mockElectron = {
      showNotification: jest.fn(),
    };

    WeatherAlertService.initialize(mockElectron);

    // Default mock implementations
    SettingsManager.getWeatherAlerts.mockResolvedValue({
      enabled: true,
      storm: true,
      rain: true,
      snow: true,
      temperature: true,
      wind: true,
    });

    TemperatureService.format.mockImplementation(temp => `${temp}°C`);
  });

  describe('initialize', () => {
    it('should initialize with electron interface', () => {
      WeatherAlertService.initialize(mockElectron);
      expect(mockElectron).toBeDefined();
    });
  });

  describe('checkAndShowAlerts', () => {
    it('should detect and show weather alerts', async () => {
      const mockAlerts = [
        { type: 'storm', message: 'Storm warning for London' },
        { type: 'wind', message: 'High wind alert' },
      ];

      weatherUtils.detectSevereWeather.mockReturnValue(mockAlerts);

      const alerts = await WeatherAlertService.checkAndShowAlerts(
        { current_weather: { weathercode: 95 } },
        'London'
      );

      expect(alerts).toHaveLength(2);
      expect(mockElectron.showNotification).toHaveBeenCalledTimes(2);
      expect(ToastService.warning).toHaveBeenCalledTimes(2);
    });

    it('should not show alerts if globally disabled', async () => {
      SettingsManager.getWeatherAlerts.mockResolvedValue({
        enabled: false,
        storm: true,
      });

      const alerts = await WeatherAlertService.checkAndShowAlerts(
        { current_weather: { weathercode: 95 } },
        'London'
      );

      expect(alerts).toHaveLength(0);
      expect(mockElectron.showNotification).not.toHaveBeenCalled();
    });

    it('should filter alerts based on preferences', async () => {
      SettingsManager.getWeatherAlerts.mockResolvedValue({
        enabled: true,
        storm: false,
        wind: true,
      });

      const mockAlerts = [
        { type: 'storm', message: 'Storm warning' },
        { type: 'wind', message: 'Wind alert' },
      ];

      weatherUtils.detectSevereWeather.mockReturnValue(mockAlerts);

      const alerts = await WeatherAlertService.checkAndShowAlerts(
        { current_weather: {} },
        'London'
      );

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('wind');
    });

    it('should handle no alerts gracefully', async () => {
      weatherUtils.detectSevereWeather.mockReturnValue([]);

      const alerts = await WeatherAlertService.checkAndShowAlerts(
        { current_weather: { weathercode: 0 } },
        'London'
      );

      expect(alerts).toHaveLength(0);
      expect(mockElectron.showNotification).not.toHaveBeenCalled();
    });
  });

  describe('checkAllCities', () => {
    it('should check alerts for multiple cities', async () => {
      weatherUtils.detectSevereWeather
        .mockReturnValueOnce([{ type: 'storm', message: 'Storm in London' }])
        .mockReturnValueOnce([{ type: 'rain', message: 'Heavy rain in Paris' }]);

      const citiesData = [
        { cityName: 'London', weatherData: { current_weather: { weathercode: 95 } } },
        { cityName: 'Paris', weatherData: { current_weather: { weathercode: 61 } } },
      ];

      const alerts = await WeatherAlertService.checkAllCities(citiesData);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].message).toContain('London');
      expect(alerts[1].message).toContain('Paris');
    });

    it('should handle empty cities array', async () => {
      const alerts = await WeatherAlertService.checkAllCities([]);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('savePreferences', () => {
    it('should save alert preferences', async () => {
      const preferences = {
        enabled: true,
        storm: true,
        rain: false,
      };

      await WeatherAlertService.savePreferences(preferences);

      expect(SettingsManager.setWeatherAlerts).toHaveBeenCalledWith(preferences);
    });
  });

  describe('getPreferences', () => {
    it('should get current preferences', async () => {
      const mockPrefs = {
        enabled: true,
        storm: true,
      };

      SettingsManager.getWeatherAlerts.mockResolvedValue(mockPrefs);

      const prefs = await WeatherAlertService.getPreferences();

      expect(prefs).toEqual(mockPrefs);
    });
  });

  describe('enableAll', () => {
    it('should enable all alert types', async () => {
      const mockPrefs = {
        enabled: false,
        storm: false,
        rain: false,
      };

      SettingsManager.getWeatherAlerts.mockResolvedValue(mockPrefs);
      SettingsManager.setWeatherAlerts.mockResolvedValue(true);

      await WeatherAlertService.enableAll();

      expect(SettingsManager.setWeatherAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });

  describe('disableAll', () => {
    it('should disable all alerts', async () => {
      SettingsManager.setWeatherAlerts.mockResolvedValue(true);

      await WeatherAlertService.disableAll();

      expect(SettingsManager.setWeatherAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('native notification integration', () => {
    it('should send native notification via electron', async () => {
      const mockAlerts = [
        { type: 'storm', message: 'Severe thunderstorm warning' },
      ];

      weatherUtils.detectSevereWeather.mockReturnValue(mockAlerts);

      await WeatherAlertService.checkAndShowAlerts(
        { current_weather: {} },
        'London'
      );

      expect(mockElectron.showNotification).toHaveBeenCalledWith(
        'Weather Alert',
        'Severe thunderstorm warning'
      );
    });

    it('should work without electron (browser mode)', async () => {
      WeatherAlertService.initialize(null);

      const mockAlerts = [
        { type: 'storm', message: 'Storm warning' },
      ];

      weatherUtils.detectSevereWeather.mockReturnValue(mockAlerts);

      const alerts = await WeatherAlertService.checkAndShowAlerts(
        { current_weather: {} },
        'London'
      );

      expect(alerts).toHaveLength(1);
      expect(ToastService.warning).toHaveBeenCalled();
    });
  });
});
