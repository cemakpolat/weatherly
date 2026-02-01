/**
 * DynamicBackgroundManager - Manages dynamic weather-based backgrounds
 * 
 * This service creates Apple Weather-like dynamic backgrounds that change
 * based on the primary weather condition across all displayed cities.
 * Follows Single Responsibility Principle by handling only background management.
 */
export class DynamicBackgroundManager {
  static #isEnabled = false;
  static #currentWeatherCode = null;
  static #updateInterval = null;
  static #transitionDuration = 1000; // ms

  /**
   * Weather code to background mapping (inspired by Apple Weather)
   * Using WMO Weather interpretation codes
   */
  static #weatherBackgrounds = {
    // Clear sky (0-1)
    clear: {
      codes: [0, 1],
      day: {
        gradient: 'linear-gradient(180deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)',
        description: 'Clear & Sunny'
      },
      night: {
        gradient: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        description: 'Clear Night'
      }
    },
    
    // Partly cloudy (2-3)
    partlyCloudy: {
      codes: [2, 3],
      day: {
        gradient: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        description: 'Partly Cloudy'
      },
      night: {
        gradient: 'linear-gradient(180deg, #232526 0%, #414345 50%, #667eea 100%)',
        description: 'Cloudy Night'
      }
    },

    // Foggy (45, 48)
    fog: {
      codes: [45, 48],
      day: {
        gradient: 'linear-gradient(180deg, #bdc3c7 0%, #8e9eab 50%, #7f8c8d 100%)',
        description: 'Foggy'
      },
      night: {
        gradient: 'linear-gradient(180deg, #414345 0%, #232526 50%, #000000 100%)',
        description: 'Foggy Night'
      }
    },

    // Drizzle (51-57)
    drizzle: {
      codes: [51, 53, 55, 56, 57],
      day: {
        gradient: 'linear-gradient(180deg, #636fa4 0%, #4f5b8c 50%, #384863 100%)',
        description: 'Drizzle'
      },
      night: {
        gradient: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
        description: 'Drizzle'
      }
    },

    // Rain (61-67, 80-82)
    rain: {
      codes: [61, 63, 65, 66, 67, 80, 81, 82],
      day: {
        gradient: 'linear-gradient(180deg, #4b6cb7 0%, #3b5998 50%, #182848 100%)',
        description: 'Rainy'
      },
      night: {
        gradient: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #0a1929 100%)',
        description: 'Rainy Night'
      }
    },

    // Snow (71-77, 85-86)
    snow: {
      codes: [71, 73, 75, 77, 85, 86],
      day: {
        gradient: 'linear-gradient(180deg, #e6e9f0 0%, #c8d3e0 50%, #b8c6db 100%)',
        description: 'Snowy'
      },
      night: {
        gradient: 'linear-gradient(180deg, #2c3e50 0%, #3f5566 50%, #4c6577 100%)',
        description: 'Snowy Night'
      }
    },

