/**
 * Weather Service (Facade Pattern + Dependency Inversion Principle)
 *
 * This service provides a unified interface to weather operations.
 * It depends on the IWeatherProvider abstraction, not concrete implementations.
 * This follows the Dependency Inversion Principle - high-level modules (this service)
 * should not depend on low-level modules (specific providers), both should depend
 * on abstractions (IWeatherProvider interface).
 */

import { WeatherProviderFactory, WeatherProviderType } from './WeatherProviderFactory.js';

/**
 * Geolocation service for getting user's location
 */
export class GeolocationService {
  /**
   * Gets user's current location using IP-based geolocation
   * @returns {Promise<{latitude: number, longitude: number, city: string, country_code: string}>}
   */
  static async getCurrentPositionViaIP() {
    try {
      console.log('Getting location via IP...');
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('Failed to get location from IP');
      }
      const data = await response.json();
      console.log('IP geolocation data:', data);

      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          country_code: data.country_code,
        };
      }
      throw new Error('Invalid location data from IP service');
    } catch (error) {
      console.error('IP geolocation error:', error);
      throw error;
    }
  }

  /**
   * Gets user's current location using browser geolocation API with IP fallback
   * @returns {Promise<{latitude: number, longitude: number, source: string, city?: string, country_code?: string}>}
   */
  static async getCurrentPosition() {
    // Try browser geolocation first (most accurate)
    if (navigator.geolocation) {
      try {
        console.log('Trying browser geolocation (GPS-based)...');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            position => {
              console.log('Browser geolocation success (GPS):', position);
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                source: 'gps',
              });
            },
            error => {
              console.log('Browser geolocation failed, will try IP fallback:', error.message);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });
        return position;
      } catch (error) {
        console.log('Falling back to IP-based geolocation (less accurate)');
        console.log(
          'NOTE: IP geolocation may show the wrong city. Please grant location permission for accurate detection.'
        );
      }
    }

    // Use IP-based geolocation as fallback
    const ipCoords = await this.getCurrentPositionViaIP();
    ipCoords.source = 'ip';
    return ipCoords;
  }
}

/**
 * Main Weather Service
 * Provides high-level weather operations using configurable providers
 */
export class WeatherService {
  /**
   * @private
   * @type {import('./providers/IWeatherProvider.js').IWeatherProvider}
   */
  #provider;

  /**
   * @private
   * @type {string}
   */
  #providerType;

  /**
   * Creates a new WeatherService instance
   * @param {string} [providerType=WeatherProviderType.OPEN_METEO] - The weather provider to use
   */
  constructor(providerType = WeatherProviderType.OPEN_METEO) {
    this.#providerType = providerType;
    this.#provider = WeatherProviderFactory.createProvider(providerType);
    console.log(`WeatherService initialized with provider: ${this.#provider.getProviderName()}`);
  }

  /**
   * Gets the current provider name
   * @returns {string}
   */
  getProviderName() {
    return this.#provider.getProviderName();
  }

  /**
   * Gets the current provider type
   * @returns {string}
   */
  getProviderType() {
    return this.#providerType;
  }

  /**
   * Switches to a different weather provider
   * @param {string} providerType - The new provider type
   */
  switchProvider(providerType) {
    this.#providerType = providerType;
    this.#provider = WeatherProviderFactory.createProvider(providerType);
    console.log(`Switched to provider: ${this.#provider.getProviderName()}`);
  }

  /**
   * Fetches weather data for a city by name
   * @param {string} cityName - The city name
   * @returns {Promise<import('./providers/IWeatherProvider.js').CityWeatherResult|null>}
   */
  async getWeatherByCity(cityName) {
    return await this.#provider.getWeatherByCity(cityName);
  }

  /**
   * Fetches weather data for given coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<import('./providers/IWeatherProvider.js').WeatherData|null>}
   */
  async getWeatherByCoordinates(latitude, longitude) {
    return await this.#provider.getWeatherByCoordinates(latitude, longitude);
  }

  /**
   * Geocodes a city name to get coordinates
   * @param {string} cityName - The city name
   * @returns {Promise<import('./providers/IWeatherProvider.js').GeocodingResult|null>}
   */
  async geocodeCity(cityName) {
    return await this.#provider.geocodeCity(cityName);
  }

  /**
   * Reverse geocodes coordinates to get city information
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<{name: string, country_code: string}|null>}
   */
  async reverseGeocode(latitude, longitude) {
    return await this.#provider.reverseGeocode(latitude, longitude);
  }

  /**
   * Gets weather for user's current location
   * @returns {Promise<{cityData: object, coords: object}|null>}
   */
  async getWeatherForCurrentLocation() {
    try {
      // Get current position
      const coords = await GeolocationService.getCurrentPosition();
      console.log('=== LOCATION DETECTED ===');
      console.log('Latitude:', coords.latitude);
      console.log('Longitude:', coords.longitude);
      console.log('Source:', coords.source || 'unknown');
      console.log('========================');

      // Reverse geocode to get city name
      let cityInfo = await this.reverseGeocode(coords.latitude, coords.longitude);

      // Fallback to IP data if reverse geocoding fails
      if (!cityInfo && coords.city && coords.country_code) {
        console.log('Reverse geocoding failed, using city name from IP service:', coords.city);
        cityInfo = {
          name: coords.city,
          country_code: coords.country_code.toUpperCase(),
        };
      }

      if (!cityInfo) {
        throw new Error('Could not determine city from location');
      }

      // Fetch weather data
      const weatherData = await this.getWeatherByCoordinates(coords.latitude, coords.longitude);
      if (!weatherData) {
        throw new Error('Failed to fetch weather data');
      }

      return {
        cityData: {
          name: cityInfo.name,
          country_code: cityInfo.country_code,
          weather: weatherData,
          isCurrentLocation: true,
        },
        coords,
      };
    } catch (error) {
      console.error('Error getting weather for current location:', error);
      throw error;
    }
  }
}
