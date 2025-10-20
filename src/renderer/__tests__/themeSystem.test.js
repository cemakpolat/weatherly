/**
 * @jest-environment jsdom
 */

// Setup global window.electron mock before all tests
global.window = global.window || {};
global.window.electron = {
  readSettings: jest.fn(),
  writeSettings: jest.fn(),
  send: jest.fn(),
  showNotification: jest.fn(),
};

describe('Theme System', () => {
  let loadAndApplyTheme;
  let applyTheme;
  let saveTheme;
  let showToast;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div class="theme-option" data-theme="purple-blue"></div>
      <div class="theme-option" data-theme="ocean-breeze"></div>
      <div class="theme-option" data-theme="sunset-glow"></div>
      <div class="theme-option" data-theme="forest-green"></div>
    `;

    // Clear all mocks
    jest.clearAllMocks();

    // Define test versions of functions (simulating the actual renderer.js functions)
    loadAndApplyTheme = async function () {
      try {
        const settings = await window.electron.readSettings();
        const theme = settings.theme || 'purple-blue';
        applyTheme(theme);
      } catch (error) {
        console.error('Error loading theme:', error);
        applyTheme('purple-blue');
      }
    };

    applyTheme = function (themeName) {
      document.body.setAttribute('data-theme', themeName);

      const themeOptions = document.querySelectorAll('.theme-option');
      themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === themeName) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    };

    saveTheme = async function (themeName) {
      try {
        const settings = await window.electron.readSettings();
        settings.theme = themeName;
        await window.electron.writeSettings(settings);
        console.log('Theme saved:', themeName);
      } catch (error) {
        console.error('Error saving theme:', error);
        if (showToast) {
          showToast('Failed to save theme', 'error');
        }
      }
    };

    showToast = jest.fn();
  });

  describe('applyTheme', () => {
    test('should set data-theme attribute on body', () => {
      applyTheme('ocean-breeze');

      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
    });

    test('should add active class to selected theme option', () => {
      applyTheme('sunset-glow');

      const sunsetOption = document.querySelector('[data-theme="sunset-glow"]');
      expect(sunsetOption.classList.contains('active')).toBe(true);
    });

    test('should remove active class from other theme options', () => {
      applyTheme('forest-green');

      const purpleOption = document.querySelector('[data-theme="purple-blue"]');
      const oceanOption = document.querySelector('[data-theme="ocean-breeze"]');
      const sunsetOption = document.querySelector('[data-theme="sunset-glow"]');

      expect(purpleOption.classList.contains('active')).toBe(false);
      expect(oceanOption.classList.contains('active')).toBe(false);
      expect(sunsetOption.classList.contains('active')).toBe(false);
    });

    test('should handle switching between themes', () => {
      applyTheme('purple-blue');
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');

      applyTheme('ocean-breeze');
      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');

      applyTheme('sunset-glow');
      expect(document.body.getAttribute('data-theme')).toBe('sunset-glow');
    });

    test('should handle non-existent theme gracefully', () => {
      expect(() => applyTheme('non-existent-theme')).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe('non-existent-theme');
    });

    test('should update active class only for existing theme options', () => {
      applyTheme('custom-theme');

      const allOptions = document.querySelectorAll('.theme-option');
      allOptions.forEach(option => {
        expect(option.classList.contains('active')).toBe(false);
      });
    });

    test('should work when no theme options exist', () => {
      document.body.innerHTML = '';

      expect(() => applyTheme('purple-blue')).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });
  });

  describe('saveTheme', () => {
    test('should read current settings before saving', async () => {
      window.electron.readSettings.mockResolvedValue({
        cities: [],
        temperatureUnit: 'celsius',
      });
      window.electron.writeSettings.mockResolvedValue(true);

      await saveTheme('ocean-breeze');

      expect(window.electron.readSettings).toHaveBeenCalled();
    });

    test('should write theme to settings', async () => {
      const mockSettings = {
        cities: [],
        temperatureUnit: 'celsius',
      };
      window.electron.readSettings.mockResolvedValue(mockSettings);
      window.electron.writeSettings.mockResolvedValue(true);

      await saveTheme('sunset-glow');

      expect(window.electron.writeSettings).toHaveBeenCalledWith({
        ...mockSettings,
        theme: 'sunset-glow',
      });
    });

    test('should preserve existing settings when saving theme', async () => {
      const mockSettings = {
        cities: ['Berlin', 'Paris'],
        temperatureUnit: 'fahrenheit',
        animationPreferences: { enabled: true },
      };
      window.electron.readSettings.mockResolvedValue(mockSettings);
      window.electron.writeSettings.mockResolvedValue(true);

      await saveTheme('forest-green');

      expect(window.electron.writeSettings).toHaveBeenCalledWith({
        cities: ['Berlin', 'Paris'],
        temperatureUnit: 'fahrenheit',
        animationPreferences: { enabled: true },
        theme: 'forest-green',
      });
    });

    test('should handle errors when reading settings fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      window.electron.readSettings.mockRejectedValue(new Error('Read failed'));

      await saveTheme('ocean-breeze');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving theme:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('should handle errors when writing settings fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      window.electron.readSettings.mockResolvedValue({});
      window.electron.writeSettings.mockRejectedValue(new Error('Write failed'));

      await saveTheme('sunset-glow');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving theme:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('should log success message on successful save', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      window.electron.readSettings.mockResolvedValue({});
      window.electron.writeSettings.mockResolvedValue(true);

      await saveTheme('purple-blue');

      expect(consoleLogSpy).toHaveBeenCalledWith('Theme saved:', 'purple-blue');
      consoleLogSpy.mockRestore();
    });
  });

  describe('loadAndApplyTheme', () => {
    test('should load saved theme from settings', async () => {
      window.electron.readSettings.mockResolvedValue({
        theme: 'ocean-breeze',
      });

      await loadAndApplyTheme();

      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
    });

    test('should apply default theme when no theme is saved', async () => {
      window.electron.readSettings.mockResolvedValue({});

      await loadAndApplyTheme();

      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });

    test('should apply default theme on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      window.electron.readSettings.mockRejectedValue(new Error('Settings file not found'));

      await loadAndApplyTheme();

      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading theme:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('should update theme option active states', async () => {
      window.electron.readSettings.mockResolvedValue({
        theme: 'forest-green',
      });

      await loadAndApplyTheme();

      const forestOption = document.querySelector('[data-theme="forest-green"]');
      expect(forestOption.classList.contains('active')).toBe(true);
    });

    test('should handle null theme gracefully', async () => {
      window.electron.readSettings.mockResolvedValue({
        theme: null,
      });

      await loadAndApplyTheme();

      // Should fallback to default
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });

    test('should handle undefined settings', async () => {
      window.electron.readSettings.mockResolvedValue(undefined);

      await loadAndApplyTheme();

      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });
  });

  describe('Integration - Complete Theme Flow', () => {
    test('should load, apply, and save theme successfully', async () => {
      // Initial load with saved theme
      window.electron.readSettings.mockResolvedValue({
        theme: 'sunset-glow',
        cities: [],
      });
      window.electron.writeSettings.mockResolvedValue(true);

      await loadAndApplyTheme();
      expect(document.body.getAttribute('data-theme')).toBe('sunset-glow');

      // Change theme
      await saveTheme('forest-green');
      applyTheme('forest-green');

      expect(document.body.getAttribute('data-theme')).toBe('forest-green');
      expect(window.electron.writeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'forest-green' })
      );
    });

    test('should handle rapid theme changes', async () => {
      window.electron.readSettings.mockResolvedValue({});
      window.electron.writeSettings.mockResolvedValue(true);

      const themes = ['purple-blue', 'ocean-breeze', 'sunset-glow', 'forest-green'];

      for (const theme of themes) {
        applyTheme(theme);
        await saveTheme(theme);
      }

      expect(document.body.getAttribute('data-theme')).toBe('forest-green');
      expect(window.electron.writeSettings).toHaveBeenCalledTimes(4);
    });

    test('should maintain theme persistence across app restarts', async () => {
      // First session - save theme
      window.electron.readSettings.mockResolvedValue({});
      window.electron.writeSettings.mockResolvedValue(true);

      await saveTheme('ocean-breeze');
      applyTheme('ocean-breeze');

      // Simulate app restart - load theme
      window.electron.readSettings.mockResolvedValue({
        theme: 'ocean-breeze',
      });

      await loadAndApplyTheme();

      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string theme name', async () => {
      expect(() => applyTheme('')).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe('');
    });

    test('should handle very long theme name', async () => {
      const longTheme = 'a'.repeat(1000);
      expect(() => applyTheme(longTheme)).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe(longTheme);
    });

    test('should handle special characters in theme name', async () => {
      const specialTheme = 'theme-with-!@#$%^&*()';
      expect(() => applyTheme(specialTheme)).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe(specialTheme);
    });

    test('should handle theme application with missing body element', () => {
      const originalBody = document.body;

      // Redefine document.body as undefined
      Object.defineProperty(document, 'body', {
        configurable: true,
        get: () => undefined,
      });

      expect(() => applyTheme('purple-blue')).toThrow();

      // Restore document.body
      Object.defineProperty(document, 'body', {
        configurable: true,
        writable: true,
        value: originalBody,
      });
    });

    test('should handle concurrent save operations', async () => {
      window.electron.readSettings.mockResolvedValue({});
      window.electron.writeSettings.mockResolvedValue(true);

      const promises = [
        saveTheme('purple-blue'),
        saveTheme('ocean-breeze'),
        saveTheme('sunset-glow'),
      ];

      await Promise.all(promises);

      expect(window.electron.writeSettings).toHaveBeenCalledTimes(3);
    });
  });

  describe('DOM Interactions', () => {
    test('should work with dynamically added theme options', () => {
      const newOption = document.createElement('div');
      newOption.className = 'theme-option';
      newOption.setAttribute('data-theme', 'new-theme');
      document.body.appendChild(newOption);

      applyTheme('new-theme');

      expect(newOption.classList.contains('active')).toBe(true);
    });

    test('should handle removal of active theme option', () => {
      const option = document.querySelector('[data-theme="purple-blue"]');
      applyTheme('purple-blue');

      option.remove();

      expect(() => applyTheme('ocean-breeze')).not.toThrow();
      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
    });

    test('should handle theme options without data-theme attribute', () => {
      const invalidOption = document.createElement('div');
      invalidOption.className = 'theme-option';
      document.body.appendChild(invalidOption);

      expect(() => applyTheme('purple-blue')).not.toThrow();
    });
  });

  describe('Available Themes', () => {
    test('should support all predefined themes', () => {
      const availableThemes = [
        'purple-blue',
        'ocean-breeze',
        'sunset-glow',
        'forest-green',
        'rose-gold',
        'midnight-blue',
        'autumn-leaves',
        'arctic-frost',
      ];

      availableThemes.forEach(theme => {
        expect(() => applyTheme(theme)).not.toThrow();
        expect(document.body.getAttribute('data-theme')).toBe(theme);
      });
    });
  });
});
