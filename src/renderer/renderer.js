// --- Module Imports ---
import {
  CITIES_JSON_URL,
  GEOCODING_API_URL,
  WEATHER_API_URL,
  DEFAULT_LANGUAGE,
  AUTO_REFRESH_INTERVAL,
  WEATHER_MAPPINGS,
  SEVERE_WEATHER_CODES,
} from './utils/constants.js';

import {
  celsiusToFahrenheit,
  formatTemperature as formatTemp,
  getCurrentHourIndex,
  formatWindDirection,
  formatWindSpeed as formatWind,
  getUVRecommendation,
  formatTime,
  getWeatherIcon as getIcon,
  getWeatherDescription as getDescription,
  detectSevereWeather,
} from './utils/weatherUtils.js';

import {
  fetchJson,
  fetchGeocodingData,
  fetchWeatherData,
  fetchWeather,
  reverseGeocode,
  getCurrentPositionViaIP,
  getCurrentPosition,
} from './services/weatherApi.js';

import { WeatherAnimationManager } from './services/animations/WeatherAnimationManager.js';

// --- DOM Elements ---
const citiesContainer = document.getElementById('cities');
const citySearch = document.getElementById('citySearch');
const searchButton = document.getElementById('searchButton');
const geolocateButton = document.getElementById('geolocateButton');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchBarContainer = document.getElementById('search-bar-container');
const scrollableContainer = document.getElementById('scrollable-container');

// --- State Variables ---
let selectedIndex = -1; // Track the selected suggestion index
let lastSearchTerm = ''; // Track the last search term to prevent duplicates
let temperatureUnit = 'celsius'; // Track temperature unit (celsius or fahrenheit)
let autoRefreshInterval = null; // Store the auto-refresh interval ID
let saveSettingsTimeout = null; // Debounce timeout for saveSettings

// --- Animation Manager ---
const animationManager = new WeatherAnimationManager();

// --- Utility Functions ---

/**
 * Saves data to session storage.
 * @param {string} key - The key to store the data under.
 * @param {any} data - The data to store (will be JSON stringified).
 */
