/**
 * ForecastService - Single Responsibility: Handle forecast data generation
 * 
 * This service manages forecast data formatting and HTML generation.
 * It follows the Single Responsibility Principle by focusing solely on
 * forecast-related operations.
 */
import { WEATHER_MAPPINGS } from '../utils/constants.js';
import { TemperatureService } from './TemperatureService.js';

export class ForecastService {
  /**
   * Generates HTML for the next 6 hours forecast.
   * @param {Array<string>} times - Array of hourly time strings.
   * @param {Array<number>} temperatures - Array of hourly temperatures.
   * @returns {string} - HTML string for the forecast.
   */
  static getNext6HoursForecast(times, temperatures) {
    const now = new Date();
    const forecastItems = [];

    for (let i = 0; i < 6; i++) {
      const targetTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const targetHour = targetTime.getHours();

      // Find the closest matching time in the forecast data
      const forecastIndex = times.findIndex(time => {
        const timeDate = new Date(time);
        return timeDate.getHours() === targetHour && timeDate.getDate() === targetTime.getDate();
      });

      if (forecastIndex !== -1) {
        const temperature = temperatures[forecastIndex];
        forecastItems.push(`
          <div>
            <small>${targetHour}h</small>
            <p class="forecast-temp">${TemperatureService.format(temperature)}</p>
          </div>
        `);
      } else {
        forecastItems.push(`
          <div>
            <small>${targetHour}h</small>
            <p class="forecast-temp">--</p>
          </div>
        `);
      }
    }

    return forecastItems.join('');
  }

  /**
   * Generates HTML for the 7-day forecast.
   * @param {object} dailyData - Daily forecast data from API.
   * @returns {string} - HTML string for the 7-day forecast.
   */
  static get7DayForecast(dailyData) {
    const {
      time,
      temperature_2m_max,
      temperature_2m_min,
      weathercode,
      precipitation_probability_max,
    } = dailyData;
    
    const forecastItems = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < Math.min(7, time.length); i++) {
      const date = new Date(time[i]);
      const dayName = i === 0 ? 'Today' : daysOfWeek[date.getDay()];
      const maxTemp = temperature_2m_max[i];
      const minTemp = temperature_2m_min[i];
      const code = weathercode[i];
      const precipProb = precipitation_probability_max[i] || 0;

      const iconClass = WEATHER_MAPPINGS[code]?.icon || 'fa-question';

      forecastItems.push(`
        <div class="daily-forecast-item-compact">
          <span class="day-name">${dayName}</span>
          <i class="fas ${iconClass} daily-weather-icon"></i>
          <span class="temp-range">
            <span class="temp-max" data-temp="${maxTemp}">${TemperatureService.format(maxTemp)}</span>
            <span class="temp-separator">/</span>
            <span class="temp-min" data-temp="${minTemp}">${TemperatureService.format(minTemp)}</span>
          </span>
          ${precipProb > 0 ? `<span class="precip-prob"><i class="fas fa-droplet"></i> ${Math.round(precipProb)}%</span>` : ''}
        </div>
      `);
    }

    return forecastItems.join('');
  }

  /**
   * Gets the current hour index from hourly time data.
   * @param {Array<string>} hourlyTimes - Array of hourly time strings.
   * @returns {number} - The current hour index.
   */
  static getCurrentHourIndex(hourlyTimes) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];

    return hourlyTimes.findIndex(time => {
      const timeDate = new Date(time);
      const timeHour = timeDate.getHours();
      const timeDateStr = time.split('T')[0];
      return timeDateStr === currentDate && timeHour === currentHour;
    });
  }

  /**
   * Extracts current weather details from weather data.
   * @param {object} weather - The weather data object.
   * @returns {object} - Object containing current weather details.
   */
  static getCurrentWeatherDetails(weather) {
    const currentHourIndex = ForecastService.getCurrentHourIndex(weather.hourly.time);

    return {
      humidity: weather.hourly.relative_humidity_2m?.[currentHourIndex] || 'N/A',
      feelsLike: weather.hourly.apparent_temperature?.[currentHourIndex],
      windSpeed: weather.hourly.wind_speed_10m?.[currentHourIndex],
      windDirection: weather.hourly.wind_direction_10m?.[currentHourIndex],
      uvIndex: weather.daily.uv_index_max?.[0] || 0,
      sunrise: weather.daily.sunrise?.[0],
      sunset: weather.daily.sunset?.[0],
    };
  }

  /**
   * Updates forecast display for a card with new temperature unit.
   * @param {HTMLElement} card - The card element.
   * @param {object} weather - The weather data.
   */
  static updateForecastDisplay(card, weather) {
    // Update hourly forecast
    const forecastContainer = card.querySelector('.forecast-container');
    if (forecastContainer && weather.hourly) {
      forecastContainer.innerHTML = ForecastService.getNext6HoursForecast(
        weather.hourly.time,
        weather.hourly.temperature_2m
      );
    }

    // Update daily forecast
    const dailyView = card.querySelector('.daily-forecast-view');
    if (dailyView && weather.daily) {
      dailyView.innerHTML = ForecastService.get7DayForecast(weather.daily);
    }
  }
}

export default ForecastService;
