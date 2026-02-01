/* global process */
/**
 * Renderer - Main Application Orchestrator
 * 
 * This file serves as the main orchestrator that coordinates all services.
 * Following the SOLID principles:
 * - Single Responsibility: Each service handles one concern
 * - Open/Closed: New features can be added by creating new services
 * - Liskov Substitution: Services can be swapped with compatible implementations
 * - Interface Segregation: Each service exposes only necessary methods
 * - Dependency Inversion: High-level modules depend on abstractions
 * 
 * This file is now under 500 lines (reduced from 2650+) by delegating
 * responsibilities to specialized services.
 */

// --- Service Imports ---
import {
  StorageService,
  ToastService,
  SettingsManager,
  TemperatureService,
  WeatherAlertService,
  CardManager,
  SearchManager,
  ThemeManager,
  MasonryLayoutManager,
  DragDropManager,
  GeolocationManager,
  AutoRefreshManager,
  DynamicBackgroundManager,
  fetchJson,
  fetchWeather,
  fetchWeatherData,
} from './services/index.js';

import { CITIES_JSON_URL } from './utils/constants.js';

// --- DOM Elements ---
const citiesContainer = document.getElementById('cities');
const citySearch = document.getElementById('citySearch');
const searchButton = document.getElementById('searchButton');
const geolocateButton = document.getElementById('geolocateButton');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchBarContainer = document.getElementById('search-bar-container');
const scrollableContainer = document.getElementById('scrollable-container');

// --- Initialization ---

/**
 * Initializes all services with required dependencies.
 */
function initializeServices() {
  // Initialize core services
  ToastService.initialize('toast-container');
  SettingsManager.initialize(window.electron);
  WeatherAlertService.initialize(window.electron);

  // Initialize UI services
  MasonryLayoutManager.initialize('cities');
  DragDropManager.initialize(citiesContainer, debouncedSaveSettings);
  CardManager.initialize(citiesContainer, debouncedSaveSettings);
  DynamicBackgroundManager.initialize();

  // Initialize search with callback
  SearchManager.initialize(citySearch, autocompleteDropdown, handleCitySearch);

  // Initialize auto-refresh
  AutoRefreshManager.initialize(() => CardManager.refreshAllCards());
}

// --- Event Handlers ---

/**
 * Handles city search callback from SearchManager.
 * @param {string} cityName - The city name to search for.
 */
async function handleCitySearch(cityName) {
  if (CardManager.isCityDisplayed(cityName)) {
    ToastService.warning(`${cityName} is already displayed`);
    return;
  }

  // Show loading state
  searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  searchButton.disabled = true;

  try {
    await SearchManager.addCityToStorage(cityName);
    const cityData = await fetchWeather(cityName);

    if (cityData) {
      const card = CardManager.createCard(cityData);
      CardManager.addCard(card, true);
      SearchManager.clearInput();
      debouncedSaveSettings();

      // Update dynamic background if enabled
      if (DynamicBackgroundManager.isEnabled()) {
        DynamicBackgroundManager.update(citiesContainer);
      }

      ToastService.success(`${cityName} added successfully`);
      await WeatherAlertService.checkAndShowAlerts(cityData.weather, cityData.name);
    } else {
      ToastService.error(`Unable to fetch weather for ${cityName}`);
    }
  } catch (error) {
    console.error('Error searching for city:', error);
    ToastService.error('Failed to search for city');
  } finally {
    searchButton.innerHTML = '<i class="fas fa-search"></i>';
    searchButton.disabled = false;
  }
}

/**
 * Handles geolocation button click.
 */
