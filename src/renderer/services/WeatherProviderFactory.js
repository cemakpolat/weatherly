/**
 * Weather Provider Factory (Factory Pattern + Dependency Inversion Principle)
 *
 * This factory creates weather provider instances based on configuration.
 * It follows the Open/Closed Principle - open for extension (new providers),
 * closed for modification (existing code doesn't change when adding providers).
 */

import { OpenMeteoProvider } from './providers/OpenMeteoProvider.js';

/**
 * Available weather provider types
 */
export const WeatherProviderType = {
  OPEN_METEO: 'openmeteo',
  // Future providers can be added here:
  // WEATHER_API: 'weatherapi',
  // OPEN_WEATHER_MAP: 'openweathermap',
  // VISUAL_CROSSING: 'visualcrossing',
};

/**
 * Factory class for creating weather providers
 */
export class WeatherProviderFactory {
  /**
   * Creates a weather provider instance
   * @param {string} providerType - The type of provider to create
   * @returns {import('./providers/IWeatherProvider.js').IWeatherProvider}
   * @throws {Error} If provider type is not supported
   */
  static createProvider(providerType = WeatherProviderType.OPEN_METEO) {
    switch (providerType) {
      case WeatherProviderType.OPEN_METEO:
        return new OpenMeteoProvider();

      // Future providers can be added here:
      // case WeatherProviderType.WEATHER_API:
      //   return new WeatherAPIProvider();
      // case WeatherProviderType.OPEN_WEATHER_MAP:
      //   return new OpenWeatherMapProvider();

      default:
        throw new Error(`Unsupported weather provider: ${providerType}`);
    }
  }

  /**
   * Gets list of available provider types
   * @returns {Array<{value: string, name: string, description: string}>}
   */
  static getAvailableProviders() {
    return [
      {
        value: WeatherProviderType.OPEN_METEO,
        name: 'Open-Meteo',
        description: 'Free weather API with no API key required',
      },
      // Future providers:
      // {
      //   value: WeatherProviderType.WEATHER_API,
      //   name: 'WeatherAPI.com',
      //   description: 'Commercial weather API with free tier',
      // },
    ];
  }
}
