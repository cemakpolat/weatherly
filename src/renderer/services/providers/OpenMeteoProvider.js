/**
 * OpenMeteo Weather Provider (Single Responsibility Principle)
 *
 * This class is responsible for integrating with the Open-Meteo API.
 * It implements the IWeatherProvider interface to ensure compatibility.
 */

import { IWeatherProvider } from './IWeatherProvider.js';

const OPENMETEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPENMETEO_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const DEFAULT_LANGUAGE = 'en';

export class OpenMeteoProvider extends IWeatherProvider {
  /**
   * @returns {string} Provider name
   */
  getProviderName() {
    return 'OpenMeteo';
  }

  /**
   * Fetches JSON data from a URL
   * @private
   * @param {string} url - The URL to fetch from
   * @returns {Promise<any>} The JSON data
   */
  async _fetchJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[${this.getProviderName()}] Error fetching data:`, error);
      throw error;
    }
  }

  /**
   * Searches for cities by name and returns geocoding results
   * @param {string} cityName - The city name to search for
   * @returns {Promise<import('./IWeatherProvider.js').GeocodingResult|null>}
   */
  async geocodeCity(cityName) {
    try {
      const url = `${OPENMETEO_GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=${DEFAULT_LANGUAGE}&format=json`;
      const data = await this._fetchJson(url);

      if (!data?.results?.length) {
        return null;
      }

      const result = data.results[0];
      return {
        name: result.name,
        country_code: result.country_code,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    } catch (error) {
      console.error(`[${this.getProviderName()}] Geocoding error for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Fetches weather data for given coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<import('./IWeatherProvider.js').WeatherData|null>}
   */
  async getWeatherByCoordinates(latitude, longitude) {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current_weather: 'true',
        hourly:
          'temperature_2m,weathercode,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,uv_index',
        daily:
          'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max',
        timezone: 'auto',
      });

      const url = `${OPENMETEO_WEATHER_URL}?${params.toString()}`;
      const data = await this._fetchJson(url);

      return data;
    } catch (error) {
      console.error(
        `[${this.getProviderName()}] Weather fetch error for coordinates (${latitude}, ${longitude}):`,
        error
      );
      return null;
    }
  }

  /**
   * Fetches complete weather data for a city by name
   * @param {string} cityName - The city name
   * @returns {Promise<import('./IWeatherProvider.js').CityWeatherResult|null>}
   */
  async getWeatherByCity(cityName) {
    try {
      // First, geocode the city
      const geocoding = await this.geocodeCity(cityName);
      if (!geocoding) {
        throw new Error('Location not found');
      }

      // Then fetch weather for those coordinates
      const weatherData = await this.getWeatherByCoordinates(
        geocoding.latitude,
        geocoding.longitude
      );
      if (!weatherData) {
        throw new Error('Weather data not available');
      }

      return {
        name: geocoding.name,
        country_code: geocoding.country_code,
        weather: weatherData,
      };
    } catch (error) {
      console.error(`[${this.getProviderName()}] Error fetching weather for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Reverse geocodes coordinates to get city information
   * Uses Nominatim API for reverse geocoding
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<{name: string, country_code: string}|null>}
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Weatherly/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.address) {
        // Try to get city name from different possible fields
        const cityName =
          data.address.city ||
          data.address.town ||
          data.address.municipality ||
          data.address.village ||
          data.address.suburb ||
          data.address.county ||
          data.address.state_district ||
          data.name;

        const countryCode = data.address.country_code?.toUpperCase() || 'N/A';

        if (cityName) {
          return {
            name: cityName,
            country_code: countryCode,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`[${this.getProviderName()}] Reverse geocoding error:`, error);
      return null;
    }
  }
}