async function handleGeolocate() {
  console.log('Geolocate button clicked');
  const originalContent = geolocateButton.innerHTML;

  try {
    geolocateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    geolocateButton.disabled = true;

    const locationData = await GeolocationManager.detectCurrentLocation();
    if (!locationData) return;

    const { coords, cityInfo } = locationData;

    if (CardManager.isCityDisplayed(cityInfo.name)) {
      ToastService.warning(`${cityInfo.name} is already displayed`);
      return;
    }

    ToastService.info('Fetching weather data...', 2000);
    const weatherData = await fetchWeatherData(coords.latitude, coords.longitude);

    if (weatherData) {
      const cityData = {
        name: cityInfo.name,
        country_code: cityInfo.country_code,
        weather: weatherData,
        isCurrentLocation: true,
      };

      const card = CardManager.createCard(cityData);
      CardManager.addCard(card, true);
      debouncedSaveSettings();

      // Update dynamic background if enabled
      if (DynamicBackgroundManager.isEnabled()) {
        DynamicBackgroundManager.update(citiesContainer);
      }

      ToastService.success(`Added your current location: ${cityInfo.name}, ${cityInfo.country_code}`);
      await WeatherAlertService.checkAndShowAlerts(weatherData, cityInfo.name);
    } else {
      ToastService.error('Failed to fetch weather for your location');
    }
  } catch (error) {
    console.error('Geolocation error:', error);
    ToastService.error(error.message || 'Failed to detect location');
  } finally {
    geolocateButton.innerHTML = originalContent;
    geolocateButton.disabled = false;
  }
}

// --- Settings Management ---

let saveSettingsTimeout = null;

/**
 * Debounced save settings function.
 */
function debouncedSaveSettings() {
  clearTimeout(saveSettingsTimeout);
  saveSettingsTimeout = setTimeout(saveSettings, 500);
}

/**
 * Saves current application settings.
 */
async function saveSettings() {
  const cities = Array.from(citiesContainer.children).map(card => {
    const name = card.querySelector('.card-title').textContent.split(',')[0];
    const country_code = card.querySelector('.card-title').textContent.split(',')[1].trim();
    return { name, country_code };
  });

  const settings = {
    isSearchBarHidden: searchBarContainer.classList.contains('d-none'),
    temperatureUnit: TemperatureService.currentUnit,
    isCompactView: document.body.classList.contains('compact-view'),
    cities,
  };

  try {
    await SettingsManager.update(settings);
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    ToastService.error('Failed to save settings');
  }
}

/**
 * Loads application settings.
 */
async function loadSettings() {
  try {
    const settings = await SettingsManager.read();
    console.log('Settings loaded:', settings);

    // Apply search bar visibility
    if (settings.isSearchBarHidden === false) {
      searchBarContainer.classList.remove('d-none');
    }

    // Apply temperature unit
    if (settings.temperatureUnit) {
      TemperatureService.currentUnit = settings.temperatureUnit;
      updateTemperatureUnitButton();
    }

    // Apply compact view
    if (settings.isCompactView) {
      applyCompactView(true);
    }

    // Load cities
    for (const city of settings.cities || []) {
      try {
        const cityData = await fetchWeather(city.name);
        if (cityData) {
          const card = CardManager.createCard(cityData);
          CardManager.addCard(card, false);
          await WeatherAlertService.checkAndShowAlerts(cityData.weather, cityData.name);
        }
      } catch (error) {
        console.error(`Error loading city ${city.name}:`, error);
      }
    }

    // Apply layout and start services
    console.log('All cities loaded, applying masonry layout...');
    MasonryLayoutManager.scheduleUpdate(200);
    AutoRefreshManager.start();
    
    // Update dynamic background if enabled
    if (DynamicBackgroundManager.isEnabled()) {
      setTimeout(() => {
        DynamicBackgroundManager.update(citiesContainer);
      }, 500);
    }
    
    hideLoadingSpinner();
  } catch (error) {
    console.error('Error loading settings:', error);
    ToastService.error('Failed to load saved settings');
    hideLoadingSpinner();
  }
}

/**
 * Loads cities data from JSON file.
 */
async function loadCities() {
  try {
    const cities = await fetchJson(CITIES_JSON_URL);
    StorageService.save('cities', cities);
    console.log('Cities loaded:', cities);
  } catch (error) {
    console.error('Error loading cities:', error);
  }
}