    // Thunderstorm (95-99)
    thunderstorm: {
      codes: [95, 96, 99],
      day: {
        gradient: 'linear-gradient(180deg, #232526 0%, #414345 50%, #636b73 100%)',
        description: 'Thunderstorm'
      },
      night: {
        gradient: 'linear-gradient(180deg, #000000 0%, #1a1a1a 50%, #232526 100%)',
        description: 'Thunderstorm'
      }
    }
  };

  /**
   * Initializes the dynamic background manager
   */
  static initialize() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      DynamicBackgroundManager.#transitionDuration = 0;
    }
  }

  /**
   * Enables dynamic weather-based backgrounds
   */
  static enable() {
    DynamicBackgroundManager.#isEnabled = true;
    DynamicBackgroundManager.startAutoUpdate();
  }

  /**
   * Disables dynamic weather-based backgrounds
   */
  static disable() {
    DynamicBackgroundManager.#isEnabled = false;
    DynamicBackgroundManager.stopAutoUpdate();
  }

  /**
   * Checks if dynamic backgrounds are enabled
   */
  static isEnabled() {
    return DynamicBackgroundManager.#isEnabled;
  }

  /**
   * Gets the primary weather code from displayed cities
   * @param {HTMLElement} citiesContainer - The container with city cards
   * @returns {number|null} - The primary weather code or null
   */
  static getPrimaryWeatherCode(citiesContainer) {
    if (!citiesContainer) return null;

    const cards = citiesContainer.querySelectorAll('[data-weather-code]');
    if (cards.length === 0) return null;

    // Get all weather codes and find most severe/common
    const weatherCodes = Array.from(cards)
      .map(card => parseInt(card.getAttribute('data-weather-code')))
      .filter(code => !isNaN(code));

    if (weatherCodes.length === 0) return null;

    // Priority order: thunderstorm > snow > rain > drizzle > fog > cloudy > clear
    const priorities = [
      95, 96, 99, // thunderstorm
      71, 73, 75, 77, 85, 86, // snow
      61, 63, 65, 66, 67, 80, 81, 82, // rain
      51, 53, 55, 56, 57, // drizzle
      45, 48, // fog
      2, 3, // cloudy
      0, 1 // clear
    ];

    for (const priority of priorities) {
      if (weatherCodes.includes(priority)) {
        return priority;
      }
    }

    return weatherCodes[0];
  }

  /**
   * Gets the background configuration for a weather code
   * @param {number} weatherCode - The weather code
   * @returns {object|null} - The background config or null
   */
  static getBackgroundForWeather(weatherCode) {
    if (weatherCode === null) return null;

    // Determine if it's day or night (simplified - use current hour)
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 20;

    for (const category of Object.values(DynamicBackgroundManager.#weatherBackgrounds)) {
      if (category.codes.includes(weatherCode)) {
        return isDaytime ? category.day : category.night;
      }
    }

    // Default to clear sky
    return isDaytime 
      ? DynamicBackgroundManager.#weatherBackgrounds.clear.day
      : DynamicBackgroundManager.#weatherBackgrounds.clear.night;
  }

  /**
   * Applies a background to the body
   * @param {string} gradient - The CSS gradient string
   * @param {boolean} animate - Whether to animate the transition
   */
  static applyBackground(gradient, animate = true) {
    if (!gradient) return;

    const body = document.body;

    // Always set the style attribute for test compatibility
    let style = '';
    style += `background: ${gradient}; background-image: ${gradient};`;
    if (animate) {
      style += ` transition: background 1000ms ease;`;
    } else {
      style += ` transition: none;`;
    }
    style += ` background-size: 400% 400%; animation: GradientBackground 15s ease infinite;`;
    body.setAttribute('style', style.trim());
  }

  /**
   * Updates the background based on current weather
   * @param {HTMLElement} citiesContainer - The container with city cards
   */
  static update(citiesContainer) {
    if (!DynamicBackgroundManager.#isEnabled) return;

    const weatherCode = DynamicBackgroundManager.getPrimaryWeatherCode(citiesContainer);
    
    // Only update if weather code changed
    if (weatherCode === DynamicBackgroundManager.#currentWeatherCode) return;

    DynamicBackgroundManager.#currentWeatherCode = weatherCode;
    
    const background = DynamicBackgroundManager.getBackgroundForWeather(weatherCode);
    if (background) {
      DynamicBackgroundManager.applyBackground(background.gradient);
      console.log(`Background updated: ${background.description} (code: ${weatherCode})`);
    }
  }

  /**
   * Starts automatic background updates
   * @param {number} intervalMs - Update interval in milliseconds (default: 30000)
   */
  static startAutoUpdate(intervalMs = 30000) {
    DynamicBackgroundManager.stopAutoUpdate();
    
    // Update immediately
    const citiesContainer = document.getElementById('cities');
    if (citiesContainer) {
      DynamicBackgroundManager.update(citiesContainer);
    }

    // Set up periodic updates
    DynamicBackgroundManager.#updateInterval = setInterval(() => {
      const container = document.getElementById('cities');
      if (container) {
        DynamicBackgroundManager.update(container);
      }
    }, intervalMs);
  }

  /**
   * Stops automatic background updates
   */
  static stopAutoUpdate() {
    if (DynamicBackgroundManager.#updateInterval) {
      clearInterval(DynamicBackgroundManager.#updateInterval);
      DynamicBackgroundManager.#updateInterval = null;
    }
  }

  /**
   * Resets background to theme default
   */
  static reset() {
    DynamicBackgroundManager.#currentWeatherCode = null;
    DynamicBackgroundManager.stopAutoUpdate();
    // Let ThemeManager handle the background
    const body = document.body;
    // Remove all background-related styles from the style attribute
    body.removeAttribute('style');
    // Also clear via style property for runtime
    body.style.background = '';
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.animation = '';
    body.style.transition = '';
  }
}

export default DynamicBackgroundManager;
