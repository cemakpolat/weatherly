/**
 * WeatherService Tests
 */

import { WeatherService, GeolocationService } from '../WeatherService';
import { WeatherProviderFactory } from '../WeatherProviderFactory';

// Mock fetch
global.fetch = jest.fn();

// Mock WeatherProviderFactory
jest.mock('../WeatherProviderFactory', () => ({
  WeatherProviderFactory: {
    createProvider: jest.fn(() => ({
      fetchWeatherData: jest.fn(),
      fetchGeocodingData: jest.fn(),
      reverseGeocode: jest.fn(),
      getProviderName: jest.fn(() => 'open-meteo'),
      getProviderType: jest.fn(() => 'open-meteo'),
      getWeatherByCity: jest.fn(() => ({ current: { temp: 15 }, forecast: [] })),
      getWeatherByCoordinates: jest.fn(() => ({ current: { temp: 15 }, forecast: [] })),
    })),
  },
  WeatherProviderType: {
    OPEN_METEO: 'open-meteo',
    OPENWEATHER: 'openweather',
  },
}));

describe('GeolocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentPositionViaIP', () => {
    it('should get location via IP', async () => {
      const mockData = {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country_code: 'GB',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await GeolocationService.getCurrentPositionViaIP();

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://ipapi.co/json/');
    });

    it('should throw error if IP service fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
      });

      await expect(GeolocationService.getCurrentPositionViaIP()).rejects.toThrow();
    });
  });

  describe('getCurrentPosition', () => {
    it('should use browser geolocation if available', async () => {
      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      navigator.geolocation = {
        getCurrentPosition: jest.fn((success) => success(mockPosition)),
      };

      const result = await GeolocationService.getCurrentPosition();

      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        source: 'gps',
      });
    });

    it('should fallback to IP if browser geolocation fails', async () => {
      const mockIPData = {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country_code: 'GB',
      };

      navigator.geolocation = {
        getCurrentPosition: jest.fn((success, error) => 
          error({ message: 'User denied geolocation' })
        ),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockIPData,
      });

      const result = await GeolocationService.getCurrentPosition();

      expect(result.source).toBe('ip');
      expect(result.latitude).toBe(51.5074);
    });
  });
});

describe('WeatherService', () => {
  let mockProvider;
  let weatherService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      geocodeCity: jest.fn(),
      getWeatherByCoordinates: jest.fn(),
      reverseGeocode: jest.fn(),
      getProviderName: jest.fn(() => 'open-meteo'),
      getProviderType: jest.fn(() => 'open-meteo'),
    };

    WeatherProviderFactory.createProvider.mockReturnValue(mockProvider);
    
    // Create instance
    weatherService = new WeatherService('open-meteo');
  });

  describe('constructor', () => {
    it('should create instance with provider type', () => {
      expect(weatherService).toBeDefined();
      expect(WeatherProviderFactory.createProvider).toHaveBeenCalledWith('open-meteo');
    });
  });

  describe('getProviderName', () => {
    it('should return provider name', () => {
      const name = weatherService.getProviderName();
      expect(name).toBe('open-meteo');
    });
  });

  describe('getProviderType', () => {
    it('should return provider type', () => {
      const type = weatherService.getProviderType();
      expect(type).toBe('open-meteo');
    });
  });

  describe('switchProvider', () => {
    it('should switch to different provider', () => {
      const newMockProvider = {
        fetchWeatherData: jest.fn(),
        fetchGeocodingData: jest.fn(),
        reverseGeocode: jest.fn(),
      };

      WeatherProviderFactory.createProvider.mockReturnValue(newMockProvider);

      weatherService.switchProvider('openweather');

      expect(WeatherProviderFactory.createProvider).toHaveBeenCalledWith('openweather');
    });
  });

  describe('getWeatherByCity', () => {
    it('should fetch weather by city name', async () => {
      const mockWeatherData = {
        current_weather: {
          temperature: 15,
          weathercode: 0,
        },
        daily: {
          time: ['2024-01-01'],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
        },
      };

      mockProvider.geocodeCity.mockResolvedValue({
        name: 'London',
        country_code: 'GB',
        latitude: 51.5074,
        longitude: -0.1278,
      });
      mockProvider.getWeatherByCoordinates.mockResolvedValue(mockWeatherData);

      const result = await weatherService.getWeatherByCity('London');

      expect(mockProvider.geocodeCity).toHaveBeenCalledWith('London');
      expect(mockProvider.getWeatherByCoordinates).toHaveBeenCalledWith(51.5074, -0.1278);
      expect(result).toBeDefined();
      expect(result.weather.current_weather).toBeDefined();
    });

    it('should handle city not found', async () => {
      mockProvider.geocodeCity.mockResolvedValue(null);

      await expect(weatherService.getWeatherByCity('InvalidCity')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockProvider.geocodeCity.mockRejectedValue(new Error('API error'));

      await expect(weatherService.getWeatherByCity('London')).rejects.toThrow();
    });
  });

  describe('getWeatherByCoordinates', () => {
    it('should fetch weather by coordinates', async () => {
      const mockWeatherData = {
        current_weather: {
          temperature: 20,
          weathercode: 1,
        },
        daily: {
          time: ['2024-01-01'],
          temperature_2m_max: [25],
          temperature_2m_min: [15],
        },
      };

      mockProvider.getWeatherByCoordinates.mockResolvedValue(mockWeatherData);
      mockProvider.reverseGeocode.mockResolvedValue({
        name: 'Paris',
        country_code: 'FR',
      });

      const result = await weatherService.getWeatherByCoordinates(48.8566, 2.3522);

      expect(mockProvider.getWeatherByCoordinates).toHaveBeenCalledWith(48.8566, 2.3522);
      expect(result).toBeDefined();
      expect(result.current_weather).toBeDefined();
    });

    it('should handle coordinate API errors', async () => {
      mockProvider.getWeatherByCoordinates.mockRejectedValue(new Error('Weather API error'));

      await expect(weatherService.getWeatherByCoordinates(0, 0)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockProvider.geocodeCity.mockRejectedValue(new Error('Network error'));

      await expect(weatherService.getWeatherByCity('London')).rejects.toThrow('Weather data not available for London');
    });

    it('should handle invalid coordinates', async () => {
      await expect(weatherService.getWeatherByCoordinates(null, null)).rejects.toThrow();
    });
  });
});
