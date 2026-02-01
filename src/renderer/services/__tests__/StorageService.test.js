/**
 * StorageService Tests
 */

import { StorageService } from '../StorageService';

describe('StorageService', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('isAvailable', () => {
    it('should return true when session storage is available', () => {
      expect(StorageService.isAvailable()).toBe(true);
    });
  });

  describe('save', () => {
    it('should save data to session storage', () => {
      const key = 'testKey';
      const data = { name: 'Test City', temp: 25 };

      const result = StorageService.save(key, data);

      expect(result).toBe(true);
      expect(sessionStorage.getItem(key)).toBe(JSON.stringify(data));
    });

    it('should save string data', () => {
      const key = 'stringKey';
      const data = 'test string';

      StorageService.save(key, data);

      expect(sessionStorage.getItem(key)).toBe(JSON.stringify(data));
    });

    it('should save array data', () => {
      const key = 'arrayKey';
      const data = [1, 2, 3, 4, 5];

      StorageService.save(key, data);

      expect(sessionStorage.getItem(key)).toBe(JSON.stringify(data));
    });

    it('should return false if storage is unavailable', () => {
      const isAvailableSpy = jest.spyOn(StorageService, 'isAvailable').mockReturnValue(false);

      const result = StorageService.save('key', 'data');

      expect(result).toBe(false);
      
      isAvailableSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should retrieve data from session storage', () => {
      const key = 'testKey';
      const data = { name: 'Test City', temp: 25 };
      
      sessionStorage.setItem(key, JSON.stringify(data));

      const result = StorageService.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = StorageService.get('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should return null if storage is unavailable', () => {
      const isAvailableSpy = jest.spyOn(StorageService, 'isAvailable').mockReturnValue(false);

      const result = StorageService.get('key');

      expect(result).toBeNull();
      
      isAvailableSpy.mockRestore();
    });

    it('should handle corrupted JSON data gracefully', () => {
      const key = 'corruptedKey';
      sessionStorage.setItem(key, 'invalid json {');

      const result = StorageService.get(key);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove data from session storage', () => {
      const key = 'testKey';
      sessionStorage.setItem(key, JSON.stringify({ test: 'data' }));

      const result = StorageService.remove(key);

      expect(result).toBe(true);
      expect(sessionStorage.getItem(key)).toBeNull();
    });

    it('should return true even if key does not exist', () => {
      const result = StorageService.remove('nonExistentKey');

      expect(result).toBe(true);
    });

    it('should return false if storage is unavailable', () => {
      const isAvailableSpy = jest.spyOn(StorageService, 'isAvailable').mockReturnValue(false);

      const result = StorageService.remove('key');

      expect(result).toBe(false);
      
      isAvailableSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all data from session storage', () => {
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.setItem('key2', 'value2');

      const result = StorageService.clear();

      expect(result).toBe(true);
      expect(sessionStorage.getItem('key1')).toBeNull();
      expect(sessionStorage.getItem('key2')).toBeNull();
    });
  });

  describe('integration', () => {
    it('should handle complex data structures', () => {
      const complexData = {
        cities: [
          { name: 'London', temp: 15, weather: { conditions: 'cloudy' } },
          { name: 'Paris', temp: 18, weather: { conditions: 'sunny' } },
        ],
        settings: {
          theme: 'dark',
          units: 'metric',
        },
      };

      StorageService.save('complexKey', complexData);
      const retrieved = StorageService.get('complexKey');

      expect(retrieved).toEqual(complexData);
    });

    it('should handle save-retrieve-remove cycle', () => {
      const key = 'cycleTest';
      const data = { test: 'cycle' };

      StorageService.save(key, data);
      expect(StorageService.get(key)).toEqual(data);

      StorageService.remove(key);
      expect(StorageService.get(key)).toBeNull();
    });
  });
});
