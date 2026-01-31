/**
 * RadarService - Single Responsibility: Handle radar map rendering
 * 
 * This service manages the creation and rendering of weather radar maps.
 * It follows the Single Responsibility Principle by focusing solely on
 * radar map operations.
 */
import { fetchGeocodingData } from './weatherApi.js';
import { SettingsManager } from './SettingsManager.js';

export class RadarService {
  /**
   * Initializes a Leaflet map for radar display.
   * @param {HTMLElement} container - The map container element.
   * @param {number} latitude - Center latitude.
   * @param {number} longitude - Center longitude.
   * @param {string} cityName - The city name for popup.
   * @returns {object} - The Leaflet map instance.
   */
  static initializeMap(container, latitude, longitude, cityName) {
    const L = window.L;
    if (!L) {
      throw new Error('Leaflet library not loaded');
    }

    const map = L.map(container.id, {
      center: [latitude, longitude],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add city marker
    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`<b>${cityName}</b>`)
      .openPopup();

    return map;
  }

  /**
   * Creates weather overlay layers for the map.
   * @param {string} apiKey - OpenWeatherMap API key.
   * @returns {object} - Object containing layer instances.
   */
  static createWeatherLayers(apiKey) {
    const L = window.L;
    if (!L || !apiKey || apiKey.trim().length === 0) {
      return { precipLayer: null, cloudsLayer: null, tempLayer: null };
    }

    const precipLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        opacity: 0.6,
        maxZoom: 19,
      }
    );