function saveToSessionStorage(key, data) {
  if (isSessionStorageAvailable()) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Retrieves data from session storage.
 * @param {string} key - The key to retrieve the data from.
 * @returns {any} - The parsed JSON data, or null if not found.
 */
function getFromSessionStorage(key) {
  if (isSessionStorageAvailable()) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Checks if session storage is available.
 * @returns {boolean} - True if session storage is available, false otherwise.
 */
function isSessionStorageAvailable() {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// --- Local wrapper functions for module imports ---

/**
 * Formats temperature based on current unit setting.
 * Wraps the imported formatTemp function with the local temperatureUnit state.
 */
function formatTemperature(celsius) {
  return formatTemp(celsius, temperatureUnit);
}

/**
 * Formats wind speed based on unit preference.
 * Wraps the imported formatWind function with the local temperatureUnit state.
 */
function formatWindSpeed(kmh) {
  return formatWind(kmh, temperatureUnit);
}

// --- Toast Notification System ---

/**
 * Shows a toast notification message.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast (success, error, warning, info).
 * @param {number} duration - How long to show the toast in milliseconds.
 */
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  const toastId = `toast-${Date.now()}`;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-body">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toast);

  // Auto-remove toast after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// --- Weather Alerts and Notifications ---

/**
 * Shows weather alerts for a city.
 * @param {object} weatherData - The weather data.
 * @param {string} cityName - The city name.
 */
async function showWeatherAlerts(weatherData, cityName) {
  const settings = await window.electron.readSettings();
  const alertPrefs = settings.weatherAlerts || {
    enabled: true,
    thunderstorm: true,
    heavyRain: true,
    heavySnow: true,
    extremeTemperature: true,
    highPrecipitation: true,
  };

  // Check if alerts are enabled globally
  if (!alertPrefs.enabled) {
    return [];
  }

  const alerts = detectSevereWeather(weatherData, cityName, formatTemperature);
  const filteredAlerts = alerts.filter(alert => alertPrefs[alert.type]);

  // Show native notifications for severe weather
  filteredAlerts.forEach(alert => {
    window.electron.showNotification('Weather Alert', alert.message);
    showToast(alert.message, 'warning', 5000);
  });

  return filteredAlerts;
}

// --- Geolocation ---

/**
 * Handles geolocation button click to auto-detect user location.
 */
async function handleGeolocate() {
  console.log('Geolocate button clicked');
  const originalContent = geolocateButton.innerHTML;

  try {
    // Show loading state
    geolocateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    geolocateButton.disabled = true;

    showToast('Detecting your location...', 'info', 2000);
    console.log('Requesting current position...');

    // Get current position
    const coords = await getCurrentPosition();
    console.log('=== LOCATION DETECTED ===');
    console.log('Latitude:', coords.latitude);
    console.log('Longitude:', coords.longitude);
    console.log('Source:', coords.source || 'unknown');
    console.log('========================');

    // Warn user if using IP-based location (less accurate)
    if (coords.source === 'ip') {
      showToast('⚠️ Using IP-based location (may be inaccurate). Please enable location permissions for accurate results.', 'warning', 5000);
    }

    // Always use reverse geocoding for more accurate city name
    showToast('Finding city name from coordinates...', 'info', 2000);
    let cityInfo = await reverseGeocode(coords.latitude, coords.longitude);
    console.log('City info from reverse geocoding:', cityInfo);

    // If reverse geocoding fails and we have IP data, use that as fallback
    if (!cityInfo && coords.city && coords.country_code) {
      console.log('Reverse geocoding failed, using city name from IP service:', coords.city);
      cityInfo = {
        name: coords.city,
        country_code: coords.country_code.toUpperCase(),
      };
    }

    if (!cityInfo) {
      showToast('Could not determine city from your location', 'error');
      return;
    }

    // Check if city is already displayed
    if (isCityAlreadyDisplayed(cityInfo.name)) {
      showToast(`${cityInfo.name} is already displayed`, 'warning');
      return;
    }

    showToast('Fetching weather data...', 'info', 2000);

    // Fetch weather data using coordinates directly
    const weatherData = await fetchWeatherData(coords.latitude, coords.longitude);
    console.log('Weather data fetched:', weatherData ? 'Success' : 'Failed');

    if (weatherData) {
      const cityData = {
        name: cityInfo.name,
        country_code: cityInfo.country_code,
        weather: weatherData,
        isCurrentLocation: true,
      };

      const card = createCityCard(cityData);
      citiesContainer.prepend(card);
      debouncedSaveSettings();

      // Apply masonry layout after adding new card
      setTimeout(() => {
        applyMasonryLayout();
      }, 100);

      showToast(
        `Added your current location: ${cityInfo.name}, ${cityInfo.country_code}`,
        'success'
      );

      // Check for weather alerts
      await showWeatherAlerts(weatherData, cityInfo.name);
    } else {
      showToast('Failed to fetch weather for your location', 'error');
    }
  } catch (error) {
    console.error('Geolocation error:', error);
    showToast(error.message || 'Failed to detect location', 'error');
  } finally {
    // Restore button
    geolocateButton.innerHTML = originalContent;
    geolocateButton.disabled = false;
  }
}

// --- Data Loading and Storage ---

/**
 * Loads cities from the JSON file and saves them to session storage.
 */
async function loadCities() {
  try {
    const cities = await fetchJson(CITIES_JSON_URL);
    saveToSessionStorage('cities', cities);
    console.log('Cities loaded:', cities);
  } catch (error) {
    console.error('Error loading cities:', error);
  }
}

// Initialize cities on app start
loadCities();

// --- UI Rendering Functions ---

/**
 * Creates a city card element.
 * @param {object} cityData - The city data.
 * @returns {HTMLElement} - The city card element.
 */
function createCityCard(cityData) {
  const { name, country_code, weather, isCurrentLocation } = cityData;
  const currentTemp = weather.current_weather.temperature;
  const weatherCode = weather.current_weather.weathercode;

  // Detect severe weather
  const alerts = detectSevereWeather(weather, name, formatTemperature);
  const hasAlerts = alerts.length > 0;
  const alertBadge = hasAlerts
    ? `<span class="weather-alert-badge" title="${alerts.map(a => a.message).join(', ')}"><i class="fas fa-triangle-exclamation"></i></span>`
    : '';

  // Current location indicator
  const locationBadge = isCurrentLocation
    ? `<span class="current-location-badge" title="Current Location"><i class="fas fa-location-dot"></i></span>`
    : '';

  // Get current hour index for extended details
  const currentHourIndex = getCurrentHourIndex(weather.hourly.time);

  // Extended weather details
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
  card.setAttribute('draggable', 'true'); // Make card draggable
  card.setAttribute('data-city-name', name);
  card.setAttribute('data-current-temp', currentTemp);
  card.setAttribute('data-weather-code', weatherCode);
  card.setAttribute('data-forecast-view', 'hourly'); // Track current view
  card.setAttribute('data-tab-view', 'forecast'); // Track current tab
  card.setAttribute('data-has-alerts', hasAlerts);
  card.setAttribute('data-is-current-location', isCurrentLocation || false);
  card.innerHTML = `
    <div class="card ${hasAlerts ? 'has-weather-alert' : ''} ${isCurrentLocation ? 'is-current-location' : ''}">
      <div class="card-body text-center position-relative">
        ${alertBadge}
        ${locationBadge}
        <button class="btn btn-sm refresh-button" aria-label="Refresh weather">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="btn btn-sm position-absolute top-0 end-0 m-2 remove-button" aria-label="Remove city">
          <i class="fas fa-x"></i>
        </button>
        <h3 class="card-title">${name}, ${country_code}</h3>
        ${getIcon(weatherCode)}
        <p class="card-text current-temp">Current: ${formatTemperature(currentTemp)} <span class="humidity-inline"><i class="fas fa-droplet"></i> ${humidity}%</span></p>
        <p class="card-text">${getDescription(weatherCode)}</p>

        <div class="card-tabs">
          <button class="card-tab-btn active" data-tab="forecast">Forecast</button>
          <button class="card-tab-btn" data-tab="details">Details</button>
          <button class="card-tab-btn" data-tab="history">History</button>
          <button class="card-tab-btn" data-tab="chart">Chart</button>
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
                  ${getNext6HoursForecast(weather.hourly.time, weather.hourly.temperature_2m)}
                </div>
              </div>
              <div class="daily-forecast-view" data-daily='${JSON.stringify(weather.daily)}'>
                ${get7DayForecast(weather.daily)}
              </div>
            </div>
          </div>

          <!-- Details Tab -->
          <div class="card-tab-pane" data-tab-pane="details">
            <div class="weather-details-grid">
              <div class="weather-detail">
                <i class="fas fa-temperature-half"></i>
                <span class="detail-label">Feels like</span>
                <span class="detail-value">${feelsLike !== undefined ? formatTemperature(feelsLike) : 'N/A'}</span>
              </div>
              <div class="weather-detail">
                <i class="fas fa-wind"></i>
                <span class="detail-label">Wind</span>
                <span class="detail-value">${windSpeed !== undefined ? `${formatWindSpeed(windSpeed)} ${formatWindDirection(windDirection)}` : 'N/A'}</span>
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
              <!-- Historical data will be loaded dynamically -->
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
        </div>
      </div>
    </div>
  `;

  // Add event listener to the refresh button
  const refreshButton = card.querySelector('.refresh-button');
  refreshButton.addEventListener('click', async () => {
    await refreshCityWeather(card, name);
  });

  // Add event listener to the remove button
  const removeButton = card.querySelector('.remove-button');
  removeButton.addEventListener('click', () => {
    // Stop animation if it exists
    if (card._animation) {
      card._animation.stop();
    }
    card.remove();
    debouncedSaveSettings();

    // Apply masonry layout after removing card
    setTimeout(() => {
      applyMasonryLayout();
    }, 50);
  });

  // Add event listeners to forecast toggle buttons
  const toggleButtons = card.querySelectorAll('.forecast-toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      toggleForecastView(card, view);
    });
  });

  // Add event listeners to tab buttons
  const tabButtons = card.querySelectorAll('.card-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      toggleCardTab(card, tab);
    });
  });

  // Add drag-and-drop event listeners
  setupDragAndDrop(card);

  // Initialize animation for this card based on settings
  initializeCardAnimation(card, name, weatherCode);

  return card;
}

