/**
 * TemperatureService - Single Responsibility: Handle temperature conversions and formatting
 * 
 * This service manages all temperature-related operations including conversion
 * between units and formatting for display. It follows the Single Responsibility
 * Principle by focusing solely on temperature operations.
 */
export class TemperatureService {
  static #currentUnit = 'celsius';

  /**
   * Available temperature units.
   */
  static get Units() {
    return {
      CELSIUS: 'celsius',
      FAHRENHEIT: 'fahrenheit',
    };
  }

  /**
   * Gets the current temperature unit.
   * @returns {string} - Current unit ('celsius' or 'fahrenheit').
   */
  static get currentUnit() {
    return TemperatureService.#currentUnit;
  }

  /**
   * Sets the current temperature unit.
   * @param {string} unit - The unit to set ('celsius' or 'fahrenheit').
   */
  static set currentUnit(unit) {
    if (unit === TemperatureService.Units.CELSIUS || unit === TemperatureService.Units.FAHRENHEIT) {
      TemperatureService.#currentUnit = unit;
    } else {
      console.warn(`Invalid temperature unit: ${unit}. Using default.`);
    }
  }

  /**
   * Converts Celsius to Fahrenheit.
   * @param {number} celsius - Temperature in Celsius.
   * @returns {number} - Temperature in Fahrenheit.
   */
  static celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  /**
   * Converts Fahrenheit to Celsius.
   * @param {number} fahrenheit - Temperature in Fahrenheit.
   * @returns {number} - Temperature in Celsius.
   */
  static fahrenheitToCelsius(fahrenheit) {
    return ((fahrenheit - 32) * 5) / 9;
  }

  /**
   * Formats temperature based on the current unit setting.
   * @param {number} celsius - Temperature in Celsius.
   * @param {string} unit - Optional override for unit.
   * @returns {string} - Formatted temperature string with unit symbol.
   */
  static format(celsius, unit = TemperatureService.#currentUnit) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) {
      return 'N/A';
    }

    if (unit === TemperatureService.Units.FAHRENHEIT) {
      const fahrenheit = TemperatureService.celsiusToFahrenheit(celsius);
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  /**
   * Formats temperature as a number without unit symbol.
   * @param {number} celsius - Temperature in Celsius.
   * @param {string} unit - Optional override for unit.
   * @returns {number} - Rounded temperature value.
   */
  static formatValue(celsius, unit = TemperatureService.#currentUnit) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) {
      return null;
    }

    if (unit === TemperatureService.Units.FAHRENHEIT) {
      return Math.round(TemperatureService.celsiusToFahrenheit(celsius));
    }
    return Math.round(celsius);
  }

  /**
   * Gets the unit symbol for the current or specified unit.
   * @param {string} unit - Optional override for unit.
   * @returns {string} - The unit symbol ('°C' or '°F').
   */
  static getUnitSymbol(unit = TemperatureService.#currentUnit) {
    return unit === TemperatureService.Units.FAHRENHEIT ? '°F' : '°C';
  }

  /**
   * Formats an array of temperatures.
   * @param {number[]} temperatures - Array of temperatures in Celsius.
   * @param {string} unit - Optional override for unit.
   * @returns {string[]} - Array of formatted temperature strings.
   */
  static formatArray(temperatures, unit = TemperatureService.#currentUnit) {
    if (!Array.isArray(temperatures)) {
      return [];
    }
    return temperatures.map(temp => TemperatureService.format(temp, unit));
  }

  /**
   * Toggles between Celsius and Fahrenheit.
   * @returns {string} - The new current unit.
   */
  static toggle() {
    TemperatureService.#currentUnit =
      TemperatureService.#currentUnit === TemperatureService.Units.CELSIUS
        ? TemperatureService.Units.FAHRENHEIT
        : TemperatureService.Units.CELSIUS;
    return TemperatureService.#currentUnit;
  }

  /**
   * Formats wind speed based on unit preference.
   * @param {number} kmh - Wind speed in km/h.
   * @param {string} unit - Temperature unit to determine wind speed unit.
   * @returns {string} - Formatted wind speed string.
   */
  static formatWindSpeed(kmh, unit = TemperatureService.#currentUnit) {
    if (kmh === null || kmh === undefined || isNaN(kmh)) {
      return 'N/A';
    }

    if (unit === TemperatureService.Units.FAHRENHEIT) {
      // Convert km/h to mph for imperial users
      const mph = kmh * 0.621371;
      return `${Math.round(mph)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  }

  /**
   * Determines temperature-based clothing/comfort recommendation.
   * @param {number} celsius - Temperature in Celsius.
   * @returns {object} - Object with recommendation and class for styling.
   */
  static getComfortLevel(celsius) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) {
      return { text: 'Unknown', class: '' };
    }

    if (celsius < 0) {
      return { text: 'Freezing', class: 'temp-freezing' };
    } else if (celsius < 10) {
      return { text: 'Cold', class: 'temp-cold' };
    } else if (celsius < 18) {
      return { text: 'Cool', class: 'temp-cool' };
    } else if (celsius < 24) {
      return { text: 'Comfortable', class: 'temp-comfortable' };
    } else if (celsius < 30) {
      return { text: 'Warm', class: 'temp-warm' };
    } else {
      return { text: 'Hot', class: 'temp-hot' };
    }
  }
}

export default TemperatureService;