// --- UI Updates ---

/**
 * Updates temperature unit button text.
 */
function updateTemperatureUnitButton() {
  const tempUnitBtn = document.getElementById('temp-unit-toggle');
  if (tempUnitBtn) {
    tempUnitBtn.textContent = TemperatureService.getUnitSymbol();
  }
}

/**
 * Toggles temperature unit between Celsius and Fahrenheit.
 */
function toggleTemperatureUnit() {
  TemperatureService.toggle();
  updateTemperatureUnitButton();
  CardManager.updateAllTemperatureDisplays();
  debouncedSaveSettings();
}

/**
 * Applies or removes compact view mode.
 * @param {boolean} enable - Whether to enable compact view.
 */
function applyCompactView(enable) {
  const compactViewBtn = document.getElementById('compact-view-toggle');

  if (enable) {
    document.body.classList.add('compact-view');
    compactViewBtn.classList.add('active');
    compactViewBtn.querySelector('i').classList.remove('fa-list');
    compactViewBtn.querySelector('i').classList.add('fa-th-large');
    compactViewBtn.title = 'Switch to Grid View';
  } else {
    document.body.classList.remove('compact-view');
    compactViewBtn.classList.remove('active');
    compactViewBtn.querySelector('i').classList.remove('fa-th-large');
    compactViewBtn.querySelector('i').classList.add('fa-list');
    compactViewBtn.title = 'Switch to List View';
  }
}

/**
 * Toggles compact view mode.
 */
function toggleCompactView() {
  const isCompact = document.body.classList.contains('compact-view');
  applyCompactView(!isCompact);
  MasonryLayoutManager.scheduleUpdate(50);
  debouncedSaveSettings();
}

/**
 * Hides the loading spinner.
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('app-loading-spinner');
  if (spinner) {
    spinner.classList.add('hidden');
    setTimeout(() => spinner.remove(), 500);
  }
}

// --- Settings Page ---

/**
 * Shows the settings page.
 */
function showSettingsPage() {
  document.getElementById('main-page').classList.add('d-none');
  document.getElementById('settings-page').classList.remove('d-none');
  searchBarContainer.classList.add('d-none');
  loadSettingsUI();
}

/**
 * Shows the main page.
 */
function showMainPage() {
  document.getElementById('settings-page').classList.add('d-none');
  document.getElementById('main-page').classList.remove('d-none');
}

/**
 * Loads the settings UI with current values.
 */
async function loadSettingsUI() {
  try {
    const settings = await SettingsManager.read();

    // Animation settings
    const globalAnimToggle = document.getElementById('global-animations-toggle');
    const animationPrefs = settings.animationPreferences || { enabled: true };
    globalAnimToggle.checked = animationPrefs.enabled;

    // Dynamic backgrounds
    const dynamicBgToggle = document.getElementById('dynamic-backgrounds-toggle');
    const dynamicBgPrefs = settings.dynamicBackgrounds || { enabled: false };
    if (dynamicBgToggle) {
      dynamicBgToggle.checked = dynamicBgPrefs.enabled;
      
      // Apply current state
      if (dynamicBgPrefs.enabled) {
        DynamicBackgroundManager.enable();
      }
    }

    // Weather alerts
    const alertPrefs = await WeatherAlertService.getPreferences();
    document.getElementById('alerts-enabled').checked = alertPrefs.enabled;
    document.getElementById('alert-thunderstorm').checked = alertPrefs.thunderstorm;
    document.getElementById('alert-heavy-rain').checked = alertPrefs.heavyRain;
    document.getElementById('alert-heavy-snow').checked = alertPrefs.heavySnow;
    document.getElementById('alert-extreme-temp').checked = alertPrefs.extremeTemperature;
    document.getElementById('alert-high-precip').checked = alertPrefs.highPrecipitation;

    // Auto-refresh
    const autoRefreshMinutes = await SettingsManager.getAutoRefreshInterval();
    const slider = document.getElementById('auto-refresh-interval');
    const valueDisplay = document.getElementById('refresh-interval-value');
    if (slider && valueDisplay) {
      slider.value = autoRefreshMinutes;
      valueDisplay.textContent = `${autoRefreshMinutes} min`;
    }

    // API keys
    const apiKeys = await SettingsManager.getApiKeys();
    const owmApiKeyInput = document.getElementById('openweathermap-api-key');
    if (owmApiKeyInput && apiKeys.openweathermap) {
      owmApiKeyInput.value = apiKeys.openweathermap;
    }

    // Theme
    ThemeManager.apply(settings.theme || 'purple-blue');
  } catch (error) {
    console.error('Error loading settings UI:', error);
  }
}