// --- Drag and Drop Functionality ---

let draggedCard = null;
let draggedIndex = null;

/**
 * Sets up drag-and-drop event listeners for a city card.
 * @param {HTMLElement} card - The city card element.
 */
function setupDragAndDrop(card) {
  // Drag start event
  card.addEventListener('dragstart', (e) => {
    draggedCard = card;
    draggedIndex = Array.from(citiesContainer.children).indexOf(card);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', card.innerHTML);
  });

  // Drag end event
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    draggedCard = null;
    draggedIndex = null;
  });

  // Drag over event
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedCard && draggedCard !== card) {
      const cards = Array.from(citiesContainer.children);
      const currentIndex = cards.indexOf(card);

      if (draggedIndex < currentIndex) {
        // Insert after current card
        citiesContainer.insertBefore(draggedCard, card.nextSibling);
      } else {
        // Insert before current card
        citiesContainer.insertBefore(draggedCard, card);
      }

      draggedIndex = cards.indexOf(draggedCard);
    }
  });

  // Drop event
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Save new order and reapply masonry
    debouncedSaveSettings();
    setTimeout(() => {
      applyMasonryLayout();
    }, 50);
  });
}

/**
 * Initializes animation for a city card based on settings.
 * @param {HTMLElement} card - The city card element
 * @param {string} cityName - The city name
 * @param {number} weatherCode - The weather code
 */
async function initializeCardAnimation(card, cityName, weatherCode) {
  try {
    const settings = await window.electron.readSettings();
    const animationPrefs = settings.animationPreferences || {
      enabled: true,
    };

    // Check if animations are enabled globally
    const globalEnabled = animationPrefs.enabled;

    if (globalEnabled) {
      // Get the card container (the .card element)
      const cardContainer = card.querySelector('.card');
      if (cardContainer) {
        // Create and start animation with reduced intensity for card-level animations
        const animation = animationManager.createCardAnimation(cardContainer, weatherCode, 0.3);

        // Store animation instance on the card element for later cleanup
        if (animation) {
          card._animation = animation;
          console.log(`Animation started for ${cityName} with weather code ${weatherCode}`);
        } else {
          console.log(`No animation created for ${cityName} (weather code ${weatherCode})`);
        }
      }
    } else {
      console.log(`Animations disabled globally, skipping ${cityName}`);
    }
  } catch (error) {
    console.error('Error initializing card animation:', error);
  }
}

/**
 * Generates the HTML for the next 6 hours forecast.
 * @param {Array<string>} times - Array of hourly time strings.
 * @param {Array<number>} temperatures - Array of hourly temperatures.
 * @returns {string} - HTML string for the forecast.
 */
