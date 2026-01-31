/**
 * CardManager - Single Responsibility: Handle city card creation and management
 * 
 * This service manages the creation, updating, and removal of city cards.
 * It follows the Single Responsibility Principle by focusing solely on
 * card-related operations.
 */
import { WEATHER_MAPPINGS } from '../utils/constants.js';
import {
  getWeatherIcon,
  getWeatherDescription,
  formatWindDirection,
  getUVRecommendation,
  formatTime,
  detectSevereWeather,
  getCurrentHourIndex,
} from '../utils/weatherUtils.js';
import { TemperatureService } from './TemperatureService.js';
import { ForecastService } from './ForecastService.js';
import { DragDropManager } from './DragDropManager.js';
import { MasonryLayoutManager } from './MasonryLayoutManager.js';
import { WeatherAnimationManager } from './animations/WeatherAnimationManager.js';
import { SettingsManager } from './SettingsManager.js';
import { ToastService } from './ToastService.js';
import { ChartService } from './ChartService.js';
import { RadarService } from './RadarService.js';
import { HistoryService } from './HistoryService.js';
import { fetchWeather } from './weatherApi.js';

export class CardManager {
  static #container = null;
  static #animationManager = null;
  static #onCardRemoveCallback = null;

  /**
   * Initializes the card manager.
   * @param {HTMLElement|string} container - The container element or its ID.
   * @param {Function} onCardRemoveCallback - Callback when a card is removed.
   */
  static initialize(container, onCardRemoveCallback = null) {
    if (typeof container === 'string') {
      CardManager.#container = document.getElementById(container);
    } else {
      CardManager.#container = container;
    }

    CardManager.#animationManager = new WeatherAnimationManager();
    CardManager.#onCardRemoveCallback = onCardRemoveCallback;
  }

  /**
   * Gets the animation manager instance.
   * @returns {WeatherAnimationManager} - The animation manager.
   */
  static get animationManager() {
    return CardManager.#animationManager;
  }

