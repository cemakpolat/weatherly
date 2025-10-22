/**
 * Weather API Services (Legacy compatibility + SOLID refactor)
 *
 * This file now serves as a facade to the new SOLID-based WeatherService.
 * It maintains backward compatibility while using the new architecture internally.
 */

import { WeatherService, GeolocationService } from './WeatherService.js';
import { WeatherProviderType } from './WeatherProviderFactory.js';

// Create a default weather service instance
const defaultWeatherService = new WeatherService(WeatherProviderType.OPEN_METEO);

/**
 * Fetches JSON data from a URL (deprecated - kept for compatibility).
 * @deprecated Use WeatherService methods instead
 * @param {string} url - The URL to fetch from.
 * @returns {Promise<any>} - The JSON data.
 */
export async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

/**
 * Fetches geocoding data for a city.
 * @param {string} city - The city name.
 * @returns {Promise<any>} - The geocoding data.
 */
export async function fetchGeocodingData(city) {
  const result = await defaultWeatherService.geocodeCity(city);
  if (!result) {
    return { results: [] };
  }
  // Convert to old format for compatibility
  return {
    results: [result],
  };
}

/**
 * Fetches weather data for given coordinates.
 * @param {number} latitude - Latitude.
 * @param {number} longitude - Longitude.
 * @returns {Promise<any>} - The weather data.
 */
export async function fetchWeatherData(latitude, longitude) {
  return await defaultWeatherService.getWeatherByCoordinates(latitude, longitude);
}

/**
 * Fetches weather data for a given city.
 * @param {string} city - The name of the city.
 * @returns {Promise<{ name: string, country_code: string, weather: object }|null>} - The weather data or null.
 */
export async function fetchWeather(city) {
  return await defaultWeatherService.getWeatherByCity(city);
}

/**
 * Reverse geocodes coordinates to get city name.
 * @param {number} latitude - Latitude coordinate.
 * @param {number} longitude - Longitude coordinate.
 * @returns {Promise<{name: string, country_code: string}|null>} - City data or null.
 */
export async function reverseGeocode(latitude, longitude) {
  return await defaultWeatherService.reverseGeocode(latitude, longitude);
}

/**
 * Gets user's current location using IP-based geolocation.
 * @returns {Promise<{latitude: number, longitude: number, city: string, country_code: string}>}
 */
export async function getCurrentPositionViaIP() {
  return await GeolocationService.getCurrentPositionViaIP();
}

/**
 * Gets user's current location using browser geolocation API with IP fallback.
 * @returns {Promise<{latitude: number, longitude: number, source: string}>}
 */
export async function getCurrentPosition() {
  return await GeolocationService.getCurrentPosition();
}

// Export the new services for direct use
export { WeatherService, GeolocationService } from './WeatherService.js';
export { WeatherProviderFactory, WeatherProviderType } from './WeatherProviderFactory.js';
