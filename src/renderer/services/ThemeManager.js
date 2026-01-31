/**
 * ThemeManager - Single Responsibility: Handle theme management
 * 
 * This service manages application theming including dark/light modes and color themes.
 * It follows the Single Responsibility Principle by focusing solely on
 * theme-related operations.
 */
import { SettingsManager } from './SettingsManager.js';
import { ToastService } from './ToastService.js';

export class ThemeManager {
  static #currentTheme = 'purple-blue';
  static #currentMode = 'dark'; // 'light' or 'dark'

  /**
   * Available themes.
   */
  static get themes() {
    return [
      'purple-blue',
      'ocean-breeze',
      'sunset-glow',
      'forest-mist',
      'midnight-dark',
      'arctic-frost',
    ];
  }

  /**
   * Gets the current theme.
   * @returns {string} - Current theme name.
   */
  static get currentTheme() {
    return ThemeManager.#currentTheme;
  }

  /**
   * Gets the current mode.
   * @returns {string} - Current mode ('light' or 'dark').
   */
  static get currentMode() {
    return ThemeManager.#currentMode;
  }

  /**
   * Loads and applies the saved theme and mode.
   */
  static async loadAndApply() {
    try {
      const theme = await SettingsManager.getTheme();
      const mode = await SettingsManager.getThemeMode();
      ThemeManager.apply(theme || 'purple-blue');
      ThemeManager.applyMode(mode || 'dark');
    } catch (error) {
      console.error('Error loading theme:', error);
      ThemeManager.apply('purple-blue');
      ThemeManager.applyMode('dark');
    }
  }

  /**
   * Applies a theme to the document.
   * @param {string} themeName - The theme name to apply.
   */
  static apply(themeName) {
    if (!ThemeManager.themes.includes(themeName)) {
      console.warn(`Unknown theme: ${themeName}. Using default.`);
      themeName = 'purple-blue';
    }

    ThemeManager.#currentTheme = themeName;
    document.body.setAttribute('data-theme', themeName);

    // Update active state in theme grid if on settings page
    ThemeManager.#updateThemeGrid(themeName);

    console.log('Theme applied:', themeName);
  }

  /**
   * Applies a mode (light/dark) to the document.
   * @param {string} mode - The mode to apply ('light' or 'dark').
   */
  static applyMode(mode) {
    if (mode !== 'light' && mode !== 'dark') {
      console.warn(`Unknown mode: ${mode}. Using dark.`);
      mode = 'dark';
    }

    ThemeManager.#currentMode = mode;
    document.body.setAttribute('data-mode', mode);

    // Update theme toggle button if it exists
    ThemeManager.#updateModeToggleButton(mode);

    console.log('Theme mode applied:', mode);
  }

  /**
   * Toggles between light and dark modes.
   */
  static async toggleMode() {
    const newMode = ThemeManager.#currentMode === 'dark' ? 'light' : 'dark';
    ThemeManager.applyMode(newMode);
    
    try {
      await SettingsManager.setThemeMode(newMode);
      ToastService.success(`${newMode === 'dark' ? 'Dark' : 'Light'} mode enabled`, 2000);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      ToastService.error('Failed to save theme mode');
    }
  }

  /**
   * Updates the mode toggle button icon.
   * @private
   */
  static #updateModeToggleButton(mode) {
    const toggleBtn = document.getElementById('theme-mode-toggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = mode === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
      }
      toggleBtn.title = mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  /**
   * Updates the theme grid active state.
   * @private
   */
  static #updateThemeGrid(themeName) {
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
   * Saves and applies a new theme.
   * @param {string} themeName - The theme name to save and apply.
   */
  static async saveAndApply(themeName) {
    ThemeManager.apply(themeName);
    
    try {
      await SettingsManager.setTheme(themeName);
      console.log('Theme saved:', themeName);
      ToastService.success('Theme changed successfully', 2000);
    } catch (error) {
      console.error('Error saving theme:', error);
      ToastService.error('Failed to save theme');
    }
  }
  /** 
  * Sets up theme option click handlers.
   */
  static setupThemeOptions() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', async () => {
        const themeName = option.getAttribute('data-theme');
        await ThemeManager.saveAndApply(themeName);
      });
    });
  }

  /**
   * Cycles to the next theme.
   */
  static async nextTheme() {
    const currentIndex = ThemeManager.themes.indexOf(ThemeManager.#currentTheme);
    const nextIndex = (currentIndex + 1) % ThemeManager.themes.length;
    await ThemeManager.saveAndApply(ThemeManager.themes[nextIndex]);
  }

  /**
   * Cycles to the previous theme.
   */
  static async previousTheme() {
    const currentIndex = ThemeManager.themes.indexOf(ThemeManager.#currentTheme);
    const prevIndex = (currentIndex - 1 + ThemeManager.themes.length) % ThemeManager.themes.length;
    await ThemeManager.saveAndApply(ThemeManager.themes[prevIndex]);
  }
}

export default ThemeManager;
