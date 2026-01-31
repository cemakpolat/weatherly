/**
 * Services Index - Central export point for all services
 * 
 * This file provides a clean import path for all modular services.
 * Following the Interface Segregation and Dependency Inversion principles,
 * consumers can import only what they need.
 */

// Core Services
export { StorageService } from './StorageService.js';
export { ToastService } from './ToastService.js';
export { SettingsManager } from './SettingsManager.js';
export { TemperatureService } from './TemperatureService.js';

// Weather Services
export { WeatherService } from './WeatherService.js';
export { WeatherProviderType } from './WeatherProviderFactory.js';
export { WeatherAlertService } from './WeatherAlertService.js';
export { ForecastService } from './ForecastService.js';
export { HistoryService } from './HistoryService.js';
export { ChartService } from './ChartService.js';
export { RadarService } from './RadarService.js';

// UI Services
export { CardManager } from './CardManager.js';
export { SearchManager } from './SearchManager.js';
export { ThemeManager } from './ThemeManager.js';
export { MasonryLayoutManager } from './MasonryLayoutManager.js';
export { DragDropManager } from './DragDropManager.js';

// Location Services
export { GeolocationManager } from './GeolocationManager.js';

// Background Services
export { AutoRefreshManager } from './AutoRefreshManager.js';

// Animation Services
export { WeatherAnimationManager } from './animations/WeatherAnimationManager.js';

// Weather API functions (for backward compatibility)
export {
  fetchJson,
  fetchGeocodingData,
  fetchWeatherData,
  fetchWeather,
  reverseGeocode,
  getCurrentPosition,
} from './weatherApi.js';
