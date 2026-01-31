/**
 * HistoryService - Single Responsibility: Handle historical weather data
 * 
 * This service manages fetching and displaying historical weather data.
 * It follows the Single Responsibility Principle by focusing solely on
 * historical data operations.
 */
import { fetchGeocodingData } from './weatherApi.js';
import { WEATHER_MAPPINGS } from '../utils/constants.js';
import { TemperatureService } from './TemperatureService.js';

export class HistoryService {
  /**
   * Fetches historical weather data for a city.
   * @param {string} cityName - The city name.
   * @param {number} days - Number of days of history (default: 7).
   * @returns {Promise<object>} - Historical weather data.
   */
  static async fetchHistoricalData(cityName, days = 7) {
    // Get city coordinates
    const geocodeData = await fetchGeocodingData(cityName);
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch from Open-Meteo Archive API
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    return response.json();
  }

  /**
   * Generates HTML for historical weather data display.
   * @param {object} dailyData - Daily historical weather data.
   * @returns {string} - HTML string for historical data.
   */
  static generateHTML(dailyData) {
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weathercode } =
      dailyData;

    const historyItems = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const maxTemp = temperature_2m_max[i];
      const minTemp = temperature_2m_min[i];
      const precip = precipitation_sum[i] || 0;
      const code = weathercode[i];

      const iconClass = WEATHER_MAPPINGS[code]?.icon || 'fa-question';

      historyItems.push(`
        <div class="history-day-item">
          <div class="history-date">
            <span class="history-day-name">${dayName}</span>
            <span class="history-date-str">${dateStr}</span>
          </div>
          <i class="fas ${iconClass} history-weather-icon"></i>
          <div class="history-temps">
            <span class="history-temp-max">${TemperatureService.format(maxTemp)}</span>
            <span class="temp-separator">/</span>
            <span class="history-temp-min">${TemperatureService.format(minTemp)}</span>
          </div>
          ${precip > 0 ? `<span class="history-precip"><i class="fas fa-droplet"></i> ${precip.toFixed(1)}mm</span>` : '<span class="history-precip">-</span>'}
        </div>
      `);
    }

    return `
      <div class="history-container">
        <h6 class="history-title">Past 7 Days</h6>
        ${historyItems.join('')}
      </div>
    `;
  }

  /**
   * Loads and renders historical data for a card.
   * @param {HTMLElement} card - The city card element.
   * @param {string} cityName - The city name.
   */
  static async loadForCard(card, cityName) {
    const historyPane = card.querySelector('[data-tab-pane="history"]');
    const historyLoading = historyPane.querySelector('.history-loading');
    const historyContent = historyPane.querySelector('.history-content');

    try {
      const data = await HistoryService.fetchHistoricalData(cityName);
      const historyHTML = HistoryService.generateHTML(data.daily);

      historyLoading.style.display = 'none';
      historyContent.style.display = 'block';
      historyContent.innerHTML = historyHTML;
    } catch (error) {
      console.error('Error loading historical data:', error);
      historyLoading.innerHTML =
        '<p class="text-muted small"><i class="fas fa-exclamation-circle"></i> Failed to load historical data</p>';
    }
  }
}

export default HistoryService;