// --- Event Listeners Setup ---

function setupEventListeners() {
  // Search
  searchButton.addEventListener('click', () => SearchManager.search());

  // Geolocation
  if (geolocateButton) {
    geolocateButton.addEventListener('click', handleGeolocate);
  }

  // Window controls
  document.getElementById('close-btn').addEventListener('click', () => {
    AutoRefreshManager.stop();
    window.electron.send('close-window');
  });

  document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electron.send('minimize-window');
  });

  document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electron.send('maximize-window');
  });

  // Temperature unit toggle
  document.getElementById('temp-unit-toggle').addEventListener('click', toggleTemperatureUnit);

  // Theme mode toggle
  const themeModeToggle = document.getElementById('theme-mode-toggle');
  if (themeModeToggle) {
    themeModeToggle.addEventListener('click', () => ThemeManager.toggleMode());
  }

  // Compact view toggle
  document.getElementById('compact-view-toggle').addEventListener('click', toggleCompactView);

  // Search bar toggle
  searchToggleBtn.addEventListener('click', () => {
    searchBarContainer.classList.toggle('d-none');
    debouncedSaveSettings();
  });

  // Scrollable container
  if (scrollableContainer) {
    scrollableContainer.addEventListener('wheel', event => {
      scrollableContainer.scrollTop += event.deltaY;
    });
  }

  // Settings page navigation
  document.getElementById('settings-btn').addEventListener('click', showSettingsPage);
  document.getElementById('back-to-main-btn').addEventListener('click', showMainPage);

  // Settings controls
  setupSettingsEventListeners();

  // Keyboard shortcuts
  setupKeyboardShortcuts();

  // Window load/resize events
  window.addEventListener('load', () => {
    MasonryLayoutManager.scheduleUpdate(300);
    ThemeManager.loadAndApply();
  });
}

/**
 * Sets up settings page event listeners.
 */