    const cloudsLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        opacity: 0.5,
        maxZoom: 19,
      }
    );

    const tempLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
        opacity: 0.6,
        maxZoom: 19,
      }
    );

    return { precipLayer, cloudsLayer, tempLayer };
  }

  /**
   * Creates a warning element for missing API key.
   * @returns {HTMLElement} - The warning element.
   */
  static createApiKeyWarning() {
    const warning = document.createElement('div');
    warning.className = 'radar-api-warning';
    warning.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <p><strong>Weather Radar Overlays Unavailable</strong></p>
      <p>OpenWeatherMap's weather map tiles (precipitation, clouds, temperature overlays) require a <strong>paid subscription</strong>.</p>
      <div style="text-align: left; margin: 15px auto; max-width: 450px; font-size: 0.9rem;">
        <p><strong>Free Plan Limitations:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Weather map tiles: ❌ Not available</li>
          <li>Current weather: ✅ Available (via Open-Meteo)</li>
          <li>Basic forecasts: ✅ Available</li>
        </ul>
        <p style="margin-top: 10px;"><strong>Note:</strong> This app uses Open-Meteo for all weather data (free & unlimited). The radar feature requires OpenWeatherMap's paid API subscription ($40+/month).</p>
        <p style="margin-top: 10px;">
          <a href="https://openweathermap.org/price" target="_blank" class="text-decoration-none">
            View OpenWeatherMap pricing <i class="fas fa-external-link-alt fa-xs"></i>
          </a>
        </p>
      </div>
    `;
    return warning;
  }

  /**
   * Sets up layer toggle functionality.
   * @param {HTMLElement} radarPane - The radar pane element.
   * @param {object} map - The Leaflet map instance.
   * @param {object} layers - Object containing layer instances.
   * @param {boolean} hasValidApiKey - Whether a valid API key exists.
   */
  static setupLayerToggles(radarPane, map, layers, hasValidApiKey) {
    const { precipLayer, cloudsLayer, tempLayer } = layers;
    const precipToggle = radarPane.querySelector('.radar-layer-precipitation');
    const cloudsToggle = radarPane.querySelector('.radar-layer-clouds');
    const tempToggle = radarPane.querySelector('.radar-layer-temperature');

    // Disable toggles if no valid API key
    if (!hasValidApiKey) {
      [precipToggle, cloudsToggle, tempToggle].forEach(toggle => {
        if (toggle) {
          toggle.disabled = true;
          toggle.checked = false;
          toggle.parentElement.style.opacity = '0.5';
        }
      });
      return;
    }

    // Add precipitation layer by default
    if (precipLayer) {
      precipLayer.addTo(map);
    }

    // Set up toggle event listeners
    if (precipToggle) {
      precipToggle.addEventListener('change', e => {
        if (precipLayer) {
          if (e.target.checked) {
            precipLayer.addTo(map);
          } else {
            map.removeLayer(precipLayer);
          }
        }
      });
    }

    if (cloudsToggle) {
      cloudsToggle.addEventListener('change', e => {
        if (cloudsLayer) {
          if (e.target.checked) {
            cloudsLayer.addTo(map);
          } else {
            map.removeLayer(cloudsLayer);
          }
        }
      });
    }

    if (tempToggle) {
      tempToggle.addEventListener('change', e => {
        if (tempLayer) {
          if (e.target.checked) {
            tempLayer.addTo(map);
          } else {
            map.removeLayer(tempLayer);
          }
        }
      });
    }
  }

  /**
   * Loads and renders a radar map for a card.
   * @param {HTMLElement} card - The city card element.
   * @param {string} cityName - The city name.
   */
  static async loadForCard(card, cityName) {
    const radarPane = card.querySelector('[data-tab-pane="radar"]');
    const radarLoading = radarPane.querySelector('.radar-loading');
    const radarContent = radarPane.querySelector('.radar-content');
    const radarMapContainer = radarContent.querySelector('.radar-map-container');

    try {
      // Get city coordinates
      const geocodeData = await fetchGeocodingData(cityName);
      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error('City not found');
      }

      const { latitude, longitude } = geocodeData.results[0];

      // Initialize map
      const map = RadarService.initializeMap(radarMapContainer, latitude, longitude, cityName);

      // Get API key from settings
      const apiKeys = await SettingsManager.getApiKeys();
      const OWM_API_KEY = apiKeys.openweathermap || '';
      const hasValidApiKey = OWM_API_KEY && OWM_API_KEY.trim().length > 0;

      console.log('[Radar] API key check:', {
        hasKey: !!OWM_API_KEY,
        keyLength: OWM_API_KEY ? OWM_API_KEY.length : 0,
        isValid: hasValidApiKey,
      });

      // Create weather layers
      const layers = hasValidApiKey
        ? RadarService.createWeatherLayers(OWM_API_KEY)
        : { precipLayer: null, cloudsLayer: null, tempLayer: null };

      // Store references for cleanup
      radarMapContainer._precipLayer = layers.precipLayer;
      radarMapContainer._cloudsLayer = layers.cloudsLayer;
      radarMapContainer._tempLayer = layers.tempLayer;
      radarMapContainer._leafletMap = map;

      // Set up layer toggles
      RadarService.setupLayerToggles(radarPane, map, layers, hasValidApiKey);

      // Show API key warning if needed
      if (!hasValidApiKey) {
        radarContent.appendChild(RadarService.createApiKeyWarning());
      }

      // Update UI
      radarLoading.style.display = 'none';
      radarContent.style.display = 'block';

      // Force map to refresh its size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error('Error loading radar map:', error);
      radarLoading.innerHTML =
        '<p class="text-muted small"><i class="fas fa-exclamation-circle"></i> Failed to load radar map</p>';
    }
  }

  /**
   * Cleans up a radar map instance.
   * @param {HTMLElement} radarMapContainer - The radar map container.
   */
  static cleanup(radarMapContainer) {
    if (radarMapContainer && radarMapContainer._leafletMap) {
      radarMapContainer._leafletMap.remove();
      radarMapContainer._leafletMap = null;
      radarMapContainer._precipLayer = null;
      radarMapContainer._cloudsLayer = null;
      radarMapContainer._tempLayer = null;
    }
  }
}

export default RadarService;
