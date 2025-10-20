/**
 * @jest-environment jsdom
 */

import { WeatherAnimationManager } from '../WeatherAnimationManager.js';
import { RainAnimation } from '../RainAnimation.js';
import { SnowAnimation } from '../SnowAnimation.js';
import { SunnyAnimation } from '../SunnyAnimation.js';
import { CloudsAnimation } from '../CloudsAnimation.js';
import { ThunderstormAnimation } from '../ThunderstormAnimation.js';

// Mock all animation classes
jest.mock('../RainAnimation.js');
jest.mock('../SnowAnimation.js');
jest.mock('../SunnyAnimation.js');
jest.mock('../CloudsAnimation.js');
jest.mock('../ThunderstormAnimation.js');

describe('WeatherAnimationManager', () => {
  let manager;
  let mockContainer;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    const mockAnimationSetup = (MockClass, name, codes) => {
      MockClass.mockImplementation(() => ({
        getName: jest.fn(() => name),
        getWeatherCodes: jest.fn(() => codes),
        start: jest.fn(),
        stop: jest.fn(),
        setIntensity: jest.fn(),
      }));
    };

    mockAnimationSetup(RainAnimation, 'Rain', [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
    mockAnimationSetup(SnowAnimation, 'Snow', [71, 73, 75, 77, 85, 86]);
    mockAnimationSetup(SunnyAnimation, 'Sunny', [0, 1]);
    mockAnimationSetup(CloudsAnimation, 'Clouds', [2, 3, 45, 48]);
    mockAnimationSetup(ThunderstormAnimation, 'Thunderstorm', [95, 96, 99]);

    // Create manager instance
    manager = new WeatherAnimationManager();

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should create manager instance successfully', () => {
      expect(manager).toBeInstanceOf(WeatherAnimationManager);
    });

    test('should initialize weather code to animation class mapping', () => {
      const animations = manager.getAvailableAnimations();
      expect(animations.length).toBeGreaterThan(0);
    });

    test('should map all animation classes correctly', () => {
      const animations = manager.getAvailableAnimations();
      const animationNames = animations.map(a => a.name);

      expect(animationNames).toContain('Rain');
      expect(animationNames).toContain('Snow');
      expect(animationNames).toContain('Sunny');
      expect(animationNames).toContain('Clouds');
      expect(animationNames).toContain('Thunderstorm');
    });
  });

  describe('setContainer', () => {
    test('should set container successfully', () => {
      expect(() => manager.setContainer(mockContainer)).not.toThrow();
    });

    test('should accept null container', () => {
      expect(() => manager.setContainer(null)).not.toThrow();
    });
  });

  describe('startForWeatherCode', () => {
    beforeEach(() => {
      manager.setContainer(mockContainer);
    });

    test('should start rain animation for rain weather code', () => {
      manager.startForWeatherCode(61); // Rain code
      expect(RainAnimation).toHaveBeenCalled();
    });

    test('should start snow animation for snow weather code', () => {
      manager.startForWeatherCode(71); // Snow code
      expect(SnowAnimation).toHaveBeenCalled();
    });

    test('should start sunny animation for clear weather code', () => {
      manager.startForWeatherCode(0); // Clear sky
      expect(SunnyAnimation).toHaveBeenCalled();
    });

    test('should start clouds animation for cloudy weather code', () => {
      manager.startForWeatherCode(2); // Partly cloudy
      expect(CloudsAnimation).toHaveBeenCalled();
    });

    test('should start thunderstorm animation for thunderstorm code', () => {
      manager.startForWeatherCode(95); // Thunderstorm
      expect(ThunderstormAnimation).toHaveBeenCalled();
    });

    test('should warn if container not set', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const newManager = new WeatherAnimationManager();
      newManager.startForWeatherCode(61);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Animation container not set');
      consoleWarnSpy.mockRestore();
    });

    test('should handle unknown weather codes gracefully', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      manager.startForWeatherCode(999); // Unknown code

      expect(consoleLogSpy).toHaveBeenCalledWith('No animation found for weather code: 999');
      consoleLogSpy.mockRestore();
    });

    test('should set intensity when starting animation', () => {
      manager.startForWeatherCode(61, 0.8);

      const rainInstance = RainAnimation.mock.results[RainAnimation.mock.results.length - 1].value;
      expect(rainInstance.setIntensity).toHaveBeenCalledWith(0.8);
    });

    test('should stop previous animation before starting new one', () => {
      manager.startForWeatherCode(61); // Start rain
      const firstInstance = RainAnimation.mock.results[0].value;

      manager.startForWeatherCode(71); // Start snow

      expect(firstInstance.stop).toHaveBeenCalled();
    });

    test('should not restart same animation type', () => {
      manager.startForWeatherCode(61); // Start rain
      const callCount = RainAnimation.mock.calls.length;

      manager.startForWeatherCode(63); // Another rain code

      // Should not create new instance
      expect(RainAnimation.mock.calls.length).toBe(callCount);
    });

    test('should update intensity if same animation already running', () => {
      manager.startForWeatherCode(61, 0.5);
      const rainInstance = RainAnimation.mock.results[0].value;
      rainInstance.setIntensity.mockClear();

      manager.startForWeatherCode(63, 0.9); // Another rain code with different intensity

      expect(rainInstance.setIntensity).toHaveBeenCalledWith(0.9);
    });
  });

  describe('stopAll', () => {
    beforeEach(() => {
      manager.setContainer(mockContainer);
    });

    test('should stop current animation', () => {
      manager.startForWeatherCode(61);
      const rainInstance = RainAnimation.mock.results[0].value;

      manager.stopAll();

      expect(rainInstance.stop).toHaveBeenCalled();
    });

    test('should clear current animation reference', () => {
      manager.startForWeatherCode(61);
      manager.stopAll();

      expect(manager.getCurrentAnimationName()).toBeNull();
    });

    test('should not throw if no animation is running', () => {
      expect(() => manager.stopAll()).not.toThrow();
    });
  });

  describe('setIntensity', () => {
    beforeEach(() => {
      manager.setContainer(mockContainer);
    });

    test('should set intensity on current animation', () => {
      manager.startForWeatherCode(61);
      const rainInstance = RainAnimation.mock.results[0].value;
      rainInstance.setIntensity.mockClear();

      manager.setIntensity(0.7);

      expect(rainInstance.setIntensity).toHaveBeenCalledWith(0.7);
    });

    test('should not throw if no animation is running', () => {
      expect(() => manager.setIntensity(0.5)).not.toThrow();
    });
  });

  describe('getCurrentAnimationName', () => {
    beforeEach(() => {
      manager.setContainer(mockContainer);
    });

    test('should return null when no animation is running', () => {
      expect(manager.getCurrentAnimationName()).toBeNull();
    });

    test('should return animation name when animation is running', () => {
      manager.startForWeatherCode(61); // Rain
      expect(manager.getCurrentAnimationName()).toBe('Rain');
    });

    test('should return null after stopping animation', () => {
      manager.startForWeatherCode(61);
      manager.stopAll();

      expect(manager.getCurrentAnimationName()).toBeNull();
    });
  });

  describe('getAvailableAnimations', () => {
    test('should return array of available animations', () => {
      const animations = manager.getAvailableAnimations();

      expect(Array.isArray(animations)).toBe(true);
      expect(animations.length).toBeGreaterThan(0);
    });

    test('should return animations with name and weather codes', () => {
      const animations = manager.getAvailableAnimations();

      animations.forEach(animation => {
        expect(animation).toHaveProperty('name');
        expect(animation).toHaveProperty('weatherCodes');
        expect(typeof animation.name).toBe('string');
        expect(Array.isArray(animation.weatherCodes)).toBe(true);
      });
    });

    test('should not have duplicate animations', () => {
      const animations = manager.getAvailableAnimations();
      const names = animations.map(a => a.name);
      const uniqueNames = [...new Set(names)];

      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('createCardAnimation', () => {
    let cardContainer;

    beforeEach(() => {
      cardContainer = document.createElement('div');
      cardContainer.className = 'weather-card';
      document.body.appendChild(cardContainer);
    });

    test('should create standalone animation for container', () => {
      const cardAnimation = manager.createCardAnimation(cardContainer, 61);

      expect(cardAnimation).not.toBeNull();
      expect(cardAnimation).toHaveProperty('stop');
      expect(cardAnimation).toHaveProperty('setIntensity');
      expect(cardAnimation).toHaveProperty('getName');
    });

    test('should warn if no container provided', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = manager.createCardAnimation(null, 61);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Animation container not provided');
      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    test('should return null for unknown weather code', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = manager.createCardAnimation(cardContainer, 999);

      expect(result).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith('No animation found for weather code: 999');
      consoleLogSpy.mockRestore();
    });

    test('should start animation with correct intensity', () => {
      manager.createCardAnimation(cardContainer, 61, 0.8);

      const rainInstance = RainAnimation.mock.results[RainAnimation.mock.results.length - 1].value;
      expect(rainInstance.setIntensity).toHaveBeenCalledWith(0.8);
      expect(rainInstance.start).toHaveBeenCalledWith(cardContainer);
    });

    test('should create independent animations for different containers', () => {
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      const animation1 = manager.createCardAnimation(container1, 61);
      const animation2 = manager.createCardAnimation(container2, 71);

      expect(animation1).not.toBeNull();
      expect(animation2).not.toBeNull();
      expect(animation1.getName()).toBe('Rain');
      expect(animation2.getName()).toBe('Snow');
    });

    test('returned animation should have working stop method', () => {
      const cardAnimation = manager.createCardAnimation(cardContainer, 61);
      const rainInstance = RainAnimation.mock.results[RainAnimation.mock.results.length - 1].value;

      cardAnimation.stop();

      expect(rainInstance.stop).toHaveBeenCalled();
    });

    test('returned animation should have working setIntensity method', () => {
      const cardAnimation = manager.createCardAnimation(cardContainer, 61);
      const rainInstance = RainAnimation.mock.results[RainAnimation.mock.results.length - 1].value;
      rainInstance.setIntensity.mockClear();

      cardAnimation.setIntensity(0.9);

      expect(rainInstance.setIntensity).toHaveBeenCalledWith(0.9);
    });

    test('returned animation should have working getName method', () => {
      const cardAnimation = manager.createCardAnimation(cardContainer, 61);

      expect(cardAnimation.getName()).toBe('Rain');
    });

    test('should not affect main container animations', () => {
      manager.setContainer(mockContainer);
      manager.startForWeatherCode(61);

      const cardAnimation = manager.createCardAnimation(cardContainer, 71);

      expect(manager.getCurrentAnimationName()).toBe('Rain');
      expect(cardAnimation.getName()).toBe('Snow');
    });
  });

  describe('Weather Code Mapping', () => {
    beforeEach(() => {
      manager.setContainer(mockContainer);
    });

    test('should map clear sky codes to Sunny animation', () => {
      manager.startForWeatherCode(0);
      expect(manager.getCurrentAnimationName()).toBe('Sunny');

      manager.stopAll();
      manager.startForWeatherCode(1);
      expect(manager.getCurrentAnimationName()).toBe('Sunny');
    });

    test('should map cloudy codes to Clouds animation', () => {
      const cloudyCodes = [2, 3, 45, 48];

      cloudyCodes.forEach(code => {
        manager.stopAll();
        manager.startForWeatherCode(code);
        expect(manager.getCurrentAnimationName()).toBe('Clouds');
      });
    });

    test('should map rain codes to Rain animation', () => {
      const rainCodes = [51, 61, 80];

      rainCodes.forEach(code => {
        manager.stopAll();
        manager.startForWeatherCode(code);
        expect(manager.getCurrentAnimationName()).toBe('Rain');
      });
    });

    test('should map snow codes to Snow animation', () => {
      const snowCodes = [71, 73, 85];

      snowCodes.forEach(code => {
        manager.stopAll();
        manager.startForWeatherCode(code);
        expect(manager.getCurrentAnimationName()).toBe('Snow');
      });
    });

    test('should map thunderstorm codes to Thunderstorm animation', () => {
      const thunderCodes = [95, 96, 99];

      thunderCodes.forEach(code => {
        manager.stopAll();
        manager.startForWeatherCode(code);
        expect(manager.getCurrentAnimationName()).toBe('Thunderstorm');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid animation switches', () => {
      manager.setContainer(mockContainer);

      manager.startForWeatherCode(61); // Rain
      manager.startForWeatherCode(71); // Snow
      manager.startForWeatherCode(0); // Sunny
      manager.startForWeatherCode(95); // Thunderstorm

      expect(manager.getCurrentAnimationName()).toBe('Thunderstorm');
    });

    test('should handle starting animation without setting container', () => {
      const newManager = new WeatherAnimationManager();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      newManager.startForWeatherCode(61);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(newManager.getCurrentAnimationName()).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    test('should handle multiple stopAll calls', () => {
      manager.setContainer(mockContainer);
      manager.startForWeatherCode(61);

      expect(() => {
        manager.stopAll();
        manager.stopAll();
        manager.stopAll();
      }).not.toThrow();
    });

    test('should handle intensity boundaries', () => {
      manager.setContainer(mockContainer);
      manager.startForWeatherCode(61);

      expect(() => {
        manager.setIntensity(0);
        manager.setIntensity(1);
        manager.setIntensity(0.5);
      }).not.toThrow();
    });
  });
});
