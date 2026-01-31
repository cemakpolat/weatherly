/**
 * GeolocationManager - Single Responsibility: Handle geolocation operations
 * 
 * This service manages user location detection and reverse geocoding.
 * It follows the Single Responsibility Principle by focusing solely on
 * location-related operations.
 */
import { getCurrentPosition, reverseGeocode } from './weatherApi.js';
import { ToastService } from './ToastService.js';

export class GeolocationManager {
  /**
   * Gets the current user position with fallback mechanisms.
   * @returns {Promise<object>} - Coordinates object with latitude, longitude, and source.
   */
  static async getCurrentPosition() {
    ToastService.info('Detecting your location...', 2000);
    console.log('Requesting current position...');

    const coords = await getCurrentPosition();
    
    console.log('=== LOCATION DETECTED ===');
    console.log('Latitude:', coords.latitude);
    console.log('Longitude:', coords.longitude);
    console.log('Source:', coords.source || 'unknown');
    console.log('========================');

    // Warn user if using IP-based location (less accurate)
    if (coords.source === 'ip') {
      ToastService.warning(
        '⚠️ Using IP-based location (may be inaccurate). Please enable location permissions for accurate results.',
        5000
      );
    }

    return coords;
  }

  /**
   * Gets city information from coordinates using reverse geocoding.
   * @param {number} latitude - The latitude.
   * @param {number} longitude - The longitude.
   * @param {object} fallbackData - Optional fallback data from IP lookup.
   * @returns {Promise<object|null>} - City info object or null.
   */
  static async getCityFromCoordinates(latitude, longitude, fallbackData = null) {
    ToastService.info('Finding city name from coordinates...', 2000);
    
    let cityInfo = await reverseGeocode(latitude, longitude);
    console.log('City info from reverse geocoding:', cityInfo);

    // If reverse geocoding fails and we have fallback data, use that
    if (!cityInfo && fallbackData && fallbackData.city && fallbackData.country_code) {
      console.log('Reverse geocoding failed, using city name from IP service:', fallbackData.city);
      cityInfo = {
        name: fallbackData.city,
        country_code: fallbackData.country_code.toUpperCase(),
      };
    }

    if (!cityInfo) {
      ToastService.error('Could not determine city from your location');
      return null;
    }

    return cityInfo;
  }

  /**
   * Full geolocation flow: get position and resolve to city.
   * @returns {Promise<object|null>} - Object with coords and cityInfo, or null on failure.
   */
  static async detectCurrentLocation() {
    try {
      const coords = await GeolocationManager.getCurrentPosition();
      const cityInfo = await GeolocationManager.getCityFromCoordinates(
        coords.latitude,
        coords.longitude,
        coords // Pass coords as fallback (may contain city from IP)
      );

      if (!cityInfo) {
        return null;
      }

      return {
        coords,
        cityInfo,
      };
    } catch (error) {
      console.error('Geolocation error:', error);
      ToastService.error(error.message || 'Failed to detect location');
      throw error;
    }
  }
}

export default GeolocationManager;
