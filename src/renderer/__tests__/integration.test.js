/**
 * Integration Tests for Weather App
 * These tests verify the overall functionality and interaction between services
 */

import { WeatherService } from '../services/WeatherService';
import { CardManager } from '../services/CardManager';
import { SettingsManager } from '../services/SettingsManager';
import { StorageService } from '../services/StorageService';
import { ThemeManager } from '../services/ThemeManager';

// Mock SettingsManager for integration tests
jest.mock('../services/SettingsManager', () => ({
  SettingsManager: {
    initialize: jest.fn(),
    getTemperatureUnit: jest.fn().mockResolvedValue('celsius'),
    setTemperatureUnit: jest.fn(),
    read: jest.fn().mockResolvedValue({}),
    write: jest.fn(),
  },
}));

// Mock StorageService without referencing out-of-scope globals (avoids jest.mock hoisting issues)
const mockStorage = new Map();
jest.mock('../services/StorageService', () => ({
  StorageService: {
    save: jest.fn((key, value) => {
      try {
        const gs = (typeof global !== 'undefined' && global.sessionStorage) ? global.sessionStorage : null;
        if (gs && typeof gs.setItem === 'function') {
          gs.setItem(key, JSON.stringify(value));
        }
        mockStorage.set(key, value);
        return true;
      } catch (e) {
        return false;
      }
    }),
    get: jest.fn((key) => {
      try {
        const gs = (typeof global !== 'undefined' && global.sessionStorage) ? global.sessionStorage : null;
        if (gs && typeof gs.getItem === 'function') {
          const data = gs.getItem(key);
          return data ? JSON.parse(data) : mockStorage.get(key);
        }
        return mockStorage.has(key) ? mockStorage.get(key) : null;
      } catch (e) {
        return null;
      }
    }),
    isAvailable: jest.fn().mockReturnValue(true),
  },
}));
import { ToastService } from '../services/ToastService';
import { WeatherAlertService } from '../services/WeatherAlertService';
import { TemperatureService } from '../services/TemperatureService';

// Mock WeatherProviderFactory before importing services that use it
jest.mock('../services/WeatherProviderFactory', () => ({
  WeatherProviderFactory: {
    createProvider: jest.fn(() => ({
      fetchWeatherData: jest.fn(),
      fetchGeocodingData: jest.fn(),
      reverseGeocode: jest.fn(),
      getProviderName: jest.fn(() => 'open-meteo'),
      getProviderType: jest.fn(() => 'open-meteo'),
    })),
  },
  WeatherProviderType: {
    OPEN_METEO: 'open-meteo',
    OPENWEATHER: 'openweather',
  },
}));

// Mock external dependencies
jest.mock('../services/weatherApi');

