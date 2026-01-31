/**
 * StorageService - Single Responsibility: Handle all session storage operations
 * 
 * This service encapsulates session storage access and provides a clean interface
 * for storing and retrieving data. It follows the Single Responsibility Principle
 * by focusing solely on storage operations.
 */
export class StorageService {
  /**
   * Checks if session storage is available.
   * @returns {boolean} - True if session storage is available, false otherwise.
   */
  static isAvailable() {
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, testKey);
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Saves data to session storage.
   * @param {string} key - The key to store the data under.
   * @param {any} data - The data to store (will be JSON stringified).
   * @returns {boolean} - True if save was successful, false otherwise.
   */
  static save(key, data) {
    if (!StorageService.isAvailable()) {
      console.warn('Session storage is not available');
      return false;
    }
    
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to session storage:', e);
      return false;
    }
  }

  /**
   * Retrieves data from session storage.
   * @param {string} key - The key to retrieve the data from.
   * @returns {any} - The parsed JSON data, or null if not found.
   */
  static get(key) {
    if (!StorageService.isAvailable()) {
      return null;
    }

    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error retrieving from session storage:', e);
      return null;
    }
  }

  /**
   * Removes data from session storage.
   * @param {string} key - The key to remove.
   * @returns {boolean} - True if removal was successful.
   */
  static remove(key) {
    if (!StorageService.isAvailable()) {
      return false;
    }

    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from session storage:', e);
      return false;
    }
  }

  /**
   * Clears all data from session storage.
   * @returns {boolean} - True if clear was successful.
   */
  static clear() {
    if (!StorageService.isAvailable()) {
      return false;
    }

    try {
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing session storage:', e);
      return false;
    }
  }
}

export default StorageService;
