/**
 * Weather-related utility functions
 */

import { WEATHER_MAPPINGS, SEVERE_WEATHER_CODES } from './constants.js';

/**
 * Converts Celsius to Fahrenheit.
 * @param {number} celsius - Temperature in Celsius.
 * @returns {number} - Temperature in Fahrenheit.
 */
export function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Formats temperature based on current unit setting.
 * @param {number} celsius - Temperature in Celsius.
 * @param {string} unit - Temperature unit ('celsius' or 'fahrenheit').
 * @returns {string} - Formatted temperature string with compact unit.
 */
export function formatTemperature(celsius, unit = 'celsius') {
  if (unit === 'fahrenheit') {
    const temp = celsiusToFahrenheit(celsius);
    return `<span class="temp-value">${temp}</span><span class="temp-unit">°F</span>`;
  }
  return `<span class="temp-value">${celsius}</span><span class="temp-unit">°C</span>`;
}

/**
 * Gets current hour index from hourly data.
 * @param {Array<string>} times - Array of hourly time strings.
 * @returns {number} - Index of current hour or 0 if not found.
 */
export function getCurrentHourIndex(times) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDate = now.getDate();

  const index = times.findIndex(time => {
    const timeDate = new Date(time);
    return timeDate.getHours() === currentHour && timeDate.getDate() === currentDate;
  });

  return index !== -1 ? index : 0;
}

/**
 * Formats wind direction from degrees to compass direction.
 * @param {number} degrees - Wind direction in degrees (0-360).
 * @returns {string} - Compass direction (N, NE, E, SE, S, SW, W, NW).
 */
export function formatWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Formats wind speed based on unit preference.
 * @param {number} kmh - Wind speed in km/h.
 * @param {string} temperatureUnit - Temperature unit preference.
 * @returns {string} - Formatted wind speed.
 */
export function formatWindSpeed(kmh, temperatureUnit = 'celsius') {
  if (temperatureUnit === 'fahrenheit') {
    const mph = Math.round(kmh / 1.609);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

/**
 * Gets UV index recommendation.
 * @param {number} uvIndex - UV index value.
 * @returns {object} - UV recommendation with text and color class.
 */
export function getUVRecommendation(uvIndex) {
  if (uvIndex <= 2) {return { text: 'Low', class: 'uv-low' };}
  if (uvIndex <= 5) {return { text: 'Moderate', class: 'uv-moderate' };}
  if (uvIndex <= 7) {return { text: 'High', class: 'uv-high' };}
  if (uvIndex <= 10) {return { text: 'Very High', class: 'uv-very-high' };}
  return { text: 'Extreme', class: 'uv-extreme' };
}

/**
 * Formats time from ISO string to local time.
 * @param {string} isoTime - ISO time string.
 * @returns {string} - Formatted time (HH:MM).
 */
export function formatTime(isoTime) {
  const date = new Date(isoTime);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Gets the weather icon based on the weather code.
 * @param {number} weatherCode - The weather code.
 * @returns {string} - The FontAwesome icon HTML.
 */
export function getWeatherIcon(weatherCode) {
  const icon = WEATHER_MAPPINGS[weatherCode]?.icon || 'fa-question';
  return `<i class="fas ${icon} weather-icon"></i>`;
}

/**
 * Gets the weather description based on the weather code.
 * @param {number} weatherCode - The weather code.
 * @returns {string} - The weather description.
 */
export function getWeatherDescription(weatherCode) {
  return WEATHER_MAPPINGS[weatherCode]?.description || 'Unknown weather';
}

/**
 * Detects severe weather conditions from weather data.
 * @param {object} weatherData - The weather data from API.
 * @param {string} cityName - The name of the city.
 * @param {function} formatTempFn - Function to format temperature.
 * @returns {Array<{type: string, message: string}>} - Array of alerts.
 */
export function detectSevereWeather(weatherData, cityName, formatTempFn) {
  const alerts = [];
  const currentCode = weatherData.current_weather?.weathercode;
  const currentTemp = weatherData.current_weather?.temperature;
  const daily = weatherData.daily;

  // Check for current severe weather
  if (SEVERE_WEATHER_CODES.thunderstorm.includes(currentCode)) {
    alerts.push({
      type: 'thunderstorm',
      message: `⚡ Thunderstorm alert for ${cityName}! ${getWeatherDescription(currentCode)}`,
    });
  }

  if (SEVERE_WEATHER_CODES.heavyRain.includes(currentCode)) {
    alerts.push({
      type: 'heavyRain',
      message: `🌧️ Heavy rain alert for ${cityName}! ${getWeatherDescription(currentCode)}`,
    });
  }

  if (SEVERE_WEATHER_CODES.heavySnow.includes(currentCode)) {
    alerts.push({
      type: 'heavySnow',
      message: `❄️ Heavy snow alert for ${cityName}! ${getWeatherDescription(currentCode)}`,
    });
  }

  // Check for extreme temperatures
  if (currentTemp !== undefined) {
    if (currentTemp >= 35) {
      alerts.push({
        type: 'extremeTemperature',
        message: `🔥 Extreme heat alert for ${cityName}! Temperature: ${formatTempFn(currentTemp)}`,
      });
    } else if (currentTemp <= -15) {
      alerts.push({
        type: 'extremeTemperature',
        message: `🥶 Extreme cold alert for ${cityName}! Temperature: ${formatTempFn(currentTemp)}`,
      });
    }
  }

  // Check for high precipitation probability in next 24 hours
  if (daily?.precipitation_probability_max?.[0] >= 80) {
    alerts.push({
      type: 'highPrecipitation',
      message: `☔ High precipitation probability for ${cityName} today: ${Math.round(daily.precipitation_probability_max[0])}%`,
    });
  }

  return alerts;
}
