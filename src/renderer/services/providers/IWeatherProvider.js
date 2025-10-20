/**
 * Weather Provider Interface (Interface Segregation Principle)
 *
 * This defines the contract that all weather providers must implement.
 * Any weather API provider (OpenMeteo, WeatherAPI, OpenWeatherMap, etc.)
 * must implement these methods to be compatible with the application.
 */

/**
 * @typedef {Object} GeocodingResult
 * @property {string} name - City name
 * @property {string} country_code - Country code
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 */

/**
 * @typedef {Object} WeatherData
 * @property {Object} current_weather - Current weather conditions
 * @property {number} current_weather.temperature - Current temperature in Celsius
 * @property {number} current_weather.weathercode - Weather condition code
 * @property {Object} hourly - Hourly forecast data
 * @property {Array<string>} hourly.time - Array of hourly timestamps
 * @property {Array<number>} hourly.temperature_2m - Hourly temperatures
 * @property {Array<number>} hourly.weathercode - Hourly weather codes
 * @property {Array<number>} hourly.relative_humidity_2m - Hourly humidity
 * @property {Array<number>} hourly.apparent_temperature - Hourly feels-like temperature
 * @property {Array<number>} hourly.wind_speed_10m - Hourly wind speed
 * @property {Array<number>} hourly.wind_direction_10m - Hourly wind direction
 * @property {Array<number>} hourly.uv_index - Hourly UV index
 * @property {Object} daily - Daily forecast data
 * @property {Array<string>} daily.time - Array of daily dates
 * @property {Array<number>} daily.temperature_2m_max - Daily max temperatures
 * @property {Array<number>} daily.temperature_2m_min - Daily min temperatures
 * @property {Array<number>} daily.weathercode - Daily weather codes
 * @property {Array<number>} daily.precipitation_sum - Daily precipitation
 * @property {Array<number>} daily.precipitation_probability_max - Daily precipitation probability
 * @property {Array<string>} daily.sunrise - Daily sunrise times
 * @property {Array<string>} daily.sunset - Daily sunset times
 * @property {Array<number>} daily.uv_index_max - Daily max UV index
 */

/**
 * @typedef {Object} CityWeatherResult
 * @property {string} name - City name
 * @property {string} country_code - Country code
 * @property {WeatherData} weather - Weather data
 */

/**
 * Base class for weather providers (Liskov Substitution Principle)
 * All providers must extend this class and implement its methods.
 */
export class IWeatherProvider {
  /**
   * Gets the provider name
   * @returns {string} Provider name (e.g., "OpenMeteo", "WeatherAPI")
   */
  getProviderName() {
    throw new Error('Method getProviderName() must be implemented');
  }

  /**
   * Searches for cities by name and returns geocoding results
   * @param {string} _cityName - The city name to search for
   * @returns {Promise<GeocodingResult|null>} Geocoding result or null
   */
  async geocodeCity(_cityName) {
    throw new Error('Method geocodeCity() must be implemented');
  }

  /**
   * Fetches weather data for given coordinates
   * @param {number} _latitude - Latitude coordinate
   * @param {number} _longitude - Longitude coordinate
   * @returns {Promise<WeatherData|null>} Weather data or null
   */
  async getWeatherByCoordinates(_latitude, _longitude) {
    throw new Error('Method getWeatherByCoordinates() must be implemented');
  }

  /**
   * Fetches complete weather data for a city by name
   * @param {string} _cityName - The city name
   * @returns {Promise<CityWeatherResult|null>} City weather data or null
   */
  async getWeatherByCity(_cityName) {
    throw new Error('Method getWeatherByCity() must be implemented');
  }

  /**
   * Reverse geocodes coordinates to get city information
   * @param {number} _latitude - Latitude coordinate
   * @param {number} _longitude - Longitude coordinate
   * @returns {Promise<{name: string, country_code: string}|null>} City info or null
   */
  async reverseGeocode(_latitude, _longitude) {
    throw new Error('Method reverseGeocode() must be implemented');
  }
}