function setupSettingsEventListeners() {
  // Global animations toggle
  document.getElementById('global-animations-toggle').addEventListener('change', async () => {
    const enabled = document.getElementById('global-animations-toggle').checked;
    await SettingsManager.setAnimationPreferences({ enabled });
    await CardManager.reloadAllAnimations();
    ToastService.success('Animation settings saved', 2000);
  });

  // Dynamic backgrounds toggle
  const dynamicBgToggle = document.getElementById('dynamic-backgrounds-toggle');
  if (dynamicBgToggle) {
    dynamicBgToggle.addEventListener('change', async () => {
      const enabled = dynamicBgToggle.checked;
      await SettingsManager.setDynamicBackgrounds({ enabled });
      
      if (enabled) {
        DynamicBackgroundManager.enable();
        ToastService.success('Dynamic backgrounds enabled', 2000);
      } else {
        DynamicBackgroundManager.disable();
        DynamicBackgroundManager.reset();
        ThemeManager.loadAndApply();
        ToastService.success('Dynamic backgrounds disabled', 2000);
      }
    });
  }

  // Weather alerts toggles
  document.getElementById('alerts-enabled').addEventListener('change', saveAlertPreferences);
  ['alert-thunderstorm', 'alert-heavy-rain', 'alert-heavy-snow', 'alert-extreme-temp', 'alert-high-precip'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveAlertPreferences);
  });

  // Auto-refresh slider
  const refreshSlider = document.getElementById('auto-refresh-interval');
  const refreshValue = document.getElementById('refresh-interval-value');
  if (refreshSlider && refreshValue) {
    refreshSlider.addEventListener('input', () => {
      refreshValue.textContent = `${refreshSlider.value} min`;
    });
    refreshSlider.addEventListener('change', async () => {
      await AutoRefreshManager.setInterval(parseInt(refreshSlider.value));
    });
  }

  // API key controls
  const saveOwmKeyBtn = document.getElementById('save-owm-api-key');
  if (saveOwmKeyBtn) {
    saveOwmKeyBtn.addEventListener('click', saveOpenWeatherMapApiKey);
  }

  const clearOwmKeyBtn = document.getElementById('clear-owm-api-key');
  if (clearOwmKeyBtn) {
    clearOwmKeyBtn.addEventListener('click', clearOpenWeatherMapApiKey);
  }

  const toggleOwmKeyBtn = document.getElementById('toggle-owm-key-visibility');
  if (toggleOwmKeyBtn) {
    toggleOwmKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  }

  // Data management buttons
  const exportBtn = document.getElementById('export-settings-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }

  const importBtn = document.getElementById('import-settings-btn');
  if (importBtn) {
    importBtn.addEventListener('click', triggerImportSettings);
  }

  const importFileInput = document.getElementById('import-settings-file');
  if (importFileInput) {
    importFileInput.addEventListener('change', importSettings);
  }

  const resetBtn = document.getElementById('reset-settings-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }

  // Theme options
  ThemeManager.setupThemeOptions();
}

/**
 * Saves alert preferences.
 */
async function saveAlertPreferences() {
  const prefs = {
    enabled: document.getElementById('alerts-enabled').checked,
    thunderstorm: document.getElementById('alert-thunderstorm').checked,
    heavyRain: document.getElementById('alert-heavy-rain').checked,
    heavySnow: document.getElementById('alert-heavy-snow').checked,
    extremeTemperature: document.getElementById('alert-extreme-temp').checked,
    highPrecipitation: document.getElementById('alert-high-precip').checked,
  };
  await WeatherAlertService.savePreferences(prefs);
  ToastService.success('Alert settings saved', 2000);
}

/**
 * Saves OpenWeatherMap API key.
 */
async function saveOpenWeatherMapApiKey() {
  const apiKeyInput = document.getElementById('openweathermap-api-key');
  const statusDiv = document.getElementById('owm-api-key-status');
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    statusDiv.innerHTML = '<small class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Please enter a valid API key</small>';
    ToastService.warning('Please enter a valid API key');
    return;
  }

  try {
    await SettingsManager.setApiKey('openweathermap', apiKey);
    statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-check-circle me-1"></i>API key saved!</small>';
    ToastService.success('OpenWeatherMap API key saved successfully', 3000);
    setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
  } catch (error) {
    console.error('Error saving API key:', error);
    statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-circle me-1"></i>Failed to save API key</small>';
    ToastService.error('Failed to save API key');
  }
}

/**
 * Clears OpenWeatherMap API key.
 */
async function clearOpenWeatherMapApiKey() {
  const apiKeyInput = document.getElementById('openweathermap-api-key');
  const statusDiv = document.getElementById('owm-api-key-status');

  try {
    await SettingsManager.setApiKey('openweathermap', '');
    apiKeyInput.value = '';
    statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-check-circle me-1"></i>API key cleared!</small>';
    ToastService.success('OpenWeatherMap API key cleared', 2000);
    setTimeout(() => { statusDiv.innerHTML = ''; }, 3000);
  } catch (error) {
    console.error('Error clearing API key:', error);
    ToastService.error('Failed to clear API key');
  }
}

/**
 * Toggles API key visibility.
 */