  /**
   * Creates a city card element.
   * @param {object} cityData - The city data.
   * @returns {HTMLElement} - The city card element.
   */
  static createCard(cityData) {
    const { name, country_code, weather, isCurrentLocation } = cityData;
    const currentTemp = weather.current_weather.temperature;
    const weatherCode = weather.current_weather.weathercode;

    // Detect severe weather
    const alerts = detectSevereWeather(weather, name, temp => TemperatureService.format(temp));
    const hasAlerts = alerts.length > 0;
    const alertBadge = hasAlerts
      ? `<span class="weather-alert-badge" title="${alerts.map(a => a.message).join(', ')}"><i class="fas fa-triangle-exclamation"></i></span>`
      : '';

    // Current location indicator
    const locationBadge = isCurrentLocation
      ? `<span class="current-location-badge" title="Current Location"><i class="fas fa-location-dot"></i></span>`
      : '';

    // Get current weather details
    const currentHourIndex = getCurrentHourIndex(weather.hourly.time);
    const humidity = weather.hourly.relative_humidity_2m?.[currentHourIndex] || 'N/A';
    const feelsLike = weather.hourly.apparent_temperature?.[currentHourIndex];
    const windSpeed = weather.hourly.wind_speed_10m?.[currentHourIndex];
    const windDirection = weather.hourly.wind_direction_10m?.[currentHourIndex];
    const uvIndex = weather.daily.uv_index_max?.[0] || 0;
    const uvRec = getUVRecommendation(uvIndex);
    const sunrise = weather.daily.sunrise?.[0];
    const sunset = weather.daily.sunset?.[0];

    const card = document.createElement('div');
    card.className = 'col';
    card.setAttribute('data-city-name', name);
    card.setAttribute('data-current-temp', currentTemp);
    card.setAttribute('data-weather-code', weatherCode);
    card.setAttribute('data-forecast-view', 'hourly');
    card.setAttribute('data-tab-view', 'forecast');
    card.setAttribute('data-has-alerts', hasAlerts);
    card.setAttribute('data-is-current-location', isCurrentLocation || false);

    card.innerHTML = CardManager.#generateCardHTML({
      name,
      country_code,
      currentTemp,
      weatherCode,
      humidity,
      feelsLike,
      windSpeed,
      windDirection,
      uvIndex,
      uvRec,
      sunrise,
      sunset,
      weather,
      alertBadge,
      locationBadge,
      hasAlerts,
      isCurrentLocation,
    });

    // Set up event listeners
    CardManager.#setupCardEventListeners(card, name, weatherCode);

    // Set up drag and drop
    DragDropManager.setupCard(card);

    // Initialize animation
    CardManager.initializeCardAnimation(card, name, weatherCode);

    return card;
  }

  /**
   * Generates the HTML content for a card.
   * @private
   */
  static #generateCardHTML(data) {
    const {
      name,
      country_code,
      currentTemp,
      weatherCode,
      humidity,
      feelsLike,
      windSpeed,
      windDirection,
      uvIndex,
      uvRec,
      sunrise,
      sunset,
      weather,
      alertBadge,
      locationBadge,
      hasAlerts,
      isCurrentLocation,
    } = data;

    const hourlyForecast = ForecastService.getNext6HoursForecast(
      weather.hourly.time,
      weather.hourly.temperature_2m
    );
    const dailyForecast = ForecastService.get7DayForecast(weather.daily);

    return `
      <div class="card ${hasAlerts ? 'has-weather-alert' : ''} ${isCurrentLocation ? 'is-current-location' : ''}">
        <div class="card-body text-center position-relative">
          <!-- Row Header for List View -->
          <div class="row-header">
            <div class="row-header-badges">
              ${alertBadge}
              ${locationBadge}
            </div>
            <span class="row-header-city">${name}, ${country_code}</span>
            <div class="row-header-weather">
              ${getWeatherIcon(weatherCode)}
              <span class="card-text">${getWeatherDescription(weatherCode)}</span>
            </div>
            <span class="row-header-temp">${TemperatureService.format(currentTemp)}</span>
            <span class="row-header-humidity"><i class="fas fa-droplet"></i> ${humidity}%</span>
            <div class="row-header-actions">
              <button class="btn btn-sm refresh-button" aria-label="Refresh weather">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button class="btn btn-sm remove-button" aria-label="Remove city">
                <i class="fas fa-x"></i>
              </button>
            </div>
          </div>

          <!-- Original Card Content (for Grid View) -->
          ${alertBadge}
          ${locationBadge}
          <button class="btn btn-sm position-absolute top-0 end-0 m-2 remove-button" aria-label="Remove city">
            <i class="fas fa-x"></i>
          </button>
          <h3 class="card-title">${name}, ${country_code}</h3>
          ${getWeatherIcon(weatherCode)}
          <p class="card-text current-temp">Current: ${TemperatureService.format(currentTemp)} <span class="humidity-inline"><i class="fas fa-droplet"></i> ${humidity}%</span></p>
          <p class="card-text">${getWeatherDescription(weatherCode)}</p>

          <div class="card-tabs">
            <button class="card-tab-btn active" data-tab="forecast">Forecast</button>
            <button class="card-tab-btn" data-tab="details">Details</button>
            <button class="card-tab-btn" data-tab="history">History</button>
            <button class="card-tab-btn" data-tab="chart">Chart</button>
            <button class="card-tab-btn" data-tab="radar">Radar</button>
          </div>

          <div class="card-tab-content">
            <!-- Forecast Tab -->
            <div class="card-tab-pane active" data-tab-pane="forecast">
              <div class="forecast-toggle-container">
                <button class="forecast-toggle-btn active" data-view="hourly">Hourly</button>
                <button class="forecast-toggle-btn" data-view="daily">7-Day</button>
              </div>
              <div class="forecast-view-container">
                <div class="hourly-forecast-view active">
                  <div class="d-flex justify-content-around forecast-container" data-hourly-temps='${JSON.stringify(weather.hourly.temperature_2m)}' data-hourly-times='${JSON.stringify(weather.hourly.time)}'>
                    ${hourlyForecast}
                  </div>
                </div>
                <div class="daily-forecast-view" data-daily='${JSON.stringify(weather.daily)}'>
                  ${dailyForecast}
                </div>
              </div>
            </div>

            <!-- Details Tab -->
            <div class="card-tab-pane" data-tab-pane="details">
              <div class="weather-details-grid">
                <div class="weather-detail">
                  <i class="fas fa-temperature-half"></i>
                  <span class="detail-label">Feels like</span>
                  <span class="detail-value">${feelsLike !== undefined ? TemperatureService.format(feelsLike) : 'N/A'}</span>
                </div>
                <div class="weather-detail">
                  <i class="fas fa-wind"></i>
                  <span class="detail-label">Wind</span>
                  <span class="detail-value">${windSpeed !== undefined ? `${TemperatureService.formatWindSpeed(windSpeed)} ${formatWindDirection(windDirection)}` : 'N/A'}</span>
                </div>
                <div class="weather-detail">
                  <i class="fas fa-sun"></i>
                  <span class="detail-label">UV Index</span>
                  <span class="detail-value ${uvRec.class}">${uvIndex} (${uvRec.text})</span>
                </div>
                <div class="weather-detail">
                  <i class="fas fa-sunrise"></i>
                  <span class="detail-label">Sunrise</span>
                  <span class="detail-value">${sunrise ? formatTime(sunrise) : 'N/A'}</span>
                </div>
                <div class="weather-detail">
                  <i class="fas fa-sunset"></i>
                  <span class="detail-label">Sunset</span>
                  <span class="detail-value">${sunset ? formatTime(sunset) : 'N/A'}</span>
                </div>
              </div>
            </div>

            <!-- History Tab -->
            <div class="card-tab-pane" data-tab-pane="history">
              <div class="history-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading historical data...
              </div>
              <div class="history-content" style="display: none;">
              </div>
            </div>

            <!-- Chart Tab -->
            <div class="card-tab-pane" data-tab-pane="chart">
              <div class="chart-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading chart data...
              </div>
              <div class="chart-content" style="display: none;">
                <canvas id="weather-chart-${name.replace(/\s+/g, '-')}" width="320" height="240"></canvas>
              </div>
            </div>

            <!-- Radar Tab -->
            <div class="card-tab-pane" data-tab-pane="radar">
              <div class="radar-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading radar map...
              </div>
              <div class="radar-content" style="display: none;">
                <div id="radar-map-${name.replace(/\s+/g, '-')}" class="radar-map-container"></div>
                <div class="radar-controls">
                  <label class="radar-layer-toggle">
                    <input type="checkbox" class="radar-layer-precipitation" checked> Precipitation
                  </label>
                  <label class="radar-layer-toggle">
                    <input type="checkbox" class="radar-layer-clouds"> Clouds
                  </label>
                  <label class="radar-layer-toggle">
                    <input type="checkbox" class="radar-layer-temperature"> Temperature
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Sets up event listeners for a card.
   * @private
   */
  static #setupCardEventListeners(card, cityName, weatherCode) {
    // Refresh button (in row-header)
    const refreshButton = card.querySelector('.row-header .refresh-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', async () => {
        await CardManager.refreshCard(card, cityName);
      });
    }

    // Remove buttons (both in row-header and grid view)
    const removeButtons = card.querySelectorAll('.remove-button');
    removeButtons.forEach(removeButton => {
      removeButton.addEventListener('click', () => {
        CardManager.removeCard(card);
      });
    });

    // Forecast toggle buttons
    const toggleButtons = card.querySelectorAll('.forecast-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        CardManager.toggleForecastView(card, view);
      });
    });

    // Tab buttons
    const tabButtons = card.querySelectorAll('.card-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        CardManager.toggleCardTab(card, tab);
      });
    });

    // Row header accordion
    const rowHeader = card.querySelector('.row-header');
    if (rowHeader) {
      rowHeader.addEventListener('click', e => {
        if (!e.target.closest('.row-header-actions')) {
          card.classList.toggle('expanded');
          MasonryLayoutManager.scheduleUpdate(300);
        }
      });
    }
  }

  /**
   * Initializes animation for a card.
   * @param {HTMLElement} card - The card element.
   * @param {string} cityName - The city name.
   * @param {number} weatherCode - The weather code.
   */
  static async initializeCardAnimation(card, cityName, weatherCode) {
    try {
      const animationPrefs = await SettingsManager.getAnimationPreferences();

      if (animationPrefs.enabled) {
        const cardContainer = card.querySelector('.card');
        if (cardContainer && CardManager.#animationManager) {
          const animation = CardManager.#animationManager.createCardAnimation(
            cardContainer,
            weatherCode,
            0.3
          );

          if (animation) {
            card._animation = animation;
            console.log(`Animation started for ${cityName} with weather code ${weatherCode}`);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing card animation:', error);
    }
  }

  /**
   * Removes a card from the container.
   * @param {HTMLElement} card - The card to remove.
   */
  static removeCard(card) {
    // Stop animation if exists
    if (card._animation) {
      card._animation.stop();
    }

    card.remove();

    // Trigger callback
    if (CardManager.#onCardRemoveCallback) {
      CardManager.#onCardRemoveCallback();
    }

    MasonryLayoutManager.scheduleUpdate(50);
  }

  /**
   * Toggles between hourly and daily forecast views.
   * @param {HTMLElement} card - The card element.
   * @param {string} view - 'hourly' or 'daily'.
   */
  static toggleForecastView(card, view) {
    card.setAttribute('data-forecast-view', view);

    const toggleButtons = card.querySelectorAll('.forecast-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    const hourlyView = card.querySelector('.hourly-forecast-view');
    const dailyView = card.querySelector('.daily-forecast-view');

    if (view === 'hourly') {
      hourlyView.classList.add('active');
      dailyView.classList.remove('active');
    } else {
      hourlyView.classList.remove('active');
      dailyView.classList.add('active');
    }

    MasonryLayoutManager.scheduleUpdate(50);
  }

  /**
   * Toggles between card tabs.
   * @param {HTMLElement} card - The card element.
   * @param {string} tab - The tab to show.
   */
  static async toggleCardTab(card, tab) {
    card.setAttribute('data-tab-view', tab);

    // Update button states
    const tabButtons = card.querySelectorAll('.card-tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Update pane visibility
    const tabPanes = card.querySelectorAll('.card-tab-pane');
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.getAttribute('data-tab-pane') === tab);
    });

    // Load tab-specific content
    const cityName = card.getAttribute('data-city-name');

    if (tab === 'history') {
      const historyContent = card.querySelector('[data-tab-pane="history"] .history-content');
      if (historyContent.children.length === 0) {
        await HistoryService.loadForCard(card, cityName);
      }
    }

    if (tab === 'chart') {
      const canvas = card.querySelector('[data-tab-pane="chart"] canvas');
      if (!canvas._chartInstance) {
        await ChartService.loadForCard(card, cityName);
      }
    }

    if (tab === 'radar') {
      const radarMap = card.querySelector('[data-tab-pane="radar"] .radar-map-container');
      if (!radarMap._leafletMap) {
        await RadarService.loadForCard(card, cityName);
      }
    }

    MasonryLayoutManager.scheduleUpdate(50);
  }

  /**
   * Refreshes a card's weather data.
   * @param {HTMLElement} card - The card element.
   * @param {string} cityName - The city name.
   */
  static async refreshCard(card, cityName) {
    const refreshButton = card.querySelector('.refresh-button i');

    try {
      refreshButton?.classList.add('fa-spin');

      const cityData = await fetchWeather(cityName);
      if (cityData) {
        CardManager.updateCardData(card, cityData);
        ToastService.success(`${cityName} weather updated`, 2000);
      } else {
        ToastService.error(`Failed to refresh ${cityName}`);
      }
    } catch (error) {
      console.error(`Error refreshing ${cityName}:`, error);
      ToastService.error(`Error refreshing ${cityName}`);
    } finally {
      refreshButton?.classList.remove('fa-spin');
    }
  }

  /**
   * Updates a card's display with new weather data.
   * @param {HTMLElement} card - The card element.
   * @param {object} cityData - The new city data.
   */
  static updateCardData(card, cityData) {
    const { name, weather } = cityData;
    const currentTemp = weather.current_weather.temperature;
    const weatherCode = weather.current_weather.weathercode;

    // Update data attributes
    card.setAttribute('data-current-temp', currentTemp);
    card.setAttribute('data-weather-code', weatherCode);

    // Update current temperature display
    const currentTempElement = card.querySelector('.current-temp');
    if (currentTempElement) {
      const humidityElement = currentTempElement.querySelector('.humidity-inline');
      const humidityHTML = humidityElement ? humidityElement.outerHTML : '';
      currentTempElement.innerHTML = `Current: ${TemperatureService.format(currentTemp)} ${humidityHTML}`;
    }

    // Update forecast data
    const forecastContainer = card.querySelector('.forecast-container');
    if (forecastContainer) {
      forecastContainer.setAttribute(
        'data-hourly-temps',
        JSON.stringify(weather.hourly.temperature_2m)
      );
      forecastContainer.setAttribute(
        'data-hourly-times',
        JSON.stringify(weather.hourly.time)
      );
      forecastContainer.innerHTML = ForecastService.getNext6HoursForecast(
        weather.hourly.time,
        weather.hourly.temperature_2m
      );
    }

    // Update daily forecast
    const dailyView = card.querySelector('.daily-forecast-view');
    if (dailyView) {
      dailyView.setAttribute('data-daily', JSON.stringify(weather.daily));
      dailyView.innerHTML = ForecastService.get7DayForecast(weather.daily);
    }

    // Refresh animation
    if (card._animation) {
      card._animation.stop();
      card._animation = null;
    }
    CardManager.initializeCardAnimation(card, name, weatherCode);
  }

  /**
   * Adds a card to the container.
   * @param {HTMLElement} card - The card to add.
   * @param {boolean} prepend - Whether to prepend (true) or append (false).
   */
  static addCard(card, prepend = true) {
    if (prepend) {
      CardManager.#container.prepend(card);
    } else {
      CardManager.#container.appendChild(card);
    }
    MasonryLayoutManager.scheduleUpdate(100);
  }

  /**
   * Gets all cards in the container.
   * @returns {NodeList} - All card elements.
   */
  static getAllCards() {
    return CardManager.#container?.querySelectorAll('.col') || [];
  }

  /**
   * Checks if a city is already displayed.
   * @param {string} cityName - The city name.
   * @returns {boolean} - True if already displayed.
   */
  static isCityDisplayed(cityName) {
    const cityCards = document.querySelectorAll('.card-title');
    return Array.from(cityCards).some(card => card.textContent.includes(cityName));
  }

  /**
   * Refreshes all cards.
   */
  static async refreshAllCards() {
    const allCards = CardManager.getAllCards();
    for (const card of allCards) {
      const cityName = card.getAttribute('data-city-name');
      if (cityName) {
        await CardManager.refreshCard(card, cityName);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Updates temperature display for all cards when unit changes.
   */
  static updateAllTemperatureDisplays() {
    const allCards = CardManager.getAllCards();
    allCards.forEach(card => {
      const currentTemp = parseFloat(card.getAttribute('data-current-temp'));
      const tempElement = card.querySelector('.current-temp');
      
      if (tempElement && !isNaN(currentTemp)) {
        const humidityElement = tempElement.querySelector('.humidity-inline');
        const humidityHTML = humidityElement ? humidityElement.outerHTML : '';
        tempElement.innerHTML = `Current: ${TemperatureService.format(currentTemp)} ${humidityHTML}`;
      }

      // Update forecasts
      const forecastContainer = card.querySelector('.forecast-container');
      if (forecastContainer) {
        const hourlyTemps = JSON.parse(forecastContainer.getAttribute('data-hourly-temps') || '[]');
        const hourlyTimes = JSON.parse(forecastContainer.getAttribute('data-hourly-times') || '[]');
        if (hourlyTemps.length > 0 && hourlyTimes.length > 0) {
          forecastContainer.innerHTML = ForecastService.getNext6HoursForecast(hourlyTimes, hourlyTemps);
        }
      }

      const dailyView = card.querySelector('.daily-forecast-view');
      if (dailyView) {
        const dailyData = JSON.parse(dailyView.getAttribute('data-daily') || '{}');
        if (dailyData.time && dailyData.time.length > 0) {
          dailyView.innerHTML = ForecastService.get7DayForecast(dailyData);
        }
      }
    });
  }

  /**
   * Reloads animations for all cards.
   */
  static async reloadAllAnimations() {
    const allCards = CardManager.getAllCards();
    
    allCards.forEach(card => {
      if (card._animation) {
        card._animation.stop();
        card._animation = null;
      }

      const cityName = card.getAttribute('data-city-name');
      const weatherCode = parseInt(card.getAttribute('data-weather-code'));

      if (cityName && !isNaN(weatherCode)) {
        CardManager.initializeCardAnimation(card, cityName, weatherCode);
      }
    });
  }
}

export default CardManager;