function getNext6HoursForecast(times, temperatures) {
  const now = new Date();
  const forecastItems = [];

  for (let i = 0; i < 6; i++) {
    const targetTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const targetHour = targetTime.getHours();

    // Find the closest matching time in the forecast data
    let forecastIndex = times.findIndex(time => {
      const timeDate = new Date(time);
      return timeDate.getHours() === targetHour && timeDate.getDate() === targetTime.getDate();
    });

    if (forecastIndex !== -1) {
      const temperature = temperatures[forecastIndex];
      forecastItems.push(`
        <div>
          <small>${targetHour}h</small>
          <p class="forecast-temp">${formatTemperature(temperature)}</p>
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
 * Generates the HTML for the 7-day forecast.
 * @param {object} dailyData - Daily forecast data from API.
 * @returns {string} - HTML string for the 7-day forecast.
 */
function get7DayForecast(dailyData) {
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
          <span class="temp-max" data-temp="${maxTemp}">${formatTemperature(maxTemp)}</span>
          <span class="temp-separator">/</span>
          <span class="temp-min" data-temp="${minTemp}">${formatTemperature(minTemp)}</span>
        </span>
        ${precipProb > 0 ? `<span class="precip-prob"><i class="fas fa-droplet"></i> ${Math.round(precipProb)}%</span>` : ''}
      </div>
    `);
  }

  return forecastItems.join('');
}

/**
 * Toggles between hourly and daily forecast views.
 * @param {HTMLElement} card - The city card element.
 * @param {string} view - 'hourly' or 'daily'.
 */
function toggleForecastView(card, view) {
  // Update card data attribute
  card.setAttribute('data-forecast-view', view);

  // Update button states
  const toggleButtons = card.querySelectorAll('.forecast-toggle-btn');
  toggleButtons.forEach(btn => {
    if (btn.getAttribute('data-view') === view) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update view visibility
  const hourlyView = card.querySelector('.hourly-forecast-view');
  const dailyView = card.querySelector('.daily-forecast-view');

  if (view === 'hourly') {
    hourlyView.classList.add('active');
    dailyView.classList.remove('active');
  } else {
    hourlyView.classList.remove('active');
    dailyView.classList.add('active');
  }

  // Reapply masonry layout after view changes
  setTimeout(() => {
    if (typeof applyMasonryLayout === 'function') {
      applyMasonryLayout();
    }
  }, 50);
}

/**
 * Toggles between card tabs (forecast, details, history).
 * @param {HTMLElement} card - The city card element.
 * @param {string} tab - 'forecast', 'details', or 'history'.
 */
async function toggleCardTab(card, tab) {
  // Update card data attribute
  card.setAttribute('data-tab-view', tab);

  // Update tab button states
  const tabButtons = card.querySelectorAll('.card-tab-btn');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab pane visibility
  const tabPanes = card.querySelectorAll('.card-tab-pane');
  tabPanes.forEach(pane => {
    if (pane.getAttribute('data-tab-pane') === tab) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Load historical data if History tab is selected and not already loaded
  if (tab === 'history') {
    const historyPane = card.querySelector('[data-tab-pane="history"]');
    const historyContent = historyPane.querySelector('.history-content');

    // Only load if not already loaded
    if (historyContent.children.length === 0) {
      const cityName = card.getAttribute('data-city-name');
      await loadHistoricalData(card, cityName);
    }
  }

  // Load chart data if Chart tab is selected and not already loaded
  if (tab === 'chart') {
    const chartPane = card.querySelector('[data-tab-pane="chart"]');
    const chartContent = chartPane.querySelector('.chart-content');
    const canvas = chartContent.querySelector('canvas');

    // Only load if not already loaded (check if chart exists on canvas)
    if (!canvas._chartInstance) {
      const cityName = card.getAttribute('data-city-name');
      await loadChartData(card, cityName);
    }
  }

  // Reapply masonry layout after tab changes
  setTimeout(() => {
    if (typeof applyMasonryLayout === 'function') {
      applyMasonryLayout();
    }
  }, 50);
}

/**
 * Loads historical weather data for a city.
 * @param {HTMLElement} card - The city card element.
 * @param {string} cityName - The city name.
 */
async function loadHistoricalData(card, cityName) {
  const historyPane = card.querySelector('[data-tab-pane="history"]');
  const historyLoading = historyPane.querySelector('.history-loading');
  const historyContent = historyPane.querySelector('.history-content');

  try {
    // Get city coordinates first
    const geocodeData = await fetchGeocodingData(cityName);
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch historical data from Open-Meteo Archive API
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    const data = await response.json();

    // Generate historical data HTML
    const historyHTML = generateHistoricalDataHTML(data.daily);

    // Update UI
    historyLoading.style.display = 'none';
    historyContent.style.display = 'block';
    historyContent.innerHTML = historyHTML;

  } catch (error) {
    console.error('Error loading historical data:', error);
    historyLoading.innerHTML = '<p class="text-muted small"><i class="fas fa-exclamation-circle"></i> Failed to load historical data</p>';
  }

  // Reapply masonry layout
  setTimeout(() => {
    applyMasonryLayout();
  }, 100);
}

/**
 * Generates HTML for historical weather data.
 * @param {object} dailyData - Daily historical weather data.
 * @returns {string} - HTML string for historical data.
 */
function generateHistoricalDataHTML(dailyData) {
  const {
    time,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_sum,
    weathercode,
  } = dailyData;

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
          <span class="history-temp-max">${formatTemperature(maxTemp)}</span>
          <span class="temp-separator">/</span>
          <span class="history-temp-min">${formatTemperature(minTemp)}</span>
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
 * Loads chart data (historical + forecast) for a city and renders chart.
 * @param {HTMLElement} card - The city card element.
 * @param {string} cityName - The city name.
 */
async function loadChartData(card, cityName) {
  const chartPane = card.querySelector('[data-tab-pane="chart"]');
  const chartLoading = chartPane.querySelector('.chart-loading');
  const chartContent = chartPane.querySelector('.chart-content');
  const canvas = chartContent.querySelector('canvas');

  try {
    // Get city coordinates first
    const geocodeData = await fetchGeocodingData(cityName);
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Calculate date range for historical data (last 7 days)
    const today = new Date();
    const historyStartDate = new Date();
    historyStartDate.setDate(today.getDate() - 7);

    const historyStartStr = historyStartDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch historical data
    const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${historyStartStr}&end_date=${todayStr}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

    const historyResponse = await fetch(historyUrl);
    if (!historyResponse.ok) {
      throw new Error('Failed to fetch historical data');
    }
    const historyData = await historyResponse.json();

    // Fetch forecast data (next 7 days) - use existing weather data from card
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;

    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    const forecastData = await forecastResponse.json();

    // Combine historical and forecast data
    const labels = [
      ...historyData.daily.time.map(t => {
        const date = new Date(t);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      ...forecastData.daily.time.map(t => {
        const date = new Date(t);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      })
    ];

    const maxTemps = [
      ...historyData.daily.temperature_2m_max,
      ...forecastData.daily.temperature_2m_max
    ];

    const minTemps = [
      ...historyData.daily.temperature_2m_min,
      ...forecastData.daily.temperature_2m_min
    ];

    // Render simple canvas-based chart
    renderSimpleChart(canvas, labels, maxTemps, minTemps, historyData.daily.time.length);

    // Update UI
    chartLoading.style.display = 'none';
    chartContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading chart data:', error);
    chartLoading.innerHTML = '<p class="text-muted small"><i class="fas fa-exclamation-circle"></i> Failed to load chart data</p>';
  }

  // Reapply masonry layout
  setTimeout(() => {
    applyMasonryLayout();
  }, 100);
}

/**
 * Renders a simple line chart on canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {Array<string>} labels - The date labels.
 * @param {Array<number>} maxTemps - Max temperatures.
 * @param {Array<number>} minTemps - Min temperatures.
 * @param {number} historyLength - Number of historical data points.
 */
function renderSimpleChart(canvas, labels, maxTemps, minTemps, historyLength) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min and max values for scaling
  const allTemps = [...maxTemps, ...minTemps];
  const minTemp = Math.min(...allTemps) - 2;
  const maxTemp = Math.max(...allTemps) + 2;
  const tempRange = maxTemp - minTemp;

  // Draw background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(padding, padding, chartWidth, chartHeight);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw vertical line at history/forecast boundary
  const boundaryX = padding + (chartWidth / (labels.length - 1)) * (historyLength - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(boundaryX, padding);
  ctx.lineTo(boundaryX, height - padding);
  ctx.stroke();
  ctx.setLineDash([]);

  // Function to convert temperature to y coordinate
  const tempToY = (temp) => {
    return height - padding - ((temp - minTemp) / tempRange) * chartHeight;
  };

  // Draw max temperature line
  ctx.strokeStyle = '#ffeb3b'; // Bright yellow for max temp
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  maxTemps.forEach((temp, i) => {
    const x = padding + (chartWidth / (labels.length - 1)) * i;
    const y = tempToY(temp);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw min temperature line
  ctx.strokeStyle = '#00e5ff'; // Bright cyan for min temp
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  minTemps.forEach((temp, i) => {
    const x = padding + (chartWidth / (labels.length - 1)) * i;
    const y = tempToY(temp);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  maxTemps.forEach((temp, i) => {
    const x = padding + (chartWidth / (labels.length - 1)) * i;
    const y = tempToY(temp);
    ctx.fillStyle = '#ffeb3b'; // Bright yellow
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    // Add white border for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  minTemps.forEach((temp, i) => {
    const x = padding + (chartWidth / (labels.length - 1)) * i;
    const y = tempToY(temp);
    ctx.fillStyle = '#00e5ff'; // Bright cyan
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    // Add white border for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw legend
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#ffeb3b'; // Yellow
  ctx.fillRect(padding, 5, 15, 4);
  ctx.fillStyle = '#fff';
  ctx.fillText('Max', padding + 20, 13);

  ctx.fillStyle = '#00e5ff'; // Cyan
  ctx.fillRect(padding + 60, 5, 15, 4);
  ctx.fillStyle = '#fff';
  ctx.fillText('Min', padding + 80, 13);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '11px Arial';
  ctx.fillText('History', padding + 120, 13);
  ctx.fillText('|', padding + 175, 13);
  ctx.fillText('Forecast', padding + 185, 13);

  // Store chart instance flag
  canvas._chartInstance = true;
}

// --- Search Functionality ---

/**
 * Handles the city search.
 */
async function handleSearch() {
  const city = citySearch.value.trim();
  if (!city || city === lastSearchTerm) return;

  lastSearchTerm = city;

  if (isCityAlreadyDisplayed(city)) {
    showToast(`${city} is already displayed`, 'warning');
    return;
  }

  // Show loading state
  searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  searchButton.disabled = true;

  try {
    await addNewCityToStorage(city);

    const cityData = await fetchWeather(city);
    if (cityData) {
      const card = createCityCard(cityData);
      citiesContainer.prepend(card);
      citySearch.value = '';
      debouncedSaveSettings();

      // Apply masonry layout after adding new card
      setTimeout(() => {
        applyMasonryLayout();
      }, 100);

      showToast(`${city} added successfully`, 'success');

      // Check for weather alerts
      await showWeatherAlerts(cityData.weather, cityData.name);
    } else {
      showToast(`Unable to fetch weather for ${city}`, 'error');
    }
  } catch (error) {
    console.error('Error searching for city:', error);
    showToast('Failed to search for city', 'error');
  } finally {
    // Restore search button
    searchButton.innerHTML = '<i class="fas fa-search"></i>';
    searchButton.disabled = false;
    lastSearchTerm = '';
  }
}

/**
 * Checks if the city is already displayed.
 * @param {string} city - The city name.
 * @returns {boolean} - True if the city is already displayed, false otherwise.
 */
function isCityAlreadyDisplayed(city) {
  const cityCards = document.querySelectorAll('.card-title');
  return Array.from(cityCards).some(card => card.textContent.includes(city));
}

/**
 * Adds a new city to session storage if it's not already there.
 * @param {string} city - The city name.
 */
async function addNewCityToStorage(city) {
  let cities = getFromSessionStorage('cities') || [];
  const cityExists = cities.some(c => c.name.toLowerCase() === city.toLowerCase());

  if (!cityExists) {
    try {
      const response = await fetch(
        `${GEOCODING_API_URL}?name=${city}&count=1&language=${DEFAULT_LANGUAGE}&format=json`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const newCity = {
          name: data.results[0].name,
          country: data.results[0].country,
        };
        cities.push(newCity);
        saveToSessionStorage('cities', cities);
      }
    } catch (error) {
      console.error('Error fetching city:', error);
    }
  }
}

// --- Autocomplete Functionality ---

/**
 * Shows autocomplete suggestions based on the input.
 * @param {string} input - The input string.
 */
function showAutocompleteSuggestions(input) {
  const cities = getFromSessionStorage('cities') || [];
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(input.toLowerCase())
  );

  autocompleteDropdown.innerHTML = '';

  filteredCities.forEach((city, index) => {
    const suggestion = document.createElement('div');
    suggestion.className = `dropdown-item ${index === selectedIndex ? 'selected' : ''}`;
    suggestion.textContent = `${city.name}, ${city.country}`;
    suggestion.setAttribute('role', 'option');
    suggestion.setAttribute('aria-selected', index === selectedIndex);
    suggestion.addEventListener('click', () => {
      citySearch.value = city.name;
      autocompleteDropdown.style.display = 'none';
      handleSearch();
    });
    autocompleteDropdown.appendChild(suggestion);
  });

  autocompleteDropdown.style.display = filteredCities.length > 0 ? 'block' : 'none';
}

/**
 * Updates the selected suggestion in the autocomplete dropdown.
 * @param {NodeListOf<Element>} suggestions - A list of suggestion elements.
 */
function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((suggestion, index) => {
    suggestion.classList.toggle('selected', index === selectedIndex);
    suggestion.setAttribute('aria-selected', index === selectedIndex);
  });

  if (selectedIndex >= 0 && suggestions[selectedIndex]) {
    suggestions[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// --- Save and Load Settings ---

/**
 * Debounced version of saveSettings to prevent excessive writes.
 */
function debouncedSaveSettings() {
  clearTimeout(saveSettingsTimeout);
  saveSettingsTimeout = setTimeout(() => {
    saveSettings();
  }, 500);
}

/**
 * Saves the current app settings.
 */
async function saveSettings() {
  const settings = {
    isSearchBarHidden: searchBarContainer.classList.contains('d-none'),
    temperatureUnit: temperatureUnit,
    cities: Array.from(citiesContainer.children).map(card => {
      const name = card.querySelector('.card-title').textContent.split(',')[0];
      const country_code = card.querySelector('.card-title').textContent.split(',')[1].trim();
      return { name, country_code };
    }),
  };

  try {
    await window.electron.writeSettings(settings);
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Loads the saved app settings.
 */
async function loadSettings() {
  try {
    const settings = await window.electron.readSettings();
    console.log('Settings loaded:', settings);

    if (settings.isSearchBarHidden) {
      searchBarContainer.classList.add('d-none');
    }

    if (settings.temperatureUnit) {
      temperatureUnit = settings.temperatureUnit;
      updateTemperatureUnitButton();
    }

    // Load cities one by one to avoid overwhelming the API
    for (const city of settings.cities || []) {
      try {
        const cityData = await fetchWeather(city.name);
        if (cityData) {
          const card = createCityCard(cityData);
          citiesContainer.appendChild(card);

          // Check for weather alerts on startup
          await showWeatherAlerts(cityData.weather, cityData.name);
        }
      } catch (error) {
        console.error(`Error loading city ${city.name}:`, error);
      }
    }

    // Apply masonry layout after all cities are loaded
    console.log('All cities loaded, applying masonry layout...');
    setTimeout(() => {
      applyMasonryLayout();
    }, 200);

    // Start auto-refresh after loading settings
    startAutoRefresh();
  } catch (error) {
    console.error('Error loading settings:', error);
    showToast('Failed to load saved settings', 'error');
  }
}

// Load settings when the app starts
loadSettings();

// --- Temperature Unit Toggle ---

/**
 * Updates the temperature unit button text.
 */
function updateTemperatureUnitButton() {
  const tempUnitBtn = document.getElementById('temp-unit-toggle');
  if (tempUnitBtn) {
    tempUnitBtn.textContent = temperatureUnit === 'celsius' ? '°C' : '°F';
  }
}

/**
 * Toggles between Celsius and Fahrenheit.
 */
function toggleTemperatureUnit() {
  temperatureUnit = temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius';
  updateTemperatureUnitButton();
  updateAllTemperatureDisplays();
  debouncedSaveSettings();
}

/**
 * Updates all temperature displays on the page.
 */
function updateAllTemperatureDisplays() {
  const allCards = citiesContainer.querySelectorAll('.col');
  allCards.forEach(card => {
    // Update current temperature
    const currentTemp = parseFloat(card.getAttribute('data-current-temp'));
    const tempElement = card.querySelector('.current-temp');
    if (tempElement && !isNaN(currentTemp)) {
      // Get humidity element to preserve it
      const humidityElement = tempElement.querySelector('.humidity-inline');
      const humidityHTML = humidityElement ? humidityElement.outerHTML : '';
      tempElement.innerHTML = `Current: ${formatTemperature(currentTemp)} ${humidityHTML}`;
    }

    // Update hourly forecast temperatures
    const forecastContainer = card.querySelector('.forecast-container');
    if (forecastContainer) {
      const hourlyTemps = JSON.parse(forecastContainer.getAttribute('data-hourly-temps') || '[]');
      const hourlyTimes = JSON.parse(forecastContainer.getAttribute('data-hourly-times') || '[]');
      if (hourlyTemps.length > 0 && hourlyTimes.length > 0) {
        forecastContainer.innerHTML = getNext6HoursForecast(hourlyTimes, hourlyTemps);
      }
    }

    // Update daily forecast temperatures
    const dailyView = card.querySelector('.daily-forecast-view');
    if (dailyView) {
      const dailyData = JSON.parse(dailyView.getAttribute('data-daily') || '{}');
      if (dailyData.time && dailyData.time.length > 0) {
        dailyView.innerHTML = get7DayForecast(dailyData);
      }
    }
  });
}

// --- Refresh Functionality ---

/**
 * Refreshes weather data for a specific city card.
 * @param {HTMLElement} card - The city card element.
 * @param {string} cityName - The name of the city.
 */
async function refreshCityWeather(card, cityName) {
  const refreshButton = card.querySelector('.refresh-button i');

  try {
    // Show loading state
    refreshButton.classList.add('fa-spin');

    const cityData = await fetchWeather(cityName);
    if (cityData) {
      // Update the card content
      const cardBody = card.querySelector('.card-body');
      const currentTemp = cityData.weather.current_weather.temperature;
      const weatherCode = cityData.weather.current_weather.weathercode;

      // Update data attributes
      card.setAttribute('data-current-temp', currentTemp);
      card.setAttribute('data-weather-code', weatherCode);

      // Update hourly forecast data
      const forecastContainer = cardBody.querySelector('.forecast-container');
      if (forecastContainer) {
        forecastContainer.setAttribute(
          'data-hourly-temps',
          JSON.stringify(cityData.weather.hourly.temperature_2m)
        );
        forecastContainer.setAttribute(
          'data-hourly-times',
          JSON.stringify(cityData.weather.hourly.time)
        );
        forecastContainer.innerHTML = getNext6HoursForecast(
          cityData.weather.hourly.time,
          cityData.weather.hourly.temperature_2m
        );
      }

      // Update daily forecast data
      const dailyView = cardBody.querySelector('.daily-forecast-view');
      if (dailyView) {
        dailyView.setAttribute('data-daily', JSON.stringify(cityData.weather.daily));
        dailyView.innerHTML = get7DayForecast(cityData.weather.daily);
      }

      // Update current temperature
      const currentTempElement = cardBody.querySelector('.current-temp');
      if (currentTempElement) {
        // Get humidity element to preserve it
        const humidityElement = currentTempElement.querySelector('.humidity-inline');
        const humidityHTML = humidityElement ? humidityElement.outerHTML : '';
        currentTempElement.innerHTML = `Current: ${formatTemperature(currentTemp)} ${humidityHTML}`;
      }

      // Update weather description - find all .card-text elements and update the one after current-temp
      const cardTextElements = cardBody.querySelectorAll('.card-text');
      if (cardTextElements.length >= 2) {
        cardTextElements[1].textContent = getDescription(weatherCode);
      }

      // Refresh the animation if enabled
      if (card._animation) {
        card._animation.stop();
        card._animation = null;
      }
      await initializeCardAnimation(card, cityName, weatherCode);

      showToast(`${cityName} weather updated`, 'success', 2000);
    } else {
      showToast(`Failed to refresh ${cityName}`, 'error');
    }
  } catch (error) {
    console.error(`Error refreshing ${cityName}:`, error);
    showToast(`Error refreshing ${cityName}`, 'error');
  } finally {
    // Remove loading state
    refreshButton.classList.remove('fa-spin');
  }
}

/**
 * Refreshes all city cards.
 */
async function refreshAllCities() {
  const allCards = citiesContainer.querySelectorAll('.col');
  for (const card of allCards) {
    const cityName = card.getAttribute('data-city-name');
    if (cityName) {
      await refreshCityWeather(card, cityName);
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Starts the auto-refresh interval.
 */
function startAutoRefresh() {
  // Clear existing interval if any
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Set up new interval
  autoRefreshInterval = setInterval(() => {
    console.log('Auto-refreshing weather data...');
    refreshAllCities();
  }, AUTO_REFRESH_INTERVAL);
}

/**
 * Stops the auto-refresh interval.
 */
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// --- Event Listeners ---

searchButton.addEventListener('click', handleSearch);

if (geolocateButton) {
  console.log('Geolocate button found, adding event listener');
  geolocateButton.addEventListener('click', handleGeolocate);
} else {
  console.error('Geolocate button not found!');
}

citySearch.addEventListener('keydown', e => {
  const suggestions = autocompleteDropdown.querySelectorAll('.dropdown-item');

  if (e.key === 'ArrowDown') {
    selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'ArrowUp') {
    selectedIndex = Math.max(selectedIndex - 1, -1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      citySearch.value = suggestions[selectedIndex].textContent.split(',')[0];
      autocompleteDropdown.style.display = 'none';
      handleSearch();
    } else {
      handleSearch();
    }
  }
});

let debounceTimer;
citySearch.addEventListener('input', e => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const input = e.target.value.trim();
    if (input) {
      showAutocompleteSuggestions(input);
    } else {
      autocompleteDropdown.style.display = 'none';
    }
  }, 300);
});

document.addEventListener('click', e => {
  if (!citySearch.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
    autocompleteDropdown.style.display = 'none';
  }
});

// --- Electron Integration ---

document.getElementById('close-btn').addEventListener('click', () => {
  stopAutoRefresh(); // Stop auto-refresh before closing
  window.electron.send('close-window');
});

document.getElementById('minimize-btn').addEventListener('click', () => {
  window.electron.send('minimize-window');
});

document.getElementById('maximize-btn').addEventListener('click', () => {
  window.electron.send('maximize-window');
});

document.getElementById('temp-unit-toggle').addEventListener('click', () => {
  toggleTemperatureUnit();
});

searchToggleBtn.addEventListener('click', () => {
  searchBarContainer.classList.toggle('d-none');
  debouncedSaveSettings();
});

if (scrollableContainer) {
  scrollableContainer.addEventListener('wheel', event => {
    scrollableContainer.scrollTop += event.deltaY;
  });
}

// --- Keyboard Shortcuts ---

/**
 * Handles global keyboard shortcuts.
 */
document.addEventListener('keydown', e => {
  // Detect platform - macOS uses Cmd (metaKey), others use Ctrl
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  // Ctrl/Cmd + F - Focus search bar
  if (modifier && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    if (searchBarContainer.classList.contains('d-none')) {
      searchBarContainer.classList.remove('d-none');
    }
    citySearch.focus();
    citySearch.select();
  }

  // Ctrl/Cmd + R - Refresh all cities
  if (modifier && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    showToast('Refreshing all cities...', 'info', 2000);
    refreshAllCities();
  }

  // Ctrl/Cmd + N - Open search (new city)
  if (modifier && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    if (searchBarContainer.classList.contains('d-none')) {
      searchBarContainer.classList.remove('d-none');
    }
    citySearch.focus();
  }

  // Escape - Close search/autocomplete
  if (e.key === 'Escape') {
    if (autocompleteDropdown.style.display === 'block') {
      autocompleteDropdown.style.display = 'none';
    } else if (!searchBarContainer.classList.contains('d-none')) {
      citySearch.blur();
    }
  }
});

// --- Settings Page ---

const mainPage = document.getElementById('main-page');
const settingsPage = document.getElementById('settings-page');
const settingsBtn = document.getElementById('settings-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');

/**
 * Shows the settings page and hides the main page.
 */
function showSettingsPage() {
  mainPage.classList.add('d-none');
  settingsPage.classList.remove('d-none');
  searchBarContainer.classList.add('d-none');
  loadSettingsUI();
}

/**
 * Shows the main page and hides the settings page.
 */
function showMainPage() {
  settingsPage.classList.add('d-none');
  mainPage.classList.remove('d-none');
}

/**
 * Loads the settings UI with current values.
 */
async function loadSettingsUI() {
  try {
    const settings = await window.electron.readSettings();

    // Load animation settings
    const globalAnimToggle = document.getElementById('global-animations-toggle');
    const animationPrefs = settings.animationPreferences || {
      enabled: true,
    };
    globalAnimToggle.checked = animationPrefs.enabled;

    // Load weather alert settings
    const alertPrefs = settings.weatherAlerts || {
      enabled: true,
      thunderstorm: true,
      heavyRain: true,
      heavySnow: true,
      extremeTemperature: true,
      highPrecipitation: true,
    };

    document.getElementById('alerts-enabled').checked = alertPrefs.enabled;
    document.getElementById('alert-thunderstorm').checked = alertPrefs.thunderstorm;
    document.getElementById('alert-heavy-rain').checked = alertPrefs.heavyRain;
    document.getElementById('alert-heavy-snow').checked = alertPrefs.heavySnow;
    document.getElementById('alert-extreme-temp').checked = alertPrefs.extremeTemperature;
    document.getElementById('alert-high-precip').checked = alertPrefs.highPrecipitation;

    // Load theme and apply active state
    const theme = settings.theme || 'purple-blue';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading settings UI:', error);
  }
}

/**
 * Saves animation preferences to settings.
 */
async function saveAnimationPreferences() {
  const settings = await window.electron.readSettings();

  const globalEnabled = document.getElementById('global-animations-toggle').checked;

  settings.animationPreferences = {
    enabled: globalEnabled,
  };

  try {
    await window.electron.writeSettings(settings);
    console.log('Animation preferences saved:', settings.animationPreferences);

    // Reload all card animations to reflect the new settings
    await reloadAllCardAnimations();
  } catch (error) {
    console.error('Error saving animation preferences:', error);
    showToast('Failed to save animation preferences', 'error');
  }
}

/**
 * Reloads animations for all city cards based on current settings.
 */
async function reloadAllCardAnimations() {
  const allCards = citiesContainer.querySelectorAll('.col');

  allCards.forEach(card => {
    // Stop existing animation if it exists
    if (card._animation) {
      card._animation.stop();
      card._animation = null;
    }

    // Reinitialize animation with new settings
    const cityName = card.getAttribute('data-city-name');
    const weatherCode = parseInt(card.getAttribute('data-weather-code'));

    if (cityName && !isNaN(weatherCode)) {
      initializeCardAnimation(card, cityName, weatherCode);
    }
  });
}

/**
 * Saves weather alert preferences to settings.
 */
async function saveAlertPreferences() {
  const settings = await window.electron.readSettings();

  settings.weatherAlerts = {
    enabled: document.getElementById('alerts-enabled').checked,
    thunderstorm: document.getElementById('alert-thunderstorm').checked,
    heavyRain: document.getElementById('alert-heavy-rain').checked,
    heavySnow: document.getElementById('alert-heavy-snow').checked,
    extremeTemperature: document.getElementById('alert-extreme-temp').checked,
    highPrecipitation: document.getElementById('alert-high-precip').checked,
  };

  try {
    await window.electron.writeSettings(settings);
    console.log('Alert preferences saved:', settings.weatherAlerts);
  } catch (error) {
    console.error('Error saving alert preferences:', error);
    showToast('Failed to save alert preferences', 'error');
  }
}

// Settings page event listeners
settingsBtn.addEventListener('click', () => {
  showSettingsPage();
});

backToMainBtn.addEventListener('click', () => {
  showMainPage();
});

// Global animations toggle
document.getElementById('global-animations-toggle').addEventListener('change', async () => {
  await saveAnimationPreferences();
  showToast('Animation settings saved', 'success', 2000);
});

// Weather alerts toggles
document.getElementById('alerts-enabled').addEventListener('change', async () => {
  await saveAlertPreferences();
  showToast('Alert settings saved', 'success', 2000);
});

['alert-thunderstorm', 'alert-heavy-rain', 'alert-heavy-snow', 'alert-extreme-temp', 'alert-high-precip'].forEach(id => {
  document.getElementById(id).addEventListener('change', async () => {
    await saveAlertPreferences();
  });
});

// --- Masonry Layout Handler ---

let masonryColumns = 3;
const columnGap = 24; // 1.5rem in pixels
const cardWidth = 350;

/**
 * Applies masonry layout to the cities grid
 */
function applyMasonryLayout() {
  const container = document.getElementById('cities');
  const items = Array.from(container.querySelectorAll('.col'));

  console.log(`[Masonry] Applying layout with ${items.length} items`);

  if (items.length === 0) {
    container.style.height = '0px';
    console.log('[Masonry] No items to layout, setting height to 0');
    return;
  }

  // Calculate number of columns based on container width
  const containerWidth = container.offsetWidth;
  const numColumns = Math.max(1, Math.floor((containerWidth + columnGap) / (cardWidth + columnGap)));
  masonryColumns = numColumns;

  console.log(`[Masonry] Container width: ${containerWidth}px, Columns: ${numColumns}`);

  // Calculate total grid width
  const gridWidth = numColumns * cardWidth + (numColumns - 1) * columnGap;

  // Calculate left offset to center the grid
  const leftOffset = Math.max(0, (containerWidth - gridWidth) / 2);

  console.log(`[Masonry] Grid width: ${gridWidth}px, Left offset: ${leftOffset}px`);

  // Create column height trackers
  const columnHeights = new Array(numColumns).fill(0);

  // Position each item
  items.forEach((item, index) => {
    // Ensure item is visible
    item.style.opacity = '1';

    // Find shortest column
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

    // Calculate position with centering offset
    const x = leftOffset + shortestColumn * (cardWidth + columnGap);
    const y = columnHeights[shortestColumn];

    // Apply position
    item.style.position = 'absolute';
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    item.style.width = `${cardWidth}px`;
    item.style.transition = 'top 0.3s ease, left 0.3s ease, opacity 0.3s ease';

    if (index === 0) {
      console.log(`[Masonry] First card positioned at (${x}, ${y}), height: ${item.offsetHeight}px`);
    }

    // Update column height
    columnHeights[shortestColumn] += item.offsetHeight + columnGap;
  });

  // Set container height
  const maxHeight = Math.max(...columnHeights);
  container.style.height = `${maxHeight}px`;
  container.style.position = 'relative';

  console.log(`[Masonry] Layout complete. Container height: ${maxHeight}px, Column heights:`, columnHeights);
}

/**
 * Debounced masonry layout application
 */
let masonryTimeout;
function debouncedMasonry() {
  clearTimeout(masonryTimeout);
  masonryTimeout = setTimeout(applyMasonryLayout, 100);
}

// Apply masonry when window loads (after all content is loaded)
window.addEventListener('load', () => {
  setTimeout(applyMasonryLayout, 300);
  loadAndApplyTheme(); // Load theme on startup
});

// Reapply on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(applyMasonryLayout, 250);
});

// --- Theme System ---

/**
 * Loads and applies the saved theme
 */
async function loadAndApplyTheme() {
  try {
    const settings = await window.electron.readSettings();
    const theme = settings.theme || 'purple-blue';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
    applyTheme('purple-blue'); // Default theme
  }
}

/**
 * Applies a theme to the body element
 * @param {string} themeName - The theme name
 */
function applyTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);

  // Update active state in theme grid if on settings page
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    if (option.getAttribute('data-theme') === themeName) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

/**
 * Saves the selected theme
 * @param {string} themeName - The theme name
 */
async function saveTheme(themeName) {
  try {
    const settings = await window.electron.readSettings();
    settings.theme = themeName;
    await window.electron.writeSettings(settings);
    console.log('Theme saved:', themeName);
  } catch (error) {
    console.error('Error saving theme:', error);
    showToast('Failed to save theme', 'error');
  }
}

// Add click handlers to theme options
document.addEventListener('DOMContentLoaded', () => {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', async () => {
      const themeName = option.getAttribute('data-theme');
      applyTheme(themeName);
      await saveTheme(themeName);
      showToast('Theme changed successfully', 'success', 2000);
    });
  });
});