function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById('openweathermap-api-key');
  const toggleBtn = document.getElementById('toggle-owm-key-visibility');
  const icon = toggleBtn.querySelector('i');

  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    apiKeyInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

/**
 * Exports settings to a JSON file.
 */
async function exportSettings() {
  try {
    await SettingsManager.exportSettings();
    ToastService.success('Settings exported successfully!', 3000);
  } catch (error) {
    console.error('Error exporting settings:', error);
    ToastService.error('Failed to export settings');
  }
}

/**
 * Triggers file input for importing settings.
 */
function triggerImportSettings() {
  const fileInput = document.getElementById('import-settings-file');
  fileInput.click();
}

/**
 * Imports settings from a JSON file.
 */
async function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    await SettingsManager.importSettings(file);
    ToastService.success('Settings imported successfully! Reloading...', 2000);
    
    // Reload the app to apply new settings
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('Error importing settings:', error);
    ToastService.error('Failed to import settings. Please check the file format.');
  }
}

/**
 * Resets settings to defaults.
 */
async function resetSettings() {
  const confirmed = confirm(
    'Are you sure you want to reset all settings to defaults? This will remove all saved cities and preferences.'
  );
  
  if (!confirmed) return;

  try {
    await SettingsManager.resetToDefaults();
    ToastService.success('Settings reset to defaults! Reloading...', 2000);
    
    // Reload the app
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('Error resetting settings:', error);
    ToastService.error('Failed to reset settings');
  }
}

/**
 * Sets up keyboard shortcuts.
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + F - Focus search
    if (modifier && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      searchBarContainer.classList.remove('d-none');
      SearchManager.focus();
      ToastService.info('Search activated', 1500);
    }

    // Ctrl/Cmd + R - Refresh all
    if (modifier && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      AutoRefreshManager.triggerRefresh();
      ToastService.info('Refreshing weather data...', 2000);
    }

    // Ctrl/Cmd + N - New city
    if (modifier && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      searchBarContainer.classList.remove('d-none');
      SearchManager.focus();
      ToastService.info('Add new city', 1500);
    }

    // Ctrl/Cmd + , - Open settings (common on Mac)
    if (modifier && e.key === ',') {
      e.preventDefault();
      showSettingsPage();
    }

    // Ctrl/Cmd + T - Toggle theme mode (dark/light)
    if (modifier && e.key.toLowerCase() === 't') {
      e.preventDefault();
      ThemeManager.toggleMode();
      ToastService.info('Theme toggled', 1500);
    }

    // Ctrl/Cmd + E - Export settings
    if (modifier && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      exportSettings();
    }

    // Ctrl/Cmd + L - Toggle compact/grid view
    if (modifier && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      toggleCompactView();
    }

    // Ctrl/Cmd + G - Geolocate
    if (modifier && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      geolocateButton.click();
    }

    // Escape - Close search/autocomplete or settings
    if (e.key === 'Escape') {
      if (autocompleteDropdown.style.display === 'block') {
        autocompleteDropdown.style.display = 'none';
      } else if (!document.getElementById('settings-page').classList.contains('d-none')) {
        showMainPage();
      } else if (!searchBarContainer.classList.contains('d-none')) {
        searchBarContainer.classList.add('d-none');
      }
    }
  });
}

// --- Debug Error Handler ---
window.addEventListener('error', event => {
  if (event.message && event.message.includes('401')) {
    console.error('[Debug] 401 error detected:', {
      message: event.message,
      filename: event.filename,
    });
  }
}, true);

// --- Application Bootstrap ---

// Only run in non-test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  // Initialize all services
  initializeServices();

  // Load cities data
  loadCities();

  // Set up event listeners
  setupEventListeners();

  // Load saved settings and cities
  loadSettings();
}

// Export for testing
export {
  handleCitySearch,
  handleGeolocate,
  saveSettings,
  loadSettings,
  toggleTemperatureUnit,
  toggleCompactView,
};
