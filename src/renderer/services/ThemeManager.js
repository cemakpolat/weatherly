/**
 * ThemeManager - Single Responsibility: Handle theme management
 * 
 * This service manages application theming including applying and saving themes.
 * It follows the Single Responsibility Principle by focusing solely on
 * theme-related operations.
 */
import { SettingsManager } from './SettingsManager.js';
import { ToastService } from './ToastService.js';

export class ThemeManager {
  static #currentTheme = 'purple-blue';

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
   * Loads and applies the saved theme.
   */
  static async loadAndApply() {
    try {
      const theme = await SettingsManager.getTheme();
      ThemeManager.apply(theme || 'purple-blue');
    } catch (error) {
      console.error('Error loading theme:', error);
      ThemeManager.apply('purple-blue');
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