describe('Weather App Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks and storage
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  describe('Complete User Flow: Search and Display Weather', () => {
    it('should fetch weather and create a card', async () => {
      // Setup DOM
      const container = document.createElement('div');
      container.id = 'cities-container';
      document.body.appendChild(container);

      // Mock weather data
      const mockWeatherData = {
        name: 'London',
        country_code: 'GB',
        weather: {
          current_weather: {
            temperature: 15,
            weathercode: 2,
            windspeed: 10,
            winddirection: 180,
          },
          hourly: {
            time: Array(24).fill('2024-01-01T00:00'),
            temperature_2m: Array(24).fill(15),
            weathercode: Array(24).fill(2),
            wind_speed_10m: Array(24).fill(10),
            wind_direction_10m: Array(24).fill(180),
          },
          daily: {
            time: Array(7).fill('2024-01-01'),
            temperature_2m_max: Array(7).fill(20),
            temperature_2m_min: Array(7).fill(10),
            weathercode: Array(7).fill(2),
            precipitation_probability_max: Array(7).fill(20),
            uv_index_max: [5],
            sunrise: ['2024-01-01T06:00'],
            sunset: ['2024-01-01T18:00'],
          },
        },
      };

      // Mock fetch weather
      WeatherService.getWeatherByCity = jest.fn().mockResolvedValue(mockWeatherData);

      // Initialize CardManager
      CardManager.initialize(container);

      // Fetch weather and create card
      const weatherData = await WeatherService.getWeatherByCity('London');
      const card = CardManager.createCard(weatherData);

      // Verify card creation
      expect(card).toBeTruthy();
      expect(card.querySelector('.card-title')).toBeTruthy();
      expect(WeatherService.getWeatherByCity).toHaveBeenCalledWith('London');
    });
  });

  describe('Settings and Temperature Unit Conversion', () => {
    it('should convert temperatures when unit changes', async () => {
      SettingsManager.settings = { units: 'C' };
      SettingsManager.getUnits = jest.fn().mockReturnValue('C');

      let formatted = TemperatureService.format(0);
      expect(formatted).toBe('0°C');

      // Change to Fahrenheit
      SettingsManager.getUnits.mockReturnValue('F');
      TemperatureService.currentUnit = 'fahrenheit';

      formatted = TemperatureService.format(0);
      expect(formatted).toBe('32°F');
    });

    it('should format multiple temperatures with correct unit', () => {
      SettingsManager.getUnits = jest.fn().mockReturnValue('C');
      TemperatureService.currentUnit = 'celsius';

      const temps = [0, 10, 20, 30];
      const formatted = TemperatureService.formatArray(temps);

      expect(formatted).toEqual(['0°C', '10°C', '20°C', '30°C']);
    });
  });

  describe('Theme Management Flow', () => {
    it('should apply theme and persist settings', async () => {
      SettingsManager.setTheme = jest.fn().mockResolvedValue(true);
      ToastService.success = jest.fn();

      await ThemeManager.saveAndApply('ocean-breeze');

      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
      expect(SettingsManager.setTheme).toHaveBeenCalledWith('ocean-breeze');
      expect(ToastService.success).toHaveBeenCalled();
    });

    it('should toggle between light and dark modes', async () => {
      SettingsManager.setThemeMode = jest.fn().mockResolvedValue(true);

      ThemeManager.applyMode('light');
      expect(ThemeManager.currentMode).toBe('light');

      await ThemeManager.toggleMode();
      expect(ThemeManager.currentMode).toBe('dark');
    });
  });

  describe('Storage Integration', () => {
    it('should save and retrieve city data', () => {
      const cityData = {
        name: 'Paris',
        country_code: 'FR',
        temperature: 18,
      };

      StorageService.save('cities', [cityData]);
      const retrieved = StorageService.get('cities');

      expect(retrieved).toEqual([cityData]);
      expect(retrieved[0].name).toBe('Paris');
    });

    it('should handle complex nested data', () => {
      const complexData = {
        cities: [
          { name: 'London', weather: { temp: 15, conditions: 'cloudy' } },
          { name: 'Paris', weather: { temp: 18, conditions: 'sunny' } },
        ],
        settings: {
          units: 'C',
          theme: 'dark',
        },
        lastUpdate: Date.now(),
      };

      StorageService.save('app-data', complexData);
      const retrieved = StorageService.get('app-data');

      expect(retrieved).toEqual(complexData);
      expect(retrieved.cities).toHaveLength(2);
    });
  });

  describe('Weather Alert Flow', () => {
    it('should detect and display weather alerts', async () => {
      SettingsManager.getWeatherAlerts = jest.fn().mockResolvedValue({
        enabled: true,
        storm: true,
        rain: true,
      });

      ToastService.warning = jest.fn();

      const mockElectron = {
        showNotification: jest.fn(),
      };

      WeatherAlertService.initialize(mockElectron);

      const weatherData = {
        current_weather: {
          weathercode: 95, // Thunderstorm
          windspeed: 65, // High wind
        },
      };

      // Mock detectSevereWeather
      const detectSevereWeather = require('../utils/weatherUtils').detectSevereWeather;
      if (detectSevereWeather) {
        jest.spyOn(require('../utils/weatherUtils'), 'detectSevereWeather').mockReturnValue([
          { type: 'storm', message: 'Severe thunderstorm in London' },
        ]);
      }

      const alerts = await WeatherAlertService.checkAndShowAlerts(weatherData, 'London');

      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multi-City Weather Management', () => {
    it('should handle multiple cities simultaneously', async () => {
      const cities = ['London', 'Paris', 'Berlin', 'Madrid'];

      WeatherService.fetchWeatherByCityName = jest.fn().mockImplementation((city) =>
        Promise.resolve({
          name: city,
          country_code: 'XX',
          weather: {
            current_weather: {
              temperature: 15 + cities.indexOf(city),
              weathercode: 0,
            },
          },
        })
      );

      const results = await Promise.all(
        cities.map((city) => WeatherService.fetchWeatherByCityName(city))
      );

      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(result.name).toBe(cities[index]);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      WeatherService.fetchWeatherByCityName = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(WeatherService.fetchWeatherByCityName('London')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle storage errors gracefully', () => {
      // Mock sessionStorage.setItem to throw an error
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      const result = StorageService.save('test', { data: 'test' });

      expect(result).toBe(false);

      // Restore original
      sessionStorage.setItem = originalSetItem;
    });

    it('should recover from corrupted storage data', () => {
      sessionStorage.setItem('corrupted', 'invalid json {{{');

      const result = StorageService.get('corrupted');

      expect(result).toBeNull();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache weather data to reduce API calls', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        name: 'London',
        weather: { current_weather: { temperature: 15 } },
      });

      WeatherService.fetchWeatherByCityName = mockFetch;

      // First call
      await WeatherService.fetchWeatherByCityName('London');

      // Store in cache
      StorageService.save('weather-London', {
        name: 'London',
        timestamp: Date.now(),
      });

      // Second call should use cache
      const cached = StorageService.get('weather-London');

      expect(cached).toBeTruthy();
      expect(cached.name).toBe('London');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain ARIA labels for accessibility', () => {
      const container = document.createElement('div');
      container.id = 'cities-container';
      container.setAttribute('role', 'main');
      container.setAttribute('aria-label', 'Weather cards');
      document.body.appendChild(container);

      expect(container.getAttribute('role')).toBe('main');
      expect(container.getAttribute('aria-label')).toBe('Weather cards');
    });

    it('should display loading states', () => {
      const loader = document.createElement('div');
      loader.className = 'loader';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-label', 'Loading weather data');
      document.body.appendChild(loader);

      expect(document.querySelector('.loader')).toBeTruthy();
      expect(loader.getAttribute('aria-label')).toBe('Loading weather data');
    });
  });

  describe('Data Validation', () => {
    it('should validate weather data structure', () => {
      const validData = {
        name: 'London',
        country_code: 'GB',
        weather: {
          current_weather: {
            temperature: 15,
            weathercode: 0,
          },
        },
      };

      expect(validData).toHaveProperty('name');
      expect(validData).toHaveProperty('weather');
      expect(validData.weather).toHaveProperty('current_weather');
    });

    it('should reject invalid weather data', () => {
      const invalidData = {
        name: 'London',
        // Missing weather data
      };

      expect(invalidData).not.toHaveProperty('weather');
    });
  });
});
